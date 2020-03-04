import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button'; 
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ClipboardModule } from 'ngx-clipboard';
import { D3Service } from 'd3-ng2-service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DtModelComponent } from './dt-model/dt-model.component';
import { TreeDisplayerComponent } from './dt-model/tree-displayer/tree-displayer.component';
import { DataLoaderPannelComponent } from './dt-model/tree-displayer/data-loader-pannel/data-loader-pannel.component';
import { TreeD3ModelComponent } from './dt-model/tree-displayer/tree-d3-model/tree-d3-model.component';
import { ForbiddenSymbolValidatorDirective } from './dt-model/tree-displayer/data-loader-pannel/forbidden-symbol-validator.directive';
import { IterableDisplayerComponent } from './dt-model/tree-displayer/iterable-displayer/iterable-displayer.component';
import { ForestAnalysisComponent } from './dt-model/tree-displayer/forest-analysis/forest-analysis.component';


@NgModule({
  declarations: [
    AppComponent,
    DtModelComponent,
    TreeDisplayerComponent,
    DataLoaderPannelComponent,
    TreeD3ModelComponent,
    ForbiddenSymbolValidatorDirective,
    IterableDisplayerComponent,
    ForestAnalysisComponent,
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
    MatExpansionModule,
    MatTabsModule,
    MatGridListModule,
    MatSidenavModule,
    MatTooltipModule,
    MatListModule, 
    MatIconModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatSnackBarModule,
    ClipboardModule,
  ],
  providers: [D3Service],
  bootstrap: [AppComponent],
})
export class AppModule { }
