import { Component, OnInit, AfterViewInit, Input, ElementRef } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';

import { DTInterface, TreeInterface } from '../../../dt-interface';

@Component({
  selector: 'app-tree-d3-model',
  templateUrl: './tree-d3-model.component.html',
  styleUrls: ['./tree-d3-model.component.css'],
})
export class TreeD3ModelComponent implements OnInit, AfterViewInit {
  @Input() treeNodes: DTInterface[];
  @Input() showImpurity: boolean;
  @Input() showLinkWeight: boolean;

  chosenTree: string | number;
  zoomValue: number = 0;

  readonly zoomMin: number = 0;
  readonly zoomMax: number = 3;

  private svg: any;
  private links: any;
  private nodes: any;
  private depthMarkers: any;
  private impurityColors: any;
  private width: number;
  private height: number;
  private maxImpurity: number;
  private readonly radiusMinimum: number = 8;
  private readonly radiusScaleFactor: number = 24;
  private static readonly styleColorLinkDefault = 'rgb(128, 128, 128)';
  private static readonly styleColorLinkSelected = 'rgb(0, 0, 0)';

  constructor(private eleRef: ElementRef) { }

  ngOnInit() {
    this.chosenTree = '0';
  }

  ngAfterViewInit() {
    this.changesHandler();
  }

  changesHandler(): void {
    this.initSvg();
    this.createTree();
  }

  private static formatLinkId(nodeAId: number,
                       nodeBId: number,
                       addIdHash = false): string {
    return (addIdHash ? '#' : '') + 'link-' + nodeAId + '-' + nodeBId;
  }

  private static formatNodeId(nodeId: number, addIdHash = false): string {
    return (addIdHash ? '#' : '') + 'node-' + nodeId;
  }

  updateZoomValue(increment: number): void {
    let aux = this.zoomValue + increment;
    this.zoomValue = Math.max(this.zoomMin, Math.min(aux, this.zoomMax));
  }

  private initSvg() {
    this.svg = d3.select('svg');

    this.cleanSvg();

    this.depthMarkers = this.svg.append('g')
        .classed('group-depth-markers cleanable', true);

    this.links = this.svg.append('g')
        .classed('group-links cleanable', true);

    this.nodes = this.svg.append('g')
        .classed('group-nodes cleanable', true);

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

    /*
    this.svg.call(d3Zoom.zoom()
      .scaleExtent([0.5, 3])
      .translateExtent([[0, 0], [this.width, this.height]])
      .on('zoom', () => {
        this.svg
          .attr('transform', d3.event.transform);
      }));
    */
  }

  private cleanSvg(): void {
    this.svg.selectAll('.cleanable')
      .selectAll('*').remove();
  }

  private buildDepthMarkers(x1: number,
                            x2: number,
                            yStart: number,
                            cyDelta: number,
                            maxDepth: number): void {
    let curY = yStart;

    for (let i = 0; i <= maxDepth; i++) {
      this.depthMarkers.append('line')
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', curY)
        .attr('y2', curY)
        .style('stroke', 'rgb(200,200,200)')
        .style('stroke-dasharray', ('2, 4'));

      curY += cyDelta;
    }
  }

  private createTree(): void {
    if (!this.svg || !this.treeNodes) {
      return;
    }

    const curTreeNodes = this.treeNodes[+this.chosenTree];

    if (!(curTreeNodes.hasOwnProperty('tree_'))) {
      return;
    }

    const curTree = curTreeNodes.tree_.value as TreeInterface;

    const criterion = curTreeNodes.criterion.value;

    this.maxImpurity = (
      criterion === 'gini' ? 1.0 :
      (criterion === 'entropy' ? Math.log2(curTree.maximum_number_of_classes) :
      (Math.max(...curTree.impurity))));

    this.impurityColors = d3Scale.scaleLinear<string>()
        .domain([0.0, this.maxImpurity])
        .range(['white', 'black']);

    const cxDelta = this.width / 4.05;
    const cyDelta = 0.98 * this.height / (1 + curTree.maximum_depth);
    const rootYCoord = (
        this.radiusMinimum +
        this.radiusScaleFactor +
        0.01 * this.height);

    this.buildDepthMarkers(
        0.01 * this.width,
        0.99 * this.width,
        rootYCoord,
        cyDelta,
        curTree.maximum_depth);

    this.buildNode(
        curTree,
        0,
        -1,
        0.5 * this.width,
        cxDelta,
        rootYCoord,
        cyDelta);

    if (this.showImpurity) {
      this.drawImpurity();
    }

    if (this.showLinkWeight) {
      this.drawLinkWeight();
    }

  }

