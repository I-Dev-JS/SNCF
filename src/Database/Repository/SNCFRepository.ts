import moment from "moment";
import SNCFDisruptionDaysAggregate from "../Model/SNCFDisruptionDaysAggregate";
import { DeletionResult } from "../Query/DeletionQuery";
import DayIdsForTimeSpan from "../Query/SNCF/DayIdsForTimeSpan";
import DeleteRecordsOlderThanGivenDays from "../Query/SNCF/DeleteRecordsOlderThanGivenDays";
import DisruptionCausesAggregate from "../Query/SNCF/DisruptionCausesAggregate";
import DisruptionDaysAggregate from "../Query/SNCF/DisruptionDaysAggregate";
import DisruptionImpactedStopsAggregate from "../Query/SNCF/DisruptionImpactedStopsAggregate";
import HasDataForTimeSpan from "../Query/SNCF/HasDataForTimeSpan";
import InsertDisruption from "../Query/SNCF/InsertDisruption";
import InsertDisruptionDay from "../Query/SNCF/InsertDisruptionDay";
import InsertDisruptionImpactedStop from "../Query/SNCF/InsertDisruptionImpactedStop";
import Transaction from "../Query/Transaction";
import { ISNCFDisruptionDayInsert } from "../Schema/ISNCFDisruptionDays";
import Repository from "./Repository";

export default class SNCFRepository extends Repository {
  public async hasDataForTimeSpan(startDate: moment.Moment, endDate: moment.Moment): Promise<boolean> {
    return new HasDataForTimeSpan(this.database, startDate, endDate).call();
  }

  public async disruptionDaysAggregate(
    startDate: moment.Moment,
    endDate: moment.Moment
  ): Promise<SNCFDisruptionDaysAggregate> {
    const dayIds = await new DayIdsForTimeSpan(this.database, startDate, endDate).call();

    const result = await new DisruptionDaysAggregate(this.database, dayIds).call();
    const causesResults = await new DisruptionCausesAggregate(this.database, dayIds).call();
    const stopsResults = await new DisruptionImpactedStopsAggregate(this.database, dayIds).call();

    return new SNCFDisruptionDaysAggregate(result, causesResults, stopsResults);
  }

  public async saveToDatabase(
    startDate: moment.Moment,
    endDate: moment.Moment,
    data: ISNCFDisruptionDayInsert
  ): Promise<number> {
    if (await this.hasDataForTimeSpan(startDate, endDate)) {
      throw new Error(`Cannot persist data for ${startDate}, record already existing.`);
    }

    return new Transaction(this.database).call(async () => {
      const result = await new InsertDisruptionDay(this.database, data).call();
      const dayId = result.lastID;

      for (const disruption of data.disruptions) {
        try {
          const disruptionId = (await new InsertDisruption(this.database, dayId, disruption).call()).lastID;

          for (const impactedStop of disruption.impacted_stops) {
            try {
              await new InsertDisruptionImpactedStop(this.database, disruptionId, dayId, impactedStop).call();
            } catch (impactedStopError) {
              impactedStopError.message = `Error while inserting impacted stop ${impactedStop.name}: ${impactedStopError.message}`;
              throw impactedStopError;
            }
          }
        } catch (disruptionError) {
          disruptionError.message = `Error while inserting disruption ${disruption.disruption_uuid}: ${disruptionError.message}`;
          throw disruptionError;
        }
      }

      return dayId;
    });
  }

  public async deleteRecordsOlderThanGivenDays(thresholdDays: number): Promise<DeletionResult> {
    return new DeleteRecordsOlderThanGivenDays(this.database, thresholdDays).call();
  }
}
