import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Drag from 'd3-drag';
import * as d3Scale from 'd3-scale';

import { TreeExtraService } from './tree-extra.service';
import { TreeLinksService } from './tree-links.service';
import { ObjectLabelInfoService } from './object-label-info.service';
import { NodeVisibleAttrsInfo } from './node-visible-attrs-info';

type D3Selection = d3.Selection<SVGElement | any, {}, HTMLElement, any>;

@Injectable({
  providedIn: 'root',
})
export class TreeNodeService {
  static readonly radiusMinimum = 8;
  static readonly radiusDefault = 16;
  static readonly radiusScaleFactor = 24;
  static readonly radiusSelectScaleFactor = 1.2;
  static readonly styleColorTextOutline = 'black';
  static readonly styleTextFontSize = 16;
  static readonly styleTextSpacing = 4;
  static readonly styleDepthNodeTextFontSize = 14;
  static readonly transitionDragEffect = 300;
  static readonly aggregationNodeDepthRadius = 48;
  static readonly aggregationDepthNodeId = -1;
  static readonly styleWidthCircleDefault = 1;
  static readonly styleWidthCirclePredict = 2;
  static readonly styleWidthCircleHover = 3;
  static readonly styleAttrRectColor = 'white';

  private impurityColors: d3Scale.ScaleLinear<string, number>;
  height: number;
  width: number;

  readonly visibleAttrsInfo = new NodeVisibleAttrsInfo();

  activeAttrs: string[] = [];
  completeAttrName = false;
  showNodeLabelsRect = true;
  instNumBasedNodeRadius = true;
  impurityBasedNodeColor = true;

  private funcDragOnStart = function(): void {
    const node = d3.select(this);
    const circle = node.select('circle');

    const nodeId = +node.attr('index');
    const radius = !circle.empty() ? +circle.attr('original-radius') : 0.0;

    d3.select('.group-nodes')
      .append('circle')
        .classed('placeholder-node', true)
        .attr('id', 'placeholder-node-' + nodeId)
        .attr('r', TreeNodeService.radiusSelectScaleFactor * radius)
        .attr('cx', circle.attr('cx'))
        .attr('cy', circle.attr('cy'))
        .attr('fill', 'none')
        .style('stroke', 'gray')
        .style('stroke-width', 1)
        .style('stroke-dasharray', ('3, 3'));

    node
      .raise()
      .classed('node-active', true);

    circle
      .attr('r', TreeNodeService.radiusSelectScaleFactor * radius);
  };

  private funcDragOnEnd = function(): void {
    const node = d3.select(this);
    const circle = node.select('circle');

    const nodeId = +node.attr('index');
    const radius = +circle.attr('original-radius');

    node
      .classed('node-active', false);

    circle
      .transition()
        .duration(0.5 * TreeNodeService.transitionDragEffect)
        .attr('r', radius / (0.9 * TreeNodeService.radiusSelectScaleFactor))
      .transition()
        .duration(0.5 * TreeNodeService.transitionDragEffect)
        .attr('r', radius);

    d3.select('#placeholder-node-' + nodeId)
      .remove();
  };

  private funcDragOnDrag = function(): void {
    TreeNodeService.moveNode(
        d3.select(this),
        d3.event.x,
        d3.event.y);
  };

  static applyHoveredClassRecursively(node: D3Selection, value: boolean) {
    node
      .classed('hovered', value);

    const circle = node.select('circle');

    circle
      .attr('stroke', TreeLinksService.funcDragEndSelectStrokeStyle);

    if (value) {
      circle
        .transition()
          .duration(350)
          .attr('stroke-width', TreeNodeService.styleWidthCircleHover);

    } else {
      circle
        .transition()
          .duration(350)
          .attr('stroke-width',
            node.classed('in-predict-path') ?
              TreeNodeService.styleWidthCirclePredict :
              TreeNodeService.styleWidthCircleDefault)
          .attr('r', circle.attr('original-radius'));
    }

    const nodeId = node.attr('index'),
          parentId = node.attr('parent-id');

    const parentNode = d3.select(
      TreeExtraService.formatNodeId(parentId, true));

    if (!parentNode.empty()) {
      d3.select(TreeExtraService.formatLinkId(parentId, nodeId, true))
        .classed('hovered', value)
          .select('line')
            .style('stroke', TreeLinksService.funcDragEndSelectStrokeStyle);

      TreeNodeService.applyHoveredClassRecursively(parentNode, value);
    }
  }

