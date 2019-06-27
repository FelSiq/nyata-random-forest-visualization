"""Module dedicated to the visualization of a Decision Tree."""
import typing as t

import sklearn.tree
import numpy as np


def get_tree_structure(tree: sklearn.tree._tree.Tree) -> str:
    """Transform the tree structure into a string object."""
    return "TO DO."


def json_encoder_type_manager(o: t.Any) -> t.Any:
    """Manage non-native python data type to serialize as a JSON."""
    if isinstance(o, np.ndarray):
        return list(map(json_encoder_type_manager, o))

    if isinstance(o, np.int):
        return str(o)

    if isinstance(o, sklearn.tree._tree.Tree):
        return get_tree_structure(o)

    return str(o)


def serialize_decision_tree(
        dt_model: sklearn.tree.DecisionTreeClassifier) -> str:
    """Transform the given Decision Tree model to a JSON string."""
    new_model = {
        str(key): json_encoder_type_manager(value)
        for key, value in dt_model.__dict__.items()
    }
    return new_model


def get_toy_model():
    from sklearn.datasets import load_iris
    iris = load_iris()

    model = sklearn.tree.DecisionTreeClassifier()
    model.fit(iris.data, iris.target)

    return model


if __name__ == "__main__":
    print(serialize_decision_tree(get_toy_model()))
