import { NavitiaDisruptionStopStatus } from "../../../Navitia/INavitiaResponse";
import Database from "../../index";
import Query from "../Query";

export interface ISNCFDisruptionImpactedStopsAggregate {
  name: string;
  total_delay: number;
  total_delayed_trips: number;
}

export default class DisruptionImpactedStopsAggregate extends Query<ISNCFDisruptionImpactedStopsAggregate[]> {
  private readonly _dayIds: number[];
  private readonly _limit: number;

  constructor(database: Database, dayIds: number[], limit = 20) {
    super(database);

    this._dayIds = dayIds;
    this._limit = limit;
  }

  public async call(): Promise<ISNCFDisruptionImpactedStopsAggregate[]> {
    return this.database.db.all<ISNCFDisruptionImpactedStopsAggregate[]>(
      `
        SELECT name,
               sum(arrival_delay) AS total_delay,
               count(id)          AS total_delayed_trips
        FROM sncf_disruption_impacted_stops
        WHERE sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
          AND name NOT LIKE 'No name %'                                      -- Ignore stops with no name
          AND arrival_status = '${NavitiaDisruptionStopStatus.STOP_DELAYED}' -- Ignore stops not marked as delayed
          AND arrival_delay > 0                                              -- Only stops having a delay in real life
        GROUP BY name
        ORDER BY total_delay DESC, total_delayed_trips DESC
        LIMIT ?
      `,
      ...this._dayIds,
      this._limit
    );
  }
}
