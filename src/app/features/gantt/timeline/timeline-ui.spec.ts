import { TestBed } from '@angular/core/testing';

import { TimelineUi } from './timeline-ui';

describe('TimelineUi', () => {
  let service: TimelineUi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineUi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