  private drawImpurity(): void {
    this.nodes.selectAll('.node').append('rect')
      .classed('draggable node-label label-impurity', true)
      .attr('width', 64)
      .attr('height', function() { return +d3.select(this.parentNode).attr('appended-info-num') * 16; })
      .attr('x', function() { return +d3.select(this.parentNode).attr('cx') - 32; })
      .attr('y', function() {
          const node = d3.select(this.parentNode).select('circle');
          return +node.attr('cy') + 1.5 * +node.attr('r') - 12;
      })
      .attr('rx', 5)
      .attr('opacity', 0.7)
      .attr('fill', 'black');

    this.nodes.selectAll('.node').append('text')
      .classed('draggable node-label label-impurity', true)
      .attr('x', function() { return +d3.select(this.parentNode).attr('cx'); })
      .attr('y', function() {
          const node = d3.select(this.parentNode).select('circle');
          return +node.attr('r') * 1.5 + +node.attr('cy');
      })
      .attr('font-size', 12)
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .text( function() { return (+d3.select(this.parentNode).attr('impurity')).toFixed(2); } );
  }

  private drawLinkWeight(): void {
    this.links.selectAll('.link').append('rect')
      .classed('draggable link-label label-weight', true)
      .attr('width', 64)
      .attr('height', function() { return +d3.select(this.parentNode).attr('appended-info-num') * 16; })
      .attr('x', function() {
          const link = d3.select(this.parentNode).select('line');
          return 0.5 * (+link.attr('x2') + +link.attr('x1')) - 32;
      })
      .attr('y', function() {
          const link = d3.select(this.parentNode).select('line');
          return 0.5 * (+link.attr('y2') + +link.attr('y1')) - 12;
      })
      .attr('rx', 5)
      .attr('opacity', 0.5)
      .attr('fill', 'red');

    this.links.selectAll('.link').append('text')
      .classed('draggable link-label label-weight', true)
      .attr('x', function() {
          const link = d3.select(this.parentNode).select('line');
          return 0.5 * (+link.attr('x2') + +link.attr('x1'));
      })
      .attr('y', function() {
          const link = d3.select(this.parentNode).select('line');
          return 0.5 * (+link.attr('y2') + +link.attr('y1'));
      })
      .attr('font-size', 12)
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .text( function() { return ((100 * +d3.select(this.parentNode).attr('weight'))).toFixed(1) + '%'; } );
  }

  private toggleImpurity(): void {
    if (!this.showImpurity) {
      this.drawImpurity();
    } else {
      this.nodes.selectAll('.label-impurity')
        .remove();
    }

    this.showImpurity = !this.showImpurity;
  }

  private toggleLinkWeight(): void {
    if (!this.showLinkWeight) {
      this.drawLinkWeight();
    } else {
      this.links.selectAll('.label-weight')
        .remove();
    }

    this.showLinkWeight = !this.showLinkWeight;
  }
  private connectNodes(nodeAId: number, nodeBId: number): void {
    const nodeA = this.nodes.select(TreeD3ModelComponent.formatNodeId(nodeAId, true));
    const nodeB = this.nodes.select(TreeD3ModelComponent.formatNodeId(nodeBId, true));

    this.links.append('g')
      .classed('link', true)
      .attr('id', TreeD3ModelComponent.formatLinkId(nodeAId, nodeBId))
      .attr('appended-info-num', 1)
      .attr('weight', +nodeB.attr('num-inst') / +nodeA.attr('num-inst'))
      .append('line')
        .attr('x1', nodeA.attr('cx'))
        .attr('x2', nodeB.attr('cx'))
        .attr('y1', nodeA.attr('cy'))
        .attr('y2', nodeB.attr('cy'))
        .style('stroke-width', 2)
        .style('stroke', TreeD3ModelComponent.styleColorLinkDefault);
  }

