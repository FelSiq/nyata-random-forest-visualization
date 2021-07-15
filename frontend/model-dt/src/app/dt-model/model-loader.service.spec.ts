import { TestBed } from '@angular/core/testing';

import { ModelLoaderService } from './model-loader.service';

describe('ModelLoaderService', () => {
  let service: ModelLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
