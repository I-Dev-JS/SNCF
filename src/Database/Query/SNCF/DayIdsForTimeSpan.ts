import moment from "moment";
import { MomentHelper } from "../../../Utils/MomentHelper";
import Database from "../../index";
import ISNCFDisruptionDays from "../../Schema/ISNCFDisruptionDays";
import Query from "../Query";

export default class DayIdsForTimeSpan extends Query<number[]> {
  private readonly _startDate: moment.Moment;
  private readonly _endDate: moment.Moment;

  constructor(database: Database, startDate: moment.Moment, endDate: moment.Moment) {
    super(database);

    this._startDate = startDate;
    this._endDate = endDate;
  }

  public async call(): Promise<number[]> {
    const dates = MomentHelper.timeSpanToSqliteDatesArray(this._startDate, this._endDate);

    return (
      await this.database.db.all<Pick<ISNCFDisruptionDays, "id">[]>(
        `
          SELECT id
          FROM sncf_disruption_days
          WHERE day IN (${dates.map(() => "?")})
        `,
        ...dates
      )
    ).map((record) => record.id);
  }
}
