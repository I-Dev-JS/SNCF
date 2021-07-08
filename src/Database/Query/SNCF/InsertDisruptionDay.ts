import SQL from "sql-template-strings";
import Database from "../../index";
import { ISNCFDisruptionDayInsert } from "../../Schema/ISNCFDisruptionDays";
import InsertionQuery, { InsertionResult } from "../InsertionQuery";

export default class InsertDisruptionDay extends InsertionQuery {
  private readonly _data: ISNCFDisruptionDayInsert;

  constructor(database: Database, data: ISNCFDisruptionDayInsert) {
    super(database);

    this._data = data;
  }

  public call(): Promise<InsertionResult> {
    return this.database.db.run(SQL`
      INSERT INTO sncf_disruption_days (day, total_trips, created_at)
      VALUES (${this._data.day},
              ${this._data.total_trips},
              DATETIME('now', 'localtime'))
    `) as Promise<InsertionResult>;
  }
}
