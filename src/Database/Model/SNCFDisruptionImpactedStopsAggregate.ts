import IFormattable from "../../Formatters/IFormattable";
import { MomentHelper } from "../../Utils/MomentHelper";
import { ISNCFDisruptionImpactedStopsAggregate } from "../Query/SNCF/DisruptionImpactedStopsAggregate";

export default class SNCFDisruptionImpactedStopsAggregate implements IFormattable {
  private readonly _record: ISNCFDisruptionImpactedStopsAggregate;

  constructor(record: ISNCFDisruptionImpactedStopsAggregate) {
    this._record = record;
  }

  public toString(): string {
    const stats = [];
    if (this._record.total_delayed_trips > 0) {
      stats.push(`${this._record.total_delayed_trips} ⏰`);
    }
    if (this._record.total_delay > 0) {
      stats.push(`${MomentHelper.humanizeDuration(this._record.total_delay, "seconds", true)}`);
    }

    let humanizedCause = `${this._record.name}`;
    if (stats.length > 0) {
      humanizedCause += ` (${stats.join(", ")})`;
    }

    return humanizedCause;
  }
}
