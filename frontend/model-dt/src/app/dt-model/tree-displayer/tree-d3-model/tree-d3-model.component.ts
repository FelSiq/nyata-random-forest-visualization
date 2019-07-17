import { Component, OnInit, Input, ElementRef } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Zoom from 'd3-zoom';

import { DTInterface, TreeInterface } from '../../../dt-interface';

@Component({
  selector: 'app-tree-d3-model',
  templateUrl: './tree-d3-model.component.html',
  styleUrls: ['./tree-d3-model.component.css'],
})
export class TreeD3ModelComponent implements OnInit {
  @Input() treeNodes: DTInterface[];
  chosenTree: string | number = '0';

  private svg: any;
  private width: number;
  private height: number;

  constructor(private eleRef: ElementRef) { }

  ngOnInit() { }

  changesHandler() {
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
    this.svg.selectAll("*").remove();
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
        4 + curTree.max_depth,
        this.width / 4,
        this.width / 8,
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

      const g = this.svg.append('g');

      if (sonLeft >= 0 && sonLeft < curTree.capacity) {
        g.append('line')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', cx - cxDelta)
          .attr('y2', cy + cyDelta)
          .attr('style', 'stroke:rgb(0,0,0);stroke-width:4');

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
        g.append('line')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', cx + cxDelta)
          .attr('y2', cy + cyDelta)
          .attr('style', 'stroke:rgb(64,64,64);stroke-width:4');

        this.buildNode(
            curTree,
            sonRight,
            radius - 1,
            cx + cxDelta,
            cxDelta / 2,
            cy + cyDelta,
            cyDelta);
      }

      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius);

  }

}
