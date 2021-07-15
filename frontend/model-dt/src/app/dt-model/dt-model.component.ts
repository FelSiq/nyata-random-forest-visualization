import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

import { GetModelService } from '../get-model.service';
import { DTInterface } from '../dt-interface';
import { ModelLoaderService } from './model-loader.service';

@Component({
  selector: 'app-dt-model',
  templateUrl: './dt-model.component.html',
  styleUrls: ['./dt-model.component.css'],
})
export class DtModelComponent implements OnDestroy {
  treeModel: DTInterface = null;

  constructor(private getModelService: GetModelService, private postModelService: ModelLoaderService) { 
  }

  postModelOnSession(modelPickle) {
    console.log(modelPickle);
    this.postModelService.postFile(modelPickle)
      .subscribe(() => {this.getDTModel()});
  }

  /*
  ngOnInit() {
    this.getDTModel();
  }
 */

  ngOnDestroy() {
    this.getModelService.destroy();
  }

  @HostListener('window:beforeunload')
  cleanBackendDataBeforeUnload() {
    this.getModelService.destroy();
    this.postModelService.destroy();
  }

  @HostListener('window:unload')
  cleanBackendDataUnload() {
    this.getModelService.destroy();
    this.postModelService.destroy();
  }

  getDTModel(): void {
    this.getModelService.getDTModel()
      .subscribe((model: DTInterface ) => {
	      this.treeModel = { ...model };
      });
  }

}
