export class LinkVisibleAttrsInfo {

  readonly visibleAttrs = [
    {
      name: 'weight',
      abbv: null,
      constraint: null,
      desc: 'Show the percentage of instances from the associated parent node that passes through the link to the associated children node.',
    },
    {
      name: 'decision',
      abbv: null,
      constraint: null,
      desc: "Show the matematical relation, 'less or equal than' ('<=') or 'greater than' ('>'), associated with the link. ",
    },
    {
      name: 'decision-feature',
      abbv: null,
      constraint: null,
      desc: 'Show index of the feature used by node as decision.',
    },
    {
      name: 'threshold',
      abbv: null,
      constraint: null,
      desc: 'Show value used as threshold to the feature by the associated parent node to redirect each instance to its correct children node.',
    },
  ];

}