  private funcMouseEnter = function(): void {
    const node = d3.select(this.parentNode)

    if (d3.select('.in-predict-path').empty()) {
      TreeNodeService.applyHoveredClassRecursively(node, true);
    }
  };

  private funcMouseLeave = function(): void {
    const node = d3.select(this.parentNode);
    const circle = node.select('circle');

    if (d3.select('.in-predict-path').empty()) {
      TreeNodeService.applyHoveredClassRecursively(node, false);
    }
  };

  private filterAggregationNode = function() {
    const node = d3.select(this);
    const aggregationNode = +node.attr('index') < 0;

    return aggregationNode ? null : this;
  };

  static funcNodeXCoord = function(): number {
    const circle = d3.select(this.parentNode).select('circle');

    const curElem = d3.select(this);
    const width = curElem.attr('width') ? +curElem.attr('width') : 0.0;

    return +circle.attr('cx') - 0.5 * width;
  };

  static funcNodeYCoord = function(): number {
    const circle = d3.select(this.parentNode).select('circle');

    const curElem = d3.select(this);
    const height = curElem.attr('height') ? +curElem.attr('height') : 0.0;

    return +circle.attr('r') + +circle.attr('cy') - 0.5 * height;
  };

  constructor(objectLabelService: ObjectLabelInfoService) { }

  private static moveDraggables(links: D3Selection): void {
    links
      .selectAll('.draggable')
        .attr('cx', TreeLinksService.funcLinkHalfXCoord)
        .attr('cy', TreeLinksService.funcLinkHalfYCoord)
        .attr('x', TreeLinksService.funcLinkHalfXCoord)
        .attr('y', TreeLinksService.funcLinkHalfYCoord);
  }

  static moveNodeLinks(node: D3Selection): void {
    const [linksFromNode, linksToNode] = TreeLinksService.getToAndFromNodeLinks(node);

    linksFromNode
      .select('line')
        .attr('x1', node.attr('cx'))
        .attr('y1', node.attr('cy'));

    linksToNode
      .select('line')
        .attr('x2', node.attr('cx'))
        .attr('y2', node.attr('cy'));

    TreeNodeService.moveDraggables(linksFromNode);
    TreeNodeService.moveDraggables(linksToNode);
  }

  static moveNode(node: D3Selection, x: number, y: number): void {
    const dx = x - +node.attr('cx');
    const dy = y - +node.attr('cy');

    node
      .attr('cx', x)
      .attr('cy', y);

    const nodeDraggables = node.selectAll('.draggable')
      .attr('cx', function() { return +d3.select(this).attr('cx') + dx; })
      .attr('cy', function() { return +d3.select(this).attr('cy') + dy; })
      .attr('x', function() { return +d3.select(this).attr('x') + dx; })
      .attr('y', function() { return +d3.select(this).attr('y') + dy; });

    TreeNodeService.moveNodeLinks(node);
  }

  private static calculateRadiusLength(radiusFactor: number): number {
    return (
      TreeNodeService.radiusMinimum +
      TreeNodeService.radiusScaleFactor *
      radiusFactor);
  }

