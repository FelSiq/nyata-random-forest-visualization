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
  @Input() hierClusTree: ClusterNode;
  @Input() numEstimators: number;
  private svg: D3Selection;
  private links: D3Selection;
  private nodes: D3Selection;
  private svgHeight: number;
  private svgWidth: number;

  constructor() { }

  ngOnInit(): void {
    this.buildHierClus();
  }

  buildHierClus() {
    this.svg = d3.select("#hier-clus-svg")

    this.nodes = this.svg.append('g').classed('cleanable', true);
    this.links = this.svg.append('g').classed('cleanable', true);

    this.svgHeight = +this.svg.attr('height');
    this.svgWidth = +this.svg.attr('width');

    let leafXvals = [];
    let xDiff = this.svgHeight / (1 + this.numEstimators);

    for (let i = 0; i < this.numEstimators; i++) {
      leafXvals.push((1 + i) * xDiff);
    }

    let leafNodes = this.nodes.selectAll('.nodes')
    	.data(leafXvals)
	.enter()
	  .append('g')
	  .classed('node', true);

    let leafNodeAttrs = leafNodes
    			.attr('y', 0.9 * this.svgWidth)
                        .attr('x', function (d) { return d; });
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
