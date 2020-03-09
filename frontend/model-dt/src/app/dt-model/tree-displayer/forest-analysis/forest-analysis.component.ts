import { Component, OnInit } from '@angular/core';
import { MostCommonAttrSeqService } from './most-common-attr-seq.service';
import { HierClusService } from './hier-clus.service';
import { Input } from '@angular/core';
import { HierClus, ClusterNode, ClusterData } from './hier-clus';

@Component({
  selector: 'app-forest-analysis',
  templateUrl: './forest-analysis.component.html',
  styleUrls: ['./forest-analysis.component.css']
})
export class ForestAnalysisComponent implements OnInit {
  rankCommonAttrSeq = [];
  hierClusters: ClusterData[] = [];
  leavesOptSeq: number[];
  attrSeqRelFreq: number[] = [];
  totalRelFreq: number = 0.0;
  errorMessage: string = '';
  calledCommonAttrSeqService: boolean = false;
  calledHierClusService = false;
  @Input() numEstimators: number = -1;
  propCutSliderValue: number = 0.5;
  @Input() attrLabels: string[] = [];
  numHierClusters: number = 0;
  thresholdCut: number;
  includeDecisionFeature: boolean = false;
  hierClustersTree: ClusterNode[] = null;
  selectedLinkageType: string;
  resultLinkageType: string;

  availableLinkages: string[] = [
    'single',
    'average',
    'complete',
    'weighted',
  ];

  constructor(public mostCommonAttrSeqService: MostCommonAttrSeqService,
              public hierClusService: HierClusService) { }

  ngOnInit(): void {
  }

  getMostCommonAttrSeq(numAttr: number, includeDecision: boolean) {
  this.errorMessage = '';

    if (numAttr < 1) {
    	this.errorMessage = 'Number of attributes must be greater than 1.';
        return;
    }

    this.rankCommonAttrSeq = null;
    this.attrSeqRelFreq = [];
    this.totalRelFreq = 0.0;
    this.calledCommonAttrSeqService = true;
    this.includeDecisionFeature = includeDecision;

    this.mostCommonAttrSeqService.getMostCommonAttrSeq(numAttr, includeDecision)
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

  formatFeatAndDecision(feat: number | string, decision: string): string {
    if (decision === "<=") {
      decision = "≤";
    }
    return '(' + feat + ', ' + decision + ')';
  }

  formatAllFeatAndDecision(rules: Array<[number | string, string]>): string[] {
    let res = [];

    for (let i = 0; i < rules.length; i++) {
      res.push(this.formatFeatAndDecision(rules[i][0], rules[i][1]));
    }

    return res;
  }

  translateAttrSeq(seq: string): string[] {
    let splittedVals = [];

    for (let i = 0; i < seq.length; i++) {
      if (!this.includeDecisionFeature) {
        splittedVals.push(this.attrLabels[seq[i]]);
      } else {
        let ind = seq[i][0];
	let decision = seq[i][1];
        splittedVals.push(this.formatFeatAndDecision(this.attrLabels[ind], decision));
      }
    }

    return splittedVals;
  }

  getHierarchicalClustering() {
    this.errorMessage = '';

    if (this.numEstimators <= 1) {
      this.errorMessage = 'The mobel must be a forest.';
    }

    this.hierClusters = null;
    this.numHierClusters = 0;
    this.hierClustersTree = null;
    this.leavesOptSeq =  null;
    this.calledHierClusService = true;
    this.thresholdCut = 2.0 * +this.propCutSliderValue;
    this.resultLinkageType =  this.selectedLinkageType;

    this.hierClusService.getHierarchicalClustering(this.thresholdCut, this.selectedLinkageType)
      .subscribe((results) => {
          this.hierClusters = results['clust_assignment'];
          this.leavesOptSeq = results['optimal_leaves_seq'];
          this.numHierClusters = +results['num_cluster'];
	      this.hierClustersTree = results['dendrogram_tree'];
          this.calledHierClusService = false;
        }, error => {
          this.hierClusters = [];
	      this.numHierClusters = 0;
	      this.hierClustersTree = null;
          this.leavesOptSeq =  null;
          this.resultLinkageType =  null;
          this.errorMessage = 'Something went wrong while communicating with the backend.';
          this.calledHierClusService = false;
        });
  }
}
