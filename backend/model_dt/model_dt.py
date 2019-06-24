"""Module dedicated to the visualization of a Decision Tree."""
import typing as t
import json
import inspect

import sklearn.tree
import numpy as np


def get_tree_structure(tree: sklearn.tree._tree.Tree) -> str:
    """Transform the tree structure into a string object."""
    return "TO DO."


def json_encoder_type_manager(o: t.Any) -> t.Any:
    """Manage non-native python data type to serialize as a JSON."""
    if isinstance(o, np.ndarray):
        return list(o)

    if isinstance(o, np.int64):
        return int(o)

    if isinstance(o, sklearn.tree._tree.Tree):
        return get_tree_structure(o)

    _func_name = inspect.stack()[0][3]

    raise TypeError("JSON encoder does not support type '{}'. "
                    "Please update '{}' function to give a "
                    "custom workaround.".format(type(o), _func_name))


def serialize_decision_tree(
        dt_model: sklearn.tree.DecisionTreeClassifier) -> str:
    """Transform the given Decision Tree model to a JSON string."""
    return json.dumps(dt_model.__dict__, default=json_encoder_type_manager)


def get_toy_model():
    from sklearn.datasets import load_iris
    iris = load_iris()

    model = sklearn.tree.DecisionTreeClassifier()
    model.fit(iris.data, iris.target)

    return model


if __name__ == "__main__":
    print(serialize_decision_tree(get_toy_model()))
