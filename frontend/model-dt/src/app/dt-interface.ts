interface descVal<T> {
  description: string;
  value: T;
}

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
  value: number[];
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
  criterion: descVal<string>;
  min_samples_split: descVal<string>;
  min_samples_leaf: descVal<string>;
  min_weight_fraction_leaf: descVal<string>;
  max_features: descVal<string>;
  max_leaf_nodes: descVal<string>;
  class_weight: descVal<string>;

  max_depth: descVal<number>;
  random_state: descVal<number>;
  min_impurity_decrease: descVal<number>;
  min_impurity_split: descVal<number>;
  n_features_: descVal<number>;
  n_outputs_: descVal<number>;
  classes_: descVal<Array<number | string>>;
  n_classes_: descVal<number>;

  tree_?: descVal<TreeInterface>;
  estimators_?: descVal<DTInterface[]>;

  presort?: descVal<boolean>;
  splitter?: descVal<string>;
  warm_start?: descVal<boolean>;
  n_estimators?: descVal<string>;
  estimator_params?: descVal<string[]>;
  oob_score?: descVal<boolean>;
  verbose?: descVal<boolean>;
  base_estimator?: descVal<BaseEstimator>;
  base_estimator_?: descVal<BaseEstimator>;
  bootstrap?: descVal<boolean>;
  n_jobs?: descVal<number>;
  max_features_?: descVal<number>;
}
