interface ValDescPair<T> {
  description: string;
  value: T;
}

export interface PredictResults {
  predict_result?: ValDescPair<number | number[]>;
  classes_by_tree?: ValDescPair<string[]>;
  decision_path?: ValDescPair<number[]>;
  leaf_id?: ValDescPair<number | number[]>;
  error?: { value: string };
  margin?: ValDescPair<string>;
  prediction_quantiles?: ValDescPair<string[]>;
  prediction_standard_deviation?: ValDescPair<string>;
}
