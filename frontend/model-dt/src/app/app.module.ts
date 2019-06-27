import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DtModelComponent } from './dt-model/dt-model.component';

import { D3Service } from 'd3-ng2-service';


@NgModule({
  declarations: [
    AppComponent,
    DtModelComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [D3Service],
  bootstrap: [AppComponent],
})
export class AppModule { }
