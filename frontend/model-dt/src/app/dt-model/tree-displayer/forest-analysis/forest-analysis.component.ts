import { Component, OnInit } from '@angular/core';
import { MostCommonAttrSeqService } from './most-common-attr-seq.service';

@Component({
  selector: 'app-forest-analysis',
  templateUrl: './forest-analysis.component.html',
  styleUrls: ['./forest-analysis.component.css']
})
export class ForestAnalysisComponent implements OnInit {
  rankCommonAttrSeq = [];
  errorMessage: string = '';
  calledCommonAttrSeqService: boolean = false;

  constructor(public mostCommonAttrSeqService: MostCommonAttrSeqService) { }

  ngOnInit(): void {
  }

  getMostCommonAttrSeq(numAttr: number) {
    if (numAttr < 1) {
        return;
    }

    this.rankCommonAttrSeq = null;
    this.calledCommonAttrSeqService = true;

    this.mostCommonAttrSeqService.getMostCommonAttrSeq(numAttr)
      .subscribe((results) => {
          this.rankCommonAttrSeq = results;
          this.calledCommonAttrSeqService = false;
        }, error => {
          this.rankCommonAttrSeq = [];
          this.errorMessage = 'Test.';
          this.calledCommonAttrSeqService = false;
        });
  }
}
