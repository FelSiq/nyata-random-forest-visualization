import { TestBed } from '@angular/core/testing';

import { HierClusService } from './hier-clus.service';

describe('HierClusService', () => {
  let service: HierClusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HierClusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
