import { Component, OnInit, Input, ElementRef, ViewChild} from '@angular/core';

import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';


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

  public captureScreen(id: string, pdfName: string = 'item.pdf'): void {
    const data = document.getElementById(id);  

    html2canvas(data).then(canvas => {
      // Note 1px ~= 0.2645833333333mm
      const imgWidth = Math.min(200, canvas.width * 0.264583);
      const imgHeight = Math.min(290, canvas.height * 0.264583);
  
      const contentDataURL = canvas.toDataURL('image/png')
      const pdf = new jspdf('p', 'mm', 'a4');
      const position = 0;
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight)
      pdf.save(pdfName);
    });
  }
}
