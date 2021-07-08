import IFormattable from "../../Formatters/IFormattable";
import { MathHelper } from "../../Utils/MathHelper";
import { MomentHelper } from "../../Utils/MomentHelper";
import { ISNCFDisruptionCausesAggregate } from "../Query/SNCF/DisruptionCausesAggregate";
import { ISNCFDisruptionDaysAggregate } from "../Query/SNCF/DisruptionDaysAggregate";
import { ISNCFDisruptionImpactedStopsAggregate } from "../Query/SNCF/DisruptionImpactedStopsAggregate";
import SNCFDisruptionCausesAggregate from "./SNCFDisruptionCausesAggregate";
import SNCFDisruptionImpactedStopsAggregate from "./SNCFDisruptionImpactedStopsAggregate";

export default class SNCFDisruptionDaysAggregate implements IFormattable {
  private readonly _record: ISNCFDisruptionDaysAggregate;
  private readonly _causes: SNCFDisruptionCausesAggregate[] = [];
  private readonly _impactedStops: SNCFDisruptionImpactedStopsAggregate[] = [];

  constructor(
    record: ISNCFDisruptionDaysAggregate,
    causes: ISNCFDisruptionCausesAggregate[],
    impactedStops: ISNCFDisruptionImpactedStopsAggregate[]
  ) {
    this._record = record;
    this._causes = causes.map((cause) => new SNCFDisruptionCausesAggregate(cause));
    this._impactedStops = impactedStops.map((impactedStop) => new SNCFDisruptionImpactedStopsAggregate(impactedStop));
  }

  public get causes(): SNCFDisruptionCausesAggregate[] {
    return this._causes;
  }

  public get impactedStops(): SNCFDisruptionImpactedStopsAggregate[] {
    return this._impactedStops;
  }

  private get delayedTripsPercentage(): number {
    return MathHelper.percentageOfBase(this._record.total_delayed_trips, this._record.total_trips);
  }

  private get partialTripsPercentage(): number {
    return MathHelper.percentageOfBase(this._record.total_partial_trips, this._record.total_trips);
  }

  private get canceledTripsPercentage(): number {
    return MathHelper.percentageOfBase(this._record.total_canceled_trips, this._record.total_trips);
  }

  public toString(): string {
    return [
      `🚆 Nombre de voyages : ${this._record.total_trips}`,
      `⏰ Trains en retards : ${this._record.total_delayed_trips} (${this.delayedTripsPercentage}%)`,
      `❗ Services partiels : ${this._record.total_partial_trips} (${this.partialTripsPercentage}%)`,
      `🗑️ Trains supprimés : ${this._record.total_canceled_trips} (${this.canceledTripsPercentage}%)`,
      `⌚ Retard cumulé : ${MomentHelper.humanizeDuration(this._record.total_delay, "seconds")}`,
    ].join("\n");
  }
}
