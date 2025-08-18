import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, fromEvent } from 'rxjs';
import { Timeline, TimelineOptions } from 'vis-timeline/standalone';
import { TimelineService } from './timeline-service';
import { DateService } from '../../../shared/date-service';
import { BusRoute } from '../weeday-bus-routes/models';

// Define the select event interface
interface TimelineSelectEvent {
  items: string[];
  event: Event;
}

@Component({
  selector: 'app-timeline',
  imports: [],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
})
export class TimelineComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static readonly TIMELINE_HEIGHT_OFFSET = 70;
  private static readonly TIMELINE_WIDTH_OFFSET = 15;
  private static readonly RESIZE_DELAY = 100;

  @Input() busRoutes: BusRoute[] = [];
  hours = Array.from({ length: 12 }, (_, i) => i);

  @ViewChild('timelineContainer', { static: true })
  container!: ElementRef<HTMLDivElement>;

  private readonly timelineService = inject(TimelineService);
  private readonly dateService = inject(DateService);
  private readonly selectedItems = new Set<string>();

  weekendMode: Signal<boolean> = this.dateService.weekendMode;

  private timeline?: Timeline;
  private currentTimeInterval?: number;
  private selectionObserver?: MutationObserver;

  constructor() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(TimelineComponent.RESIZE_DELAY), takeUntilDestroyed())
      .subscribe(() => this.updateTimelineSize());

    effect(() => {
      this.dateService.weekendMode();
      if (this.timeline) {
        this.refreshTimelineData();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['busRoutes'] && this.timeline) {
      this.refreshTimelineData();
    }
  }

  ngAfterViewInit() {
    this.initTimeline();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  // Public API
  clearSelections() {
    this.selectedItems.clear();
    this.timeline?.setSelection([]);
  }

  moveToNextHours(hours: number) {
    if (!this.timeline) return;
    const window = this.timelineService.createTimeWindow(hours);
    this.animateToWindow(window.startTime, window.endTime);
  }

  goToHour(event: Event) {
    if (!this.timeline) return;
    const hour = parseInt((event.target as HTMLSelectElement).value);
    if (isNaN(hour)) return;

    const window = this.timelineService.createTimeWindow(2, hour);
    this.animateToWindow(window.startTime, window.endTime);
  }

  toggleWeekendMode() {
    this.dateService.toggleWeekendMode();
  }

  // Timeline initialization
  private initTimeline() {
    try {
      this.cleanup();

      // Create timeline with data and options
      const items = this.timelineService.createRoutesDataSet(
        this.busRoutes,
        this.dateService.today(),
      );
      const groups = this.timelineService.createGroups(this.busRoutes);
      const options = this.getTimelineOptions();

      this.timeline = new Timeline(
        this.container.nativeElement,
        items,
        groups,
        options,
      );

      // Setup event handlers
      this.timeline.on('select', (props: TimelineSelectEvent) => {
        if (props.items.length === 0) return;

        const clickedId = props.items[props.items.length - 1];
        if (this.selectedItems.has(clickedId)) {
          this.selectedItems.delete(clickedId);
        } else {
          this.selectedItems.add(clickedId);
        }
        this.timeline?.setSelection(Array.from(this.selectedItems));
      });

      // Setup selection observer and initial resize
      this.setupSelectionObserver();
      this.updateTimelineSize();
    } catch (error) {
      console.error('Failed to initialize timeline', error);
    }
  }

  private refreshTimelineData() {
    if (!this.timeline) return;

    const items = this.timelineService.createRoutesDataSet(
      this.busRoutes,
      this.dateService.today(),
    );
    const groups = this.timelineService.createGroups(this.busRoutes);

    this.timeline.setItems(items);
    this.timeline.setGroups(groups);
  }

  private setupSelectionObserver() {
    const container = this.container.nativeElement;

    const selectElement = (element: HTMLElement) => {
      Object.assign(element.style, {
        transition: 'margin-top 0.2s ease, box-shadow 0.2s ease',
        outline: '1px solid #222',
        zIndex: '999',
        marginTop: '-.2rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      });
    };

    const deselectElement = (element: HTMLElement) => {
      Object.assign(element.style, {
        marginTop: '0',
        boxShadow: 'none',
        outline: '',
        zIndex: '',
      });

      setTimeout(() => {
        element.style.removeProperty('margin-top');
        element.style.removeProperty('box-shadow');
        element.style.removeProperty('transition');
      }, 200);
    };

    const handleVisItem = (element: HTMLElement) => {
      if (element.classList.contains('vis-selected')) {
        selectElement(element);
      } else {
        deselectElement(element);
      }
    };

    this.selectionObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const element = mutation.target as HTMLElement;
          if (element.classList.contains('vis-item')) {
            handleVisItem(element);
          }
        }

        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              const items = element.classList?.contains('vis-item')
                ? [element]
                : Array.from(element.querySelectorAll?.('.vis-item') || []);

              items.forEach((item) => {
                const htmlItem = item as HTMLElement;
                this.selectionObserver?.observe(htmlItem, {
                  attributes: true,
                  attributeFilter: ['class'],
                });
                if (htmlItem.classList.contains('vis-selected')) {
                  selectElement(htmlItem);
                }
              });
            }
          });
        }
      });
    });

    this.selectionObserver.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
  }

  private animateToWindow(start: Date, end: Date) {
    this.timeline?.setWindow(start, end, {
      animation: { duration: 500, easingFunction: 'easeInOutQuad' },
    });
  }

  private updateTimelineSize() {
    const parent = this.container.nativeElement.parentElement;
    if (!this.timeline || !parent) return;

    const { clientHeight, clientWidth } = parent;
    this.timeline.setOptions({
      height: clientHeight - TimelineComponent.TIMELINE_HEIGHT_OFFSET,
      width: clientWidth - TimelineComponent.TIMELINE_WIDTH_OFFSET,
    });
    this.timeline.redraw();
  }

  private cleanup() {
    this.timeline?.destroy();
    this.selectionObserver?.disconnect();

    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
      this.currentTimeInterval = undefined;
    }
  }

  private getTimelineOptions(): TimelineOptions {
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
      editable: false,
    };
  }
}
