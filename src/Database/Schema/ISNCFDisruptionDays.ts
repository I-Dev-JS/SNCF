import IFormattable from "../../Formatters/IFormattable";
import { ISNCFDisruptionInsert } from "./ISNCFDisruptions";

export default interface ISNCFDisruptionDays extends IFormattable {
  id: number;
  day: string;
  total_trips: number;
  created_at: string;
}

export interface ISNCFDisruptionDayInsert extends Omit<ISNCFDisruptionDays, "id" | "created_at"> {
  disruptions: ISNCFDisruptionInsert[];
}
