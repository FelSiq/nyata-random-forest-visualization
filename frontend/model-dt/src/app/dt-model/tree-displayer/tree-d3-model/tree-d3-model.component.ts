import { Component, OnInit, AfterViewInit, Input, ElementRef } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Transform from 'd3-transform';
import * as d3Drag from 'd3-drag';
import * as d3Shape from 'd3-shape';

import { TreeNodeService } from './tree-node.service';
import { TreeLinksService } from './tree-links.service';
import { TreeExtraService } from './tree-extra.service';
import { DTInterface, TreeInterface } from '../../../dt-interface';

type D3Selection = d3.Selection<SVGElement | any, {}, HTMLElement, any>;

@Component({
  selector: 'app-tree-d3-model',
  templateUrl: './tree-d3-model.component.html',
  styleUrls: ['./tree-d3-model.component.css'],
})
export class TreeD3ModelComponent implements OnInit, AfterViewInit {
  @Input() treeNodes: DTInterface[];

  private _decisionPath: Array<Array<number | string>>;
  @Input() singleInstAttrs: Array<string | number>;
  @Input() attrNames: string[];

  @Input() set decisionPath(decisionPath: Array<Array<number | string>>) {
    this._decisionPath = decisionPath;

    if (this._decisionPath && this.chosenTree) {
      this.solvePredictionIssues();

    } else {
      this.linkService.cleanPredictionPaths(this.links,
        this.nodes,
        false);

      this.nodeService.toggleNodeInPredictPath(this.nodes, null, null);

      const predictLogIndex = this.nodeService.activeAttrs.indexOf('predict-log');
      if (predictLogIndex > -1) {
        this.nodeService.activeAttrs.splice(predictLogIndex, 1);
      }

      this.nodeService.updateNodeLabel(this.nodes);
      this.linkService.updateLinkLabel(this.links);
    }
  }

  chosenTree: string | number;

  readonly zoomMin: number = 1;
  readonly zoomMax: number = 4;
  readonly minDefaultDepthFromRoot = 3;
  readonly minDefaultDepthFromLeaf = 3;

  private svg: D3Selection;
  private basePack: D3Selection;
  private links: D3Selection;
  private nodes: D3Selection;
  private depthMarkers: D3Selection;
  private width: number;
  private height: number;
  private maxImpurity: number;
  private treeAngle = 180;
  private zoomValue = 1;
  private xTranslate = 0;
  private yTranslate = 0;
  private classes: Array<string | number>;
  private maxDepth: number;
  private maxHiddenLevels: number;
  private visualDepthFromRoot: number;
  private visualDepthFromLeaves: number;
  private nodeIDByDepth: { [depth: number] : string[]; };
  private verticalAngle: boolean;
  private aggregationDepthNodeDepth: number;
  private omittedNodesId: number[];

  private adjustVisualDepthAuto = true;
  private showNodeLabelsRect = true;
  private showLinkLabelsRect = true;
  private rearrangeNodes = true;

