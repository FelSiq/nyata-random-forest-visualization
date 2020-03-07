export class ClusterNode {
  id: number;
  left?: ClusterNode;
  right?: ClusterNode;
  dist?: number;
  count?: number;
}

export interface HierClus {
  dendrogram: number[][];
  clust_assignment: number[];
  num_cluster: number;
  dendrogram_tree: ClusterNode;
}
