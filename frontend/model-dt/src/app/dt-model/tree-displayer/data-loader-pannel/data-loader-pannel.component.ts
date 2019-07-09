import { Component, OnInit, Input } from '@angular/core';
import { NgForm } from '@angular/forms';

import { PredictResults } from '../predict-results';
import { TreePredictCallerService } from './tree-predict-caller.service';

@Component({
  selector: 'app-data-loader-pannel',
  templateUrl: './data-loader-pannel.component.html',
  styleUrls: ['./data-loader-pannel.component.css']
})
export class DataLoaderPannelComponent implements OnInit {
  @Input() public datasetDim: number;
  @Input() public testInstSep: string;
  public isValidFormSubmitted: boolean;
  public testInstValues: string;
  public errorMessage: string;
  public predictResults: PredictResults;
  public readonly maxFileSize: number;
  public readonly maxFileSizeUnit: string;

  constructor(public predictor: TreePredictCallerService) {
    this.maxFileSize = 50;
    this.maxFileSizeUnit = 'MB';
  }

  ngOnInit() { 
    this.testInstValues = '';
    this.testInstSep = ',';
  }

  onFormSubmit(form: NgForm): void {
    this.isValidFormSubmitted = false;

    if (form.invalid) {
      return;
    }

    this.isValidFormSubmitted = true;
    this.testInstValues = form.controls['attrs'].value;
    this.testInstSep = form.controls['sep'].value;

    this.predictTestInstValues();
  }

  clearErrorMessage(): void {
    this.errorMessage = '';
  }

  predictTestInstValues(): void {
    let splittedValues: string[] = this.testInstValues.split(this.testInstSep);

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

}
