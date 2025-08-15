import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Timeline } from 'vis-timeline/standalone';
import { countrysideStops } from '../countryside-stops';
import { leesburgSterlingEastbound } from '../leesburg-sterling-eastbound';
import { sterlingLeesburgWestbound } from '../sterling-leesburg-westbound';
import { rtcMorningStops } from '../rtc-morning-stops';

@Component({
  selector: 'app-timeline',
  imports: [],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
})
export class TimelineComponent implements AfterViewInit {
  @ViewChild('timelineContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;
  today = new Date().toLocaleDateString('en-CA');

  private readonly selectedItems: Set<string> = new Set(); // Track multiple selected items
  private timeline!: Timeline;

  ngAfterViewInit() {
    const routes = [
      countrysideStops,
      sterlingLeesburgWestbound,
      leesburgSterlingEastbound,
      rtcMorningStops,
    ];
    const items = this.createRoutesDataSet(routes, this.today);

    const groups = routes.map((route, i) => ({
      id: `route-${i}`,
      content: route.name,
    }));

    this.timeline = new Timeline(this.container.nativeElement, items, groups, {
      selectable: true,
      multiselect: true, // Enable multiselect
      orientation: 'top',
      stack: true,
      showCurrentTime: true,
      start: new Date(),
      end: new Date(new Date().getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
    });

    // Custom selection handling
    this.timeline.on('select', (props: any) => {
      if (props.items.length > 0) {
        const clickedId = props.items[props.items.length - 1]; // Get the most recently clicked item

        // Toggle selection
        if (this.selectedItems.has(clickedId)) {
          // Remove from selection
          this.selectedItems.delete(clickedId);
          this.clearHighlight(clickedId);
        } else {
          // Add to selection
          this.selectedItems.add(clickedId);
          this.highlightItem(clickedId);
        }

        // Update timeline selection to match our tracked selections
        this.timeline.setSelection(Array.from(this.selectedItems));
      }
    });
  }

  private getRouteFromItemId(itemId: string): string {
    // Extract route ID from item ID (format: "route-0-stopname-index")
    return itemId.split('-').slice(0, 2).join('-');
  }

  private highlightItem(itemId: string): void {
    setTimeout(() => {
      const el = document.querySelector(`[data-id="${itemId}"]`) as HTMLElement;
      if (el) {
        el.style.backgroundColor = 'yellow';
        el.style.border = '2px solid orange';
      }
    }, 100);
  }

  private clearHighlight(itemId: string): void {
    const el = document.querySelector(`[data-id="${itemId}"]`) as HTMLElement;
    if (el) {
      el.style.backgroundColor = '';
      el.style.border = '';
    }
  }

  clearAllSelections(): void {
    this.selectedItems.forEach((itemId) => this.clearHighlight(itemId));
    this.selectedItems.clear();
    this.timeline.setSelection([]);
  }

  private createRoutesDataSet(
    routes: BusRoute[],
    dateString: string
  ): TimelineDataItem[] {
    const items: TimelineDataItem[] = [];

    routes.forEach((route, routeIndex) => {
      const groupName = `route-${routeIndex}`;

      route.busStops.forEach((stop) => {
        stop.times.forEach((t, index) => {
          const [hourStr, minStr] = t.split(':');
          const hour = parseInt(hourStr);
          const minute = parseInt(minStr);

          const [year, month, day] = dateString.split('-').map(Number);
          const start = new Date(year, month - 1, day, hour, minute, 0, 0);

          items.push({
            id: `${groupName}-${stop.name}-${index}`,
            group: groupName,
            content: `${stop.name} ${t}`,
            start,
            title: `${stop.name} ${t}`,
          });
        });
      });
    });

    return items;
  }

  moveToCurrentTime(): void {
    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Next 3 hours

    this.timeline.setWindow(now, threeHoursLater, {
      animation: {
        duration: 500,
        easingFunction: 'easeInOutQuad',
      },
    });
  }

  moveToNextHours(hours: number): void {
    const now = new Date();
    const laterTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    this.timeline.setWindow(now, laterTime, {
      animation: {
        duration: 500,
        easingFunction: 'easeInOutQuad',
      },
    });
  }
}
