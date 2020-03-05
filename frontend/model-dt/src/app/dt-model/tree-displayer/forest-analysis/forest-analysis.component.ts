import { Component, OnInit } from '@angular/core';
import { MostCommonAttrSeqService } from './most-common-attr-seq.service';
import { HierClusService } from './hier-clus.service';
import { Input } from '@angular/core';

@Component({
  selector: 'app-forest-analysis',
  templateUrl: './forest-analysis.component.html',
  styleUrls: ['./forest-analysis.component.css']
})
export class ForestAnalysisComponent implements OnInit {
  rankCommonAttrSeq = [];
  hierClusters = [];
  attrSeqRelFreq: number[] = [];
  totalRelFreq: number = 0.0;
  errorMessage: string = '';
  calledCommonAttrSeqService: boolean = false;
  calledHierClusService = false;
  @Input() numEstimators: number = -1;
  propCutSliderValue: number = 0.5;

  constructor(public mostCommonAttrSeqService: MostCommonAttrSeqService,
              public hierClusService: HierClusService) { }

  ngOnInit(): void {
  }

  getMostCommonAttrSeq(numAttr: number) {
  this.errorMessage = '';

    if (numAttr < 1) {
    	this.errorMessage = 'Number of attributes must be greater than 1.';
        return;
    }

    this.rankCommonAttrSeq = null;
    this.attrSeqRelFreq = [];
    this.totalRelFreq = 0.0;
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

  getHierarchicalClustering() {
    this.errorMessage = '';

    if (this.numEstimators <= 1) {
      this.errorMessage = 'The mobel must be a forest.';
    }

    this.hierClusters = null;
    this.calledHierClusService = true;

    this.hierClusService.getHierarchicalClustering(2.0 * +this.propCutSliderValue)
      .subscribe((results) => {
          this.hierClusters = results;
          this.calledHierClusService = false;
        }, error => {
          this.hierClusters = [];
          this.errorMessage = 'Something went wrong while communicating with the backend.';
          this.calledHierClusService = false;
        });
  }
}
