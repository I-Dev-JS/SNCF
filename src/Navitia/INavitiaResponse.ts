export interface INavitiaResponse {
  disruptions?: INavitiaResponseDisruption[];

  pagination?: {
    start_page: number;
    items_on_page: number;
    items_per_page: number;
    total_results: number;
  };

  links: [
    {
      href: string;
      type: string;
      rel: string;
      templated: boolean;
    }
  ];

  context: {
    timezone: string;
    current_datetime: string;
  };

  error?: {
    id: string;
    message: string;
  };

  [propName: string]: any;
}

export interface INavitiaResponseDisruption {
  status: string;
  disruption_id: string;
  severity: {
    color: string;
    priority: number;
    name: NavitiaDisruptionType;
    effect: NavitiaDisruptionEffect;
  };
  impact_id: string;
  application_periods: [
    {
      begin: string;
      end: string;
    }
  ];
  messages?: [
    {
      text: string;
    }
  ];
  updated_at: string;
  uri: string;
  impacted_objects: [
    {
      impacted_stops?: INavitiaResponseDisruptionImpactedStop[];
      pt_object: {
        embedded_type: NavitiaDisruptionEmbeddedImpactedObjectType;
        trip?: {
          id: string;
          name: string;
        };
      };
    }
  ];
  disruption_url: string;
  contributor: string;
  cause: string;
  id: string;
}

export interface INavitiaResponseDisruptionImpactedStop {
  amended_arrival_time: string;
  stop_point: INavitiaResponseDisruptionStop;
  departure_status: NavitiaDisruptionStopStatus;
  amended_departure_time: string;
  base_arrival_time: string;
  cause: string;
  base_departure_time: string;
  arrival_status: NavitiaDisruptionStopStatus;
}

export interface INavitiaResponseDisruptionStop {
  name: string;
  coord: {
    lat: string;
    lon: string;
  };
  label: string;
  id: string;
}

export enum NavitiaDisruptionType {
  TRIP_DELAYED = "trip delayed",
  TRIP_MODIFIED = "trip modified",
  TRIP_CANCELED = "trip canceled",
  REDUCED_SERVICE = "reduced service",
  ADDITIONAL_SERVICE = "additional service",
  UNKNOWN_EFFECT = "unknown effect",
  DETOUR = "detour",
}

// Follows the GTFS RT values (https://gtfs.org/reference/realtime/v2/#enum-effect)
export enum NavitiaDisruptionEffect {
  NO_SERVICE = "NO_SERVICE",
  REDUCED_SERVICE = "REDUCED_SERVICE",
  SIGNIFICANT_DELAYS = "SIGNIFICANT_DELAYS",
  DETOUR = "DETOUR",
  ADDITIONAL_SERVICE = "ADDITIONAL_SERVICE",
  MODIFIED_SERVICE = "MODIFIED_SERVICE",
  OTHER_EFFECT = "OTHER_EFFECT",
  UNKNOWN_EFFECT = "UNKNOWN_EFFECT",
  STOP_MOVED = "STOP_MOVED",
  NO_EFFECT = "NO_EFFECT",
  ACCESSIBILITY_ISSUE = "ACCESSIBILITY_ISSUE",
}

export enum NavitiaDisruptionStopStatus {
  STOP_UNCHANGED = "unchanged",
  STOP_DELAYED = "delayed",
  STOP_ADDED = "added",
  STOP_DELETED = "deleted",
}

export enum NavitiaDisruptionEmbeddedImpactedObjectType {
  TRIP = "trip",
}
