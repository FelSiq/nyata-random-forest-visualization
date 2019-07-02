import { Component, OnInit, Input } from '@angular/core';

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

  constructor() { }

  ngOnInit() {
    this.testInstanceValues = new Array(this.datasetDim);
    this.testInstanceValues.fill(0.0);
  }

  updateBoxValue(newValue: number, boxIndex: number): void {
    this.testInstanceValues[boxIndex] = +newValue;
    console.log(this.testInstanceValues);
  }

}
