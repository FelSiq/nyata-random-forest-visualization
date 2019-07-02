import { Component, OnInit, Input } from '@angular/core';
import { PredictResults } from '../predict-results';
import { TreePredictCallerService } from './tree-predict-caller.service';

@Component({
  selector: 'app-data-loader-pannel',
  templateUrl: './data-loader-pannel.component.html',
  styleUrls: ['./data-loader-pannel.component.css']
})
export class DataLoaderPannelComponent implements OnInit {
  public testInstanceValues: number[];
  @Input() public datasetDim: number;
  public maxFileSize: number = 50;
  public maxFileSizeUnit: string = 'MB';
  public predictResults: PredictResults;

  constructor(public predictor: TreePredictCallerService) { }

  ngOnInit() {
    this.testInstanceValues = new Array(this.datasetDim);
    this.testInstanceValues.fill(0.0);
  }

  updateBoxValue(newValue: number, boxIndex: number): void {
    this.testInstanceValues[boxIndex] = +newValue;
    console.log(this.testInstanceValues);
  }

  predictTestInstanceValues(): void {
    this.predictor.predictSingleInstance(this.testInstanceValues)
      .subscribe((results: PredictResults) => {
        this.predictResults = { ...results };
      });
  }

}
