import { TestBed } from '@angular/core/testing';

import { ObjectLabelInfoService } from './object-label-info.service';

describe('ObjectLabelInfoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ObjectLabelInfoService = TestBed.get(ObjectLabelInfoService);
    expect(service).toBeTruthy();
  });
});
