import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Input } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Transform from 'd3-transform';

import { ClusterNode } from '../hier-clus';

type D3Selection = d3.Selection<SVGElement | any, {}, HTMLElement, any>;

@Component({
  selector: 'app-hier-clus-visual',
  templateUrl: './hier-clus-visual.component.html',
  styleUrls: ['./hier-clus-visual.component.css']
})
export class HierClusVisualComponent implements OnInit, AfterViewInit {
  @Input() hierClustersTree: ClusterNode[];
  @Input() leavesOptSeq: number[];
  @Input() numEstimators: number;
  @Input() thresholdCut: number;
  private svg: D3Selection;
  private links: D3Selection;
  private nodes: D3Selection;
  private thresholdLine: D3Selection;
  private svgHeight: number;
  private svgWidth: number;
  private xSvgLimit: number;

  private xMaxLimit = 2.0;
  private numLegendTicks = 10;

  private readonly textFontSize = 14;
  private readonly pixelsPerNode = 18;
  private readonly legendSpace = 64;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.buildHierClus();
  }

  buildHierClus() {
    if (!this.hierClustersTree) {
      return;
    }

    this.svg = d3.select("#hier-clus-svg")

    this.nodes = this.svg.append('g').classed('cleanable', true);

    this.svgWidth = +this.svg.node().getBoundingClientRect().width;
    this.svgHeight = Math.max(
        +this.svg.attr('height'),
        this.pixelsPerNode * this.numEstimators + this.legendSpace);
    this.svg.attr('height', this.svgHeight);

    this.xSvgLimit = this.svgWidth - this.numEstimators.toString().length * this.textFontSize - 1;
    let yDiff = (this.svgHeight - this.legendSpace) / this.numEstimators;

    this.thresholdLine = null;

    if (this.thresholdCut !== null && this.thresholdCut !== undefined) {
    const thresholdLinePos = (1.0 - this.thresholdCut / this.xMaxLimit) * this.xSvgLimit;
  
      this.thresholdLine = this.svg.append('g');

      this.thresholdLine.append('line')
          .classed('cleanable', true)
          .attr('x1', thresholdLinePos)
          .attr('x2', thresholdLinePos)
          .attr('y1', 0)
          .attr('y2', this.svgHeight - this.legendSpace)
          .attr('stroke', 'red')
          .attr('stroke-width', 2)
          .style('stroke-dasharray', ('3, 3'));

      this.thresholdLine.append('text')
          .text(this.thresholdCut.toFixed(3).toString())
          .attr('font-size', '12px')
          .attr('x', thresholdLinePos)
          .attr('text-anchor', 'middle')
          .attr('y', this.svgHeight - this.legendSpace + 8)
          .style('fill', 'red');
    }

    let leafData = [];

    for (let i = 0; i < this.numEstimators; i++) {
      leafData.push({
        'y': (1 + i) * yDiff,
        'id': this.leavesOptSeq[i],
      });
    }

    let leafNodes = this.nodes.selectAll('.nodes')
    .data(leafData)
    .enter()
      .append('text')
        .attr('id', function(d) { return 'node-' + d.id; })
        .classed('node', true)
        .text( function(d) { return d.id; } )
        .attr('font-size', this.textFontSize + 'px')
        .attr('x', this.xSvgLimit)
        .attr('y', function (d) { return d.y; });

    const numEstimators = this.numEstimators;
    const xSvgLimit = this.xSvgLimit;
    const xMaxLimit = this.xMaxLimit;

    let innerNodes = this.nodes.selectAll('.nodes')
        .data(this.hierClustersTree.slice(numEstimators))
        .enter()
          .append('g')
            .attr('id', function(d, i) { return 'node-' + (i + numEstimators); })
            .classed('node', true)
            .attr('x', function(d) { return xSvgLimit * (1.0 - +d.dist / xMaxLimit); })
            .attr('y', function(d, i) {
                let childL = d3.select('#node-' + d.left);
                let childR = d3.select('#node-' + d.right);
                return 0.5 * (+childL.attr('y') + +childR.attr('y'));
            })
            .append('polyline')
              .classed('link', true)
              .attr('stroke', 'black')
              .attr('fill', 'none')
              .attr('stroke-widht', 2)
              .attr('points', function(d) {
                let parent = d3.select(this.parentNode);
                let childL = d3.select('#node-' + d.left);
                let childR = d3.select('#node-' + d.right);
                return (childL.attr('x') + ',' + childL.attr('y') + ' ' +
                    parent.attr('x') + ',' + childL.attr('y') + ' ' +
                    parent.attr('x') + ',' + childR.attr('y') + ' ' +
                    childR.attr('x') + ',' + childR.attr('y') + ' ');
                  });

    const lastNode = d3.select('#node-' + (this.hierClustersTree.length - 1));

    this.nodes.append('line')
        .classed('link', true)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('x1', lastNode.attr('x'))
        .attr('y1', lastNode.attr('y'))
        .attr('x2', 0)
        .attr('y2', lastNode.attr('y'));

    const legendYPos = this.svgHeight - 4;
    this.svg.append('g')
        .classed('legend', true)
        .classed('cleanable', true)
        .attr('id', 'hier-clus-legend')
        .append('line')
          .classed('legend', true)
          .attr('stroke', 'black')
          .attr('stroke-width', '2px')
          .attr('x1', 0)
          .attr('x2', this.xSvgLimit)
          .attr('y1', legendYPos)
          .attr('y2', legendYPos);

    let legendTicks = [];
    for (let i = 0; i < this.numLegendTicks; i++) {
      legendTicks.push(i / this.numLegendTicks);
    }

    this.svg.select('#hier-clus-legend')
        .selectAll('.legend')
          .data(legendTicks)
          .enter()
            .append('circle')
            .attr('cx', function(d) { return xSvgLimit * d; })
            .attr('cy', function() { return legendYPos; })
            .attr('r', 2)
            .attr('color', 'black')

    this.svg.select('#hier-clus-legend')
        .selectAll('.legend')
          .data(legendTicks)
          .enter()
            .append('text')
              .text(function (d) { return (xMaxLimit * d).toFixed(2);} )
              .attr('font-size', '8px')
              .attr('x', function(d) { return xSvgLimit * d; })
              .attr('y', function() { return legendYPos + 4; })
              .attr('text-anchor', 'middle');
  }

  destroyHierClus() {
    this.svg
      .selectAll('.cleanable')
        .remove();
  }
}
