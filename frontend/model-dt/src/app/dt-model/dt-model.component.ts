import { Component, OnInit, OnDestroy } from '@angular/core';

import { GetModelService } from '../get-model.service';
import { DTInterface } from '../dt-interface';

@Component({
  selector: 'app-dt-model',
  templateUrl: './dt-model.component.html',
  styleUrls: ['./dt-model.component.css'],
})
export class DtModelComponent implements OnInit {
    treeModel: DTInterface;

  constructor(private modelService: GetModelService) { 
  }

  ngOnInit() {
    this.getDTModel();
  }

  ngOnDestroy() {
    this.modelService.destroy();
  }

  getDTModel(): void {
    this.modelService.getDTModel()
      .subscribe((model: DTInterface ) => {
	      this.treeModel = { ...model };
      });
  }

}
