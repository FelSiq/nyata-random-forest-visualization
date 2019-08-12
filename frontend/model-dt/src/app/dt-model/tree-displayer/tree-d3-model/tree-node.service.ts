import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Drag from 'd3-drag';

import { TreeExtraService } from './tree-extra.service';
import { TreeLinksService } from './tree-links.service';

@Injectable({
  providedIn: 'root',
})
export class TreeNodeService {
  static readonly radiusMinimum: number = 8;
  static readonly radiusScaleFactor: number = 24;
  static readonly radiusSelectScaleFactor: number = 1.1;

  readonly visibleAttrs = [
    'impurity',
    'decision-feature',
    'number-of-instances',
    'threshold',
    'node-class',
  ];

  activeAttrs: string[] = [];

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
    const radius = !circle.empty() ? +circle.attr('r') : 0.0;

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
    const radius = +circle.attr('r');

    node
      .classed('node-active', false);

    circle
      .attr('r', radius / TreeNodeService.radiusSelectScaleFactor);

    d3.select('#placeholder-node-' + nodeId)
      .remove();

    d3.selectAll([
          TreeExtraService.formatLinkId(nodeId, sonLeftId, true),
          TreeExtraService.formatLinkId(nodeId, sonRightId, true),
          TreeExtraService.formatLinkId(parentId, nodeId, true),
      ].join(','))
        .classed('link-active', false)
        .select('line')
          .style('stroke', function() {
            const predictPathLink = d3.select(this.parentNode)
              .classed('in-predict-path');

            return (
              predictPathLink ? 
              TreeLinksService.styleColorLinkPredict :
              TreeLinksService.styleColorLinkDefault);
          });
  };

  private funcDragOnDrag = function() {
    const node = d3.select(this);

    if (node.empty()) {
      return;
    }

    const circle = node.select('circle');

    const nodeId = +node.attr('index');
    const parentId = +node.attr('parent-id');
    const sonLeftId = +node.attr('son-left-id');
    const sonRightId = +node.attr('son-right-id');

    const linkA = TreeExtraService.formatLinkId(nodeId, sonLeftId, true);
    const linkB = TreeExtraService.formatLinkId(nodeId, sonRightId, true);
    const linkC = TreeExtraService.formatLinkId(parentId, nodeId, true);

    node
      .attr('cx', d3.event.x)
      .attr('cy', d3.event.y);

    const nodeDraggables = node.selectAll('.draggable')
      .attr('cx', function() { return +d3.select(this).attr('cx') + d3.event.dx; })
      .attr('cy', function() { return +d3.select(this).attr('cy') + d3.event.dy; })
      .attr('x', function() { return +d3.select(this).attr('x') + d3.event.dx; })
      .attr('y', function() { return +d3.select(this).attr('y') + d3.event.dy; });

    if (!nodeDraggables.empty()) {
    }

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
  };

  private funcMouseenter = function() {
    const node = d3.select(this);

    if (node.empty()) {
      return;
    }

    node.attr('stroke-width', 2)
        .attr('stroke', 'rgb(96,96,96)');

    d3.select('#node-info-pannel')
      .attr('selected-node', node.attr('index'));
  };

  private funcMouseleave = function() {
    d3.select(this)
      .attr('stroke-width', 1)
      .attr('stroke', 'gray');

    d3.select('#node-info-pannel')
      .attr('selected-node', -1);
  };

  constructor() { }

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
        .attr('fill', circleColor)
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .on('mouseenter', this.funcMouseenter)
        .on('mouseleave', this.funcMouseleave);
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
      rects = nodes.selectAll('.node')
        .append('rect')
          .raise()
          .classed('draggable node-label', true)
          .attr('width', 64)
          .attr('height', 16 * this.activeAttrs.length)
          .attr('rx', 5)
          .attr('opacity', 0.5)
          .attr('fill', 'black');

    } else {
      rects = nodes.selectAll('.node')
        .select('rect')
          .attr('height', 16 * this.activeAttrs.length);
    }

    nodes.selectAll('.node')
      .selectAll('text')
        .remove();

    for (let i = 0; i < this.activeAttrs.length; i++) {
      const curAttr = this.activeAttrs[i];
      const attrLabelPrefix = (this.activeAttrs.length > 1) ? (curAttr + ': ') : '';

      nodes.selectAll('.node')
        .append('text')
          .classed('draggable node-label', true)
          .attr('font-size', 12)
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('x', TreeNodeService.funcNodeXCoord)
          .attr('y', TreeNodeService.funcNodeYCoord)
          .attr('transform', 'translate(0, ' + (12 + 16 * (i - 0.5 * this.activeAttrs.length)) + ')')
          .text(function(): string {
            let value: string | number = d3.select(this.parentNode).attr(curAttr);
            if (+value && value.indexOf('.') > -1 && value.length > 4) {
              value = (+value).toFixed(2);
            }
            return attrLabelPrefix + value;
          });
    }

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

}