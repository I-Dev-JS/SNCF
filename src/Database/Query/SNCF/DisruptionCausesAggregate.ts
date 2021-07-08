import { NavitiaDisruptionStopStatus } from "../../../Navitia/INavitiaResponse";
import Database from "../../index";
import Query from "../Query";

export interface ISNCFDisruptionCausesAggregate {
  cause: string;
  occurrences: number;
  total_delayed_trips: number;
  total_partial_trips: number;
  total_canceled_trips: number;
}

export default class DisruptionCausesAggregate extends Query<ISNCFDisruptionCausesAggregate[]> {
  private readonly _dayIds: number[];
  private readonly _limit: number;

  constructor(database: Database, dayIds: number[], limit = 20) {
    super(database);

    this._dayIds = dayIds;
    this._limit = limit;
  }

  public async call(): Promise<ISNCFDisruptionCausesAggregate[]> {
    return this.database.db.all<ISNCFDisruptionCausesAggregate[]>(
      `
        SELECT disruptions.cause,
               count(DISTINCT disruptions.id) AS occurrences,
               (SELECT count(d.id)
                FROM sncf_disruptions d
                WHERE d.cause = disruptions.cause
                  AND sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
                  AND EXISTS(SELECT id
                             FROM sncf_disruption_impacted_stops
                             WHERE sncf_disruption_id = d.id
                               AND arrival_status = '${NavitiaDisruptionStopStatus.STOP_DELAYED}'
                               AND arrival_delay > 0)
               )                              AS total_delayed_trips,
               (SELECT count(d.id)
                FROM sncf_disruptions d
                WHERE d.cause = disruptions.cause
                  AND sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
                  AND EXISTS(SELECT id
                             FROM sncf_disruption_impacted_stops
                             WHERE sncf_disruption_id = d.id
                               AND arrival_status = '${NavitiaDisruptionStopStatus.STOP_DELETED}')
               )                              AS total_partial_trips,
               (SELECT count(d.id)
                FROM sncf_disruptions d
                WHERE d.cause = disruptions.cause
                  AND sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
                  AND d.severity_effect IN ('NO_SERVICE')
               )                              AS total_canceled_trips
        FROM sncf_disruptions disruptions
        WHERE disruptions.sncf_disruption_day_id IN (${this._dayIds.map(() => "?")})
          AND disruptions.cause IS NOT NULL
        GROUP BY disruptions.cause
        ORDER BY occurrences DESC
        LIMIT ?
      `,
      ...this._dayIds,
      ...this._dayIds,
      ...this._dayIds,
      ...this._dayIds,
      this._limit
    );
  }
}
