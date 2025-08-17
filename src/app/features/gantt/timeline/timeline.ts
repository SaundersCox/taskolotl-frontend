import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { debounceTime, fromEvent, Subject, takeUntil } from 'rxjs';
import { Timeline } from 'vis-timeline/standalone';
import { TimelineService } from './timeline-service';

@Component({
  selector: 'app-timeline',
  imports: [],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
})
export class TimelineComponent implements AfterViewInit, OnDestroy {
  @ViewChild('timelineContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;
  @Input() busRoutes: BusRoute[] = [];
  hours = Array.from({ length: 12 }, (_, i) => i);
  private readonly destroy$ = new Subject<void>();

  private readonly today = new Date().toLocaleDateString('en-CA');
  private readonly selectedItems = new Set<string>();
  private timeline!: Timeline;
  private currentTimeInterval?: number;

  constructor(private readonly timelineService: TimelineService) {}

  ngOnInit() {
    this.timelineService.isWeekendMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isWeekend) => {
        this.refreshTimeline();
      });
  }

  get isWeekendMode(): boolean {
    return this.timelineService.isWeekendMode;
  }

  ngAfterViewInit() {
    this.initTimeline();
  }

  ngOnDestroy() {
    this.timeline?.destroy();
    if (this.currentTimeInterval) clearInterval(this.currentTimeInterval);
    this.destroy$.next();
    this.destroy$.complete();
  }

  initTimeline() {
    this.timeline?.destroy();

    // Pass routes to service methods
    const items = this.timelineService.createRoutesDataSet(
      this.busRoutes,
      this.today
    );
    const groups = this.timelineService.createGroups(this.busRoutes);
    const options = this.timelineService.getTimelineOptions();

    this.timeline = new Timeline(
      this.container.nativeElement,
      items,
      groups,
      options
    );

    this.setupEventHandlers();
    this.addCurrentTimeMarker();
    this.currentTimeInterval = setInterval(
      () => this.updateCurrentTimeMarker(),
      60000
    );
    setTimeout(() => this.updateTimelineSize(), 100);

    this.setupSelectionObserver();
    this.setupDebouncedResize();
  }

  private setupEventHandlers() {
    this.timeline.on('select', (props: any) => {
      if (props.items.length === 0) return;

      const clickedId = props.items[props.items.length - 1];

      if (this.selectedItems.has(clickedId)) {
        this.selectedItems.delete(clickedId);
        this.highlightSelection(clickedId, false); // Remove highlight
      } else {
        this.selectedItems.add(clickedId);
        this.highlightSelection(clickedId, true); // Add highlight
      }

      this.timeline.setSelection(Array.from(this.selectedItems));
    });
  }

  clearAllSelections() {
    this.selectedItems.forEach((id) => {
      const el = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
      if (el) {
        el.style.backgroundColor = '';
        el.style.border = '';
      }
    });
    this.selectedItems.clear();
    this.timeline.setSelection([]);
  }

  moveToNextHours(hours: number) {
    const { startTime, laterTime } =
      this.timelineService.createHoursWindow(hours);
    this.animateToWindow(startTime, laterTime);
  }

  goToHour(event: Event) {
    const hour = parseInt((event.target as HTMLSelectElement).value);
    if (isNaN(hour)) return;

    const { startTime, endTime } = this.timelineService.createTimeWindow(
      hour,
      2
    );
    this.animateToWindow(startTime, endTime);
  }

  private animateToWindow(start: Date, end: Date) {
    this.timeline.setWindow(start, end, {
      animation: { duration: 500, easingFunction: 'easeInOutQuad' },
    });
  }

  private addCurrentTimeMarker() {
    const now = new Date();
    this.timeline.addCustomTime(now, 'currentTime');
    this.timeline.setCustomTimeTitle('Current Time', 'currentTime');

    setTimeout(() => {
      const timeBar = document.querySelector(
        '.vis-custom-time[data-id="currentTime"]'
      ) as HTMLElement;
      if (timeBar) {
        Object.assign(timeBar.style, {
          backgroundColor: '#ff4444',
          width: '3px',
          zIndex: '999',
        });
      }
    }, 100);
  }

  private updateCurrentTimeMarker() {
    this.timeline.setCustomTime(new Date(), 'currentTime');
  }

  private setupDebouncedResize() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTimelineSize();
      });
  }
  private updateTimelineSize() {
    const parentHeight =
      this.container.nativeElement.parentElement?.clientHeight;
    const parentWidth = this.container.nativeElement.parentElement?.clientWidth;
    if (this.timeline && parentHeight && parentWidth) {
      this.timeline.setOptions({
        height: parentHeight - 70,
        width: parentWidth - 15,
      });
      this.timeline.redraw();
    }
  }

  private highlightSelection(itemId: string, isSelected: boolean) {
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

  private setupSelectionObserver() {
    const container = this.container.nativeElement;

    const highlightElement = (element: HTMLElement, isSelected: boolean) => {
      if (isSelected) {
        Object.assign(element.style, {
          transition: 'margin-top 0.2s ease, box-shadow 0.2s ease',
          outline: '1px solid #222',
          zIndex: '999',
          marginTop: '-.2rem',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        });
      } else {
        element.style.marginTop = '0';
        element.style.boxShadow = 'none';
        element.style.removeProperty('outline');
        element.style.removeProperty('z-index');

        setTimeout(() => {
          element.style.removeProperty('margin-top');
          element.style.removeProperty('box-shadow');
          element.style.removeProperty('transition');
        }, 200);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const element = mutation.target as HTMLElement;
          if (element.classList.contains('vis-item')) {
            const isSelected = element.classList.contains('vis-selected');
            highlightElement(element, isSelected);
          }
        }

        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node: any) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const items = node.classList?.contains('vis-item')
                ? [node]
                : Array.from(node.querySelectorAll?.('.vis-item') || []);

              items.forEach((item: HTMLElement) => {
                observer.observe(item, {
                  attributes: true,
                  attributeFilter: ['class'],
                });
                if (item.classList.contains('vis-selected')) {
                  highlightElement(item, true);
                }
              });
            }
          });
        }
      });
    });

    observer.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
  }

  private refreshTimeline() {
    const items = this.timelineService.createRoutesDataSet(
      this.busRoutes,
      new Date().toLocaleDateString()
    );

    const groups = this.timelineService.createGroups(this.busRoutes);

    this.timeline.setItems(items);
    this.timeline.setGroups(groups);
  }

  toggleWeekendMode() {
    this.timelineService.toggleWeekendMode();
  }
}
