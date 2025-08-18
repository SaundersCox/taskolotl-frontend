import { Component, inject } from '@angular/core';
import { DateService } from '../../shared/date-service';
import { TimelineComponent } from './timeline/timeline';
import { countrysideStops } from './weeday-bus-routes/countryside-stops';
import { innovationStops } from './weeday-bus-routes/innovation-stops';
import { leesburgSterlingEastbound } from './weeday-bus-routes/leesburg-sterling-eastbound';
import { rtcStops } from './weeday-bus-routes/rtc-stops';
import { sterlingLeesburgWestbound } from './weeday-bus-routes/sterling-leesburg-westbound';
import { sterlingConnector } from './weeday-bus-routes/sterling-stops';

@Component({
  selector: 'app-gantt',
  imports: [TimelineComponent],
  templateUrl: './gantt.html',
  styleUrl: './gantt.css',
})
export class Gantt {
  private readonly dateService = inject(DateService);

  readonly busRoutes = [
    countrysideStops,
    sterlingLeesburgWestbound,
    leesburgSterlingEastbound,
    rtcStops,
    innovationStops,
    sterlingConnector,
  ];
}
