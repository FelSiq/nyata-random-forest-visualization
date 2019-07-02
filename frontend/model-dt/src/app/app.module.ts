import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DtModelComponent } from './dt-model/dt-model.component';

import { D3Service } from 'd3-ng2-service';
import { InstanceBarComponent } from './instance-bar/instance-bar.component';
import { TreeDisplayerComponent } from './dt-model/tree-displayer/tree-displayer.component';
import { DataLoaderPannelComponent } from './dt-model/tree-displayer/data-loader-pannel/data-loader-pannel.component';


@NgModule({
  declarations: [
    AppComponent,
    DtModelComponent,
    InstanceBarComponent,
    TreeDisplayerComponent,
    DataLoaderPannelComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [D3Service],
  bootstrap: [AppComponent],
})
export class AppModule { }
