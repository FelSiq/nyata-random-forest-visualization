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
  static readonly styleColorTextOutline = 'black';
  static readonly styleTextFontSize = 16;
  static readonly styleTextSpacing = 4;

  readonly visibleAttrs = [
    'weight',
    'decision',
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

  static funcDragEndSelectStrokeStyle = function(): string {
    const predictPathLink = d3.select(this.parentNode)
      .classed('in-predict-path');

    return (
      predictPathLink ? 
      TreeLinksService.styleColorLinkPredict :
      TreeLinksService.styleColorLinkDefault);
  }

  connectNodes(links,
               nodes,
               nodeAId: number,
               nodeBId: number,
               decision: string): void {
    const nodeA = nodes.select(TreeExtraService.formatNodeId(nodeAId, true));
    const nodeB = nodes.select(TreeExtraService.formatNodeId(nodeBId, true));

    const weight: string = (
      100 * +nodeB.attr('number-of-instances') / +nodeA.attr('number-of-instances')
    ).toFixed(1) + '%';

    links.append('g')
      .classed('link', true)
      .attr('id', TreeExtraService.formatLinkId(nodeAId, nodeBId))
      .attr('node-a-id', nodeAId)
      .attr('node-b-id', nodeBId)
      .attr('decision', decision)
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
          .attr('height', (TreeLinksService.styleTextFontSize +
                           TreeLinksService.styleTextSpacing) *
                           this.activeAttrs.length)
          .attr('rx', 5)
          .attr('opacity', 0.5)
          .attr('fill', 'red');

    } else {
      rects = links.selectAll('.link')
        .select('rect')
          .attr('height', (TreeLinksService.styleTextFontSize +
                           TreeLinksService.styleTextSpacing) *
                           this.activeAttrs.length);
    }

    links.selectAll('.link')
      .selectAll('text')
        .remove();

    for (let i = 0; i < this.activeAttrs.length; i++) {
      const curAttr = this.activeAttrs[i];
      const attrLabelPrefix = (this.activeAttrs.length > 1) ? (curAttr + ': ') : '';
      const translationValue = (TreeLinksService.styleTextFontSize +
                                (TreeLinksService.styleTextFontSize +
                                 TreeLinksService.styleTextSpacing) *
                                (i - 0.5 * this.activeAttrs.length));
      links.selectAll('.link')
        .append('text')
          .classed('draggable link-label', true)
          .attr('font-size', TreeLinksService.styleTextFontSize)
          .attr('font-family', "'Roboto', sans-serif")
          .attr('font-weight', 900)
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('x', TreeLinksService.funcLinkHalfXCoord)
          .attr('y', TreeLinksService.funcLinkHalfYCoord)
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
