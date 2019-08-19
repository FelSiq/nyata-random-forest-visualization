import { Injectable } from '@angular/core';

import * as d3 from 'd3-selection';

type D3Selection = d3.Selection<SVGElement | any, {}, HTMLElement, any>;

@Injectable({
  providedIn: 'root',
})
export class TreeExtraService {
  static readonly depthMarkersPercentageSize = 0.99;

  constructor() { }

  static formatLinkId(nodeAId: number | string,
                      nodeBId: number | string,
                      addIdHash = false): string {
    return (addIdHash ? '#' : '') + 'link-' + nodeAId + '-' + nodeBId;
  }

  static formatNodeId(nodeId: number,
                      addIdHash = false): string {
    return (addIdHash ? '#' : '') + 'node-' + nodeId;
  }

  static abbreviateAttrLabel(attrLabel: string, separator = '-'): string {
    const letters: string[] = [];
    for (const token of attrLabel.split(separator)) {
      letters.push(token[0].toUpperCase());
    }
    return letters.join('');
  }

  buildDepthMarkers(depthMarkers,
                    limMin: number,
                    limMax: number,
                    coordStart: number,
                    coordDelta: number,
                    maxDepth: number,
                    vertical: boolean): void {
    let curCoord = coordStart;

    if (vertical) {
      for (let i = 0; i <= maxDepth; i++) {
        depthMarkers.append('line')
          .attr('x1', limMin)
          .attr('x2', limMax)
          .attr('y1', curCoord)
          .attr('y2', curCoord)
          .style('stroke', 'rgb(200, 200, 200)')
          .style('stroke-dasharray', ('2, 4'));

        curCoord += coordDelta;
      }
    } else {
      for (let i = 0; i <= maxDepth; i++) {
        depthMarkers.append('line')
          .attr('x1', curCoord)
          .attr('x2', curCoord)
          .attr('y1', limMin)
          .attr('y2', limMax)
          .style('stroke', 'rgb(200, 200, 200)')
          .style('stroke-dasharray', ('2, 4'));

        curCoord += coordDelta;
      }
    }
  }

  static getRectWidth(objects: D3Selection): number {
    let labelWidth = 0;

    objects
      .selectAll('.label-text')
        .each(function(i) {
          labelWidth = Math.max(4 + (<SVGTextElement>this).getComputedTextLength(), labelWidth);
        });

    return labelWidth;
  }

  static buildObjectsLabelRect(
        objects: D3Selection,
        rectColor: string,
        hide: boolean,
        lineHeight: number,
        funcXCoord,
        funcYCoord): void {
    if (objects.empty()) {
      return;
    }

    objects
      .select(function() {
        return d3.select(this).select('rect').empty() ? this : null;
      })
        .append('rect')
          .raise()
          .classed('draggable label', true)
          .attr('rx', 5)
          .attr('opacity', 0.5)
          .attr('fill', rectColor);

    objects
      .selectAll('rect')
        .attr('width', this.getRectWidth(objects))
        .attr('height', function(): number {
          return (lineHeight *
            d3.select((<SVGElement>this).parentNode)
              .selectAll('.label-text').size());
        })
        .attr('x', funcXCoord)
        .attr('y', funcYCoord)
        .attr('visibility', hide ? 'visible' : 'hidden');
  }

  static getAbbvs(
        labels: string[],
        visibleAttrs: { name: string, abbv: string }[]): string[] {
    const abbvs: string[] = [];

    for (let i = 0; i < labels.length; i++) {
      const curAttr = labels[i];

      let curAbbv = visibleAttrs[
        visibleAttrs.map(item => item.name).indexOf(curAttr)
      ].abbv;

      if (!curAbbv) {
        curAbbv = TreeExtraService.abbreviateAttrLabel(curAttr);
      }

      abbvs.push(curAbbv);
    }

    return abbvs;
  }

  static buildObjectsLabelText(
        objects: D3Selection,
        labels: string[],
        abbv: string[],
        fontSize: number,
        fontSpacing: number,
        textOutline: string,
        funcXCoord,
        funcYCoord): void {
    if (objects.empty()) {
      return;
    }

    objects
      .selectAll('.label-text')
        .remove();

    for (let i = 0; i < labels.length; i++) {
      const curAttr = labels[i];
      const formatedAttrLabel = abbv ? abbv[i] : curAttr;

      const attrLabelPrefix = (labels.length > 1) ? (formatedAttrLabel + ': ') : '';
      objects
        .select(function() {
          return d3.select(this).attr(curAttr) ? this : null;
        })
        .append('text')
          .classed('draggable label label-text', true)
          .text(function(): string {
            let value: string | number = d3.select(this.parentNode).attr(curAttr);

            if (+value && value.indexOf('.') > -1 && value.length > 4) {
              value = (+value).toFixed(2);
            }

            return attrLabelPrefix + value;
          });
    }

    objects
      .selectAll('.label-text')
        .attr('font-size', fontSize)
        .attr('font-family', "'Roboto', sans-serif")
        .attr('font-weight', 900)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('x', funcXCoord)
        .attr('y', funcYCoord)
        .style('stroke', textOutline)
        .style('stroke-width', 1)
        .each(function(d, i) {
          d3.select(this)
            .attr('transform', function(): string {
              const activeAttrs = +d3.select((<SVGElement>this).parentNode)
                .selectAll('.label-text').size();

              const translationValue = (
                fontSize + (fontSize + fontSpacing) * (i - 0.5 * activeAttrs));

              return 'translate(0, ' + translationValue + ')';
          })
        });
  }

  static setMouseEvents(
        objects: D3Selection,
        funcMouseEnter,
        funcMouseLeave): void {
    if (objects.empty()) {
      return;
    }

    objects
      .selectAll('.draggable')
        .on('mouseenter', funcMouseEnter)
        .on('mouseleave', funcMouseLeave);
  }
}
