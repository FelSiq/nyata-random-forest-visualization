import { TestBed } from '@angular/core/testing';

import { DashService } from './dash.service';

describe('DashService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DashService = TestBed.get(DashService);
    expect(service).toBeTruthy();
  });
});
