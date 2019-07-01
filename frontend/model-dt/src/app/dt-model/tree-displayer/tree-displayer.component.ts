import { Component, OnInit, Input } from '@angular/core';
import { DTInterface } from '../../dt-interface';

interface Button {
  label: string;
  id: number;
}

@Component({
  selector: 'app-tree-displayer',
  templateUrl: './tree-displayer.component.html',
  styleUrls: ['./tree-displayer.component.css']
})
export class TreeDisplayerComponent implements OnInit {
  public curOption: number;
  public buttons: Button[];
  @Input() public treeModel: DTInterface;

  constructor() { }

  ngOnInit() {
    this.curOption = 0;
    this.buttons = [
        { label: 'Tree Information', id: 0},
        { label: 'Test Instance', id: 1},
        { label: 'Train statistics', id: 2},
    ];
  }

  updateOption(newOption: number) {
    this.curOption = newOption;
  }

}
