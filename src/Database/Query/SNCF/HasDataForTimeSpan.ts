import moment from "moment";
import { MomentHelper } from "../../../Utils/MomentHelper";
import Database from "../../index";
import Query from "../Query";

export default class HasDataForTimeSpan extends Query<boolean> {
  private readonly _startDate: moment.Moment;
  private readonly _endDate: moment.Moment;

  constructor(database: Database, startDate: moment.Moment, endDate: moment.Moment) {
    super(database);

    this._startDate = startDate;
    this._endDate = endDate;
  }

  public async call(): Promise<boolean> {
    const dates = MomentHelper.timeSpanToSqliteDatesArray(this._startDate, this._endDate);

    const result = await this.database.db.get<{ days_count: number }>(
      `
        SELECT COUNT(id) days_count
        FROM sncf_disruption_days
        WHERE day IN (${dates.map(() => "?")})
      `,
      ...dates
    );

    return result?.days_count === dates.length;
  }
}
