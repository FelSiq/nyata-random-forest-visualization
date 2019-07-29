import { TestBed } from '@angular/core/testing';

import { TreeNodeService } from './tree-node.service';

describe('TreeNodeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeNodeService = TestBed.get(TreeNodeService);
    expect(service).toBeTruthy();
  });
});
