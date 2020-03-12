export class ClusterNode {
  id: number;
  left?: number;
  right?: number;
  dist?: number;
  count?: number;
}

export interface ClusterData {
  clust_buckets: number[];
  medoid_ind: number;
}

export interface KeyValuePair {
  value: string;
  proportion: number;
}

export interface HierClus {
  dendrogram: number[][];
  clust_assignment: ClusterData[];
  num_cluster: number;
  dendrogram_tree: ClusterNode[];
  optimal_leaves_seq: number[];
  clust_sum_dists: KeyValuePair[];
  hier_clus_distance: string;
  max_limit: number;
}
