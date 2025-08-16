import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DataItem, Timeline } from 'vis-timeline/standalone';
import { countrysideStops } from '../bus-routes/countryside-stops';
import { innovationStops } from '../bus-routes/innovation-stops';
import { leesburgSterlingEastbound } from '../bus-routes/leesburg-sterling-eastbound';
import { rtcStops } from '../bus-routes/rtc-stops';
import { sterlingLeesburgWestbound } from '../bus-routes/sterling-leesburg-westbound';
import { sterlingConnector } from '../bus-routes/sterling-stops';

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
  private currentTimeInterval: any;

  private readonly selectedItems: Set<string> = new Set(); // Track multiple selected items
  private timeline!: Timeline;

  ngAfterViewInit() {
    this.initTimeline();
  }

  ngOnDestroy(): void {
    if (this.timeline) {
      this.timeline.destroy();
    }
    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
    }
  }

  initTimeline() {
    if (this.timeline) {
      this.timeline.destroy();
    }

    const routes = [
      countrysideStops,
      sterlingLeesburgWestbound,
      leesburgSterlingEastbound,
      rtcStops,
      innovationStops,
      sterlingConnector,
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
      start: new Date(new Date().getTime() - 30 * 60 * 1000),
      end: new Date(new Date().getTime() + 60 * 60 * 1000),
      zoomMin: 1000 * 60 * 30,
      zoomMax: 1000 * 60 * 60 * 12,
      zoomable: false,
      verticalScroll: true,
      horizontalScroll: true,
      maxHeight: '700px',
      editable: false,
    });

    this.timeline.on('select', (props: any) => {
      if (props.items.length > 0) {
        const clickedId = props.items[props.items.length - 1];

        if (this.selectedItems.has(clickedId)) {
          this.selectedItems.delete(clickedId);
        } else {
          this.selectedItems.add(clickedId);
        }

        this.timeline.setSelection(Array.from(this.selectedItems));
      }
    });

    setTimeout(() => {
      this.setupSelectionObserver();
    }, 500);

    // Add current time marker
    this.addCurrentTimeMarker();

    // Update every minute
    this.currentTimeInterval = setInterval(() => {
      this.updateCurrentTimeMarker();
    }, 60000);
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
  ): DataItem[] {
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

          // Each index gets its own color (cycles through the 5 colors)
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

  moveToNextHours(hours: number): void {
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60 * 60);
    const laterTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

    this.timeline.setWindow(startTime, laterTime, {
      animation: {
        duration: 500,
        easingFunction: 'easeInOutQuad',
      },
    });
  }

  private setupSelectionObserver(): void {
    const timelineContainer = this.container.nativeElement;

    const applySelectionStyle = (element: HTMLElement) => {
      // Set transition first
      element.style.setProperty(
        'transition',
        'margin-top 0.2s ease, box-shadow 0.2s ease',
        'important'
      );

      element.style.setProperty('outline', '1px solid #222', 'important');
      element.style.setProperty('z-index', '999', 'important');
      element.style.setProperty('margin-top', '-.2rem', 'important');
      element.style.setProperty(
        'box-shadow',
        '0 4px 8px rgba(0, 0, 0, 0.2)',
        'important'
      );
    };

    const removeSelectionStyle = (element: HTMLElement) => {
      // Reset to original values to trigger reverse transition
      element.style.setProperty('margin-top', '0', 'important');
      element.style.setProperty('box-shadow', 'none', 'important');

      // Remove other non-transitioning properties immediately
      element.style.removeProperty('outline');
      element.style.removeProperty('outline-offset');
      element.style.removeProperty('z-index');

      // Clean up transition properties after animation completes
      setTimeout(() => {
        element.style.removeProperty('margin-top');
        element.style.removeProperty('box-shadow');
        element.style.removeProperty('transition');
      }, 200);
    };

    const handleVisItem = (item: HTMLElement) => {
      observer.observe(item, { attributes: true, attributeFilter: ['class'] });
      if (item.classList.contains('vis-selected')) {
        applySelectionStyle(item);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const element = mutation.target as HTMLElement;
          if (element.classList.contains('vis-selected')) {
            applySelectionStyle(element);
          } else if (element.classList.contains('vis-item')) {
            removeSelectionStyle(element);
          }
        }

        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node: any) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList?.contains('vis-item')) {
                handleVisItem(node as HTMLElement);
              }
              node
                .querySelectorAll?.('.vis-item')
                .forEach((item: Element) => handleVisItem(item as HTMLElement));
            }
          });
        }
      });
    });

    observer.observe(timelineContainer, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });

    timelineContainer
      .querySelectorAll('.vis-item')
      .forEach((item: Element) => handleVisItem(item as HTMLElement));
  }

  generateColorVariants(baseHex: string): string[] {
    // Remove # if present
    const hex = baseHex.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Generate 3 variants
    const variants = [
      // Original color
      baseHex,

      // Lighter variant (add 40 to each component, max 255)
      `#${Math.min(255, r + 25)
        .toString(16)
        .padStart(2, '0')}${Math.min(255, g + 20)
        .toString(16)
        .padStart(2, '0')}${Math.min(255, b - 12)
        .toString(16)
        .padStart(2, '0')}`,

      // Darker variant (subtract 40 from each component, min 0)
      `#${Math.max(0, r - 19)
        .toString(16)
        .padStart(2, '0')}${Math.max(0, g - 20)
        .toString(16)
        .padStart(2, '0')}${Math.max(0, b - 12)
        .toString(16)
        .padStart(2, '0')}`,
    ];

    return variants;
  }

  private addCurrentTimeMarker() {
    const now = new Date();

    // Add custom time to vis-timeline
    this.timeline.addCustomTime(now, 'currentTime');
    this.timeline.setCustomTimeTitle('Current Time', 'currentTime');

    // Style the current time line (optional)
    setTimeout(() => {
      const timeBar = document.querySelector(
        '.vis-custom-time[data-id="currentTime"]'
      );
      if (timeBar) {
        (timeBar as HTMLElement).style.backgroundColor = '#ff4444';
        (timeBar as HTMLElement).style.width = '3px';
        (timeBar as HTMLElement).style.zIndex = '999';
      }
    }, 100);
  }

  private updateCurrentTimeMarker() {
    const now = new Date();
    this.timeline.setCustomTime(now, 'currentTime');
  }

  goToHour(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const hour = parseInt(target.value);

    if (!isNaN(hour)) {
      const today = new Date();
      const startTime = new Date(today.setHours(hour, 0, 0, 0));
      const endTime = new Date(today.setHours(hour + 2, 0, 0, 0)); // Show 2-hour window

      this.timeline.setWindow(startTime, endTime, {
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad',
        },
      });
    }
  }
}
