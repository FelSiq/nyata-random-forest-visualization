import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';

import { PredictResults } from '../predict-results';
import { TreePredictCallerService } from './tree-predict-caller.service';
import { DatasetUploadService } from './dataset-upload.service';
import { forbiddenNameValidator, checkInstanceDimension } from './forbidden-symbol-validator.directive';

interface SepOption {
  symb: string;
  label: string; 
}

@Component({
  selector: 'app-data-loader-pannel',
  templateUrl: './data-loader-pannel.component.html',
  styleUrls: ['./data-loader-pannel.component.css'],
})
export class DataLoaderPannelComponent implements OnInit {
  @Input() datasetDim: number;
  isValidFormSubmitted: boolean;
  predictResults: PredictResults;
  readonly maxFileSize: number = 50;
  readonly maxFileSizeUnit: string = 'MB';
  readonly sepOptions: SepOption[] = [
    { symb: ',', label: 'Comma' },
    { symb: ' ', label: 'Blank space' },
    { symb: ';', label: 'Semicolon' },
  ];
  fileToUpload: File = null;

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

  constructor(public predictor: TreePredictCallerService,
              public fileUploadService: DatasetUploadService,
              private fb: FormBuilder) { }

  ngOnInit() { }

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

    if (splittedValues.length === this.datasetDim) {
      this.predictor.predictSingleInstance(splittedValues)
        .subscribe((results: PredictResults) => {
          this.predictResults = { ...results };
        });
    }
  }

  handleFileInput(files: FileList) {
      this.fileToUpload = files.item(0);
  }

  uploadFileToActivity() {
    this.fileUploadService.postFile(this.fileToUpload).subscribe(data => {
      // do something, if upload success
      }, error => {
        console.log(error);
      });
  }

}
