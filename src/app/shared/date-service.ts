import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  private readonly _weekendModeEnabled = signal(
    [0, 6].includes(new Date().getDay()),
  );

  readonly weekendMode = computed(() => this._weekendModeEnabled());

  toggleWeekendMode() {
    this._weekendModeEnabled.update((enabled) => !enabled);
  }

  setWeekendMode(enabled: boolean) {
    this._weekendModeEnabled.set(enabled);
  }

  today(): string {
    return new Date().toLocaleDateString('en-CA');
  }

  todayIsWeekend(): boolean {
    return [0, 6].includes(new Date().getDay());
  }

  timeFromNow(hours: number): Date {
    return new Date(new Date().getTime() + hours * 60 * 60 * 1000);
  }

  createTimeWindow(windowHours: number, hour?: number) {
    const today = new Date();

    let startTime: Date;
    if (hour !== undefined) {
      startTime = new Date(today.setHours(hour, 0, 0, 0));
    } else {
      startTime = new Date();
    }

    const endTime = new Date(
      startTime.getTime() + windowHours * 60 * 60 * 1000,
    );
    return { startTime, endTime };
  }

  createHoursWindow(hours: number) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60 * 1000);
    const laterTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
    return { startTime, laterTime };
  }
}
