import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-instance-bar',
  templateUrl: './instance-bar.component.html',
  styleUrls: ['./instance-bar.component.css'],
})
export class InstanceBarComponent implements OnInit {
  attributes: Array<number | string> = [];

  constructor() { }

  ngOnInit() {
  }

}
