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
  readonly minDepthFromRoot = 2;
  readonly minDepthFromLeaf = 2;

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
  private visualDepthFromRoot: number;
  private visualDepthFromLeaves: number;
  private nodeIDByDepth: { [depth: number] : string[]; };
  private verticalAngle: boolean;

  private showNodeLabelsRect = true;
  private showLinkLabelsRect = true;
  private rearrangeNodes = true;

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

    if (this.verticalAngle) {
      cxDelta = this.width / 4.05;
      cyDelta = 0.98 * this.height / (1 + curTree.maximum_depth);

      rootXCoord = 0.5 * this.width;

      rootYCoord = (
          TreeNodeService.radiusMinimum +
          TreeNodeService.radiusScaleFactor +
          0.01 * this.height);

      if (this.treeAngle === 270) {
        rootYCoord = this.height - rootYCoord;
        cyDelta *= -1.0;
      }
    } else {
      cyDelta = this.height / 4.05;
      cxDelta = ((0.99 * this.width -
                 TreeNodeService.radiusMinimum -
                 TreeNodeService.radiusScaleFactor) / +curTree.maximum_depth);

      rootYCoord = 0.5 * this.height;

      rootXCoord = (
          TreeNodeService.radiusMinimum +
          TreeNodeService.radiusScaleFactor +
          0.01 * this.width);

      if (this.treeAngle === 0) {
        rootXCoord = this.width - rootXCoord;
        cxDelta *= -1.0;
      }
    }

    return { rootXCoord, rootYCoord, cxDelta, cyDelta };
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
    this.visualDepthFromRoot = Math.min(this.minDepthFromRoot, Math.ceil(0.5 * this.maxDepth));
    this.visualDepthFromLeaves = Math.min(this.minDepthFromLeaf, Math.floor(0.5 * this.maxDepth));

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
        curTree.maximum_depth,
        this.verticalAngle);

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
      this.maxDepth - (this.visualDepthFromRoot + this.visualDepthFromLeaves));

    if (this.rearrangeNodes) {
      this.adjustNodePositions();
    }

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
        cyDelta: number,
        depth: number): void {
      const aggregationIsChildren = (depth === this.visualDepthFromRoot - 1);
      const sonLeftId = +curTree.children_left[nodeId];
      const sonRightId = +curTree.children_right[nodeId];

      let cxScaleFactor, cyScaleFactor;

      if (depth >= this.visualDepthFromRoot &&
          depth <= this.maxDepth - this.visualDepthFromLeaves) {
          cxScaleFactor = 1.0;
          cyScaleFactor = 1.0;
          nodeId = TreeNodeService.aggregationDepthNodeId;

          const aggregationNodeId = TreeExtraService.formatNodeId(nodeId, true);
          const aggregationNode = this.nodes.select(aggregationNodeId);

          if (aggregationNode.empty()) {
            this.nodeService.generateNode(
                this.nodes,
                nodeId,
                this.verticalAngle ? 0.5 * this.width : cx,
                !this.verticalAngle ? 0.5 * this.height : cy,
                TreeNodeService.aggregationNodeDepthRadius,
                'white',
                {
                  'number-of-nodes': 1,
                });

          } else {
            aggregationNode.attr(
              'number-of-nodes', 1 + +aggregationNode.attr('number-of-nodes'));
          }
      } else {
        const numInstInNode = +curTree.weighted_number_of_node_samples[nodeId];
        const impurity = +curTree.impurity[nodeId];
        const threshold = +curTree.threshold[nodeId];
        const feature = +curTree.feature[nodeId];
        const nodeClassId = curTree.value[nodeId][0].indexOf(Math.max(...curTree.value[nodeId][0]));
        const circleColor = this.impurityColors(impurity);

        cxScaleFactor = this.verticalAngle ? 0.5 : 1.0;
        cyScaleFactor = !this.verticalAngle ? 0.5 : 1.0;

        const radius = (
          TreeNodeService.radiusMinimum +
          TreeNodeService.radiusScaleFactor *
          (numInstInNode /
          +curTree.weighted_number_of_node_samples[0]));

        if (!(depth in this.nodeIDByDepth)) {
          this.nodeIDByDepth[depth] = [];
        }
        this.nodeIDByDepth[depth].push(TreeExtraService.formatNodeId(nodeId, true));

        this.nodeService.generateNode(
            this.nodes,
            nodeId,
            cx,
            cy,
            radius,
            circleColor,
            {
              'impurity': impurity,
              'decision-feature': feature >= 0 ? feature : null,
              'node-class': this.classes ? this.classes[+nodeClassId] : null,
              'threshold': feature >= 0 ? threshold : null,
              'number-of-instances': numInstInNode,
              'parent-id': parentId,
              'son-left-id': aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonLeftId,
              'son-right-id': aggregationIsChildren ? TreeNodeService.aggregationDepthNodeId : sonRightId,
            });
      }

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
