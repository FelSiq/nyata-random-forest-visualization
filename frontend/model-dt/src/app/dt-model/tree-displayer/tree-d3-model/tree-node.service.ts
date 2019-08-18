import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Drag from 'd3-drag';

import { TreeExtraService } from './tree-extra.service';
import { TreeLinksService } from './tree-links.service';
import { ObjectLabelInfoService } from './object-label-info.service';

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

  readonly visibleAttrs = [
    { name: 'impurity', abbv: null },
    { name: 'decision-feature', abbv: null },
    { name: 'number-of-instances', abbv: null },
    { name: 'threshold', abbv: null },
    { name: 'node-class', abbv: null },
    { name: 'depth', abbv: null },
    { name: 'index', abbv: 'ID' },
  ];

  activeAttrs: string[] = [];
  completeAttrName = false;
  showNodeLabelsRect = true;

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

    if (!circle.empty()) {
      circle
        .attr('r', TreeNodeService.radiusSelectScaleFactor * radius);
    }

    TreeLinksService.getNodeIncidentEdges(node)
      .classed('link-active', true)
      .select('line')
        .transition()
          .duration(TreeNodeService.transitionDragEffect)
          .style('stroke', TreeLinksService.styleColorLinkSelected);
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

    TreeLinksService.getNodeIncidentEdges(node)
      .classed('link-active', false)
      .select('line')
        .transition()
          .duration(TreeNodeService.transitionDragEffect)
          .style('stroke', TreeLinksService.funcDragEndSelectStrokeStyle);
  };

  private funcDragOnDrag = function(): void {
    TreeNodeService.moveNode(
        d3.select(this),
        d3.event.x,
        d3.event.y);
  };

  private funcMouseenter = function(): void {
    d3.select(this.parentNode)
      .select('circle')
        .transition()
          .duration(350)
          .attr('stroke-width', 3);
  };

  private funcMouseleave = function(): void {
    const node = d3.select(this.parentNode)
      .select('circle');

    node
      .transition()
        .duration(350)
        .attr('stroke-width', 1)
        .attr('r', node.attr('original-radius'));
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

  generateNode(nodes: D3Selection,
               nodeId: number,
               cx: number,
               cy: number,
               radius: number,
               circleColor: number | string,
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

    node
      .call(d3Drag.drag()
        .on('start', this.funcDragOnStart)
        .on('end', this.funcDragOnEnd)
        .on('drag', this.funcDragOnDrag));

    node
      .append('circle')
        .classed('draggable', true)
        .attr('stroke', 'gray')
        .attr('stroke-width', 1)
        .attr('fill', circleColor)
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .attr('original-radius', radius);
  }

  setMouseEvents(nodes: D3Selection): void {
    if (nodes.empty()) {
      return;
    }

    nodes
      .selectAll('.draggable')
        .on('mouseenter', this.funcMouseenter)
        .on('mouseleave', this.funcMouseleave);
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

  private buildNodesLabelRect(nodes: D3Selection): D3Selection {
    if (nodes.empty()) {
      return;
    }

    const rects = nodes
      .selectAll('.node')
        .select(this.filterAggregationNode)
          .append('rect')
            .raise()
            .classed('draggable node-label', true)
            .attr('width', 64)
            .attr('height', (TreeNodeService.styleTextFontSize +
                             TreeNodeService.styleTextSpacing) *
                             this.activeAttrs.length)
            .attr('rx', 5)
            .attr('opacity', 0.5)
            .attr('fill', 'black')
            .attr('visibility', this.showNodeLabelsRect ? 'visible' : 'hidden');

    return rects;
  }

  private buildNodesLabelText(nodes: D3Selection): void {
    if (nodes.empty()) {
      return;
    }

    nodes
      .selectAll('text')
        .remove();

    for (let i = 0; i < this.activeAttrs.length; i++) {
      const curAttr = this.activeAttrs[i];
      const curAbbv = this.visibleAttrs[
        this.visibleAttrs.map(item => item.name).indexOf(curAttr)
      ].abbv;

      const formatedAttrLabel = (
          this.completeAttrName ?
          curAttr : (
            curAbbv ?
            curAbbv : 
            TreeExtraService.abbreviateAttrLabel(curAttr)));

      const attrLabelPrefix = (this.activeAttrs.length > 1) ? (formatedAttrLabel + ': ') : '';
      const translationValue = (TreeNodeService.styleTextFontSize +
                                (TreeNodeService.styleTextFontSize +
                                 TreeNodeService.styleTextSpacing) *
                                (i - 0.5 * this.activeAttrs.length));
      nodes
        .append('text')
          .classed('draggable node-label', true)
          .attr('font-size', TreeNodeService.styleTextFontSize)
          .attr('font-family', "'Roboto', sans-serif")
          .attr('font-weight', 900)
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('x', TreeNodeService.funcNodeXCoord)
          .attr('y', TreeNodeService.funcNodeYCoord)
          .attr('transform', 'translate(0, ' + translationValue + ')')
          .text(function(): string {
            let value: string | number = d3.select(this.parentNode).attr(curAttr);
            if (+value && value.indexOf('.') > -1 && value.length > 4) {
              value = (+value).toFixed(2);
            }
            return attrLabelPrefix + (value !== null && value !== undefined ? value : '-');
          })
          .style('stroke', TreeLinksService.styleColorTextOutline)
          .style('stroke-width', '1px');
    }
  }

  updateNodeLabel(nodes): void {
    if (nodes.empty()) {
      return;
    }

    const filteredNodes = nodes
      .selectAll('.node')
        .select(this.filterAggregationNode);

    if (this.activeAttrs.length === 0) {
      filteredNodes
        .selectAll('.node-label')
          .remove();

      this.setMouseEvents(nodes);

      return;
    }

    let rects = null;

    if (nodes.select('.node').select('rect').empty()) {
      rects = this.buildNodesLabelRect(nodes);

    } else {
      rects = filteredNodes
        .select('rect')
          .attr('height', (TreeNodeService.styleTextFontSize +
                           TreeNodeService.styleTextSpacing) *
                           this.activeAttrs.length);
    }

    this.buildNodesLabelText(filteredNodes);

    if (rects) {
      let labelWidth = 0;

      filteredNodes
        .selectAll('text')
          .each(function(i) {
            labelWidth = Math.max(4 + this.getComputedTextLength(), labelWidth);
          });

      rects
        .attr('width', labelWidth)
        .attr('x', TreeNodeService.funcNodeXCoord)
        .attr('y', TreeNodeService.funcNodeYCoord);
    }

    this.setMouseEvents(nodes);
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

}
