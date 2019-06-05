import { Component, OnInit } from '@angular/core';
import { DashService } from '../../dash.service';
import { Config } from '../../config';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  providers: [ DashService ]
})

export class StartComponent implements OnInit {

  constructor(private dashService: DashService) { }

  ngOnInit() {
  }


}
