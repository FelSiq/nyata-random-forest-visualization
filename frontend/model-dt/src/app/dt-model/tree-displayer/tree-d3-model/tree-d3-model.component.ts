import { Component, OnInit, AfterViewInit, Input, ElementRef } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';

import { TreeNodeService } from './tree-node.service';
import { TreeLinksService } from './tree-links.service';
import { TreeExtraService } from './tree-extra.service';
import { DTInterface, TreeInterface } from '../../../dt-interface';

@Component({
  selector: 'app-tree-d3-model',
  templateUrl: './tree-d3-model.component.html',
  styleUrls: ['./tree-d3-model.component.css'],
})
export class TreeD3ModelComponent implements OnInit, AfterViewInit {
  @Input() treeNodes: DTInterface[];

  private _decisionPath: Array<Array<number | string>>;

  @Input() set decisionPath(decisionPath: Array<Array<number | string>>) {
    this._decisionPath = decisionPath;

    if (this._decisionPath && this.chosenTree) {
      this.linkService.cleanPredictionPaths(this.links, true);
      this.linkService.drawPredictionPaths(
        this.links,
        this._decisionPath[+this.chosenTree]);
    } else {
      this.linkService.cleanPredictionPaths(this.links, false);
    }
  }

  chosenTree: string | number;
  zoomValue = 0;

  readonly zoomMin: number = 0;
  readonly zoomMax: number = 3;

  private svg: any;
  private links: any;
  private nodes: any;
  private depthMarkers: any;
  private impurityColors: any;
  private width: number;
  private height: number;
  private maxImpurity: number;

  constructor(private eleRef: ElementRef,
              private nodeService: TreeNodeService,
              private linkService: TreeLinksService,
              private extraService: TreeExtraService) { }

  ngOnInit() {
    this.chosenTree = '0';
  }

  ngAfterViewInit() {
    this.changesHandler();
  }

  private changesHandler(): void {
    this.initSvg();
    this.createTree();
  }

  private updateZoomValue(increment: number): void {
    const aux = this.zoomValue + increment;
    this.zoomValue = Math.max(this.zoomMin, Math.min(aux, this.zoomMax));
  }

  private initSvg() {
    this.svg = d3.select('svg');

    this.cleanSvg();

    this.depthMarkers = this.svg.append('g')
        .classed('group-depth-markers cleanable', true);

    this.links = this.svg.append('g')
        .classed('group-links cleanable', true);

    this.nodes = this.svg.append('g')
        .classed('group-nodes cleanable', true);

    this.width = (
        +this.svg.attr('width') ?
        +this.svg.attr('width') :
        this.eleRef.nativeElement.offsetWidth
    ) - 2 * (TreeNodeService.radiusMinimum +
             TreeNodeService.radiusScaleFactor);

    this.height = (
        +this.svg.attr('height') ?
        +this.svg.attr('height') :
        this.eleRef.nativeElement.offsetHeight
    );

    /*
    this.svg.call(d3Zoom.zoom()
      .scaleExtent([0.5, 3])
      .translateExtent([[0, 0], [this.width, this.height]])
      .on('zoom', () => {
        this.svg
          .attr('transform', d3.event.transform);
      }));
    */
  }

  private cleanSvg(): void {
    this.svg.selectAll('.cleanable')
      .selectAll('*').remove();
  }

  private createTree(): void {
    if (!this.svg || !this.treeNodes) {
      return;
    }

    const curTreeNodes = this.treeNodes[+this.chosenTree];

    if (!(curTreeNodes.hasOwnProperty('tree_'))) {
      return;
    }

    const curTree = curTreeNodes.tree_.value as TreeInterface;

    const criterion = curTreeNodes.criterion.value;

    this.maxImpurity = (
      criterion === 'gini' ? 1.0 :
      (criterion === 'entropy' ? Math.log2(curTree.maximum_number_of_classes) :
      (Math.max(...curTree.impurity))));

    this.impurityColors = d3Scale.scaleLinear<string>()
        .domain([0.0, this.maxImpurity])
        .range(['white', 'black']);

    const cxDelta = this.width / 4.05;
    const cyDelta = 0.98 * this.height / (1 + curTree.maximum_depth);
    const rootYCoord = (
        TreeNodeService.radiusMinimum +
        TreeNodeService.radiusScaleFactor +
        0.01 * this.height);

    this.extraService.buildDepthMarkers(
        this.depthMarkers,
        0.01 * this.width,
        0.99 * this.width,
        rootYCoord,
        cyDelta,
        curTree.maximum_depth);

    this.buildNode(
        curTree,
        0,
        -1,
        0.5 * this.width + (TreeNodeService.radiusMinimum +
                            TreeNodeService.radiusScaleFactor),
        cxDelta,
        rootYCoord,
        cyDelta);

    if (this._decisionPath && this.chosenTree) {
      this.linkService.cleanPredictionPaths(
        this.links,
        true);
      this.linkService.drawPredictionPaths(
        this.links,
        this._decisionPath[+this.chosenTree]);
    }

    if (this.links) {
      this.linkService.updateLinkLabel(this.links);
    }

    if (this.nodes) {
      this.nodeService.updateNodeLabel(this.nodes);
    }
  }

  private buildNode(
        curTree: TreeInterface,
        nodeId: number,
        parentId: number,
        cx: number,
        cxDelta: number,
        cy: number,
        cyDelta: number): void {

      const sonLeftId = +curTree.children_left[nodeId];
      const sonRightId = +curTree.children_right[nodeId];
      const impurity = +curTree.impurity[nodeId];
      const numInstInNode = +curTree.weighted_number_of_node_samples[nodeId];
      const threshold = +curTree.threshold[nodeId];
      const feature = +curTree.feature[nodeId];
      const nodeClassId = curTree.value[nodeId][0].indexOf(Math.max(...curTree.value[nodeId][0]));
      const circleColor = this.impurityColors(impurity);

      const radius = (
        TreeNodeService.radiusMinimum +
        TreeNodeService.radiusScaleFactor *
        (numInstInNode /
        +curTree.weighted_number_of_node_samples[0]));

      this.nodeService.generateNode(
          this.nodes,
          nodeId,
          cx,
          cy,
          radius,
          circleColor,
          {
            'impurity': impurity,
            'decision-feature': feature,
            'node-class-id': nodeClassId,
            'threshold': threshold,
            'num-inst': numInstInNode,
            'parent-id': parentId,
            'son-left-id': sonLeftId,
            'son-right-id': sonRightId,
          });

      if (sonLeftId >= 0 && sonLeftId < curTree.capacity) {
        const cxSonLeft = cx - cxDelta;
        const cySonLeft = cy + cyDelta;

        this.buildNode(
            curTree,
            sonLeftId,
            nodeId,
            cxSonLeft,
            0.5 * cxDelta,
            cySonLeft,
            cyDelta);

        this.linkService.connectNodes(this.links, this.nodes, nodeId, sonLeftId, '<=');
      }

      if (sonRightId >= 0 && sonRightId < curTree.capacity) {
        const cxSonRight = cx + cxDelta;
        const cySonRight = cy + cyDelta;

        this.buildNode(
            curTree,
            sonRightId,
            nodeId,
            cxSonRight,
            0.5 * cxDelta,
            cySonRight,
            cyDelta);

        this.linkService.connectNodes(this.links, this.nodes, nodeId, sonRightId, '>');
      }
  }

}
