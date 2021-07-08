import SQL from "sql-template-strings";
import Database from "../../index";
import DeletionQuery, { DeletionResult } from "../DeletionQuery";

export default class DeleteRecordsOlderThanGivenDays extends DeletionQuery {
  private readonly _daysThreshold: number;

  constructor(database: Database, daysThreshold: number) {
    super(database);

    this._daysThreshold = daysThreshold;
  }

  call(): Promise<DeletionResult> {
    return this.database.db.run(SQL`
      DELETE
      FROM sncf_disruption_days
      WHERE day < date('now', ${`-${this._daysThreshold} days`})
    `) as Promise<DeletionResult>;
  }
}
