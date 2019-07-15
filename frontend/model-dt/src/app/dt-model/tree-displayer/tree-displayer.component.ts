import { Component, OnInit, Input } from '@angular/core';
import { DTInterface } from '../../dt-interface';

@Component({
  selector: 'app-tree-displayer',
  templateUrl: './tree-displayer.component.html',
  styleUrls: ['./tree-displayer.component.css'],
})
export class TreeDisplayerComponent implements OnInit {
  @Input() treeModel: DTInterface;
  bannedModelAttrs: string[];

  constructor() { }

  ngOnInit() {
    this.bannedModelAttrs = [
      'estimators_',
    ];
  }

  filter_empty(item): boolean {
    return item === 0 || item;
  }

  isSingleValue(item): boolean {
    return (
      (typeof item === 'string') || (item instanceof String) ||
      (typeof item === 'number') || (item instanceof Number) ||
      (typeof item === 'boolean') || (item instanceof Boolean)
    );
  }

  isBannedAttr(attr: string): boolean {
    return this.bannedModelAttrs.indexOf(attr) > -1;
  }
}
