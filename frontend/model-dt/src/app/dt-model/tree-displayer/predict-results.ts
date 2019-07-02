export interface PredictResults {
  accuracy: number;
  instLabels: number | string;
  instPaths: Array<number>;
}
