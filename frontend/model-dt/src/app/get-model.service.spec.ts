import { TestBed } from '@angular/core/testing';

import { GetModelService } from './get-model.service';

describe('GetModelService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GetModelService = TestBed.get(GetModelService);
    expect(service).toBeTruthy();
  });
});
