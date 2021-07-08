import moment from "moment";
import Database from "../../Database";
import SNCFRepository from "../../Database/Repository/SNCFRepository";
import { ISNCFDisruptionDayInsert } from "../../Database/Schema/ISNCFDisruptionDays";
import { ISNCFDisruptionImpactedStopInsert } from "../../Database/Schema/ISNCFDisruptionImpactedStops";
import { ISNCFDisruptionInsert } from "../../Database/Schema/ISNCFDisruptions";
import { Navitia } from "../../Navitia";
import {
  INavitiaResponseDisruption,
  INavitiaResponseDisruptionImpactedStop,
  NavitiaDisruptionEffect,
  NavitiaDisruptionEmbeddedImpactedObjectType,
  NavitiaDisruptionStopStatus,
} from "../../Navitia/INavitiaResponse";
import { Constants } from "../../Utils/Constants";
import { Logger } from "../../Utils/Logger";
import { MomentHelper } from "../../Utils/MomentHelper";

const logger = Logger.getLogger();

export class SNCFProcessor {
  public readonly startDate: moment.Moment;
  public readonly endDate: moment.Moment;

  private readonly _repository: SNCFRepository;
  private readonly _navitia: Navitia;
  private readonly _prioritizeCache: boolean;
  private _totalTrips: number | undefined;
  private _disruptionsRawData: INavitiaResponseDisruption[] | undefined;
  private _processedDisruptionUuids: string[] = [];

  constructor(database: Database, startDate?: moment.Moment, endDate?: moment.Moment, prioritizeCache?: boolean) {
    this._repository = new SNCFRepository(database);
    this._navitia = new Navitia(Constants.NAVITIA_SNCF_TOKEN);
    this._prioritizeCache = prioritizeCache !== undefined ? prioritizeCache : true;

    this.startDate = startDate || MomentHelper.yesterday().startOf("day");
    this.endDate = endDate || this.startDate.clone().endOf("day");
  }

  public async process(): Promise<void> {
    await this.getTotalTrips();
    await this.getDisruptionsRawData();

    const data = this.processDisruptionsData();

    await this._repository.saveToDatabase(this.startDate, this.endDate, data);
  }

  private async getTotalTrips() {
    logger.info(`Getting trips data for ${this.startDate.toString()}...`);

    const query = this._navitia
      .createQuery()
      .endpoint("https://api.sncf.com")
      .version("v1")
      .coverage("sncf")
      .vehicleJourneys()
      .since(MomentHelper.momentToShortDateTimeString(this.startDate))
      .until(MomentHelper.momentToShortDateTimeString(this.endDate))
      .count(0)
      .disableDisruptions();
    this._totalTrips = await this._navitia.resultsCount(query);
  }

  private async getDisruptionsRawData() {
    logger.info(`Getting disruptions data for ${this.startDate.toString()}...`);

    const query = this._navitia
      .createQuery()
      .endpoint("https://api.sncf.com")
      .version("v1")
      .coverage("sncf")
      .disruptions()
      .since(MomentHelper.momentToShortDateTimeString(this.startDate))
      .until(MomentHelper.momentToShortDateTimeString(this.endDate))
      .count(500)
      .dataFreshness("base_schedule");
    this._disruptionsRawData = await this._navitia.collection(query);
  }

  private processDisruptionsData(): ISNCFDisruptionDayInsert {
    if (this._totalTrips === undefined || this._disruptionsRawData === undefined) {
      throw new Error("Cannot process disruptions data: data not available.");
    }

    logger.info(`Processing disruptions data for ${MomentHelper.humanizeDate(this.startDate, this.endDate)}...`);

    const disruptions: ISNCFDisruptionInsert[] = [];

    for (const rawDisruption of this._disruptionsRawData) {
      const disruptionInsert = this.processDisruption(rawDisruption);

      if (disruptionInsert === null) {
        continue;
      }

      disruptions.push(disruptionInsert);
    }

    return {
      day: MomentHelper.momentToSqliteDateString(this.startDate),
      total_trips: this._totalTrips,
      disruptions: disruptions,
    };
  }

