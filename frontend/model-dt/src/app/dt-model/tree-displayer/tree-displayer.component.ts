import { Component, OnInit, Input } from '@angular/core';

import { DTInterface } from '../../dt-interface';
import { PredictResults } from './predict-results';

@Component({
  selector: 'app-tree-displayer',
  templateUrl: './tree-displayer.component.html',
  styleUrls: ['./tree-displayer.component.css'],
})
export class TreeDisplayerComponent implements OnInit {
  @Input() treeModel: DTInterface;
  predictResults: PredictResults;

  readonly bannedModelAttrs: string[] = [
    'estimators_',
    'base_estimator_',
    'tree_',
    'verbose',
  ];

  constructor() { }

  ngOnInit() {
  }

  updatePredictionResults(value: PredictResults) {
    if (value) {
      this.predictResults = { ...value };
    } else {
      this.predictResults = undefined;
    }
  }

}
