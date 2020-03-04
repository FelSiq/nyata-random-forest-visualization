import { TestBed } from '@angular/core/testing';

import { MostCommonAttrSeqService } from './most-common-attr-seq.service';

describe('MostCommonAttrSeqService', () => {
  let service: MostCommonAttrSeqService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MostCommonAttrSeqService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
