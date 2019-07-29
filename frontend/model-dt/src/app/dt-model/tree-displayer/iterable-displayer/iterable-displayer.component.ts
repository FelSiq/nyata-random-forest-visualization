import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-iterable-displayer',
  templateUrl: './iterable-displayer.component.html',
  styleUrls: ['./iterable-displayer.component.css'],
})
export class IterableDisplayerComponent implements OnInit {
  @Input() banList: string[];
  @Input() data: object;

  readonly noDescMsg: string = 'No description found for this item.';

  constructor() { }

  ngOnInit() {
  }

  format(label: string): string {
    return label.split('_').filter(this.filterEmpty).join(' ');
  }

  filterEmpty(item): boolean {
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
    return this.banList.indexOf(attr) > -1;
  }

  isElegibleAttr(key: string,
                 value: boolean | number | string): boolean | number | string {
    return (
      !this.isBannedAttr(key) &&
      (value ||
       value === 0 ||
       value === false)
    );
  }

}
