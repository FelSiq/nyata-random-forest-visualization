"""Solve item descriptions."""
import typing as t
import re

import sklearn.tree
import sklearn.ensemble

_cached_class_docs = set()


def build_class_arg_key(obj, prefix: str = "class_") -> str:
    """Build a standard description key for a given object attribute."""
    return prefix + str(type(obj))


def get_class_doc(model,
                  prefix: str = "class_",
                  check_cache: bool = True,
                  verbose: bool = False) -> t.Dict[str, str]:
    """Get documentation of given class instantiation arguments and attributes."""
    global _cached_class_docs

    if check_cache and type(model) in _cached_class_docs:
        return {}

    preproc = re.sub("\n\n|--+", "__@", model.__doc__)
    preproc = re.sub("([^\s]) : ([^\n]+)", r"\1 : (Type: \2)", preproc)
    preproc = re.sub("\s+", " ", preproc)
    preproc = re.sub("(?<=__@)\s", "", preproc)
    preproc = re.sub("``|`", '"', preproc)
    preproc = preproc.split("__@")

    res = {}  # type: t.Dict[str, str]

    full_prefix = build_class_arg_key(obj=model, prefix=prefix)

    for piece in preproc:
        try:
            param, desc = piece.split(" : ")
            res[full_prefix + param] = desc

            if verbose:
                print("Updated doc. w/ key = ", full_prefix + param)

        except ValueError:
            pass

    _cached_class_docs.add(type(model))

    return res


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
    "prediction_result":
    "...",
    "classes_by_tree":
    "...",
    "pred_margin":
    "Margin is the instance highest class probability "
    "minus second highest class probability.",
    **get_class_doc(sklearn.ensemble.RandomForestClassifier()),
    **get_class_doc(sklearn.ensemble.RandomForestRegressor()),
    **get_class_doc(sklearn.tree.DecisionTreeClassifier()),
    **get_class_doc(sklearn.tree.DecisionTreeRegressor()),
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
             from_id: t.Optional[t.Any] = None,
             from_obj_doc: t.Optional[t.Any] = None) -> t.Dict[str, t.Any]:
    """Add a description to an object."""
    if from_obj_doc is not None and from_id is None:
        raise ValueError("'from_id' must be given if 'from_obj_doc' is given.")

    if desc is None:
        if from_obj_doc is not None:
            from_id = build_class_arg_key(obj=from_obj_doc) + from_id

        desc = DESCRIPTIONS.get(from_id, None)

    return dictionarize(value=value,
                        auxiliar_value=desc,
                        auxiliar_key="description")


def add_proportion(value: t.Any, prop: float) -> t.Dict[str, t.Any]:
    """Attach a proportion to an object."""
    return dictionarize(value=value,
                        auxiliar_value=prop,
                        auxiliar_key="proportion")
