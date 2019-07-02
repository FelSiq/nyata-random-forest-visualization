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
  styleUrls: ['./dt-model.component.css']
})
export class DtModelComponent implements OnInit, OnDestroy {
    public treeModel: DTInterface;
    private d3: D3;
    private parentNativeElement: any;
    private d3Svg: Selection<SVGSVGElement, any, null, undefined>;

  constructor(
      private modelService: GetModelService,
      element: ElementRef,
      private ngZone: NgZone,
      d3Service: D3Service) { 
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
  }

  ngOnInit() {
    this.getDTModel();
  }

  ngOnDestroy() {
    if (this.d3Svg.empty && !this.d3Svg.empty()) {
      this.d3Svg.selectAll('*').remove();
    }
  }

  getDTModel(): void {
    this.modelService.getDTModel()
      .subscribe((model: DTInterface ) => {
	      this.treeModel = { ...model };
      });
  }

}
