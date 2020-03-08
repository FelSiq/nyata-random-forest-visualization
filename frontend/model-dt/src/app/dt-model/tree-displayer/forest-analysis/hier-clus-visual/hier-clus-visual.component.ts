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
  @Input() hierClusTree: ClusterNode[];
  @Input() numEstimators: number;
  private svg: D3Selection;
  private links: D3Selection;
  private nodes: D3Selection;
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

    let leafXvals = [];
    let yDiff = this.svgHeight / (1 + this.numEstimators);
    this.xLimit = this.svgWidth - this.numEstimators.toString().length * this.textFontSize - 1;

    for (let i = 0; i < this.numEstimators; i++) {
      leafXvals.push((1 + i) * yDiff);
    }

    let leafNodes = this.nodes.selectAll('.nodes')
    	.data(leafXvals)
	.enter()
	  .append('text')
	    .text( function(d, i) { return i + 1; } )
	    .attr('font-size', this.textFontSize + 'px')
	    .classed('node', true);

    let leafNodeAttrs = leafNodes
    			.attr('x', this.xLimit)
                        .attr('y', function (d) { return d; });
  }

  destroyHierClus() {
    this.svg
      .selectAll('.cleanable')
        .remove();
  }

  buildRecursively(node: ClusterNode, x: number) {
    const x_mod = 0.5 * x;

    this.nodes.append('g')
    	.classed('node', true)
	.attr('x', x)
	.attr('y', node.dist);

    if (node.left) {
      this.buildRecursively(node.left, x - x_mod);
    }

    if (node.right) {
      this.buildRecursively(node.right, x + x_mod);
    }
  }
}
