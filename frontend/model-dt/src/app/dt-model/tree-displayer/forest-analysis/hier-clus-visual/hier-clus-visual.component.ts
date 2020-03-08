import { Component, OnInit } from '@angular/core';
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
export class HierClusVisualComponent implements OnInit {
  @Input() hierClustersTree: ClusterNode[];
  @Input() numEstimators: number;
  @Input() thresholdCut: number;
  private svg: D3Selection;
  private links: D3Selection;
  private nodes: D3Selection;
  private thresholdLine: D3Selection;
  private svgHeight: number;
  private svgWidth: number;
  private xLimit: number;

  private readonly textFontSize = 14;
  private readonly pixelsPerNode = 18;

  constructor() { }

  ngOnInit(): void {
    this.buildHierClus();
  }

  buildHierClus() {
    this.svg = d3.select("#hier-clus-svg")

    this.nodes = this.svg.append('g').classed('cleanable', true);
    this.links = this.svg.append('g').classed('cleanable', true);

    this.svgWidth = +this.svg.node().getBoundingClientRect().width;
    this.svgHeight = Math.max(+this.svg.attr('height'), this.pixelsPerNode * this.numEstimators);
    this.svg.attr('height', this.svgHeight);

    this.thresholdLine = null;

    if (this.thresholdCut !== null && this.thresholdCut !== undefined) {
      const thresholdLinePos = this.thresholdCut * 0.5 * this.svgWidth;

      this.thresholdLine = this.svg.append('line')
      	.classed('cleanable', true)
          .attr('x1', thresholdLinePos)
          .attr('x2', thresholdLinePos)
          .attr('y1', 0)
          .attr('y2', this.svgHeight)
          .attr('stroke', 'red')
          .attr('stroke-width', 2)
          .style('stroke-dasharray', ('3, 3'));
    }

    let leafXvals = [];
    let yDiff = this.svgHeight / this.numEstimators;
    this.xLimit = this.svgWidth - this.numEstimators.toString().length * this.textFontSize - 1;

    for (let i = 0; i < this.numEstimators; i++) {
      leafXvals.push((1 + i) * yDiff);
    }

    let leafNodes = this.nodes.selectAll('.nodes')
    	.data(leafXvals)
	.enter()
	  .append('text')
	    .attr('id', function(d, i) { return 'node-' + i; })
	    .classed('node', true)
	    .text( function(d, i) { return i + 1; } )
	    .attr('font-size', this.textFontSize + 'px')
    	    .attr('x', this.xLimit)
            .attr('y', function (d) { return d; });

    const numEstimators = this.numEstimators;
    const xLimit = this.xLimit;

    let innerNodes = this.nodes.selectAll('.nodes')
        .data(this.hierClustersTree.slice(numEstimators))
	.enter()
	  .append('g')
	    .attr('id', function(d, i) { return 'node-' + (i + numEstimators); })
	    .classed('node', true)
	    .attr('x', function(d) { return xLimit * (1.0 - +d.dist / 2.0); })
	    .attr('y', function(d, i) {
	        let childL = d3.select('#node-' + d.left);
	        let childR = d3.select('#node-' + d.right);
	    	return 0.5 * (+childL.attr('y') + +childR.attr('y'));
	    });

  }

  destroyHierClus() {
    this.svg
      .selectAll('.cleanable')
        .remove();
  }
}
