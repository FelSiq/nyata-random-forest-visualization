import { Component, OnInit, Input } from '@angular/core';
import { DTInterface } from '../../dt-interface';

@Component({
  selector: 'app-tree-displayer',
  templateUrl: './tree-displayer.component.html',
  styleUrls: ['./tree-displayer.component.css'],
})
export class TreeDisplayerComponent implements OnInit {
  @Input() treeModel: DTInterface;
  bannedModelAttrs: string[];

  constructor() { }

  ngOnInit() {
    this.bannedModelAttrs = [
      'estimators_',
      'base_estimator_',
      'tree_',
    ];
  }

}
