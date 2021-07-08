import { NavitiaDisruptionEffect, NavitiaDisruptionType } from "../../Navitia/INavitiaResponse";
import { ISNCFDisruptionImpactedStopInsert } from "./ISNCFDisruptionImpactedStops";

export default interface ISNCFDisruptions {
  id: number;
  disruption_uuid: string;
  trip_id: string;
  trip_name: string;
  application_period_begin: string;
  application_period_end: string;
  severity_name: NavitiaDisruptionType;
  severity_effect: NavitiaDisruptionEffect;
  message_text?: string;
  cause?: string;
}

export interface ISNCFDisruptionInsert extends Omit<ISNCFDisruptions, "id"> {
  impacted_stops: ISNCFDisruptionImpactedStopInsert[];
}
