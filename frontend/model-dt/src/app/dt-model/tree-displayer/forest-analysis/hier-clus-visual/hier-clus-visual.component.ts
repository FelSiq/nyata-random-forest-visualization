import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

import * as d3 from 'd3-selection';
import * as d3Transform from 'd3-transform';

import { ClusterNode } from '../hier-clus';

type D3Selection = d3.Selection<SVGElement | any, {}, HTMLElement, any>;

@Component({
  selector: 'app-hier-clus-visual',
  templateUrl: './hier-clus-visual.component.html',
  styleUrls: ['./hier-clus-visual.component.css']
})
export class HierClusVisualComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() hierClustersTree: ClusterNode[];
  @Input() leavesOptSeq: number[];
  @Input() numEstimators: number;
  @Input() thresholdCut: number;
  @Input() selectedLinkageType: string;
  private svg: D3Selection;
  private links: D3Selection;
  private nodes: D3Selection;
  private thresholdLine: D3Selection;
  private svgHeight: number;
  private svgWidth: number;
  private xSvgLimit: number;

  private xMaxLimit = 2.0;
  private numLegendTicks = 10;

  private readonly textFontSize = 18;
  private readonly legendSpace = 96;
  private readonly clusterStrokeWidth = 2;
  private pixelsPerNode = 32;
  private legendYPos: number;

  private eventsSubscription: Subscription;
  @Input() events: Observable<void>;

  constructor() { }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe(() => this.buildHierClusThreshold());
  }

  ngAfterViewInit(): void {
    this.buildHierClus();
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  buildHierClusLegend() {
    this.legendYPos = this.svgHeight - 64;
    const xSvgLimit = this.xSvgLimit;
    const xMaxLimit = this.xMaxLimit;

    let legendTicks = [];
    for (let i = 0; i <= this.numLegendTicks; i++) {
      legendTicks.push(i / this.numLegendTicks);
    }

    this.svg.selectAll('.legend').remove();

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
          .attr('y1', this.legendYPos)
          .attr('y2', this.legendYPos);

    this.svg.select('#hier-clus-legend')
        .selectAll('.legend')
          .data(legendTicks)
          .enter()
            .append('circle')
            .attr('cx', function(d) { return xSvgLimit * d; })
            .attr('cy', this.legendYPos)
            .attr('r', 3);

    let legend = this.svg.select('#hier-clus-legend')
        .selectAll('.legend')
          .data(legendTicks)
          .enter()
            .append('g')
              .classed('legend', true);

    legend
        .append('text')
          .classed('legend', true)
          .text('f(x) = 1 - Cohen_kappa(x)')
          .attr('font-size', '16px')
          .attr('x', 1)
          .attr('y', this.legendYPos + 36);

    legend
        .append('text')
          .classed('legend', true)
          .text(function (d) { return (xMaxLimit * (1 - d)).toFixed(2);} )
          .attr('font-size', '16px')
          .attr('x', function(d) { return xSvgLimit * d; })
          .attr('y', this.legendYPos + 16)
          .attr('text-anchor', 'middle');

    legend
        .append('line') 
          .classed('legend', true)
          .attr('x1', function(d) { return xSvgLimit * d; })
          .attr('x2', function(d) { return xSvgLimit * d; })
          .attr('y1', 0)
          .attr('y2', this.legendYPos)
          .attr('stroke', 'rgb(230, 230, 230)')
          .attr('stroke-width', this.clusterStrokeWidth)
          .style('stroke-dasharray', ('4, 3'));

  }

  buildHierClusThreshold() {
    this.thresholdLine = null;

    if (this.thresholdCut !== null && this.thresholdCut !== undefined) {
      this.svg.selectAll('.threshold').remove();

      const thresholdLinePos = (1.0 - this.thresholdCut / this.xMaxLimit) * this.xSvgLimit;
  
      this.thresholdLine = this.svg.append('g');

      this.thresholdLine.append('line')
          .classed('cleanable', true)
          .classed('threshold', true)
          .attr('x1', thresholdLinePos)
          .attr('x2', thresholdLinePos)
          .attr('y1', 0)
          .attr('y2', this.svgHeight - this.legendSpace)
          .attr('stroke', 'red')
          .attr('stroke-width', this.clusterStrokeWidth)
          .style('stroke-dasharray', ('3, 3'));

      this.thresholdLine.append('text')
          .classed('cleanable', true)
          .classed('threshold', true)
          .text(this.thresholdCut.toFixed(2).toString())
          .attr('font-size', '16px')
          .attr('x', thresholdLinePos)
          .attr('text-anchor', 'middle')
          .attr('y', this.svgHeight - this.legendSpace + 16)
          .style('fill', 'red');
    }
  }

  updatePixelsPerNode() {
    if (this.numEstimators > 75) {
      this.pixelsPerNode = 18;

    } else if (this.numEstimators > 20) {
      this.pixelsPerNode = 32;

    } else {
      this.pixelsPerNode = 48;
    }
  }

  buildHierClus() {
    if (!this.hierClustersTree) {
      return;
    }

    this.svg = d3.select("#hier-clus-svg")

    this.svgWidth = +this.svg.node().getBoundingClientRect().width;
    this.svgHeight = Math.max(
        +this.svg.attr('height'),
        this.pixelsPerNode * this.numEstimators + this.legendSpace);
    this.svg.attr('height', this.svgHeight);

    this.xSvgLimit = this.svgWidth - this.numEstimators.toString().length * this.textFontSize - 16;
    const yDiff = (this.svgHeight - this.legendSpace) / this.numEstimators;
    const numEstimators = this.numEstimators;
    const xSvgLimit = this.xSvgLimit;
    const xMaxLimit = this.xMaxLimit;

    this.buildHierClusLegend();

    this.nodes = this.svg.append('g').classed('cleanable', true);

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
            .attr('id', function(d) { return 'hc-node-' + d.id; })
            .classed('node', true)
            .text( function(d) { return d.id; } )
            .attr('font-size', this.textFontSize + 'px')
            .attr('x', this.xSvgLimit + 16)
            .attr('y', function (d) { return d.y; });

    let innerNodes = this.nodes.selectAll('.nodes')
        .data(this.hierClustersTree.slice(numEstimators))
        .enter()
          .append('g')
            .attr('id', function(d, i) { return 'hc-node-' + (i + numEstimators); })
            .classed('node', true)
            .attr('x', function(d) { return xSvgLimit * (1.0 - +d.dist / xMaxLimit); })
            .attr('y', function(d, i) {
                let childL = d3.select('#hc-node-' + d.left);
                let childR = d3.select('#hc-node-' + d.right);
                return 0.5 * (+childL.attr('y') + +childR.attr('y'));
            })
            .append('polyline')
              .classed('link', true)
              .attr('stroke', 'black')
              .attr('fill', 'none')
              .attr('stroke-width', this.clusterStrokeWidth)
              .attr('points', function(d) {
                let parent = d3.select(this.parentNode);
                let childL = d3.select('#hc-node-' + d.left);
                let childR = d3.select('#hc-node-' + d.right);
                return (childL.attr('x') + ',' + childL.attr('y') + ' ' +
                    parent.attr('x') + ',' + childL.attr('y') + ' ' +
                    parent.attr('x') + ',' + childR.attr('y') + ' ' +
                    childR.attr('x') + ',' + childR.attr('y'));
                  });

    const lastNode = d3.select('#hc-node-' + (this.hierClustersTree.length - 1));

    this.nodes.append('line')
        .classed('link', true)
        .attr('stroke', 'black')
        .attr('stroke-width', this.clusterStrokeWidth)
        .attr('x1', lastNode.attr('x'))
        .attr('y1', lastNode.attr('y'))
        .attr('x2', 0)
        .attr('y2', lastNode.attr('y'));

    this.buildHierClusThreshold();
  }

  destroyHierClus() {
    this.svg
      .selectAll('.cleanable')
        .remove();
  }
}
