import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';

import { TreeExtraService } from './tree-extra.service';

type D3Selection = d3.Selection<SVGElement | any, {}, HTMLElement, any>;

@Injectable({
  providedIn: 'root',
})
export class TreeLinksService {
  static readonly styleColorLinkDefault = 'rgb(128, 128, 128)';
  static readonly styleColorLinkSelected = 'rgb(0, 0, 0)';
  static readonly styleColorLinkPredict = 'rgb(192, 0, 0)';
  static readonly styleColorLinkPredictSelected = 'rgb(96, 0, 0)';
  static readonly styleWidthLinkDefault = 2;
  static readonly styleWidthLinkSelected = 6;
  static readonly styleWidthLinkDragFactor = 2.0;
  static readonly styleColorTextOutline = 'black';
  static readonly styleTextFontSize = 16;
  static readonly styleTextSpacing = 4;

  readonly visibleAttrs = [
    { name: 'weight', abbv: null },
    { name: 'decision', abbv: null },
    { name: 'decision-feature', abbv: null },
    { name: 'threshold', abbv: null },
  ];

  activeAttrs: string[] = [];
  completeAttrName = false;
  showLinkLabelsRect = true;

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

  static funcDragStartSelectStrokeStyle = function(): string {
    const predictPathLink = d3.select(this.parentNode)
      .classed('in-predict-path');

    return (
      predictPathLink ? 
      TreeLinksService.styleColorLinkPredictSelected :
      TreeLinksService.styleColorLinkSelected);
  };

  static funcDragEndSelectStrokeStyle = function(): string {
    const predictPathLink = d3.select(this.parentNode)
      .classed('in-predict-path');

    return (
      predictPathLink ? 
      TreeLinksService.styleColorLinkPredict :
      TreeLinksService.styleColorLinkDefault);
  };

  private filterAggregationLink = function() {
    const link = d3.select(this);
    const aggregationLink = (+link.attr('node-a-id') < 0 ||
                             +link.attr('node-b-id') < 0);
    return aggregationLink ? null : this;
  };

  constructor() { }

  static getNodeIncidentEdges(node: D3Selection): D3Selection {
    const links = d3.selectAll('.link');
    const nodeIndex = +node.attr('index');

    return links
      .select(function() {
        return (
          +d3.select(this).attr('node-a-id') === nodeIndex ||
          +d3.select(this).attr('node-b-id') === nodeIndex
        ) ? this : null;
      });
  }

  static getToAndFromNodeLinks(node: D3Selection): [D3Selection, D3Selection] {
    const links = d3.selectAll('.link');
    const nodeIndex = +node.attr('index');

    const linksFromNode = links
      .select(function() {
        return +d3.select(this).attr('node-a-id') === nodeIndex ? this : null;
      });

    const linksToNode = links
      .select(function() {
        return +d3.select(this).attr('node-b-id') === nodeIndex ? this : null;
      });

    return [ linksFromNode, linksToNode ];
  }

  connectNodes(links: D3Selection,
               nodes: D3Selection,
               nodeAId: number,
               nodeBId: number,
               decision: string): void {
    if (nodeAId === nodeBId || links.empty()) {
      return;
    }

    const nodeA = nodes.select(TreeExtraService.formatNodeId(nodeAId, true));
    const nodeB = nodes.select(TreeExtraService.formatNodeId(nodeBId, true));
    const newLinkId = TreeExtraService.formatLinkId(nodeAId, nodeBId);

    if (nodeA.empty() || nodeB.empty() || !links.select('#' + newLinkId).empty()) {
      return;
    }

    const newLink = links.append('g')
      .classed('link', true)
      .attr('id', newLinkId)
      .attr('node-a-id', nodeAId)
      .attr('node-b-id', nodeBId);

    newLink
      .append('line')
        .attr('x1', nodeA.attr('cx'))
        .attr('x2', nodeB.attr('cx'))
        .attr('y1', nodeA.attr('cy'))
        .attr('y2', nodeB.attr('cy'))
        .style('stroke-width', TreeLinksService.styleWidthLinkDefault)
        .style('stroke', TreeLinksService.styleColorLinkDefault);

    if (+nodeA.attr('index') >= 0 && +nodeB.attr('index') >= 0) {
      const weight: string = (
        100 * +nodeB.attr('number-of-instances') / +nodeA.attr('number-of-instances')
      ).toFixed(1) + '%';

      newLink
        .attr('decision', decision)
        .attr('threshold', nodeA.attr('threshold'))
        .attr('decision-feature', nodeA.attr('decision-feature'))
        .attr('weight', weight);
    }
  }