  private processDisruption(disruption: INavitiaResponseDisruption): ISNCFDisruptionInsert | null {
    const disruptionUuid = disruption.disruption_id;

    if (this._processedDisruptionUuids.includes(disruptionUuid)) {
      logger.warn(`Duplicate disruption UUID found for disruption ${disruptionUuid}, skipping duplicate.`);
      return null;
    }

    this._processedDisruptionUuids.push(disruptionUuid);

    if (disruption.impacted_objects.length !== 1) {
      logger.warn(`Disruption ${disruptionUuid} has ${disruption.impacted_objects.length} impacted objects.`);
    }

    const embeddedImpactedObjectType = disruption.impacted_objects[0].pt_object.embedded_type;
    if (embeddedImpactedObjectType !== NavitiaDisruptionEmbeddedImpactedObjectType.TRIP) {
      logger.error(
        `Disruption ${disruptionUuid} has an embedded impacted object of type ${embeddedImpactedObjectType}`
      );
    }

    if (!disruption.impacted_objects[0].pt_object.trip) {
      logger.error(
        `Disruption ${disruptionUuid} has an embedded impacted object type of '${embeddedImpactedObjectType}' type, but has no trip information embedded.`
      );
      throw new Error("No trip information given.");
    }

    if (disruption.application_periods.length !== 1) {
      logger.warn(`Disruption ${disruptionUuid} has ${disruption.application_periods.length} application periods.`);
    }

    let messageText;
    if (disruption.messages) {
      if (disruption.messages.length > 1) {
        logger.warn(`Disruption ${disruptionUuid} has more than 1 message.`);
      }

      messageText = disruption.messages[0].text;
    }

    let cause;
    let mostFrequentCauseInImpactedStops;

    if (disruption.impacted_objects[0].impacted_stops) {
      const countByCausesFromStops = new Map<string, number>();

      disruption.impacted_objects[0].impacted_stops
        .filter((stop) => stop.cause !== "")
        .forEach((stop) => {
          countByCausesFromStops.set(stop.cause, (countByCausesFromStops.get(stop.cause) || 0) + 1);
        });
      if (countByCausesFromStops.size > 0) {
        mostFrequentCauseInImpactedStops = [...countByCausesFromStops.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
    }

    if (disruption.cause !== "") {
      cause = disruption.cause;
    } else if (mostFrequentCauseInImpactedStops) {
      cause = mostFrequentCauseInImpactedStops;
    } else if (messageText) {
      cause = messageText;
    }

    if (
      disruption.severity.effect !== NavitiaDisruptionEffect.NO_SERVICE &&
      disruption.impacted_objects[0].impacted_stops === undefined
    ) {
      throw new Error(`Disruption ${disruptionUuid} isn't a canceled trip and has no impacted stops.`);
    }

    return {
      disruption_uuid: disruptionUuid,
      trip_id: disruption.impacted_objects[0].pt_object.trip.id,
      trip_name: disruption.impacted_objects[0].pt_object.trip.name,
      application_period_begin: MomentHelper.momentToSqliteDateTimeString(
        moment(disruption.application_periods[0].begin)
      ),
      application_period_end: MomentHelper.momentToSqliteDateTimeString(moment(disruption.application_periods[0].end)),
      severity_name: disruption.severity.name,
      severity_effect: disruption.severity.effect,
      message_text: messageText,
      cause: cause,
      impacted_stops: disruption.impacted_objects[0].impacted_stops
        ? this.processImpactedStops(disruption.impacted_objects[0].impacted_stops)
        : [],
    };
  }

  private processImpactedStops(
    impactedStops: INavitiaResponseDisruptionImpactedStop[]
  ): ISNCFDisruptionImpactedStopInsert[] {
    return impactedStops.map((impactedStop) => this.processImpactedStop(impactedStop));
  }

  private processImpactedStop(impactedStop: INavitiaResponseDisruptionImpactedStop): ISNCFDisruptionImpactedStopInsert {
    let baseArrivalTime = MomentHelper.shortTimeStringToMoment(impactedStop.base_arrival_time);
    let amendedArrivalTime = MomentHelper.shortTimeStringToMoment(impactedStop.amended_arrival_time);
    let arrivalDelta =
      impactedStop.arrival_status !== NavitiaDisruptionStopStatus.STOP_DELETED
        ? amendedArrivalTime.diff(baseArrivalTime, "seconds")
        : 0;
    let baseDepartureTime = MomentHelper.shortTimeStringToMoment(impactedStop.base_departure_time);
    let amendedDepartureTime = MomentHelper.shortTimeStringToMoment(impactedStop.amended_departure_time);
    let departureDelta =
      impactedStop.departure_status !== NavitiaDisruptionStopStatus.STOP_DELETED
        ? amendedDepartureTime.diff(baseDepartureTime, "seconds")
        : 0;

    // Special cases when times overflow over the previous/next day.
    if (arrivalDelta > 72000) {
      // When base arrival time is at the beginning of the next day and amended arrival time is at the end of the
      // current day. The train is actually early.
      baseArrivalTime = baseArrivalTime.add(1, "day");
      arrivalDelta = amendedArrivalTime.diff(baseArrivalTime, "seconds");
    } else if (arrivalDelta < -72000) {
      // When base arrival time is at the end of the current day and amended arrival time is at the beginning of the
      // next day. The train is actually late.
      amendedArrivalTime = amendedArrivalTime.add(1, "day");
      arrivalDelta = amendedArrivalTime.diff(baseArrivalTime, "seconds");
    }
    if (departureDelta > 72000) {
      // When base departure time is at the beginning of the next day and amended departure time is at the end of the
      // current day. The train is actually early.
      baseDepartureTime = baseDepartureTime.add(1, "day");
      departureDelta = amendedDepartureTime.diff(baseDepartureTime, "seconds");
    } else if (departureDelta < -72000) {
      // When base departure time is at the end of the current day and amended departure time is at the beginning of the
      // next day. The train is actually late.
      amendedDepartureTime = amendedDepartureTime.add(1, "day");
      departureDelta = amendedDepartureTime.diff(baseDepartureTime, "seconds");
    }

    let name;
    if (impactedStop.stop_point.label !== "") {
      name = impactedStop.stop_point.label;
    } else if (impactedStop.stop_point.name !== "") {
      name = impactedStop.stop_point.name;
    } else if (impactedStop.stop_point.id !== "") {
      name = `No name (${impactedStop.stop_point.id})`;
    } else {
      throw new Error("Stop has no label, no name and no ID.");
    }

    return {
      name,
      base_arrival_time: impactedStop.base_arrival_time,
      amended_arrival_time: impactedStop.amended_arrival_time,
      arrival_status: impactedStop.arrival_status,
      arrival_delta: arrivalDelta,
      base_departure_time: impactedStop.base_departure_time,
      amended_departure_time: impactedStop.amended_departure_time,
      departure_status: impactedStop.departure_status,
      departure_delta: departureDelta,
    };
  }
}
