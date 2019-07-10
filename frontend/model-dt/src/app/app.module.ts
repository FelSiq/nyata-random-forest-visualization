import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MdRadioModule } from '@angular/material';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DtModelComponent } from './dt-model/dt-model.component';

import { D3Service } from 'd3-ng2-service';
import { InstanceBarComponent } from './instance-bar/instance-bar.component';
import { TreeDisplayerComponent } from './dt-model/tree-displayer/tree-displayer.component';
import { DataLoaderPannelComponent } from './dt-model/tree-displayer/data-loader-pannel/data-loader-pannel.component';
import { TreeD3ModelComponent } from './dt-model/tree-displayer/tree-d3-model/tree-d3-model.component';


@NgModule({
  declarations: [
    AppComponent,
    DtModelComponent,
    InstanceBarComponent,
    TreeDisplayerComponent,
    DataLoaderPannelComponent,
    TreeD3ModelComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
  ],
  providers: [D3Service],
  bootstrap: [AppComponent],
})
export class AppModule { }
