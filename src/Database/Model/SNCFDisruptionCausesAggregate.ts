import IFormattable from "../../Formatters/IFormattable";
import { ISNCFDisruptionCausesAggregate } from "../Query/SNCF/DisruptionCausesAggregate";

export default class SNCFDisruptionCausesAggregate implements IFormattable {
  private readonly _record: ISNCFDisruptionCausesAggregate;

  constructor(record: ISNCFDisruptionCausesAggregate) {
    this._record = record;
  }

  public toString(): string {
    const stats = [];
    if (this._record.total_delayed_trips > 0) {
      stats.push(`${this._record.total_delayed_trips} ⏰`);
    }
    if (this._record.total_partial_trips > 0) {
      stats.push(`${this._record.total_partial_trips} ❗`);
    }
    if (this._record.total_canceled_trips > 0) {
      stats.push(`${this._record.total_canceled_trips} 🗑️ `);
    }

    let humanizedCause = `${this._record.cause}`;
    if (stats.length > 0) {
      humanizedCause += ` (${stats.join(", ")})`;
    }

    return humanizedCause;
  }
}
