"""Solve item descriptions."""
import typing as t

DESCRIPTIONS = {
    "within_cluster_dists":
    "Sum of within cluster distances for each instance. The medoid "
    "tree have, by definition, the minimal sum of inner cluster distances "
    "in its cluster. The format of this list is: "
    "[Tree Index] ([Total sum of distances]): [Inner cluster proportion "
    "of the distance sum]",
    "depth_frequencies":
    "...",
    "feature_importances":
    "...",
    "prediction_result": "...",
    "classes_by_tree": "...",
    "pred_margin": "Margin is the instance highest class probability "
                   "minus second highest class probability.",
}  # t.Dict[t.Any, str]


def dictionarize(value: t.Any, auxiliar_value: t.Any,
                 auxiliar_key: str) -> t.Dict[str, t.Any]:
    res = {
        "value": value,
        auxiliar_key: auxiliar_value,
    }

    return res


def add_desc(value: t.Any,
             desc: t.Optional[str] = None,
             from_id: t.Optional[t.Any] = None) -> t.Dict[str, t.Any]:
    """Add a description to an object."""
    if desc is None:
        desc = DESCRIPTIONS.get(from_id, "TODO.")

    return dictionarize(value=value,
                        auxiliar_value=desc,
                        auxiliar_key="description")


def add_proportion(value: t.Any, prop: float) -> t.Dict[str, t.Any]:
    """Attach a proportion to an object."""
    return dictionarize(value=value,
                        auxiliar_value=prop,
                        auxiliar_key="proportion")
