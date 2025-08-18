import { inject, Injectable } from '@angular/core';
import { DataItem } from 'vis-timeline/standalone';
import { ColorService } from '../../../shared/color';
import { DateService } from '../../../shared/date-service';
import { BusRoute } from '../weeday-bus-routes/models';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  private readonly colorService = inject(ColorService);
  private readonly dateService = inject(DateService);

  createGroups(routes: BusRoute[]) {
    return routes.map((route, i) => ({
      id: `route-${i}`,
      content: route.name,
    }));
  }

  createRoutesDataSet(routes: BusRoute[], dateString: string): DataItem[] {
    const items: DataItem[] = [];

    routes.forEach((route, routeIndex) => {
      const groupName = `route-${routeIndex}`;
      const baseColor = route.baseColor;
      const colors = baseColor
        ? this.generateColorVariants(baseColor)
        : ['#437373', '#694369', '#86863f'];

      const busStops = this.dateService.weekendMode()
        ? route.weekendBusStops
        : route.weekdayBusStops;

      busStops.forEach((stop) => {
        stop.times.forEach((t, index) => {
          if (!t || t.trim() === '') return;

          const [hourStr, minStr] = t.split(':');
          const hour = parseInt(hourStr);
          const minute = parseInt(minStr);

          const [year, month, day] = dateString.split('-').map(Number);
          const start = new Date(year, month - 1, day, hour, minute, 0, 0);

          const colorIndex = index % colors.length;
          const backgroundColor = colors[colorIndex];

          items.push({
            id: `${groupName}-${stop.name}-${index}`,
            group: groupName,
            content: `${stop.name} ${t}`,
            start,
            title: `${stop.name} ${t}`,
            style: `background-color: ${backgroundColor}; border-color: ${backgroundColor}; color: white;`,
          });
        });
      });
    });

    return items;
  }

  generateColorVariants(baseHex: string): string[] {
    return this.colorService.generateColorVariants(baseHex);
  }

  createTimeWindow(windowHours: number, hour?: number) {
    const today = new Date();

    let startTime: Date;
    if (hour !== undefined) {
      startTime = new Date(today.setHours(hour, 0, 0, 0));
    } else {
      startTime = new Date(); // Start from current time
    }

    const endTime = new Date(
      startTime.getTime() + windowHours * 60 * 60 * 1000,
    );
    return { startTime, endTime };
  }
}
