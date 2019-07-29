import { TestBed } from '@angular/core/testing';

import { TreeExtraService } from './tree-extra.service';

describe('TreeExtraService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeExtraService = TestBed.get(TreeExtraService);
    expect(service).toBeTruthy();
  });
});
