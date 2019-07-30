import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';

import { TreeExtraService } from './tree-extra.service';

@Injectable({
  providedIn: 'root',
})
export class TreeLinksService {
  static readonly styleColorLinkDefault = 'rgb(128, 128, 128)';
  static readonly styleColorLinkSelected = 'rgb(0, 0, 0)';
  static readonly styleColorLinkPredict = 'rgb(255, 0, 0)';
  static readonly styleWidthLinkDefault = 2;
  static readonly styleWidthLinkSelected = 6;

  readonly visibleAttrs = [
    'weight',
    'relation',
    'decision-feature',
    'threshold',
  ];

  activeAttrs: string[] = [];

  constructor() { }

  static funcLinkHalfXCoord = function(): number {
    const link = d3.select(this.parentNode).select('line');

    const curElem = d3.select(this);
    const width = curElem.attr('width') ? +curElem.attr('width') : 0.0;

    return 0.5 * (+link.attr('x2') + +link.attr('x1') - width);
  };

  static funcLinkHalfYCoord = function(): number {
    const link = d3.select(this.parentNode).select('line');

    const curElem = d3.select(this);
    const height = curElem.attr('height') ? +curElem.attr('height') : 0.0;

    return 0.5 * (+link.attr('y2') + +link.attr('y1') - height);
  };

  connectNodes(links,
               nodes,
               nodeAId: number,
               nodeBId: number,
               relation: string): void {
    const nodeA = nodes.select(TreeExtraService.formatNodeId(nodeAId, true));
    const nodeB = nodes.select(TreeExtraService.formatNodeId(nodeBId, true));

    const weight: string = (
      100 * +nodeB.attr('num-inst') / +nodeA.attr('num-inst')
    ).toFixed(1) + '%';

    links.append('g')
      .classed('link', true)
      .attr('id', TreeExtraService.formatLinkId(nodeAId, nodeBId))
      .attr('node-a-id', nodeAId)
      .attr('node-b-id', nodeBId)
      .attr('appended-info-num', 1)
      .attr('relation', relation)
      .attr('threshold', nodeA.attr('threshold'))
      .attr('decision-feature', nodeA.attr('decision-feature'))
      .attr('weight', weight)
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

  updateLinkLabel(links): void {
    if (this.activeAttrs.length === 0) {
      links.selectAll('.link')
        .selectAll('.link-label')
          .remove();

      return;

    }

    let rects = null;

    if (links.select('.link').select('rect').empty()) {
      rects = links.selectAll('.link')
        .append('rect')
          .raise()
          .classed('draggable link-label', true)
          .attr('width', 64)
          .attr('height', 16 * this.activeAttrs.length)
          .attr('rx', 5)
          .attr('opacity', 0.5)
          .attr('fill', 'red');

    } else {
      rects = links.selectAll('.link')
        .select('rect')
          .attr('height', 16 * this.activeAttrs.length);
    }

    links.selectAll('.link')
      .selectAll('text')
        .remove();

    for (let i = 0; i < this.activeAttrs.length; i++) {
      const curAttr = this.activeAttrs[i];
      const attrLabelPrefix = (this.activeAttrs.length > 1) ? (curAttr + ': ') : '';

      links.selectAll('.link')
        .append('text')
          .classed('draggable link-label', true)
          .attr('font-size', 12)
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('x', TreeLinksService.funcLinkHalfXCoord)
          .attr('y', TreeLinksService.funcLinkHalfYCoord)
          .attr('transform', 'translate(0, ' + (12 + 16 * (i - 0.5 * this.activeAttrs.length)) + ')')
          .text(function(): string {
            let value: string | number = d3.select(this.parentNode).attr(curAttr);
            if (+value) {
              value = (+value).toFixed(2);
            }
            return attrLabelPrefix + value;
          });
    }

    if (rects) {
      let labelWidth = 0;

      links.selectAll('.link')
        .selectAll('text')
          .each(function(i) {
            labelWidth = Math.max(4 + this.getComputedTextLength(), labelWidth);
          });

      rects
        .attr('width', labelWidth)
        .attr('x', TreeLinksService.funcLinkHalfXCoord)
        .attr('y', TreeLinksService.funcLinkHalfYCoord);
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
