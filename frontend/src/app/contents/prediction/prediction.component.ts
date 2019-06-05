import { Component, OnInit, ViewChild } from '@angular/core';
import { DashService } from '../../dash.service';
import { PredConf } from '../../pred-conf';
import { Pred, FormPred} from '../../atomos';
import {MatTableModule} from '@angular/material/table';
import {MatTable} from '@angular/material';

@Component({
  selector: 'app-prediction',
  templateUrl: './prediction.component.html',
  styleUrls: ['./prediction.component.scss']
})

export class PredictionComponent implements OnInit {
  predConf: PredConf[];
  dataSource: Pred[];
  displayedColumns: string[] = ['formula', 'glass_property', 'ml_algorithm', 'value'];

  @ViewChild(MatTable) table: MatTable<any>;

  constructor(private dashService: DashService) { }

  ngOnInit() {
    this.getPredConfig();
    this.dataSource = [];
  }

  getPredConfig(): void {
    this.dashService.getPredConfig()
    .subscribe(predConf => this.predConf = predConf);
  }

  save(): void {
    console.log(this.predConf);
    console.log(this.dataSource);
  }

  predict(formula: string, glass_property: string, ml_algorithm: string) {

    if (!formula) { return; }
    if (!glass_property) { return; }
    if (!ml_algorithm) { return; }
    console.log(formula);
    console.log(glass_property);
    console.log(ml_algorithm);
    this.dashService.predFormula({ formula, glass_property, ml_algorithm } as FormPred)
    .subscribe(pred => this.dataSource.push(pred));
    console.log(this.dataSource);
  }

  refresh(): void {
    // this.changeDetectorRef.detectChanges();
    this.table.renderRows();
   // dataSource.renderRows()
  }
  clear(): void {
    this.dataSource = [];
    // this.refresh();
  }
}
