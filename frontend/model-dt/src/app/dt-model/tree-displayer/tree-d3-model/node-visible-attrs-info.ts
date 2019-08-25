export class NodeVisibleAttrsInfo {

  readonly visibleAttrs = [
    {
      name: 'impurity',
      abbv: null,
      constraint: null,
      desc: null,
    },
    {
      name: 'decision-feature',
      abbv: null,
      constraint: null,
      desc: 'Show index of the feature used by node as decision.',
    },
    {
      name: 'number-of-instances',
      abbv: null,
      constraint: null,
      desc: 'Show number of instances that passed throught the node in the training phase.',
    },
    {
      name: 'threshold',
      abbv: null,
      constraint: null,
      desc: 'Show value used as threshold to the feature to redirect each instance to the correct children node.',
    },
    {
      name: 'node-class',
      abbv: null,
      constraint: null,
      desc: 'If the model is a Classificator, then show the majority class between the training instances within. If the model is a Regressor, show the mean value of the dependent attribute of the training instances within.',
    },
    {
      name: 'depth',
      abbv: null,
      constraint: null,
      desc: null,
    },
    {
      name: 'output-delta',
      abbv: null,
      constraint: 'For regression tasks only',
      desc: 'Show the variation of the model output between the current node and its parent node.',
    },
    {
      name: 'index',
      abbv: 'ID',
      constraint: null,
      desc: null,
    },
  ];

}
