export interface TreeInterface {
  capacity: number;
  children_left: number[];
  children_right: number[];
  feature: number[];
  impurity: number[];
  max_depth: number;
  max_n_classes: number;
  n_classes: number[];
  n_features: number;
  n_node_samples: number[];
  n_outputs: number;
  node_count: number;
  threshold: number[];
  value: any[];
  weighted_n_node_samples: number[];
}

export interface BaseEstimator {
  class_weight: number[];
  criterion: string;
  max_depth: number;
  max_features: number;
  max_leaf_nodes: number;
  min_impurity_decrease: number;
  min_impurity_split: number;
  min_samples_leaf: number;
  min_samples_split: number;
  min_weight_fraction_leaf: number;
  presort: boolean;
  random_state: number;
  splitter: string;
}

export interface DTInterface {
  criterion: string;
  min_samples_split: string;
  min_samples_leaf: string;
  min_weight_fraction_leaf: string;
  max_features: string;
  max_leaf_nodes: string;
  class_weight: string;

  max_depth: number;
  random_state: number;
  min_impurity_decrease: number;
  min_impurity_split: number;
  n_features_: number;
  n_outputs_: number;
  classes_: Array<number | string>;
  n_classes_: number;

  tree_?: TreeInterface;
  estimators_?: DTInterface[];

  presort?: boolean;
  splitter?: string;
  warm_start?: boolean;
  n_estimators?: string;
  estimator_params?: any[];
  oob_score?: boolean;
  verbose?: boolean;
  base_estimator?: BaseEstimator;
  base_estimator_?: BaseEstimator;
  bootstrap?: boolean;
  n_jobs?: number;
  max_features_?: number;
}
