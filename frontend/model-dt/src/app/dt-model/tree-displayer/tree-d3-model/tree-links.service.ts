import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';

import { TreeExtraService } from './tree-extra.service';

@Injectable({
  providedIn: 'root'
})
export class TreeLinksService {
  static readonly styleColorLinkDefault = 'rgb(128, 128, 128)';
  static readonly styleColorLinkSelected = 'rgb(0, 0, 0)';
  static readonly styleColorLinkPredict = 'rgb(255, 0, 0)';
  static readonly styleWidthLinkDefault = 2;
  static readonly styleWidthLinkSelected = 6;

  constructor() { }

  static funcLinkHalfXCoord = function() {
    const link = d3.select(this.parentNode).select('line');

    const curElem = d3.select(this);
    const width = curElem.attr('width') ? +curElem.attr('width') : 0.0;

    return 0.5 * (+link.attr('x2') + +link.attr('x1') - width);
  }

  static funcLinkHalfYCoord = function() {
    const link = d3.select(this.parentNode).select('line');

    const curElem = d3.select(this);
    const height = curElem.attr('height') ? +curElem.attr('height') : 0.0;

    return 0.5 * (+link.attr('y2') + +link.attr('y1') - height);
  }

  connectNodes(links,
               nodes,
               nodeAId: number,
               nodeBId: number,
               relation: string): void {
    const nodeA = nodes.select(TreeExtraService.formatNodeId(nodeAId, true));
    const nodeB = nodes.select(TreeExtraService.formatNodeId(nodeBId, true));

    links.append('g')
      .classed('link', true)
      .attr('id', TreeExtraService.formatLinkId(nodeAId, nodeBId))
      .attr('node-a-id', nodeAId)
      .attr('node-b-id', nodeBId)
      .attr('appended-info-num', 1)
      .attr('relation', relation)
      .attr('weight', +nodeB.attr('num-inst') / +nodeA.attr('num-inst'))
      .append('line')
        .attr('x1', nodeA.attr('cx'))
        .attr('x2', nodeB.attr('cx'))
        .attr('y1', nodeA.attr('cy'))
        .attr('y2', nodeB.attr('cy'))
        .style('stroke-width', TreeLinksService.styleWidthLinkDefault)
        .style('stroke', TreeLinksService.styleColorLinkDefault);
  }

  cleanPredictionPaths(links, dashed = false): void {
    if (links) {
      links.selectAll('.link')
        .classed('in-predict-path', false)
        .select('line')
          .style('stroke', TreeLinksService.styleColorLinkDefault)
          .style('stroke-width', TreeLinksService.styleWidthLinkDefault)
          .style('stroke-dasharray', dashed ? ('4, 4') : 'none');
    }
  }

  drawPredictionPaths(links, curPath): void {
    for (let i = 0; i < curPath.length - 1; i++) {
      links.select(TreeExtraService.formatLinkId(curPath[i], curPath[i+1], true))
        .classed('in-predict-path', true)
        .select('line')
          .style('stroke', TreeLinksService.styleColorLinkPredict)
          .style('stroke-width', TreeLinksService.styleWidthLinkSelected)
          .style('stroke-dasharray', 'none');
    }
  }

  drawLinkWeight(links): void {
    links.selectAll('.link')
      .append('rect')
        .classed('draggable link-label label-weight', true)
        .attr('width', 64)
        .attr('height', function() { return +d3.select(this.parentNode).attr('appended-info-num') * 16; })
        .attr('x', TreeLinksService.funcLinkHalfXCoord)
        .attr('y', TreeLinksService.funcLinkHalfYCoord)
        .attr('rx', 5)
        .attr('opacity', 0.5)
        .attr('fill', 'red');

    links
      .selectAll('.link')
      .append('text')
        .classed('draggable link-label label-weight', true)
        .attr('font-size', 12)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('x', TreeLinksService.funcLinkHalfXCoord)
        .attr('y', TreeLinksService.funcLinkHalfYCoord)
        .text( function(): string {
          return (
            100 * +d3.select(this.parentNode).attr('weight')
          ).toFixed(1) + '%';
        });
  }

}
