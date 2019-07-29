import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
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

  buildDepthMarkers(depthMarkers,
                    x1: number,
                    x2: number,
                    yStart: number,
                    cyDelta: number,
                    maxDepth: number): void {
    let curY = yStart;

    for (let i = 0; i <= maxDepth; i++) {
      depthMarkers.append('line')
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', curY)
        .attr('y2', curY)
        .style('stroke', 'rgb(200, 200, 200)')
        .style('stroke-dasharray', ('2, 4'));

      curY += cyDelta;
    }
  }

}
