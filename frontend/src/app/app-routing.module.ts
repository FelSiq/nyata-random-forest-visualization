import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VisualAnalysisComponent } from './contents/visual-analysis/visual-analysis.component';
import { StartComponent } from './contents/start/start.component';
import { StatisticalAnalysisComponent } from './contents/statistical-analysis/statistical-analysis.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { PredictionComponent } from './contents/prediction/prediction.component';

const routes: Routes = [
  { path: '', redirectTo: 'start', pathMatch: 'full' },
  // { path: '**',  component: NotfoundComponent },
  { path: 'visual-analysis', component: VisualAnalysisComponent },
  { path: 'prediction', component:  PredictionComponent},
  { path: 'statistical-analysis', component: StatisticalAnalysisComponent },
  { path: 'start', component: StartComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
