import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TreeExtraService {

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
    let letters: string[] = [];
    for (let token of attrLabel.split(separator)) {
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

}
