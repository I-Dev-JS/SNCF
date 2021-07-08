--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

PRAGMA auto_vacuum = incremental;

CREATE TABLE sncf_disruption_days
(
    id          INTEGER PRIMARY KEY,
    day         TEXT    NOT NULL UNIQUE,
    total_trips INTEGER NOT NULL,
    created_at  TEXT    NOT NULL
);
CREATE INDEX sncf_disruption_day_ix_day ON sncf_disruption_days (day);

CREATE TABLE sncf_disruptions
(
    id                       INTEGER PRIMARY KEY,
    sncf_disruption_day_id   INTEGER NOT NULL,
    disruption_uuid          TEXT    NOT NULL,
    trip_id                  TEXT    NOT NULL,
    trip_name                TEXT    NOT NULL,
    application_period_begin TEXT    NOT NULL,
    application_period_end   TEXT    NOT NULL,
    severity_name            TEXT    NOT NULL,
    severity_effect          TEXT    NOT NULL,
    message_text             TEXT,
    cause                    TEXT,

    UNIQUE (sncf_disruption_day_id, disruption_uuid),

    CONSTRAINT sncf_disruption_fk_day_id FOREIGN KEY (sncf_disruption_day_id)
        REFERENCES sncf_disruption_days (id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX sncf_disruption_ix_day_id ON sncf_disruptions (sncf_disruption_day_id);
CREATE INDEX sncf_disruption_ix_cause ON sncf_disruptions (cause);
CREATE INDEX sncf_disruption_ix_severity_effect ON sncf_disruptions (severity_effect);

CREATE TABLE sncf_disruption_impacted_stops
(
    id                     INTEGER PRIMARY KEY,
    sncf_disruption_id     INTEGER NOT NULL,
    sncf_disruption_day_id INTEGER NOT NULL,
    name                   TEXT    NOT NULL,
    base_arrival_time      TEXT,
    amended_arrival_time   TEXT,
    arrival_status         TEXT,
    arrival_delta          INTEGER,
    arrival_delay          INTEGER
                           GENERATED ALWAYS AS (max(0, ifnull(arrival_delta, 0))) STORED,
    base_departure_time    TEXT,
    amended_departure_time TEXT,
    departure_status       TEXT,
    departure_delta        INTEGER,
    departure_delay        INTEGER
                           GENERATED ALWAYS AS (max(0, ifnull(departure_delta, 0))) STORED,

    CONSTRAINT sncf_disruption_impacted_stop_fk_disruption_id FOREIGN KEY (sncf_disruption_id)
        REFERENCES sncf_disruptions (id) ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT sncf_disruption_impacted_stop_fk_day_id FOREIGN KEY (sncf_disruption_day_id)
        REFERENCES sncf_disruption_days (id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX sncf_disruption_impacted_stop_ix_day_id ON sncf_disruption_impacted_stops (sncf_disruption_day_id);
CREATE INDEX sncf_disruption_impacted_stop_ix_disruption_id ON sncf_disruption_impacted_stops (sncf_disruption_id);
CREATE INDEX sncf_disruption_impacted_stop_ix_name ON sncf_disruption_impacted_stops (name);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP INDEX sncf_disruption_impacted_stop_ix_name;
DROP INDEX sncf_disruption_impacted_stop_ix_disruption_id;
DROP INDEX sncf_disruption_impacted_stop_ix_day_id;
DROP TABLE sncf_disruption_impacted_stops;
DROP INDEX sncf_disruption_ix_severity_effect;
DROP INDEX sncf_disruption_ix_cause;
DROP INDEX sncf_disruption_ix_day_id;
DROP TABLE sncf_disruptions;
DROP INDEX sncf_disruption_day_ix_day;
DROP TABLE sncf_disruption_days;
