"""Methods for serialize objects."""
import typing as t

import sklearn.tree
import sklearn.ensemble
import sklearn.base
import sklearn.dummy
import numpy as np
import scipy.cluster.hierarchy

from . import utils
from . import descriptions

try:
    from . import model_dt

except ImportError:
    pass


def json_encoder_type_manager(obj: t.Any) -> t.Any:
    """Manage non-native python data type to serialize as a JSON."""
    if utils.is_tree(obj):
        return serialize_decision_tree(obj)

    if isinstance(obj, np.random.RandomState):
        return "(Random Number Generator instance)"

    if isinstance(obj, sklearn.dummy.DummyClassifier):
        return "(DummyClassifier instance)"

    if isinstance(obj, sklearn.dummy.DummyRegressor):
        return "(DummyClassifier instance)"

    if isinstance(obj, scipy.cluster.hierarchy.ClusterNode):
        return serialize_cluster_node(obj)

    if isinstance(obj, (np.ndarray, list, tuple)):
        return list(map(json_encoder_type_manager, obj))

    if np.issubdtype(type(obj), np.integer):
        return int(obj)

    if isinstance(obj, sklearn.tree._tree.Tree):
        return model_dt.get_tree_structure(obj)

    if isinstance(obj, dict):
        return {
            json_encoder_type_manager(key): json_encoder_type_manager(value)
            for key, value in obj.items()
        }

    return obj


def serialize_generic_obj(
    obj: t.Any, include_description: bool = False
) -> t.Dict[str, t.Any]:
    """Serialize a generic object."""
    if include_description:
        res = {
            utils.preprocess_key(str(key)): descriptions.add_desc(
                value=json_encoder_type_manager(value),
                from_id=key,
                from_obj_doc=obj,
            )
            for key, value in obj.__dict__.items()
        }

    else:
        res = {
            utils.preprocess_key(str(key)): json_encoder_type_manager(value)
            for key, value in obj.__dict__.items()
        }

    return res


def serialize_cluster_node(obj: t.Any) -> t.Dict[str, t.Any]:
    """Serialize a Cluster Node object."""
    res = {
        utils.preprocess_key(str(key)): json_encoder_type_manager(value)
        for key, value in obj.__dict__.items()
        if not isinstance(value, scipy.cluster.hierarchy.ClusterNode)
    }

    try:
        res["left"] = obj.left.id

    except AttributeError:
        pass

    try:
        res["right"] = obj.right.id

    except AttributeError:
        pass

    return res


def serialize_decision_tree(
    dt_model: t.Union[
        sklearn.ensemble.RandomForestClassifier,
        sklearn.ensemble.RandomForestRegressor,
        sklearn.tree.DecisionTreeRegressor,
        sklearn.tree.DecisionTreeClassifier,
    ],
    attr_labels: t.Optional[t.Sequence[str]] = None,
) -> t.Dict[str, t.Any]:
    """Transform the given DT model into a serializable dictionary."""
    new_model = serialize_generic_obj(dt_model, include_description=True)

    try:
        if attr_labels is None:
            attr_num = len(dt_model.feature_importances_)
            attr_labels = ["Attribute {}".format(i) for i in range(attr_num)]

        indexed_attr_labels = [
            "{} (index: {})".format(attr, attr_ind)
            for attr_ind, attr in enumerate(attr_labels)
        ]

        sorted_ft_imp = sorted(
            zip(dt_model.feature_importances_, indexed_attr_labels),
            key=lambda item: item[0],
            reverse=True,
        )

        new_model["feature_importances_"] = descriptions.add_desc(
            value=json_encoder_type_manager(
                [
                    descriptions.add_proportion(
                        value=item[1],
                        prop=item[0],
                    )
                    for item in sorted_ft_imp
                ]
            ),
            from_id="feature_importances_",
            from_obj_doc=dt_model,
        )

    except AttributeError:
        pass

    if attr_labels is not None:
        new_model["attr_labels"] = json_encoder_type_manager(attr_labels)

    depth_freqs = {}  # type: t.Dict[int, int]

    try:
        for tree in dt_model.estimators_:
            cur_depth = tree.get_depth()
            depth_freqs.setdefault(cur_depth, 0)
            depth_freqs[cur_depth] += 1

    except AttributeError:
        pass

    if depth_freqs:
        for key in depth_freqs:
            depth_freqs[key] = depth_freqs[key] / dt_model.n_estimators

        depth_formatted_sorted = list(
            map(
                lambda item: descriptions.add_proportion(
                    value=item[0],
                    prop=item[1],
                ),
                sorted(depth_freqs.items(), key=lambda item: item[1], reverse=True),
            )
        )

        new_model["depth_frequencies"] = descriptions.add_desc(
            value=json_encoder_type_manager(depth_formatted_sorted),
            from_id="depth_frequencies",
        )

    if sklearn.base.is_classifier(dt_model):
        new_model["model_type"] = "classifier"

    else:
        new_model["model_type"] = "regressor"

    return new_model
