import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Drag from 'd3-drag';

import { TreeExtraService } from './tree-extra.service';
import { TreeLinksService } from './tree-links.service';

@Injectable({
  providedIn: 'root'
})
export class TreeNodeService {
  static readonly radiusMinimum: number = 8;
  static readonly radiusScaleFactor: number = 24;
  static readonly radiusSelectScaleFactor: number = 1.1;

  private funcDragOnStart = function() {
    const node = d3.select(this);
    const circle = node.select('circle');

    const nodeId = +node.attr('index');
    const parentId = +node.attr('parent-id');
    const sonLeftId = +node.attr('son-left-id');
    const sonRightId = +node.attr('son-right-id');
    const radius = +circle.attr('r');

    d3.select('.group-nodes')
      .append('circle')
        .classed('node placeholder-node', true)
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
      .classed('node-active', true)

    circle
      .attr('r', TreeNodeService.radiusSelectScaleFactor * radius);

    d3.selectAll([
          TreeExtraService.formatLinkId(nodeId, sonLeftId, true),
          TreeExtraService.formatLinkId(nodeId, sonRightId, true),
          TreeExtraService.formatLinkId(parentId, nodeId, true),
      ].join(','))
        .classed('link-active', true)
        .select('line')
          .style('stroke', TreeLinksService.styleColorLinkSelected);
  }

  private funcDragOnEnd = function() {
    const node = d3.select(this);
    const circle = node.select('circle');

    const nodeId = +node.attr('index');
    const parentId = +node.attr('parent-id');
    const sonLeftId = +node.attr('son-left-id');
    const sonRightId = +node.attr('son-right-id');
    const radius = +circle.attr('r');

    node
      .classed('node-active', false)

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
            const predictPathLink = d3.select(this)
              .classed('in-predict-path');

            return (
              predictPathLink ? 
              TreeLinksService.styleColorLinkPredict :
              TreeLinksService.styleColorLinkDefault);
          });
  }

  private funcDragOnDrag = function() {
    const node = d3.select(this);
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

    node.selectAll('.draggable')
      .attr('cx', function() { return +d3.select(this).attr('cx') + d3.event.dx; })
      .attr('cy', function() { return +d3.select(this).attr('cy') + d3.event.dy; })
      .attr('x', function() { return +d3.select(this).attr('x') + d3.event.dx; })
      .attr('y', function() { return +d3.select(this).attr('y') + d3.event.dy; });

    d3.selectAll([linkA, linkB].join(','))
      .select('line')
        .attr('x1', circle.attr('cx'))
        .attr('y1', circle.attr('cy'));

    d3.select(linkC)
      .select('line')
        .attr('x2', circle.attr('cx'))
        .attr('y2', circle.attr('cy'));

    d3.selectAll([linkA, linkB, linkC].join(','))
      .selectAll('.draggable')
        .attr('cx', TreeLinksService.funcLinkHalfXCoord)
        .attr('cy', TreeLinksService.funcLinkHalfYCoord)
        .attr('x', TreeLinksService.funcLinkHalfXCoord)
        .attr('y', TreeLinksService.funcLinkHalfYCoord);
  }

  private funcMouseenter = function() {
    const node = d3.select(this);

    node.attr('stroke-width', 2)
        .attr('stroke', 'rgb(96,96,96)');

    d3.select('#node-info-pannel')
      .attr('selected-node', node.attr('index'));
  }

  private funcMouseleave = function() {
    d3.select(this)
      .attr('stroke-width', 1)
      .attr('stroke', 'gray');

    d3.select('#node-info-pannel')
      .attr('selected-node', -1);
  }

  constructor() { }

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
      .attr('appended-info-num', 1)
      .attr('cx', cx)
      .attr('cy', cy)

    for (let attr in nodeAttrs) {
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

  drawImpurity(nodes): void {
    nodes.selectAll('.node')
      .append('rect')
        .classed('draggable node-label label-impurity', true)
        .attr('width', 64)
        .attr('height', function() { return +d3.select(this.parentNode).attr('appended-info-num') * 16; })
        .attr('x', function() { return +d3.select(this.parentNode).attr('cx') - 32; })
        .attr('y', function() {
            const node = d3.select(this.parentNode).select('circle');
            return +node.attr('cy') + 1.5 * +node.attr('r') - 12;
        })
        .attr('rx', 5)
        .attr('opacity', 0.7)
        .attr('fill', 'black');

    nodes.selectAll('.node')
      .append('text')
        .classed('draggable node-label label-impurity', true)
        .attr('font-size', 12)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('x', function() {
          return +d3.select(this.parentNode)
            .attr('cx');
          })
        .attr('y', function() {
            const node = d3.select(this.parentNode).select('circle');
            return +node.attr('r') * 1.5 + +node.attr('cy');
        })
        .text( function() {
          return (
            +d3.select(this.parentNode)
              .attr('impurity')
          ).toFixed(2);
        } );
  }

}
