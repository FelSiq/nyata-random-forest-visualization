import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs-compat';

import { DTInterface } from '../../dt-interface';
import { PredictResults } from './predict-results';
import { SingleInstRestEmitterInterface } from './data-loader-pannel/data-loader-pannel.component';

@Component({
  selector: 'app-tree-displayer',
  templateUrl: './tree-displayer.component.html',
  styleUrls: ['./tree-displayer.component.css'],
})
export class TreeDisplayerComponent implements OnInit {
  @Input() treeModel: DTInterface;
  predictResults: PredictResults;
  singleInstAttrs: Array<string | number>;
  attrNames: string[];
  updateTreeSignalSubject: Subject<number | string> = new Subject<number | string>();

  readonly bannedModelAttrs: string[] = [
    'estimators_',
    'base_estimator',
    'tree_',
    'verbose',
  ];

  constructor() { }

  ngOnInit() {
  }

  updateChosenTree(treeId: string | number) {
    this.updateTreeSignalSubject.next(treeId);
  }

  updatePredictionResults(value: SingleInstRestEmitterInterface): void {
    if (value) {
      this.predictResults = { ...value['predictResults'] };
      this.singleInstAttrs = value['singleInstAttrs'];
      this.attrNames = null;

    } else {
      this.predictResults = null;
      this.singleInstAttrs = null;
      this.attrNames = null;
    }
  }

}
