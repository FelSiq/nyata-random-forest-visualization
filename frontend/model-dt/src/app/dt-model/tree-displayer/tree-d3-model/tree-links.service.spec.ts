import { TestBed } from '@angular/core/testing';

import { TreeLinksService } from './tree-links.service';

describe('TreeLinksService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeLinksService = TestBed.get(TreeLinksService);
    expect(service).toBeTruthy();
  });
});
