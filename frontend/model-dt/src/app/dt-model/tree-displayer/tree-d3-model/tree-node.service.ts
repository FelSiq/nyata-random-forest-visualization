import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Drag from 'd3-drag';

import { TreeExtraService } from './tree-extra.service';
import { TreeLinksService } from './tree-links.service';
import { ObjectLabelInfoService } from './object-label-info.service';

@Injectable({
  providedIn: 'root',
})
export class TreeNodeService {
  static readonly radiusMinimum = 8;
  static readonly radiusScaleFactor = 24;
  static readonly radiusSelectScaleFactor = 1.2;
  static readonly styleColorTextOutline = 'black';
  static readonly styleTextFontSize = 16;
  static readonly styleTextSpacing = 4;
  static readonly transitionDragEffect = 300;
  static readonly aggregationNodeDepthRadius = 48;

  static readonly aggregationDepthNodeId = -1;

  readonly visibleAttrs = [
    'impurity',
    'decision-feature',
    'number-of-instances',
    'threshold',
    'node-class',
  ];

  activeAttrs: string[] = [];

  completeAttrName = false;

  showNodeLabelsRect = true;

  private funcDragOnStart = function() {
    const node = d3.select(this);

    if (node.empty()) {
      return;
    }

    const circle = node.select('circle');

    const nodeId = +node.attr('index');
    const parentId = +node.attr('parent-id');
    const sonLeftId = +node.attr('son-left-id');
    const sonRightId = +node.attr('son-right-id');
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

    d3.selectAll([
          TreeExtraService.formatLinkId(nodeId, sonLeftId, true),
          TreeExtraService.formatLinkId(nodeId, sonRightId, true),
          TreeExtraService.formatLinkId(parentId, nodeId, true),
      ].join(','))
        .classed('link-active', true)
        .select('line')
          .transition()
            .duration(TreeNodeService.transitionDragEffect)
            .style('stroke', TreeLinksService.styleColorLinkSelected);
  };

  private funcDragOnEnd = function() {
    const node = d3.select(this);

    if (node.empty()) {
      return;
    }

    const circle = node.select('circle');

    const nodeId = +node.attr('index');
    const parentId = +node.attr('parent-id');
    const sonLeftId = +node.attr('son-left-id');
    const sonRightId = +node.attr('son-right-id');
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

    d3.selectAll([
          TreeExtraService.formatLinkId(nodeId, sonLeftId, true),
          TreeExtraService.formatLinkId(nodeId, sonRightId, true),
          TreeExtraService.formatLinkId(parentId, nodeId, true),
      ].join(','))
        .classed('link-active', false)
        .select('line')
          .transition()
            .duration(TreeNodeService.transitionDragEffect)
            .style('stroke', TreeLinksService.funcDragEndSelectStrokeStyle);
  };

  static getConventionalNodeLinks(node): string[] {
    const nodeIndex = +node.attr('index');
    const parentId = +node.attr('parent-id');
    const sonLeftId = +node.attr('son-left-id');
    const sonRightId = +node.attr('son-right-id');

    const linkA = TreeExtraService.formatLinkId(nodeIndex, sonLeftId, true);
    const linkB = TreeExtraService.formatLinkId(nodeIndex, sonRightId, true);
    const linkC = TreeExtraService.formatLinkId(parentId, nodeIndex, true);

    return [linkA, linkB, linkC];
  }

  static moveNodeLinks(node): void {
    const nodeIndex = +node.attr('index');

    if (nodeIndex < 0) {
      d3.selectAll('.link')
        .select(function() {
          return +d3.select(this).attr('node-a-id') === nodeIndex ? this : null;
        })
          .select('line')
            .attr('x1', node.attr('cx'))
            .attr('y1', node.attr('cy'));

      d3.selectAll('.link')
        .select(function() {
          return +d3.select(this).attr('node-b-id') === nodeIndex ? this : null;
        })
          .select('line')
            .attr('x2', node.attr('cx'))
            .attr('y2', node.attr('cy'));

      return;
    }

    const [linkA, linkB, linkC] = TreeNodeService.getConventionalNodeLinks(node);
    const circle = node.select('circle');

    d3.selectAll([linkA, linkB].join(','))
      .select('line')
        .attr('x1', circle.attr('cx'))
        .attr('y1', circle.attr('cy'));

    d3.select(linkC)
      .select('line')
        .attr('x2', circle.attr('cx'))
        .attr('y2', circle.attr('cy'));

    const linkDraggables = d3.selectAll([linkA, linkB, linkC].join(','))
      .selectAll('.draggable');

    if (!linkDraggables.empty()) {
      if (linkDraggables.attr('cx')) {
        linkDraggables.attr('cx', TreeLinksService.funcLinkHalfXCoord);
      }

      if (linkDraggables.attr('cy')) {
        linkDraggables.attr('cy', TreeLinksService.funcLinkHalfYCoord);
      }

      if (linkDraggables.attr('x')) {
        linkDraggables.attr('x', TreeLinksService.funcLinkHalfXCoord);
      }

      if (linkDraggables.attr('y')) {
        linkDraggables.attr('y', TreeLinksService.funcLinkHalfYCoord);
      }
    }
  }

