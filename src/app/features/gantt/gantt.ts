import { Component } from '@angular/core';
import { TimelineComponent } from '../../src/app/features/gantt/timeline/timeline';

@Component({
  selector: 'app-gantt',
  imports: [TimelineComponent],
  templateUrl: './gantt.html',
  styleUrl: './gantt.css',
})
export class Gantt {}
