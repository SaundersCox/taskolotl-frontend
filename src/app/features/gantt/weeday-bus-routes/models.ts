interface BusStop {
  name: string;
  times: string[];
}
export interface BusRoute {
  name: string;
  routeNumber: string;
  baseColor?: string;
  weekdayBusStops: BusStop[];
  weekendBusStops: BusStop[];
}