  static moveNode(node, x: number, y: number): void {
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

  private funcDragOnDrag = function() {
    const node = d3.select(this);
    TreeNodeService.moveNode(
        node,
        d3.event.x,
        d3.event.y);
  };

  private funcMouseenter = function() {
    const node = d3.select(this);

    node
      .transition()
        .duration(350)
        .attr('stroke-width', 3);
  };

  private funcMouseleave = function() {
    const node = d3.select(this);

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

  constructor(objectLabelService: ObjectLabelInfoService) { }

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

  generateNode(nodes,
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
        .attr('original-radius', radius)
        .on('mouseenter', this.funcMouseenter)
        .on('mouseleave', this.funcMouseleave);
  }

  buildAggregationDepthNodeText(agDepthNode): void {
    agDepthNode.append('text')
      .classed('draggable node-special-label', true)
      .attr('font-size', 16)
      .attr('font-family', "'Roboto', sans-serif")
      .attr('font-weight', 400)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .attr('x', agDepthNode.attr('cx'))
      .attr('y', agDepthNode.attr('cy'))
      .text('Nodes in: ' + agDepthNode.attr('number-of-nodes'));
  }

  private buildNodesLabelRect(nodes) {
    const rects = nodes.selectAll('.node')
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

  private buildNodesLabelText(nodes): void {
    nodes.selectAll('.node')
      .selectAll('text')
        .remove();

    for (let i = 0; i < this.activeAttrs.length; i++) {
      const curAttr = this.activeAttrs[i];

      const formatedAttrLabel = (
          this.completeAttrName ?
          curAttr :
          TreeExtraService.abbreviateAttrLabel(curAttr));

      const attrLabelPrefix = (this.activeAttrs.length > 1) ? (formatedAttrLabel + ': ') : '';
      const translationValue = (TreeNodeService.styleTextFontSize +
                                (TreeNodeService.styleTextFontSize +
                                 TreeNodeService.styleTextSpacing) *
                                (i - 0.5 * this.activeAttrs.length));
      nodes.selectAll('.node')
        .select(this.filterAggregationNode)
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
    if (this.activeAttrs.length === 0) {
      nodes.selectAll('.node')
        .selectAll('.node-label')
          .remove();

      return;
    }

    let rects = null;

    if (nodes.select('.node').select('rect').empty()) {
      rects = this.buildNodesLabelRect(nodes);

    } else {
      rects = nodes.selectAll('.node')
        .select('rect')
          .attr('height', (TreeNodeService.styleTextFontSize +
                           TreeNodeService.styleTextSpacing) *
                           this.activeAttrs.length);
    }

    this.buildNodesLabelText(nodes);

    if (rects) {
      let labelWidth = 0;

      nodes.selectAll('.node')
        .selectAll('text')
          .each(function(i) {
            labelWidth = Math.max(4 + this.getComputedTextLength(), labelWidth);
          });

      rects
        .attr('width', labelWidth)
        .attr('x', TreeNodeService.funcNodeXCoord)
        .attr('y', TreeNodeService.funcNodeYCoord);
    }
  }

  toggleAttr(newValue: string): void {
    const index: number = this.activeAttrs.indexOf(newValue);
    if (index > -1) {
      this.activeAttrs.splice(index, 1);
    } else {
      this.activeAttrs.push(newValue);
    }
  }

  toggleRectVisibility(nodes): void {
    this.showNodeLabelsRect = !this.showNodeLabelsRect;

    nodes.selectAll('.node')
      .select('rect')
        .attr('visibility', this.showNodeLabelsRect ? 'visible' : 'hidden');
  }

}
