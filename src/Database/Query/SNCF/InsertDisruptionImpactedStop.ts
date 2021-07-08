import SQL from "sql-template-strings";
import Database from "../../index";
import { ISNCFDisruptionImpactedStopInsert } from "../../Schema/ISNCFDisruptionImpactedStops";
import InsertionQuery, { InsertionResult } from "../InsertionQuery";

export default class InsertDisruptionImpactedStop extends InsertionQuery {
  private readonly _disruptionId: number;
  private readonly _dayId: number;
  private readonly _data: ISNCFDisruptionImpactedStopInsert;

  constructor(database: Database, disruptionId: number, dayId: number, data: ISNCFDisruptionImpactedStopInsert) {
    super(database);

    this._disruptionId = disruptionId;
    this._dayId = dayId;
    this._data = data;
  }

  public call(): Promise<InsertionResult> {
    return this.database.db.run(SQL`
      INSERT INTO sncf_disruption_impacted_stops (sncf_disruption_id,
                                                  sncf_disruption_day_id,
                                                  name,
                                                  base_arrival_time,
                                                  amended_arrival_time,
                                                  arrival_status,
                                                  arrival_delta,
                                                  base_departure_time,
                                                  amended_departure_time,
                                                  departure_status,
                                                  departure_delta)
      VALUES (${this._disruptionId},
              ${this._dayId},
              ${this._data.name},
              ${this._data.base_arrival_time},
              ${this._data.amended_arrival_time},
              ${this._data.arrival_status},
              ${this._data.arrival_delta},
              ${this._data.base_departure_time},
              ${this._data.amended_departure_time},
              ${this._data.departure_status},
              ${this._data.departure_delta})
    `) as Promise<InsertionResult>;
  }
}
