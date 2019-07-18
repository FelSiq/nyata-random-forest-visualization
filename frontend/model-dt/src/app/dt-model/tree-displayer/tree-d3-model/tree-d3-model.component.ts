import { Component, OnInit, Input, ElementRef } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';

import { DTInterface, TreeInterface } from '../../../dt-interface';

@Component({
  selector: 'app-tree-d3-model',
  templateUrl: './tree-d3-model.component.html',
  styleUrls: ['./tree-d3-model.component.css'],
})
export class TreeD3ModelComponent implements OnInit {
  @Input() treeNodes: DTInterface[];
  chosenTree: string | number;

  /**
  To read:
  https://github.com/d3/d3-zoom
  https://bl.ocks.org/mbostock/3127661b6f13f9316be745e77fdfb084

  https://github.com/d3/d3-drag
  https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048

  https://github.com/d3/d3-force
  https://bl.ocks.org/mbostock/2675ff61ea5e063ede2b5d63c08020c7
  https://bl.ocks.org/mbostock/f584aa36df54c451c94a9d0798caed35

  https://github.com/d3/d3-brush
  https://bl.ocks.org/mbostock/0d20834e3d5a46138752f86b9b79727e

  https://bl.ocks.org/mbostock/3680999

  */

  private svg: any;
  private links: any;
  private nodes: any;
  private width: number;
  private height: number;

  constructor(private eleRef: ElementRef) { }

  ngOnInit() {
    this.chosenTree = '0';
    this.changesHandler();
  }

  changesHandler(): void {
    this.initSvg();
    this.cleanSvg();
    this.createTree();
  }

  private initSvg() {
    this.svg = d3.select('svg');

    this.width = (
        +this.svg.attr('width') ?
        +this.svg.attr('width') :
        this.eleRef.nativeElement.offsetWidth
    );
    this.height = (
        +this.svg.attr('height') ?
        +this.svg.attr('height') :
        this.eleRef.nativeElement.offsetHeight
    );
  }

  private cleanSvg(): void {
    this.svg.selectAll('*').remove();
  }

  private createTree(): void {

    if (!this.svg || !this.treeNodes) {
      return;
    }

    const chosenTree = +this.chosenTree;
    const curTreeNodes = this.treeNodes[chosenTree];

    if (!(curTreeNodes.hasOwnProperty('tree_'))) {
      return;
    }

    const curTree = curTreeNodes.tree_.value as TreeInterface;

    this.links = this.svg.append('g')
        .attr('class', 'group-links');

    this.nodes = this.svg.append('g')
        .attr('class', 'group-nodes')

    this.buildNode(
        curTree,
        0,
        4 + curTree.max_depth,
        this.width / 2,
        this.width / 4,
        0.02 * this.height,
        0.98 * this.height / (1 + curTree.max_depth));

  }

  private buildNode(
        curTree: TreeInterface,
        nodeId: number,
        radius: number,
        cx: number,
        cxDelta: number,
        cy: number,
        cyDelta: number): void {

      const sonLeft = curTree.children_left[nodeId];
      const sonRight = curTree.children_right[nodeId];

      this.nodes.append('circle')
        .attr('class', 'node')
        .attr('id', 'node-' + nodeId) 
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .call(d3Drag.drag()
          .on('start', function() {
            d3.select(this)
              .raise()
              .classed('active', true);
          })
          .on('end', function() {
            d3.select(this)
              .classed('active', false);
          })
          .on('drag', function() {
            d3.select(this)
              .attr('cx', d3.event.x)
              .attr('cy', d3.event.y);
          }));

      if (sonLeft >= 0 && sonLeft < curTree.capacity) {
        this.links.append('line')
          .attr('class', 'link')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', cx - cxDelta)
          .attr('y2', cy + cyDelta)
          .style('stroke', 'rgb(64,64,64)')
          .style('stroke-width', 4);

        this.buildNode(
            curTree,
            sonLeft,
            radius - 1,
            cx - cxDelta,
            cxDelta / 2,
            cy + cyDelta,
            cyDelta);
      }

      if (sonRight >= 0 && sonRight < curTree.capacity) {
        this.links.append('line')
          .attr('class', 'link')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', cx + cxDelta)
          .attr('y2', cy + cyDelta)
          .style('stroke', 'rgb(64,64,64)')
          .style('stroke-width', 4);

        this.buildNode(
            curTree,
            sonRight,
            radius - 1,
            cx + cxDelta,
            cxDelta / 2,
            cy + cyDelta,
            cyDelta);
      }
  }

}
