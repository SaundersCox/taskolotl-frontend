import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TimelineStateService {
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
}
