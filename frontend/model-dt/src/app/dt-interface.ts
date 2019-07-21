interface DescVal<T> {
  description: string;
  value: T;
}

export interface TreeInterface {
  capacity: number;
  children_left: number[];
  children_right: number[];
  feature: number[];
  impurity: number[];
  maximum_depth: number;
  maximum_number_of_classes: number;
  number_of_classes: number[];
  number_of_features: number;
  number_of_node_samples: number[];
  number_of_outputs: number;
  node_count: number;
  threshold: number[];
  value: number[];
  weighted_number_of_node_samples: number[];
}

export interface BaseEstimator {
  class_weight: number[];
  criterion: string;
  maximum_depth: number;
  maximum_features: number;
  maximum_leaf_nodes: number;
  minimum_impurity_decrease: number;
  minimum_impurity_split: number;
  minimum_samples_leaf: number;
  minimum_samples_split: number;
  minimum_weight_fraction_leaf: number;
  presort: boolean;
  random_state: number;
  splitter: string;
}

export interface DTInterface {
  criterion: DescVal<string>;
  minimum_samples_split: DescVal<string>;
  minimum_samples_leaf: DescVal<string>;
  minimum_weight_fraction_leaf: DescVal<string>;
  maximum_features: DescVal<string>;
  maximum_leaf_nodes: DescVal<string>;
  class_weight: DescVal<string>;

  maximum_depth: DescVal<number>;
  random_state: DescVal<number>;
  minimum_impurity_decrease: DescVal<number>;
  minimum_impurity_split: DescVal<number>;
  number_of_features_: DescVal<number>;
  number_of_outputs_: DescVal<number>;
  classes_: DescVal<Array<number | string>>;
  number_of_classes_: DescVal<number>;

  tree_?: DescVal<TreeInterface>;
  estimators_?: DescVal<DTInterface[]>;

  presort?: DescVal<boolean>;
  splitter?: DescVal<string>;
  warm_start?: DescVal<boolean>;
  number_of_estimators?: DescVal<string>;
  estimator_parameters?: DescVal<string[]>;
  oob_score?: DescVal<boolean>;
  verbose?: DescVal<boolean>;
  base_estimator?: DescVal<BaseEstimator>;
  base_estimator_?: DescVal<BaseEstimator>;
  bootstrap?: DescVal<boolean>;
  number_of_jobs?: DescVal<number>;
  maximum_features_?: DescVal<number>;
}
