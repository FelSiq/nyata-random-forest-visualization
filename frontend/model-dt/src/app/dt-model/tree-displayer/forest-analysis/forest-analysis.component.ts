import { Component, OnInit } from '@angular/core';
import { MostCommonAttrSeqService } from './most-common-attr-seq.service';

@Component({
  selector: 'app-forest-analysis',
  templateUrl: './forest-analysis.component.html',
  styleUrls: ['./forest-analysis.component.css']
})
export class ForestAnalysisComponent implements OnInit {
  rankCommonAttrSeq = [];
  attrSeqRelFreq: number[] = [];
  totalRelFreq: number = 0.0;
  errorMessage: string = '';
  calledCommonAttrSeqService: boolean = false;

  constructor(public mostCommonAttrSeqService: MostCommonAttrSeqService) { }

  ngOnInit(): void {
  }

  getMostCommonAttrSeq(numAttr: number) {
  this.errorMessage = '';

    if (numAttr < 1) {
    	this.errorMessage = 'Number of attributes must be greater than 1.';
        return;
    }

    this.rankCommonAttrSeq = null;
    this.calledCommonAttrSeqService = true;

    this.mostCommonAttrSeqService.getMostCommonAttrSeq(numAttr)
      .subscribe((results) => {
          this.rankCommonAttrSeq = results[0];
          this.attrSeqRelFreq = results[1];
	  this.totalRelFreq = results[1].reduce((a, b) => a + b, 0);
          this.calledCommonAttrSeqService = false;
        }, error => {
          this.rankCommonAttrSeq = [];
          this.errorMessage = 'Something went wrong while communicating with the backend.';
	  this.totalRelFreq = 0.0;
          this.calledCommonAttrSeqService = false;
        });
  }
}
