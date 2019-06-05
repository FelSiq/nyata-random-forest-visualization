import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-visual-analysis',
  templateUrl: './visual-analysis.component.html',
  styleUrls: ['./visual-analysis.component.scss']
})
export class VisualAnalysisComponent implements OnInit {

  dash_app = 'http://127.0.0.1:8050/';
  constructor() { }

  ngOnInit() {
  }

}
