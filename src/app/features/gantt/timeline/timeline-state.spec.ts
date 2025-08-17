import { TestBed } from '@angular/core/testing';

import { TimelineState } from './timeline-state';

describe('TimelineState', () => {
  let service: TimelineState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
