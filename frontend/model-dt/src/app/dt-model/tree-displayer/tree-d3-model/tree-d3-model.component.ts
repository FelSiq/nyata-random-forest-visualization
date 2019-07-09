import { Component, OnInit, OnChanges, Input } from '@angular/core';
import * as d3 from 'd3';

import { TreeInterface } from '../../../dt-interface';

@Component({
  selector: 'app-tree-d3-model',
  templateUrl: './tree-d3-model.component.html',
  styleUrls: ['./tree-d3-model.component.css']
})
export class TreeD3ModelComponent implements OnInit, OnChanges {
  @Input() treeNodes: TreeInterface[];
  public d3Model: any;
  public chosenTree: number;

  constructor() { }

  ngOnInit() { this.chosenTree = 0; }

  ngOnChanges(): void {
    if (!this.treeNodes) {
      return;
    }

    this.createTree();
  }

  private createTree(): void {
  }
}
