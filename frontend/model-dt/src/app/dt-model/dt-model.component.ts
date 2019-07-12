import { Component, OnInit, OnDestroy, ElementRef, NgZone } from '@angular/core';
import { GetModelService } from '../get-model.service';
import { DTInterface } from '../dt-interface';
import {
  D3Service,
  D3,
  Axis,
  BrushBehavior,
  BrushSelection,
  D3BrushEvent,
  ScaleLinear,
  ScaleOrdinal,
  Selection,
  Transition
} from 'd3-ng2-service';

@Component({
  selector: 'app-dt-model',
  templateUrl: './dt-model.component.html',
  styleUrls: ['./dt-model.component.css'],
})
export class DtModelComponent implements OnInit, OnDestroy {
    treeModel: DTInterface;
    private d3: D3;

  constructor(
      private modelService: GetModelService,
      element: ElementRef,
      private ngZone: NgZone,
      d3Service: D3Service) { 
  }

  ngOnInit() {
    this.getDTModel();
  }

  ngOnDestroy() { }

  getDTModel(): void {
    this.modelService.getDTModel()
      .subscribe((model: DTInterface ) => {
	      this.treeModel = { ...model };
      });
  }

}