  generateNode(nodes: D3Selection,
               nodeId: number,
               cx: number,
               cy: number,
               radiusFactor: number,
               nodeAttrs: {}): void {

    const node = nodes.append('g')
      .classed('node', true)
      .style('cursor', 'move')
      .attr('id', TreeExtraService.formatNodeId(nodeId)) 
      .attr('index', nodeId)
      .attr('cx', cx)
      .attr('cy', cy);

    for (const attr in nodeAttrs) {
      if (nodeAttrs.hasOwnProperty(attr)) {
        node.attr(attr, nodeAttrs[attr]);
      }
    }

    const impurity = node.attr('impurity');

    const circleColor = (
      this.impurityBasedNodeColor && impurity ?
      this.impurityColors(+impurity) :
      'white');

    node
      .call(d3Drag.drag()
        .on('start', this.funcDragOnStart)
        .on('end', this.funcDragOnEnd)
        .on('drag', this.funcDragOnDrag));

    const radius = (
      radiusFactor <= 1.0 ?
      TreeNodeService.calculateRadiusLength(radiusFactor) :
      radiusFactor);

    node
      .append('circle')
        .classed('draggable', true)
        .attr('stroke', 'gray')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', nodeId < 0 ? ('8, 4') : null)
        .attr('fill', circleColor)
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .attr('original-radius', radius)
        .attr('radius-factor', radiusFactor);
  }

  private setAggregationDepthNodeTextStyle(text: D3Selection): void {
    text
      .attr('font-size', TreeNodeService.styleDepthNodeTextFontSize)
      .attr('font-family', "'Roboto', sans-serif")
      .attr('font-weight', 400)
      .attr('fill', 'rgb(96,96,96)')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central');
  }

  buildAggregationDepthNodeText(agDepthNode: D3Selection, totalDepth: number): void {
    if (agDepthNode.empty()) {
      return;
    }

    const textDepth = agDepthNode.append('text')
      .classed('draggable node-label', true)
      .attr('x', agDepthNode.attr('cx'))
      .attr('y', agDepthNode.attr('cy'))
      .text('Total depth: ' + totalDepth);

    const textNode = agDepthNode.append('text')
      .classed('draggable node-label', true)
      .attr('x', agDepthNode.attr('cx'))
      .attr('y', +agDepthNode.attr('cy') + TreeNodeService.styleDepthNodeTextFontSize + 4)
      .text('Nodes in: ' + agDepthNode.attr('number-of-nodes'));

    this.setAggregationDepthNodeTextStyle(textNode);
    this.setAggregationDepthNodeTextStyle(textDepth);
  }

  updateNodeLabel(nodes: D3Selection): void {
    if (!nodes || nodes.empty()) {
      return;
    }
    const aux = nodes.selectAll('.node');
    if (!aux.empty()) {
      nodes = aux;
    }

    const filteredNodes = nodes.select(this.filterAggregationNode);

    TreeExtraService.buildObjectsLabelText(
      filteredNodes,
      this.activeAttrs,
      (this.completeAttrName ?
         null :
         TreeExtraService.getAbbvs(this.activeAttrs,
                                   this.visibleAttrsInfo.visibleAttrs)),
      TreeNodeService.styleTextFontSize,
      TreeNodeService.styleTextSpacing,
      TreeLinksService.styleColorTextOutline,
      TreeNodeService.funcNodeXCoord,
      TreeNodeService.funcNodeYCoord,
    );

    TreeExtraService.buildObjectsLabelRect(
      filteredNodes,
      TreeNodeService.styleAttrRectColor,
      this.showNodeLabelsRect,
      (TreeNodeService.styleTextFontSize +
       TreeNodeService.styleTextSpacing),
      TreeNodeService.funcNodeXCoord,
      TreeNodeService.funcNodeYCoord,
    );

    TreeExtraService.adjustObjectsCoordsByLabel(
      filteredNodes,
      this.height,
      this.width,
      TreeNodeService.moveNode,
    );

    filteredNodes
      .selectAll('.label-text')
        .raise();

    TreeExtraService.setMouseEvents(
      nodes,
      this.funcMouseEnter,
      this.funcMouseLeave);
  }

