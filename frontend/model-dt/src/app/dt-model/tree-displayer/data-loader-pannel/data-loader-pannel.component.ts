import { Component, OnInit, Input } from '@angular/core';
import { PredictResults } from '../predict-results';
import { TreePredictCallerService } from './tree-predict-caller.service';

@Component({
  selector: 'app-data-loader-pannel',
  templateUrl: './data-loader-pannel.component.html',
  styleUrls: ['./data-loader-pannel.component.css']
})
export class DataLoaderPannelComponent implements OnInit {
  @Input() public datasetDim: number;
  public testInstanceValues: string;
  public errorMessage: string;
  public predictResults: PredictResults;
  public readonly maxFileSize: number;
  public readonly maxFileSizeUnit: string;

  constructor(public predictor: TreePredictCallerService) {
    this.maxFileSize = 50;
    this.maxFileSizeUnit = 'MB';
  }

  ngOnInit() { }

  updateBoxValue(values: string): void {
    this.testInstanceValues = values;
  }

  clearErrorMessage(): void {
    this.errorMessage = '';
  }

  predictTestInstanceValues(separator: string): void {
    let splittedValues: string[] = this.testInstanceValues.split(separator);

    this.clearErrorMessage();

    if (splittedValues.length === this.datasetDim) {
      this.predictor.predictSingleInstance(splittedValues)
        .subscribe((results: PredictResults) => {
          this.predictResults = { ...results };
        });
    } else {
      this.errorMessage = `
        Dimension of test instance (${splittedValues.length}) and
        dataset (${this.datasetDim}) does not match!
      `;
    }
  }

  errorHandler(): void {
    this.errorMessage = `
      Something went wrong while predicting your
      instance values. Please check the attribute
      values are correct.
    `;
  }

}
