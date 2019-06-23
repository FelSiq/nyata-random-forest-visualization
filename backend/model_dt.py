"""Module dedicated to the visualization of a Decision Tree."""
import typing as t
import json
import inspect

import sklearn.tree
import numpy as np


def json_encoder_type_manager(o: t.Any) -> t.Any:
    """Manage non-native python data type to serialize as a JSON."""
    if isinstance(o, np.ndarray):
        return list(o)

    if isinstance(o, np.int64):
        return int(o)

    _func_name = inspect.stack()[0][3]

    raise TypeError("JSON encoder does not support type '{}'. "
                    "Please update '{}' function to give a "
                    "custom workaround.".format(type(o), _func_name))


def serialize_decision_tree(
        dt_model: sklearn.tree.DecisionTreeClassifier) -> str:
    """Transform the given Decision Tree model to a JSON string."""
    dt_model.__dict__.pop("tree_")
    return json.dumps(dt_model.__dict__, default=json_encoder_type_manager)


if __name__ == "__main__":
    from sklearn.datasets import load_iris

    def get_toy_model(x, y):
        model = sklearn.tree.DecisionTreeClassifier()
        model.fit(x, y)
        return model

    iris = load_iris()

    model = get_toy_model(iris.data, iris.target)

    json_str = serialize_decision_tree(model)
    print(json_str)
