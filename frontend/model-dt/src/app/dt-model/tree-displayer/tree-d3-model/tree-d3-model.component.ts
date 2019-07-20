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
    this.createTree();
  }

  private initSvg() {
    this.svg = d3.select('svg');

    this.cleanSvg();

    this.links = this.svg.append('g')
        .attr('class', 'group-links');

    this.nodes = this.svg.append('g')
        .attr('class', 'group-nodes')

    this.svg.call(d3Zoom.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', () => {
        this.svg
          .attr('transform', d3.event.transform);
      }));

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
    if (this.nodes) {
      this.nodes.selectAll('*').remove();
    }

    if (this.links) {
      this.links.selectAll('*').remove();
    }
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

    this.buildNode(
        curTree,
        0,
        10,
        this.width / 2,
        this.width / 4,
        0.02 * this.height,
        0.98 * this.height / (1 + curTree.max_depth));

  }

  private generateLink(nodeAId: number,
                       nodeBId: number,
                       x1: number,
                       x2: number,
                       y1: number,
                       y2: number): void {

    this.links.append('line')
      .attr('class', 'link')
      .attr('id', 'link-' + nodeAId + '-' + nodeBId)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2)
      .style('stroke', 'rgb(64,64,64)')
      .style('stroke-width', 2);
  }

  private connectNodes(nodeAId: number, nodeBId: number): void {
    const nodeA = this.nodes.select("#node-" + nodeAId);
    const nodeB = this.nodes.select("#node-" + nodeBId);

    this.generateLink(
      nodeAId,
      nodeBId,
      nodeA.attr('cx'),
      nodeB.attr('cx'),
      nodeA.attr('cy'),
      nodeB.attr('cy'));
  }

  private generateNode(nodeId: number,
                       cx: number,
                       cy: number,
                       radius: number): void {
    this.nodes.append('circle')
      .attr('class', 'node')
      .attr('id', 'node-' + nodeId) 
      .attr('stroke', 'gray')
      .attr('fill', 'white')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', radius)
      .call(d3Drag.drag()
        .on('start', function() {
          d3.select(this)
            .raise()
            .classed('active', true)
            .attr('r', 2 * radius);
        })
        .on('end', function() {
          d3.select(this)
            .classed('active', false)
            .attr('r', radius);
        })
        .on('drag', function() {
          d3.select(this)
            .attr('cx', d3.event.x)
            .attr('cy', d3.event.y);
        }));
  }

  private buildNode(
        curTree: TreeInterface,
        nodeId: number,
        radius: number,
        cx: number,
        cxDelta: number,
        cy: number,
        cyDelta: number): void {

      const sonLeftId = +curTree.children_left[nodeId];
      const sonRightId = +curTree.children_right[nodeId];

      this.generateNode(nodeId, cx, cy, radius);

      if (sonLeftId >= 0 && sonLeftId < curTree.capacity) {
        const cxSonLeft = cx - cxDelta;
        const cySonLeft = cy + cyDelta;

        this.buildNode(
            curTree,
            sonLeftId,
            radius,
            cxSonLeft,
            cxDelta / 2,
            cySonLeft,
            cyDelta);

        this.connectNodes(nodeId, sonLeftId);
      }

      if (sonRightId >= 0 && sonRightId < curTree.capacity) {
        const cxSonRight = cx + cxDelta;
        const cySonRight = cy + cyDelta;

        this.buildNode(
            curTree,
            sonRightId,
            radius,
            cxSonRight,
            cxDelta / 2,
            cySonRight,
            cyDelta);

        this.connectNodes(nodeId, sonRightId);
      }
  }

}
