import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatRadioModule, MatInputModule } from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button'; 
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DtModelComponent } from './dt-model/dt-model.component';

import { D3Service } from 'd3-ng2-service';
import { InstanceBarComponent } from './instance-bar/instance-bar.component';
import { TreeDisplayerComponent } from './dt-model/tree-displayer/tree-displayer.component';
import { DataLoaderPannelComponent } from './dt-model/tree-displayer/data-loader-pannel/data-loader-pannel.component';
import { TreeD3ModelComponent } from './dt-model/tree-displayer/tree-d3-model/tree-d3-model.component';
import { ForbiddenSymbolValidatorDirective } from './dt-model/tree-displayer/data-loader-pannel/forbidden-symbol-validator.directive';


@NgModule({
  declarations: [
    AppComponent,
    DtModelComponent,
    InstanceBarComponent,
    TreeDisplayerComponent,
    DataLoaderPannelComponent,
    TreeD3ModelComponent,
    ForbiddenSymbolValidatorDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatCardModule,
  ],
  providers: [D3Service],
  bootstrap: [AppComponent],
})
export class AppModule { }
