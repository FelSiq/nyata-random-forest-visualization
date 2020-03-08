export class ClusterNode {
  id: number;
  left?: number;
  right?: number;
  dist?: number;
  count?: number;
}

export interface HierClus {
  dendrogram: number[][];
  clust_assignment: number[];
  num_cluster: number;
  dendrogram_tree: ClusterNode[];
}
