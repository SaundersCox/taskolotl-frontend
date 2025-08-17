interface BusStop {
  name: string;
  times: string[];
}

interface BusRoute {
  name: string;
  baseColor?: string;
  isWeekday: boolean;
  busStops: BusStop[];
}
