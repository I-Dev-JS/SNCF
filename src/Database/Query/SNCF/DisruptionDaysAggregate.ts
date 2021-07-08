import { NavitiaDisruptionStopStatus } from "../../../Navitia/INavitiaResponse";
import Database from "../../index";
import Query from "../Query";

export interface ISNCFDisruptionDaysAggregate {
  total_trips: number;
  total_delayed_trips: number;
  total_partial_trips: number;
  total_canceled_trips: number;
  total_delay: number;
}

export default class DisruptionDaysAggregate extends Query<ISNCFDisruptionDaysAggregate> {
  private readonly _dayIds: number[];

  constructor(database: Database, dayIds: number[]) {
    super(database);

    this._dayIds = dayIds;
  }

  public async call(): Promise<ISNCFDisruptionDaysAggregate> {
    const result = await this.database.db.get<ISNCFDisruptionDaysAggregate>(
      `
        SELECT sum(total_trips) AS total_trips,
               (SELECT count(DISTINCT sncf_disruption_id)
                FROM sncf_disruption_impacted_stops
                WHERE sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
                  AND arrival_status = '${NavitiaDisruptionStopStatus.STOP_DELAYED}'
                  AND arrival_delay > 0
               )                AS total_delayed_trips,
               (SELECT count(DISTINCT sncf_disruption_id)
                FROM sncf_disruption_impacted_stops
                WHERE sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
                  AND arrival_status = '${NavitiaDisruptionStopStatus.STOP_DELETED}'
               )                AS total_partial_trips,
               (SELECT count(id)
                FROM sncf_disruptions
                WHERE sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
                  AND severity_effect IN ('NO_SERVICE')
               )                AS total_canceled_trips,
               -- Select greatest delay from all delayed stops in a trip and sum them together
               (SELECT sum(greatest_delays_by_stops.greatest_delay)
                FROM (
                       SELECT max(arrival_delay) as greatest_delay
                       FROM sncf_disruption_impacted_stops
                       WHERE sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
                         -- Ignore stops not marked as delayed
                         AND arrival_status = '${NavitiaDisruptionStopStatus.STOP_DELAYED}'
                         AND arrival_delay > 0 -- Select only stops having a real delay
                       GROUP BY sncf_disruption_id
                     ) greatest_delays_by_stops
               )                AS total_delay
        FROM sncf_disruption_days days
        WHERE days.id IN (${this._dayIds.map(() => "?")})
      `,
      ...this._dayIds,
      ...this._dayIds,
      ...this._dayIds,
      ...this._dayIds,
      ...this._dayIds
    );

    if (!result) {
      throw new Error("No result.");
    }

    return result;
  }
}
