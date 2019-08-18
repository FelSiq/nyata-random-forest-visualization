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

type D3Selection = d3.Selection<SVGElement | any, {}, HTMLElement, any>;

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
      this.linkService.cleanPredictionPaths(
        this.links,
        this.nodes,
        true);

      this.linkService.drawPredictionPaths(
        this.links,
        this.nodes,
        this._decisionPath[+this.chosenTree],
        this.omittedNodesId);

      this.nodeService.toggleNodeInPredictPath(this.nodes);
    } else {
      this.linkService.cleanPredictionPaths(this.links, this.nodes, false);
    }
  }

  chosenTree: string | number;
  zoomValue = 0;

  readonly zoomMin: number = 0;
  readonly zoomMax: number = 3;
  readonly minDefaultDepthFromRoot = 3;
  readonly minDefaultDepthFromLeaf = 3;

  private svg: D3Selection;
  private links: D3Selection;
  private nodes: D3Selection;
  private depthMarkers: D3Selection;
  private impurityColors: d3Scale.ScaleLinear<string, number>;
  private width: number;
  private height: number;
  private maxImpurity: number;
  private treeAngle = 180;
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
  private instNumBasedNodeRadius = true;
  private impurityBasedNodeColor = true;
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
          attr: this.impurityBasedNodeColor,
          func: () => { this.impurityBasedNodeColor = !this.impurityBasedNodeColor; },
        },
        {
          text: 'Node radius size based on number of instances within',
          attr: this.instNumBasedNodeRadius,
          func: () => { this.instNumBasedNodeRadius = !this.instNumBasedNodeRadius; },
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
          func: () => { this.nodeService.toggleRectVisibility(this.nodes); },
        },
        {
          text: 'Show link labels rectangle',
          attr: this.linkService.showLinkLabelsRect,
          func: () => { this.linkService.toggleRectVisibility(this.links); },
        },
        {
          text: 'Show node attributes full name',
          attr: this.nodeService.completeAttrName,
          func: () => { this.nodeService.toggleCompleteAttrName(this.nodes); },
        },
        {
          text: 'Show link attributes full name',
          attr: this.linkService.completeAttrName,
          func: () => { this.linkService.toggleCompleteAttrName(this.links); },
        },
        {
          text: 'Rearrange nodes to fit available space',
          attr: this.rearrangeNodes,
          func: () => { this.rearrangeNodes = !this.rearrangeNodes; },
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
    const aux = this.zoomValue + increment;
    this.zoomValue = Math.max(this.zoomMin, Math.min(aux, this.zoomMax));
  }

  private abbreviateAttrLabel(attrLabel: string, separator = '-'): string {
    return TreeExtraService.abbreviateAttrLabel(attrLabel, separator);
  }

  private initSvg() {
    this.svg = d3.select('svg');

    this.nodeIDByDepth = {};

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
    this.svg
      .call(d3Zoom.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', function() {
        d3.select(this)
          .attr('transform', d3.event.transform);
      }));
    */
  }

  private cleanSvg(): void {
    this.svg
      .selectAll('.cleanable')
        .selectAll('*')
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
      this.visualDepthFromRoot = Math.min(
        this.minDefaultDepthFromRoot,
        Math.ceil(0.5 * this.maxHiddenLevels));

      this.visualDepthFromLeaves = Math.min(
        this.minDefaultDepthFromLeaf,
        Math.floor(0.5 * this.maxHiddenLevels));

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

    this.impurityColors = d3Scale.scaleLinear<string, number>()
        .domain([0.0, this.maxImpurity])
        .range(['white', 'black']);

    const { rootXCoord,
            rootYCoord,
            cxDelta,
            cyDelta } = this.calcRootCoordAndDeltas(curTree);

    this.extraService.buildDepthMarkers(
        this.depthMarkers,
        0.01 * (this.verticalAngle ? this.width : this.height),
        0.99 * (this.verticalAngle ? this.width : this.height),
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

      this.nodeService.toggleNodeInPredictPath(this.nodes);
    }

    if (this.links) {
      this.linkService.updateLinkLabel(this.links);
    }

    if (this.nodes) {
      this.nodeService.updateNodeLabel(this.nodes);
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
          'white',
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
    const nodeClassId = curTree.value[nodeId][0].indexOf(Math.max(...curTree.value[nodeId][0]));
    const circleColor = this.impurityBasedNodeColor ? this.impurityColors(impurity) : 'white';
    const sonLeftId = +curTree.children_left[nodeId];
    const sonRightId = +curTree.children_right[nodeId];

    const radius = (this.instNumBasedNodeRadius ? (
        TreeNodeService.radiusMinimum +
        TreeNodeService.radiusScaleFactor *
        (numInstInNode /
        +curTree.weighted_number_of_node_samples[0])) :
      TreeNodeService.radiusDefault);

    const nodeAttrs = {
      'impurity': impurity,
      'decision-feature': feature >= 0 ? feature : null,
      'node-class': this.classes ? this.classes[+nodeClassId] : null,
      'threshold': feature >= 0 ? threshold : null,
      'number-of-instances': numInstInNode,
      'parent-id': parentId,
      'son-left-id': aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonLeftId,
      'son-right-id': aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonRightId,
    };

    this.nodeService.generateNode(
        this.nodes,
        nodeId,
        cx,
        cy,
        radius,
        circleColor,
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
        cx -= cxDelta;
        cy -= cyDelta;
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
