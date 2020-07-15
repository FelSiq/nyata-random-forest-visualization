import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';

import { TreeExtraService } from './tree-extra.service';
import { LinkVisibleAttrsInfo } from './link-visible-attrs-info';

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
  static readonly styleAttrRectColor = 'white';

  height: number;
  width: number;

  readonly visibleAttrsInfo = new LinkVisibleAttrsInfo();

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
    const obj = d3.select(this.parentNode),
          predictPathLink = obj.classed('in-predict-path'),
          hoveredPathLink = obj.classed('hovered');

    return (
      predictPathLink || hoveredPathLink ? 
      TreeLinksService.styleColorLinkPredictSelected :
      TreeLinksService.styleColorLinkSelected);
  };

  static funcDragEndSelectStrokeStyle = function(): string {
    const obj = d3.select(this.parentNode),
          predictPathLink = obj.classed('in-predict-path'),
          hoveredPathLink = obj.classed('hovered');

    return (
      predictPathLink || hoveredPathLink ? 
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

  cleanPredictionPaths(links: D3Selection,
                       nodes: D3Selection,
                       dashed = false): [ D3Selection, D3Selection ] {
    let inPredPathNodes,
        inPredPathLinks;

    if (links && !links.empty()) {
      inPredPathLinks = links
        .selectAll('.in-predict-path');

      inPredPathLinks
        .classed('in-predict-path', false)
        .select('line')
          .style('stroke', TreeLinksService.styleColorLinkDefault)
          .style('stroke-width', TreeLinksService.styleWidthLinkDefault)

      links
        .selectAll('.link')
          .select('line')
            .style('stroke-dasharray', dashed ? ('4, 4') : 'none');
    }

    if (nodes && !nodes.empty()) {
      inPredPathNodes = nodes
        .selectAll('.in-predict-path');
        
      inPredPathNodes
        .classed('in-predict-path', false)
        .attr('predict-log', null);
    }

    return [ inPredPathNodes, inPredPathLinks ];
  }

  drawPredictionPaths(links: D3Selection,
                      nodes: D3Selection,
                      curPath: Array<number | string>,
                      omittedNodes: number[]): void {
    if (links.empty() || !curPath) {
      return;
    }

    links
      .selectAll('.link')
        .classed('hovered', false)
        .select('line')
          .style('stroke', TreeLinksService.styleColorLinkDefault)
          .style('stroke-dasharray', ('4, 4'));

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

  updateLinkLabel(links): void {
    if (!links || links.empty()) {
      return;
    }

    const aux = links.selectAll('.link');
    if (!aux.empty()) {
      links = aux;
    }
  
    const filteredLinks = links
      .select(this.filterAggregationLink);

    TreeExtraService.buildObjectsLabelText(
      filteredLinks,
      this.activeAttrs,
      (this.completeAttrName ?
         null :
         TreeExtraService.getAbbvs(this.activeAttrs,
                                   this.visibleAttrsInfo.visibleAttrs)),
      TreeLinksService.styleTextFontSize,
      TreeLinksService.styleTextSpacing,
      TreeLinksService.styleColorTextOutline,
      TreeLinksService.funcLinkHalfXCoord,
      TreeLinksService.funcLinkHalfYCoord,
    );

    TreeExtraService.buildObjectsLabelRect(
      filteredLinks,
      TreeLinksService.styleAttrRectColor,
      this.showLinkLabelsRect,
      (TreeLinksService.styleTextFontSize +
       TreeLinksService.styleTextSpacing),
      TreeLinksService.funcLinkHalfXCoord,
      TreeLinksService.funcLinkHalfYCoord,
    );

    TreeExtraService.adjustObjectsCoordsByLabel(
      filteredLinks,
      this.height,
      this.width,
      null,
    );

    filteredLinks
      .selectAll('.label-text')
        .raise();

    TreeExtraService.setMouseEvents(links, null, null);
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
