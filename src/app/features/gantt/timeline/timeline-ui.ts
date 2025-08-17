import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TimelineUiService {
  highlightSelection(itemId: string, isSelected: boolean) {
    // ... your existing highlight logic
  }

  getTimelineOptions() {
    // ... your existing options logic
  }
}
