interface BusStop {
  name: string;
  times: string[];
}

interface BusRoute {
  name: string;
  isWeekday: boolean;
  busStops: BusStop[];
}

interface TimelineDataItem {
  id: string;
  group: string;
  content: string; // Only string, not HTMLElement
  start: Date;
  title?: string;
}
