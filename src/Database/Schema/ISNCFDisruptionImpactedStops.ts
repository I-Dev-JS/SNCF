export default interface ISNCFDisruptionImpactedStops {
  id: number;
  name: string;
  base_arrival_time?: string;
  amended_arrival_time?: string;
  arrival_status?: string;
  arrival_delta?: number; // In seconds (can be negative if train arrived early).
  arrival_delay: number; // In seconds (cannot be negative, 0 if train was on time or arrived early).
  base_departure_time?: string;
  amended_departure_time?: string;
  departure_status?: string;
  departure_delta?: number; // In seconds (can be negative if train departed early).
  departure_delay: number; // In seconds (cannot be negative, 0 if train was on time or departed early).
}

export type ISNCFDisruptionImpactedStopInsert = Omit<
  ISNCFDisruptionImpactedStops,
  "id" | "arrival_delay" | "departure_delay"
>;
