import { Component, OnInit, OnDestroy } from '@angular/core';
import { MostCommonAttrSeqService } from './most-common-attr-seq.service';
import { HierClusService } from './hier-clus.service';
import { Input, Output, EventEmitter } from '@angular/core';
import { HierClus, ClusterNode, ClusterData, KeyValuePair } from './hier-clus';
import { Subject } from 'rxjs/Subject';

import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-forest-analysis',
  templateUrl: './forest-analysis.component.html',
  styleUrls: ['./forest-analysis.component.css']
})
export class ForestAnalysisComponent implements OnInit, OnDestroy {
  @Input() numEstimators: number = -1;
  @Input() modelType: string;
  @Input() attrLabels: string[] = [];

  @Output() peekMedoidTree = new EventEmitter<number>();

  rankCommonAttrSeq = [];
  hierClusters: ClusterData[] = [];
  leavesOptSeq: number[];
  attrSeqRelFreq: number[] = [];
  totalRelFreq: number = 0.0;
  errorMessage: string = '';
  calledCommonAttrSeqService: boolean = false;
  calledHierClusService = false;
  propCutSliderValue: number = 0.0;
  numHierClusters: number = 0;
  thresholdCut: number;
  includeDecisionFeature: boolean = false;
  hierClustersTree: ClusterNode[] = null;
  selectedLinkageType: string;
  resultLinkageType: string;
  selectedChVectorType: string = 'dna';
  calledHierClusCutService: boolean = false;
  childUpdateThreshold: Subject<void> = new Subject<void>();
  clustSumDists: KeyValuePair[];
  hierClusDistFormula: string;
  xMaxLimit: number;

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

  ngOnDestroy(): void {
    this.mostCommonAttrSeqService.destroy();
    this.hierClusService.destroy();
  }

  emitEventToParent(treeId: string | number) {
    this.peekMedoidTree.emit(+treeId);
  }

  emitEventToChild() {
    this.childUpdateThreshold.next();
  }

  formatEqFormula(equation: string): string {
    if (!equation) {
      return 'Unknown';
    }
    return equation.replace('_', '\\_');
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
      this.errorMessage = 'The model must be a forest.';
    }

    if (this.calledHierClusService) {
      return;
    }

    this.hierClusters = null;
    this.numHierClusters = 0;
    this.hierClustersTree = null;
    this.leavesOptSeq =  null;
    this.calledHierClusService = true;
    this.thresholdCut = +this.propCutSliderValue;
    this.resultLinkageType =  this.selectedLinkageType;
    this.clustSumDists = null;

    this.hierClusService.getHierarchicalClustering(this.thresholdCut,
                                                   this.selectedLinkageType,
                                                   this.selectedChVectorType)
      .subscribe((results: HierClus) => {
          this.hierClusters = results['clust_assignment'];
          this.leavesOptSeq = results['optimal_leaves_seq'];
	  this.hierClusDistFormula = results['hier_clus_distance'];
          this.numHierClusters = +results['num_cluster'];
          this.hierClustersTree = results['dendrogram_tree'];
          this.clustSumDists = results['clust_sum_dists'];
	  this.xMaxLimit = +results['max_limit'];
          this.calledHierClusService = false;
        }, error => {
          this.hierClusters = [];
	  this.numHierClusters = 0;
	  this.hierClustersTree = null;
          this.leavesOptSeq =  null;
          this.resultLinkageType =  null;
	  this.xMaxLimit = -1;
          this.errorMessage = 'Something went wrong while communicating with the backend.';
          this.calledHierClusService = false;
        });
  }

  cutHierarchicalClustering() {
    this.errorMessage = '';

    if (!this.hierClusters || this.calledHierClusCutService) {
      return;
    }

    this.thresholdCut = +this.propCutSliderValue;
    this.calledHierClusCutService = true;
    this.clustSumDists = null;

    this.hierClusService.cutHierarchicalClustering(this.thresholdCut)
      .subscribe((results) => {
          this.hierClusters = results['clust_assignment'];
          this.numHierClusters = +results['num_cluster'];
          this.calledHierClusCutService = false;
          this.clustSumDists = results['clust_sum_dists'];
          this.emitEventToChild();
        }, error => {
          this.hierClusters = [];
	  this.numHierClusters = 0;
          this.errorMessage = 'Something went wrong while communicating with the backend.';
          this.calledHierClusCutService = false;
        });
  }

  captureScreen(id: string, pdfName: string = 'analysis-data.pdf'): void {
    const data = document.getElementById(id);  

    html2canvas(data).then(canvas => {
      const origRatio = canvas.width / canvas.height;

      // Note 1px ~= 0.2645833333333mm
      const imgHeight = Math.min(290, canvas.height * 0.264583);
      const imgWidth = Math.min(200, canvas.width * 0.264583, imgHeight * origRatio);
  
      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jspdf('p', 'mm', 'a4');
      const position = 0;
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save(pdfName);
    });
  }
}
