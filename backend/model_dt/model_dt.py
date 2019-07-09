"""Module dedicated to the visualization of a Decision Tree."""
import typing as t
import inspect

import sklearn.tree
import sklearn.ensemble
import numpy as np


def get_tree_structure(tree: sklearn.tree._tree.Tree) -> t.Dict[str, t.Any]:
    """Transform the sklearn tree structure into a string object.

    For more information, check the sklearn documentation (url below.)
    https://scikit-learn.org/stable/auto_examples/tree/plot_unveil_tree_structure.html
    """
    attributes = inspect.getmembers(tree,
                                    lambda attr: not inspect.isroutine(attr))

    encoded_tree = {
        attr_name: json_encoder_type_manager(attr_val)
        for attr_name, attr_val in attributes
        if not (attr_name.startswith('__') and attr_name.endswith('__'))
    }

    return encoded_tree


def json_encoder_type_manager(obj: t.Any) -> t.Any:
    """Manage non-native python data type to serialize as a JSON."""
    if isinstance(obj, (sklearn.tree.tree.DecisionTreeClassifier,
                        sklearn.tree.tree.DecisionTreeRegressor)):
        return serialize_decision_tree(obj)

    if isinstance(obj, (np.ndarray, list)):
        return list(map(json_encoder_type_manager, obj))

    if isinstance(obj, (np.int8, np.int16, np.int32, np.int64)):
        return int(obj)

    if isinstance(obj, sklearn.tree._tree.Tree):
        return get_tree_structure(obj)

    return obj


def serialize_decision_tree(
        dt_model: t.
        Union[sklearn.ensemble.forest.RandomForestClassifier, sklearn.ensemble.
              forest.RandomForestRegressor, sklearn.tree.tree.
              DecisionTreeRegressor, sklearn.tree.tree.DecisionTreeClassifier]
) -> t.Dict[str, t.Any]:
    """Transform the given DT model into a serializable dictionary."""
    new_model = {
        str(key): json_encoder_type_manager(value)
        for key, value in dt_model.__dict__.items()
    }
    return new_model


def get_toy_model(forest: bool = False, regressor: bool = False):
    """Create a DT toy model for testing purposes."""
    from sklearn.datasets import load_iris
    iris = load_iris()  # type: sklearn.utils.Bunch

    ALGORITHMS = {
        (False, False): sklearn.tree.DecisionTreeClassifier,
        (False, True): sklearn.tree.DecisionTreeRegressor,
        (True, False): sklearn.ensemble.RandomForestClassifier,
        (True, True): sklearn.ensemble.RandomForestRegressor,
    }

    model = ALGORITHMS.get((forest, regressor))()
    model.fit(iris.data, iris.target)

    return model


if __name__ == "__main__":
    print(serialize_decision_tree(get_toy_model()))
