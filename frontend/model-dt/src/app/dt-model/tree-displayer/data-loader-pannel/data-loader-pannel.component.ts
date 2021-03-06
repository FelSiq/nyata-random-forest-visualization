import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PredictResults } from '../predict-results';
import { TreePredictCallerService } from './tree-predict-caller.service';
import { DatasetUploadService } from './dataset-upload.service';
import { forbiddenNameValidator, checkInstanceDimension } from './forbidden-symbol-validator.directive';

interface SepOption {
  symb: string;
  label: string; 
}

export interface SingleInstRestEmitterInterface {
  singleInstAttrs?: Array<number | string>;
  predictResults: PredictResults;
}

@Component({
  selector: 'app-data-loader-pannel',
  templateUrl: './data-loader-pannel.component.html',
  styleUrls: ['./data-loader-pannel.component.css'],
})
export class DataLoaderPannelComponent implements OnInit, OnDestroy {
  @Input() datasetDim: number;
  @Output() resultsEmitter = new EventEmitter<SingleInstRestEmitterInterface>();
  predictResults: PredictResults;
  isValidFormSubmitted: boolean;
  calledPredictService = false;
  fileToUpload: File = null;
  datasetErrorLogs: string[] = [];
  datasetHasHeader = false;
  datasetHasClasses = true;
  datasetSep = ',';

  private snackBarDurationInSecs = 5;
  readonly maxFileSize: number = 50;
  readonly maxFileSizeUnit: string = 'MB';
  readonly sepOptions: SepOption[] = [
    { symb: ',', label: 'Comma' },
    { symb: ' ', label: 'Blank space' },
    { symb: ';', label: 'Semicolon' },
  ];

  testInstForm = this.fb.group({
    sep: [',', [ Validators.required ]],
    customSep: [
        '',
        forbiddenNameValidator(
          new RegExp(this.sepOptions
            .map(item => item.symb).join('|'), 'i')),
    ],
    attrs: ['', [ ]],
  });

  readonly predicResultsBanAttrs: string[] = [
    'decision_path',
    'leaf_id',
  ];

  constructor(public predictor: TreePredictCallerService,
              public fileUploadService: DatasetUploadService,
              private fb: FormBuilder,
              private _snackBar: MatSnackBar) { }

  ngOnInit() { }

  ngOnDestroy() {
    this.cleanPredictResults();
    this.predictor.destroy();
    this.fileUploadService.destroy();
  }

  private showCopiedSnackBar(): void {
    this._snackBar.open(
      'Successfully copied attributes to clipboard.',
      'Ok',
      {
        duration: 1000 * this.snackBarDurationInSecs,
      });


    if (this.snackBarDurationInSecs > 1) {
      // Decrease snack bar duration to prevent user get bored of
      // the same message over and over again
      this.snackBarDurationInSecs -= 1;
    }
  }

  cleanTestInstAttr(): void {
    this.testInstForm.get('attrs').setValue('');
  }

  validateTestInstAttr(): void {
    this.testInstForm
      .controls['attrs']
      .setValidators([
        Validators.required,
        checkInstanceDimension(
          this.testInstForm.value['attrs'],
          this.testInstForm.value['sep'],
          this.datasetDim),
    ]);

    this.testInstForm.get('attrs').updateValueAndValidity();
  }

  predictTestInstValues(): void {
    const formAttrs = this.testInstForm.value['attrs'];
    const formSep = this.testInstForm.value['sep'];

    const splittedValues: string[] = formAttrs.split(formSep);

    this.predictResults = null;

    if (splittedValues.length === this.datasetDim) {
      this.calledPredictService = true;

      this.predictor.predictSingleInstance(splittedValues)
        .subscribe((results: PredictResults) => {
            this.predictResults = { ...results };
            this.calledPredictService = false;
            this.resultsEmitter.emit({
              singleInstAttrs: splittedValues,
              predictResults: this.predictResults,
            });
          }, error => {
            this.predictResults = {
              'error': { 'value': error },
            };
            this.calledPredictService = false;
            this.resultsEmitter.emit({
              singleInstAttrs: null,
              predictResults: this.predictResults,
            });
          });
    }
  }

  handleFileInput(files: FileList) {
    this.datasetErrorLogs = [];

    this.fileToUpload = files.item(0);

    const fileSize = +this.fileToUpload.size / 1024 / 1024;
    const fileType = this.fileToUpload.type;

    if (fileSize > 50) {
      this.datasetErrorLogs.push(
        'This file is too large! (size: ' + fileSize.toFixed(2) + 'MB)'
      );
    }

    if (this.fileToUpload.type !== 'text/csv') {
      this.datasetErrorLogs.push(
        "The file must be a '.csv' text file! (received type: " +
        (fileType ? fileType : 'unknown') + ')'
      );
    }

    if (this.datasetErrorLogs.length) {
      this.fileToUpload = null;
    }
  }

  uploadDatasetToPredict(): void {
    if (!this.fileToUpload) {
      return;
    }

    this.predictResults = null;
    this.calledPredictService = true;

    this.fileUploadService.postFile(
          this.fileToUpload,
          this.datasetSep,
          this.datasetHasHeader,
          this.datasetHasClasses)
          .subscribe((results: PredictResults) => {
              this.predictResults = { ...results };
              this.calledPredictService = false;
              this.resultsEmitter.emit({
                predictResults: this.predictResults,
              });
            }, error => {
              this.predictResults = {
                'error': { 'value': error },
              };
              this.calledPredictService = false;
              this.resultsEmitter.emit({
                predictResults: this.predictResults,
              });
            });
  }

  cleanPredictResults(): void {
    this.predictResults = null;
    this.calledPredictService = false;
    this.resultsEmitter.emit(null);
  }

  private toggleDatasetOptions(prop): void {
    if (this.hasOwnProperty(prop)) {
      this[prop] = !this[prop];
    }
  }

}
