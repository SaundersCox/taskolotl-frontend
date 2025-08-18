interface BusStop {
  name: string;
  times: string[];
}
export interface BusRoute {
  name: string;
  baseColor?: string;
  weekdayBusStops: BusStop[];
  weekendBusStops: BusStop[];
}