  private generateNode(nodeId: number,
                       impurity: number,
                       numInstInNode: number,
                       cx: number,
                       cy: number,
                       radius: number,
                       parentId: number,
                       sonLeftId: number,
                       sonRightId: number): void {
    const g = this.nodes.append('g')
      .classed('node', true)
      .style('cursor', 'move')
      .attr('id', TreeD3ModelComponent.formatNodeId(nodeId)) 
      .attr('index', nodeId)
      .attr('sonLeftId', sonLeftId)
      .attr('sonRightId', sonRightId)
      .attr('parentId', parentId)
      .attr('appended-info-num', 1)
      .attr('impurity', impurity)
      .attr('num-inst', numInstInNode)
      .attr('cx', cx)
      .attr('cy', cy)
      .call(d3Drag.drag()
        .on('start', function() {
          const node = d3.select(this);
          const circle = node.select('circle');

          const nodeId = +node.attr('index');
          const parentId = +node.attr('parentId');
          const sonLeftId = +node.attr('sonLeftId');
          const sonRightId = +node.attr('sonRightId');

          d3.select('.group-nodes').append('circle')
            .classed('node placeholder-node', true)
            .attr('id', 'placeholder-node-' + nodeId)
            .attr('r', 1.1 * +circle.attr('r'))
            .attr('cx', circle.attr('cx'))
            .attr('cy', circle.attr('cy'))
            .attr('fill', 'none')
            .style('stroke', 'gray')
            .style('stroke-width', 1)
            .style('stroke-dasharray', ('3, 3'));

          node
            .raise()
            .classed('node-active', true)

          circle
            .attr('r', 1.1 * radius);

          d3.selectAll([
                TreeD3ModelComponent.formatLinkId(nodeId, sonLeftId, true),
                TreeD3ModelComponent.formatLinkId(nodeId, sonRightId, true),
                TreeD3ModelComponent.formatLinkId(parentId, nodeId, true),
            ].join(','))
              .classed('link-active', true)
              .select('line')
              .style('stroke', TreeD3ModelComponent.styleColorLinkSelected);
        })
        .on('end', function() {
          const node = d3.select(this);
          const circle = node.select('circle');

          const nodeId = +node.attr('index');
          const parentId = +node.attr('parentId');
          const sonLeftId = +node.attr('sonLeftId');
          const sonRightId = +node.attr('sonRightId');

          node
            .classed('node-active', false)

          circle
            .attr('r', radius);

          d3.select('#placeholder-node-' + nodeId)
            .remove();

          d3.selectAll([
                TreeD3ModelComponent.formatLinkId(nodeId, sonLeftId, true),
                TreeD3ModelComponent.formatLinkId(nodeId, sonRightId, true),
                TreeD3ModelComponent.formatLinkId(parentId, nodeId, true),
            ].join(','))
              .classed('link-active', false)
              .select('line')
              .style('stroke', TreeD3ModelComponent.styleColorLinkDefault);
        })
        .on('drag', function() {
          const node = d3.select(this);
          const circle = node.select('circle');

          const nodeId = +node.attr('index');
          const parentId = +node.attr('parentId');
          const sonLeftId = +node.attr('sonLeftId');
          const sonRightId = +node.attr('sonRightId');

          const linkA = TreeD3ModelComponent.formatLinkId(nodeId, sonLeftId, true);
          const linkB = TreeD3ModelComponent.formatLinkId(nodeId, sonRightId, true);
          const linkC = TreeD3ModelComponent.formatLinkId(parentId, nodeId, true);

          node
            .attr('cx', d3.event.x)
            .attr('cy', d3.event.y);

          node.selectAll('.draggable')
            .attr('cx', function() { return +d3.select(this).attr('cx') + d3.event.dx; })
            .attr('cy', function() { return +d3.select(this).attr('cy') + d3.event.dy; })
            .attr('x', function() { return +d3.select(this).attr('x') + d3.event.dx; })
            .attr('y', function() { return +d3.select(this).attr('y') + d3.event.dy; });

          d3.selectAll([linkA, linkB].join(','))
              .select('line')
                .attr('x1', circle.attr('cx'))
                .attr('y1', circle.attr('cy'));

          d3.select(linkC)
            .select('line')
              .attr('x2', circle.attr('cx'))
              .attr('y2', circle.attr('cy'));

          d3.selectAll([linkA, linkB, linkC].join(','))
            .selectAll('.draggable')
              .attr('cx', function() { return +d3.select(this).attr('cx') + d3.event.dx; })
              .attr('cy', function() { return +d3.select(this).attr('cy') + d3.event.dy; })
              .attr('x', function() { return +d3.select(this).attr('x') + d3.event.dx; })
              .attr('y', function() { return +d3.select(this).attr('y') + d3.event.dy; });
        }));

    g.append('circle')
      .classed('draggable', true)
      .attr('stroke', 'gray')
      .attr('fill', this.impurityColors(impurity))
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', radius)
      .on('mouseenter', function() {
        const node = d3.select(this);

        node.attr('stroke-width', 2)
            .attr('stroke', 'rgb(96,96,96)');

        d3.select('#node-info-pannel')
          .attr('selected-node', node.attr('index'));
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('stroke', 'gray');

        d3.select('#node-info-pannel')
          .attr('selected-node', -1);
      });
  }

  private buildNode(
        curTree: TreeInterface,
        nodeId: number,
        parentId: number,
        cx: number,
        cxDelta: number,
        cy: number,
        cyDelta: number): void {

      const sonLeftId = +curTree.children_left[nodeId];
      const sonRightId = +curTree.children_right[nodeId];
      const impurity = +curTree.impurity[nodeId];
      const numInstInNode = +curTree.weighted_number_of_node_samples[nodeId];

      const radius = (
        this.radiusMinimum +
        this.radiusScaleFactor *
        (numInstInNode /
        +curTree.weighted_number_of_node_samples[0]));

      this.generateNode(
          nodeId,
          impurity,
          numInstInNode,
          cx,
          cy,
          radius,
          parentId,
          sonLeftId,
          sonRightId);

      if (sonLeftId >= 0 && sonLeftId < curTree.capacity) {
        const cxSonLeft = cx - cxDelta;
        const cySonLeft = cy + cyDelta;

        this.buildNode(
            curTree,
            sonLeftId,
            nodeId,
            cxSonLeft,
            0.5 * cxDelta,
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
            nodeId,
            cxSonRight,
            0.5 * cxDelta,
            cySonRight,
            cyDelta);

        this.connectNodes(nodeId, sonRightId);
      }
  }

}