  toggleAttr(newValue: string): void {
    const index: number = this.activeAttrs.indexOf(newValue);
    if (index > -1) {
      this.activeAttrs.splice(index, 1);
    } else {
      this.activeAttrs.push(newValue);
    }
  }

  toggleRectVisibility(nodes: D3Selection): void {
    this.showNodeLabelsRect = !this.showNodeLabelsRect;

    if (nodes.empty()) {
      return;
    }

    nodes
      .selectAll('.node')
        .select('rect')
          .attr('visibility', this.showNodeLabelsRect ? 'visible' : 'hidden');
  }

  toggleCompleteAttrName(nodes: D3Selection): void {
    this.completeAttrName = !this.completeAttrName;

    if (nodes.empty()) {
      return;
    }

    this.updateNodeLabel(nodes);
  }

  toggleNodeInPredictPath(
        nodes: D3Selection,
        instAttrValues: Array<string | number>,
        attrNames: string[]): void {
    if (!nodes || nodes.empty()) {
      return;
    }

    const nodesNotInPath = nodes
      .selectAll('.node')
        .select(function() {
          return !d3.select(this).classed('in-predict-path') ? this : null;
        })
          .attr('predict-log', null)
          .select('circle')
            .attr('stroke', 'gray')
            .attr('stroke-width', TreeNodeService.styleWidthCircleDefault);

    const nodesInPath = nodes
      .selectAll('.in-predict-path')
        .attr('predict-log', instAttrValues ? function(): string {
          const node = d3.select(this),
                isLeaf = node.attr('is-leaf') === 'true';

          if (!isLeaf) {
            const attrIndex = +node.attr('decision-feature');

            let instAttrVal = '' + instAttrValues[attrIndex],
                threshold = node.attr('threshold');

            const decision = (+instAttrVal <= +threshold) ? ' ≤ ' : ' > ',
                  attrName = attrNames ? attrNames[attrIndex] : 'ATTR#' + attrIndex;

            instAttrVal = TreeExtraService.toFixed(instAttrVal);
            threshold = TreeExtraService.toFixed(threshold);

            return (attrName + ': ' + instAttrVal + decision + threshold);
          }

          return 'Output: ' + node.attr('node-class');
        } : null)
        .select('circle')
          .attr('stroke', TreeLinksService.styleColorLinkPredict)
          .attr('stroke-width', TreeNodeService.styleWidthCirclePredict);
  }

  setImpurityScale(maxImpurity: number): void {
    this.impurityColors = d3Scale.scaleLinear<string, number>()
        .domain([0.0, maxImpurity])
        .range(['white', 'black']);
  }

  toggleImpurityBasedNodeColor(nodes: D3Selection): void {
    if (nodes.empty()) {
      return;
    }

    this.impurityBasedNodeColor = !this.impurityBasedNodeColor;

    const impurityColors = this.impurityColors;

    const circles = nodes
        .selectAll('.node')
          .select(this.filterAggregationNode)
            .select('circle');

    if (this.impurityBasedNodeColor) {
      circles
        .attr('fill', function() {
          const impurity = d3.select((<SVGElement>this).parentNode).attr('impurity');
          return impurity ? impurityColors(+impurity) : 'white';
        });

    } else {
      circles
        .attr('fill', 'white');
    }
  }

  toggleInstNumBasedNodeRadius(nodes: D3Selection): void {
    if (nodes.empty()) {
      return;
    }

    this.instNumBasedNodeRadius = !this.instNumBasedNodeRadius;

    const circles = nodes
      .selectAll('.node')
        .select(this.filterAggregationNode)
          .select('circle');

    if (this.instNumBasedNodeRadius) {
      circles
        .attr('original-radius', function(): number {
          const radiusFactor = +d3.select(this).attr('radius-factor');
          return TreeNodeService.calculateRadiusLength(radiusFactor);
        });

    } else {
      circles
        .attr('original-radius', TreeNodeService.radiusDefault);
    }

    circles
      .attr('r', function(): string {
        return d3.select(this).attr('original-radius');
      });
  }

}
