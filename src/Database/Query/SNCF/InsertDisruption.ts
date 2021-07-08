import SQL from "sql-template-strings";
import Database from "../../index";
import { ISNCFDisruptionInsert } from "../../Schema/ISNCFDisruptions";
import InsertionQuery, { InsertionResult } from "../InsertionQuery";

export default class InsertDisruption extends InsertionQuery {
  private readonly _dayId: number;
  private readonly _data: ISNCFDisruptionInsert;

  constructor(database: Database, dayId: number, data: ISNCFDisruptionInsert) {
    super(database);

    this._dayId = dayId;
    this._data = data;
  }

  public call(): Promise<InsertionResult> {
    return this.database.db.run(SQL`
      INSERT INTO sncf_disruptions (sncf_disruption_day_id,
                                    disruption_uuid,
                                    trip_id,
                                    trip_name,
                                    application_period_begin,
                                    application_period_end,
                                    severity_name,
                                    severity_effect,
                                    message_text,
                                    cause)
      VALUES (${this._dayId},
              ${this._data.disruption_uuid},
              ${this._data.trip_id},
              ${this._data.trip_name},
              ${this._data.application_period_begin},
              ${this._data.application_period_end},
              ${this._data.severity_name},
              ${this._data.severity_effect},
              ${this._data.message_text},
              ${this._data.cause})
    `) as Promise<InsertionResult>;
  }
}