  private additionalMiscOptions = [
    {
      name: 'Visual information',
      icon: 'tonality',
      content: [
        {
          text: 'Node color based on impurity value',
          attr: this.nodeService.impurityBasedNodeColor,
          func: (): void => { this.nodeService.toggleImpurityBasedNodeColor(this.nodes); },
        },
        {
          text: 'Node radius size based on number of instances within',
          attr: this.nodeService.instNumBasedNodeRadius,
          func: (): void => { this.nodeService.toggleInstNumBasedNodeRadius(this.nodes); },
        },
      ],
    },
    {
      name: 'Aesthetics',
      icon: 'details',
      content: [
        {
          text: 'Show node labels rectangle',
          attr: this.nodeService.showNodeLabelsRect,
          func: (): void => { this.nodeService.toggleRectVisibility(this.nodes); },
        },
        {
          text: 'Show link labels rectangle',
          attr: this.linkService.showLinkLabelsRect,
          func: (): void => { this.linkService.toggleRectVisibility(this.links); },
        },
        {
          text: 'Show node attributes full name',
          attr: this.nodeService.completeAttrName,
          func: (): void => { this.nodeService.toggleCompleteAttrName(this.nodes); },
        },
        {
          text: 'Show link attributes full name',
          attr: this.linkService.completeAttrName,
          func: (): void => { this.linkService.toggleCompleteAttrName(this.links); },
        },
        {
          text: 'Rearrange nodes to fit available space',
          attr: this.rearrangeNodes,
          func: (): void => { this.rearrangeNodes = !this.rearrangeNodes; },
        },
      ],
    },
  ];

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
    this.verticalAngle = (this.treeAngle === 90 || this.treeAngle === 270);
    this.createTree();
  }

  private updateZoomValue(increment: number): void {
    if (increment) {
      const aux = this.zoomValue + increment;
      this.zoomValue = Math.max(this.zoomMin, Math.min(aux, this.zoomMax));
    }
  }

  private abbreviateAttrLabel(attrLabel: string, separator = '-'): string {
    return TreeExtraService.abbreviateAttrLabel(attrLabel, separator);
  }

  private initSvg() {
    this.svg = d3.select('svg');

    const transformation = d3Transform.transform()
      .scale(this.zoomValue);
      //.translate([this.xTranslate, this.yTranslate]);

    // Necessary to apply zoom
    this.basePack = this.svg.append('g')
      .attr('transform', transformation);

    this.nodeIDByDepth = {};

    this.cleanSvg();

    this.depthMarkers = this.basePack.append('g')
        .classed('group-depth-markers cleanable', true);

    this.links = this.basePack.append('g')
        .classed('group-links cleanable', true);

    this.nodes = this.basePack.append('g')
        .classed('group-nodes cleanable', true);

    this.width = (
        +this.svg.attr('width') ?
        +this.svg.attr('width') :
        +this.eleRef.nativeElement.offsetWidth
    ) - 2 * (TreeNodeService.radiusMinimum +
             TreeNodeService.radiusScaleFactor);

    this.height = (
        +this.svg.attr('height') ?
        +this.svg.attr('height') :
        +this.eleRef.nativeElement.offsetHeight
    );

    this.nodeService.width = this.width;
    this.nodeService.height = this.height;
    this.linkService.width = this.width;
    this.linkService.height = this.height;

    /*
    this.svg
      .call(d3Zoom.zoom()
        .extent([[0, 0], [this.width, this.height]])
        .scaleExtent([this.zoomMin, this.zoomMax])
        .on('zoom', () => {
          this.zoomValue = d3.event.transform.k;
          this.xTranslate = d3.event.transform.x;
          this.yTranslate = d3.event.transform.y;

          this.basePack
            .attr('transform', d3.event.transform);
        }));
    */
  }

  private cleanSvg(): void {
    this.svg
      .selectAll('.cleanable')
        .remove();
  }

  private calcRootCoordAndDeltas(curTree: TreeInterface) {
    let cxDelta, cyDelta, rootYCoord, rootXCoord;
    let visibleLevelsNum = 2 + this.visualDepthFromRoot + this.visualDepthFromLeaves;
   
    // Adjust for the Aggregation Depth Node level
    visibleLevelsNum -= +(visibleLevelsNum === this.maxDepth + 1);

    const translationFactor = (
      TreeNodeService.radiusMinimum +
      TreeNodeService.radiusScaleFactor);

    const totalWidth = this.width - 2 * translationFactor;
    const totalHeight = this.height - 2 * translationFactor;

    if (this.verticalAngle) {
      cxDelta = 0.25 * totalWidth;
      cyDelta = totalHeight / visibleLevelsNum;
      rootXCoord = translationFactor + 0.5 * totalWidth;
      rootYCoord = translationFactor;

      if (this.treeAngle === 270) {
        rootYCoord = this.height - rootYCoord;
        cyDelta *= -1.0;
      }
    } else {
      cyDelta = 0.25 * totalHeight;
      cxDelta = totalWidth / visibleLevelsNum;
      rootXCoord = translationFactor;
      rootYCoord = translationFactor + 0.5 * totalHeight;

      if (this.treeAngle === 0) {
        rootXCoord = this.width - rootXCoord;
        cxDelta *= -1.0;
      }
    }

    return { rootXCoord, rootYCoord, cxDelta, cyDelta };
  }

  private setVisualDepth(): void {
    if (this.adjustVisualDepthAuto ||
        this.visualDepthFromRoot === null ||
        this.visualDepthFromRoot === undefined) {
      const halfLevelsUpper = Math.ceil(0.5 * this.maxHiddenLevels),
            halfLevelsLower = Math.floor(0.5 * this.maxHiddenLevels);

      this.visualDepthFromRoot = Math.min(
        this.minDefaultDepthFromRoot,
        halfLevelsUpper);

      this.visualDepthFromLeaves = Math.min(
        this.minDefaultDepthFromLeaf,
        halfLevelsLower);

      if (this.maxHiddenLevels -
          (this.visualDepthFromRoot + this.visualDepthFromLeaves) === 1) {
        this.visualDepthFromRoot = halfLevelsUpper;
        this.visualDepthFromLeaves = halfLevelsLower;
      }

    } else {
      this.visualDepthFromRoot = Math.min(
        this.visualDepthFromRoot,
        this.maxHiddenLevels);

      this.visualDepthFromLeaves = Math.min(
        this.visualDepthFromLeaves,
        this.maxHiddenLevels - this.visualDepthFromRoot);
    }
  }

  private createTree(): void {
    if (!this.svg || !this.treeNodes) {
      return;
    }

    const curTreeNodes = this.treeNodes[+this.chosenTree];

    if (!(curTreeNodes.hasOwnProperty('tree_'))) {
      return;
    }

    this.classes = null;
    if (curTreeNodes.hasOwnProperty('classes_')) {
      this.classes = curTreeNodes.classes_.value;
    }

    const curTree = curTreeNodes.tree_.value as TreeInterface;

    this.maxDepth = +curTree.maximum_depth;
    this.maxHiddenLevels = +curTree.maximum_depth - 1;

    this.setVisualDepth();

    const criterion = curTreeNodes.criterion.value;

    this.maxImpurity = (
      criterion === 'gini' ? 1.0 :
      (criterion === 'entropy' ? Math.log2(curTree.maximum_number_of_classes) :
      (Math.max(...curTree.impurity))));

    this.nodeService.setImpurityScale(this.maxImpurity);

    const { rootXCoord,
            rootYCoord,
            cxDelta,
            cyDelta } = this.calcRootCoordAndDeltas(curTree);

    this.extraService.buildDepthMarkers(
        this.depthMarkers,
        ((1.0 - TreeExtraService.depthMarkersPercentageSize) *
         (this.verticalAngle ? this.width : this.height)),
        ((TreeExtraService.depthMarkersPercentageSize) *
         (this.verticalAngle ? this.width : this.height)),
        this.verticalAngle ? rootYCoord : rootXCoord,
        this.verticalAngle ? cyDelta : cxDelta,
        2 + this.visualDepthFromRoot + this.visualDepthFromLeaves,
        this.verticalAngle);

    this.omittedNodesId = [];

    this.buildNode(
        curTree,
        0,
        null,
        rootXCoord,
        cxDelta,
        rootYCoord,
        cyDelta,
        0);

    const aggregationNodeId = TreeExtraService
      .formatNodeId(TreeNodeService.aggregationDepthNodeId, true);

    this.nodeService.buildAggregationDepthNodeText(
      this.nodes.select(aggregationNodeId),
      this.maxHiddenLevels - (this.visualDepthFromRoot + this.visualDepthFromLeaves));

    if (this.rearrangeNodes) {
      this.adjustNodePositions();
    }

    this.solvePredictionIssues();

    if (this.links) {
      this.linkService.updateLinkLabel(this.links);
    }

    if (this.nodes) {
      this.nodeService.updateNodeLabel(this.nodes);
    }
  }

  private solvePredictionIssues(): void {
    if (this._decisionPath && this.chosenTree) {
      this.linkService.cleanPredictionPaths(
        this.links,
        this.nodes,
        true);

      this.linkService.drawPredictionPaths(
        this.links,
        this.nodes,
        this._decisionPath[+this.chosenTree],
        this.omittedNodesId);

      this.nodeService.toggleNodeInPredictPath(
        this.nodes,
        this.singleInstAttrs,
        this.attrNames);

      if (this.nodeService.activeAttrs.indexOf('predict-log') < 0) {
        this.nodeService.activeAttrs.push('predict-log');
      }

      this.nodeService.updateNodeLabel(this.nodes);
      this.linkService.updateLinkLabel(this.links);
    }
  }

  private updateAggregationDepthNode(cx: number, cy: number, depth: number): void {
    const aggregationNodeId = TreeExtraService
      .formatNodeId(TreeNodeService.aggregationDepthNodeId, true);

    const aggregationNode = this.nodes.select(aggregationNodeId);

    if (aggregationNode.empty()) {
      const nodeAttrs = {
        'number-of-nodes': 1,
      };

      this.nodeService.generateNode(
          this.nodes,
          TreeNodeService.aggregationDepthNodeId,
          this.verticalAngle ? 0.5 * this.width : cx,
          !this.verticalAngle ? 0.5 * this.height : cy,
          TreeNodeService.aggregationNodeDepthRadius,
          nodeAttrs);

      this.aggregationDepthNodeDepth = depth;

      return;
    }

    aggregationNode.attr(
      'number-of-nodes', 1 + +aggregationNode.attr('number-of-nodes'));
  }

  private generateConventionalNode(
        curTree: TreeInterface,
        nodeId: number,
        parentId: number,
        cx: number,
        cy: number,
        depth: number,
        aggregationIsChildren = false): void {
    const numInstInNode = +curTree.weighted_number_of_node_samples[nodeId];
    const impurity = +curTree.impurity[nodeId];
    const threshold = +curTree.threshold[nodeId];
    const feature = +curTree.feature[nodeId];
    const sonLeftId = +curTree.children_left[nodeId];
    const sonRightId = +curTree.children_right[nodeId];
    const isLeaf = (sonLeftId < 0 && sonRightId < 0);

    let nodeClass;

    if (this.classes) {
      const nodeClassId = +curTree.value[nodeId][0].indexOf(Math.max(...curTree.value[nodeId][0]));
      nodeClass = this.classes[nodeClassId];
    } else {
      nodeClass = +curTree.value[nodeId][0][0];
    }

    const radiusFactor = (numInstInNode / +curTree.weighted_number_of_node_samples[0])

    const nodeAttrs = {
      'impurity': impurity,
      'decision-feature': feature >= 0 ? feature : null,
      'node-class': nodeClass,
      'threshold': feature >= 0 ? threshold : null,
      'number-of-instances': numInstInNode,
      'parent-id': parentId,
      'son-left-id': aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonLeftId,
      'son-right-id': aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonRightId,
      'depth': depth,
      'is-leaf': isLeaf,
    };

    this.nodeService.generateNode(
        this.nodes,
        nodeId,
        cx,
        cy,
        radiusFactor,
        nodeAttrs);
  }

  private updateNodeByDepthLists(nodeId: number, depth: number): void {
    if (!(depth in this.nodeIDByDepth)) {
      this.nodeIDByDepth[depth] = [];
    }

    const formattedNodeId = TreeExtraService.formatNodeId(nodeId, true);

    if (this.nodeIDByDepth[depth].indexOf(formattedNodeId) < 0) {
      this.nodeIDByDepth[depth].push(formattedNodeId);
    }
  }

  private buildNode(
        curTree: TreeInterface,
        nodeId: number,
        parentId: number,
        cx: number,
        cxDelta: number,
        cy: number,
        cyDelta: number,
        depth: number): void {
    const sonLeftId = +curTree.children_left[nodeId];
    const sonRightId = +curTree.children_right[nodeId];
    const aggregationIsChildren = (
        depth === this.visualDepthFromRoot &&
        depth !== this.maxDepth - this.visualDepthFromLeaves - 1);

    const omittedNode = (
        depth > this.visualDepthFromRoot &&
        depth < this.maxDepth - this.visualDepthFromLeaves);

    let cxScaleFactor, cyScaleFactor;

    if (omittedNode) {
      cxScaleFactor = 1.0;
      cyScaleFactor = 1.0;

      this.omittedNodesId.push(nodeId);

      nodeId = TreeNodeService.aggregationDepthNodeId;

      this.updateAggregationDepthNode(cx, cy, depth);

      if (depth !== this.aggregationDepthNodeDepth) {
        cx -= !this.verticalAngle ? cxDelta : 0;
        cy -= this.verticalAngle ? cyDelta : 0;
      }

    } else {
      cxScaleFactor = this.verticalAngle ? 0.5 : 1.0;
      cyScaleFactor = !this.verticalAngle ? 0.5 : 1.0;
      this.generateConventionalNode(
        curTree,
        nodeId,
        parentId,
        cx,
        cy,
        depth,
        aggregationIsChildren);
    }

    this.updateNodeByDepthLists(nodeId, depth);

    if (sonLeftId >= 0 && sonLeftId < curTree.capacity) {
      const cxSonLeft = cx + (this.verticalAngle ? -1 : 1) * cxDelta;
      const cySonLeft = cy + cyDelta;

      this.buildNode(
          curTree,
          sonLeftId,
          nodeId,
          cxSonLeft,
          cxScaleFactor * cxDelta,
          cySonLeft,
          cyScaleFactor * cyDelta,
          depth + 1);

      this.linkService.connectNodes(
        this.links,
        this.nodes,
        nodeId,
        aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonLeftId,
        '<=');
    }

    if (sonRightId >= 0 && sonRightId < curTree.capacity) {
      const cxSonRight = cx + cxDelta;
      const cySonRight = cy + (!this.verticalAngle ? -1 : 1) * cyDelta;

      this.buildNode(
          curTree,
          sonRightId,
          nodeId,
          cxSonRight,
          cxScaleFactor * cxDelta,
          cySonRight,
          cyScaleFactor * cyDelta,
          depth + 1);

      this.linkService.connectNodes(
        this.links,
        this.nodes,
        nodeId,
        aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonRightId,
        '>');
    }
  }

  private rotateTree(angleUpdate: number | string): void {
    this.treeAngle = (this.treeAngle + +angleUpdate) % 360;
    this.changesHandler();
  }

  private adjustNodePositions(): void {
    const totalLength: number = this.verticalAngle ? this.width : this.height;
    const verticalAngle = this.verticalAngle;

    for (const depth in this.nodeIDByDepth) {
      if (this.nodeIDByDepth.hasOwnProperty(depth)) {
        const nodeList: string[] = this.nodeIDByDepth[depth];
        const divLength: number = totalLength / (1 + nodeList.length);

        d3.selectAll(nodeList.join(','))
          .each(function(d, i) {
            const node = d3.select(this);
            if (verticalAngle) {
              TreeNodeService.moveNode(node, divLength * (i + 1), +node.attr('cy'));
            } else {
              TreeNodeService.moveNode(node, +node.attr('cx'), divLength * (i + 1));
            }
          });
      }
    }
  }

  private updateVisualDepthFromLeaves(newValue: number | string): void {
    newValue = +newValue;
    if (newValue >= 0 && newValue <= this.maxHiddenLevels - this.visualDepthFromRoot) {
      this.visualDepthFromLeaves = newValue;
      this.changesHandler();
    }
  }

  private updateVisualDepthFromRoot(newValue: number | string): void {
    newValue = +newValue;
    if (newValue >= 0 && newValue <= this.maxHiddenLevels - this.visualDepthFromLeaves) {
      this.visualDepthFromRoot = newValue;
      this.changesHandler();
    }
  }

}
