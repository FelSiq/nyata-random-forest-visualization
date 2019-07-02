import { TestBed } from '@angular/core/testing';

import { TreePredictCallerService } from './tree-predict-caller.service';

describe('TreePredictCallerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreePredictCallerService = TestBed.get(TreePredictCallerService);
    expect(service).toBeTruthy();
  });
});
