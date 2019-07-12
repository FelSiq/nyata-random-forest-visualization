import { Component, OnInit, Input } from '@angular/core';
import { DTInterface } from '../../dt-interface';

@Component({
  selector: 'app-tree-displayer',
  templateUrl: './tree-displayer.component.html',
  styleUrls: ['./tree-displayer.component.css'],
})
export class TreeDisplayerComponent implements OnInit {
  curOption: number;
  buttons: string[];
  @Input() treeModel: DTInterface;

  constructor() { }

  ngOnInit() {
    this.curOption = 0;
    this.buttons = [
        'Model information',
        'Predict',
        'Train statistics',
        'Notes',
    ];
  }

  updateOption(newOption: number) {
    this.curOption = newOption;
  }

}
