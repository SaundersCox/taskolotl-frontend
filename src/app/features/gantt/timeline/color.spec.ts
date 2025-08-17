import { TestBed } from '@angular/core/testing';

import { Color } from './color';

describe('Color', () => {
  let service: Color;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Color);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