  cleanPredictionPaths(links: D3Selection, nodes: D3Selection, dashed = false): void {
    if (links && !links.empty()) {
      links
        .selectAll('.link')
          .classed('in-predict-path', false)
          .select('line')
            .style('stroke', TreeLinksService.styleColorLinkDefault)
            .style('stroke-width', TreeLinksService.styleWidthLinkDefault)
            .style('stroke-dasharray', dashed ? ('4, 4') : 'none');
    }

    if (nodes && !nodes.empty()) {
      nodes
        .selectAll('.in-predict-path')
          .classed('in-predict-path', false);
    }
  }

  drawPredictionPaths(links: D3Selection,
                      nodes: D3Selection,
                      curPath: Array<number | string>,
                      omittedNodes: number[]): void {
    if (links.empty()) {
      return;
    }

    let nodeAId,
        nodeAIsDrawn,
        nodeBIsDrawn,
        nodeBId = curPath[0];

    for (let i = 1; i < curPath.length; i++) {
      nodeAId = +nodeBId;
      nodeBId = +curPath[i];

      nodeAIsDrawn = omittedNodes.indexOf(nodeAId) < 0,
      nodeBIsDrawn = omittedNodes.indexOf(nodeBId) < 0;

      if (!nodeAIsDrawn || !nodeBIsDrawn) {
        d3.select(TreeExtraService.formatNodeId(-1, true))
          .classed('in-predict-path', true);
      }

      if (nodeAIsDrawn || nodeBIsDrawn) {
        if (nodeAIsDrawn) {
          d3.select(TreeExtraService.formatNodeId(nodeAId, true))
            .classed('in-predict-path', true);
        }

        if (nodeBIsDrawn) {
          d3.select(TreeExtraService.formatNodeId(nodeBId, true))
            .classed('in-predict-path', true);
        }

        const curLinkId = (
          TreeExtraService.formatLinkId(
            nodeAIsDrawn ? nodeAId : -1,
            nodeBIsDrawn ? nodeBId : -1,
            true));

        links.select(curLinkId)
          .classed('in-predict-path', true)
          .select('line')
            .style('stroke', TreeLinksService.styleColorLinkPredict)
            .style('stroke-width', TreeLinksService.styleWidthLinkSelected)
            .style('stroke-dasharray', 'none');
      }
    }
  }

  private buildLinksLabelRect(links: D3Selection): D3Selection {
    if (links.empty()) {
      return;
    }

    const rects = links.selectAll('.link')
      .select(this.filterAggregationLink)
        .append('rect')
          .raise()
          .classed('draggable link-label', true)
          .attr('width', 64)
          .attr('height', (TreeLinksService.styleTextFontSize +
                           TreeLinksService.styleTextSpacing) *
                           this.activeAttrs.length)
          .attr('rx', 5)
          .attr('opacity', 0.5)
          .attr('fill', 'red')
          .attr('visibility', this.showLinkLabelsRect ? 'visible' : 'hidden');

    return rects;
  }

  private buildLinksLabelText(links: D3Selection): void {
    if (links.empty()) {
      return;
    }

    const filteredLinks = links
      .selectAll('.link')
        .select(this.filterAggregationLink);

    filteredLinks
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
      const translationValue = (TreeLinksService.styleTextFontSize +
                                (TreeLinksService.styleTextFontSize +
                                 TreeLinksService.styleTextSpacing) *
                                (i - 0.5 * this.activeAttrs.length));
      filteredLinks
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
  }

  updateLinkLabel(links): void {
    if (links.empty()) {
      return;
    }

    if (this.activeAttrs.length === 0) {
      links.selectAll('.link')
        .selectAll('.link-label')
          .remove();

      return;
    }

    let rects = null;

    if (links.select('.link').select('rect').empty()) {
      rects = this.buildLinksLabelRect(links);

    } else {
      rects = links.selectAll('.link')
        .select('rect')
          .attr('height', (TreeLinksService.styleTextFontSize +
                           TreeLinksService.styleTextSpacing) *
                           this.activeAttrs.length);
    }

    this.buildLinksLabelText(links);

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

  toggleRectVisibility(links: D3Selection): void {
    this.showLinkLabelsRect = !this.showLinkLabelsRect;

    if (links.empty()) {
      return;
    }

    links
      .selectAll('.link')
        .select('rect')
          .attr('visibility', this.showLinkLabelsRect ? 'visible' : 'hidden');
  }

  toggleCompleteAttrName(links: D3Selection): void {
    this.completeAttrName = !this.completeAttrName;

    if (links.empty()) {
      return;
    }

    this.updateLinkLabel(links);
  }

}
