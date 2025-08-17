import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataItem } from 'vis-timeline/standalone';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  isWeekendMode$ = new BehaviorSubject<boolean>(
    [0, 6].includes(new Date().getDay())
  );

  get isWeekendMode(): boolean {
    return this.isWeekendMode$.value;
  }

  toggleWeekendMode(): void {
    this.isWeekendMode$.next(!this.isWeekendMode$.value);
  }

  setWeekendMode(isWeekend: boolean): void {
    this.isWeekendMode$.next(isWeekend);
  }

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
      let colors = baseColor
        ? this.generateColorVariants(baseColor)
        : ['#437373', '#694369', '#86863f'];

      route.busStops.forEach((stop) => {
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
    const hex = baseHex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const variants = [
      baseHex,
      `#${Math.min(255, r + 64)
        .toString(16)
        .padStart(2, '0')}${Math.min(255, g + 32)
        .toString(16)
        .padStart(2, '0')}${Math.min(255, b + 16)
        .toString(16)
        .padStart(2, '0')}`,
      `#${Math.max(0, r - 32)
        .toString(16)
        .padStart(2, '0')}${Math.max(0, g - 16)
        .toString(16)
        .padStart(2, '0')}${Math.max(0, b - 64)
        .toString(16)
        .padStart(2, '0')}`,
    ];

    return variants;
  }

  getTimelineOptions() {
    const viewportHeight = window.innerHeight;
    const controlsHeight = 150;
    const initialHeight = Math.max(400, viewportHeight - controlsHeight);

    return {
      selectable: true,
      multiselect: true,
      orientation: 'top',
      stack: true,
      showCurrentTime: true,
      start: new Date(new Date().getTime() - 30 * 60 * 1000),
      end: new Date(new Date().getTime() + 60 * 60 * 1000),
      zoomMin: 1000 * 60 * 30,
      zoomMax: 1000 * 60 * 60 * 12,
      zoomable: false,
      verticalScroll: true,
      horizontalScroll: true,
      // height: initialHeight, // Number, not string with 'px'
      editable: false,
    };
  }

  createTimeWindow(hour: number, windowHours: number = 2) {
    const today = new Date();
    const startTime = new Date(today.setHours(hour, 0, 0, 0));
    const endTime = new Date(today.setHours(hour + windowHours, 0, 0, 0));
    return { startTime, endTime };
  }

  createHoursWindow(hours: number) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60 * 60);
    const laterTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
    return { startTime, laterTime };
  }

  highlightSelection(itemId: string, isSelected: boolean) {
    const element = document.querySelector(
      `[data-id="${itemId}"]`
    ) as HTMLElement;
    if (!element) return;

    const styles = isSelected
      ? {
          transition: 'all 0.2s ease',
          outline: '1px solid #222',
          zIndex: '999',
          marginTop: '-.2rem',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        }
      : {
          marginTop: '0',
          boxShadow: 'none',
        };

    Object.entries(styles).forEach(([prop, value]) =>
      element.style.setProperty(
        prop.replace(/([A-Z])/g, '-$1').toLowerCase(),
        value,
        'important'
      )
    );

    if (!isSelected) {
      ['outline', 'z-index'].forEach((prop) =>
        element.style.removeProperty(prop)
      );
      setTimeout(() => {
        ['margin-top', 'box-shadow', 'transition'].forEach((prop) =>
          element.style.removeProperty(prop)
        );
      }, 200);
    }
  }
}
