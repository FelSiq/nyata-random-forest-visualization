"""Module dedicated to the visualization of a Decision Tree."""
import typing as t
import inspect
import re

import sklearn.tree
import sklearn.ensemble
import sklearn.metrics
import numpy as np
import scipy.sparse

RE_KEY_NUMBEROF = re.compile(r"\bn \b")
"""Regular expression for getting 'n ' string, to format JSON keys."""
RE_KEY_MIN = re.compile(r"\bmin\b")
"""Regular expression for getting 'min' string, to format JSON keys."""
RE_KEY_MAX = re.compile(r"\bmax\b")
"""Regular expression for getting 'max' string, to format JSON keys."""
RE_KEY_PARAMS = re.compile(r"\bparams\b")
"""Regular expression for getting 'params' string, to format JSON keys."""

METRICS_CLASSIFICATION = {
    "accuracy": sklearn.metrics.accuracy_score,
    "balanced_accuracy": sklearn.metrics.balanced_accuracy_score,
    "average_precision": sklearn.metrics.average_precision_score,
    "precision": sklearn.metrics.precision_score,
    "recall": sklearn.metrics.recall_score,
}
"""Chosen metrics to evaluate classifier models."""

METRICS_REGRESSION = {
    "mean_absolute_error": sklearn.metrics.mean_absolute_error,
    "mean_squared_log_error": sklearn.metrics.mean_squared_log_error,
    "explained_variance_score": sklearn.metrics.explained_variance_score,
    "mean_squared_error": sklearn.metrics.mean_squared_error,
    "median_absolute_error": sklearn.metrics.median_absolute_error,
    "mean_squared_log_error": sklearn.metrics.mean_squared_log_error,
}
"""Chosen metrics to evaluate regressor models."""


def preprocess_key(key: str) -> str:
    """Transform the sklearn model dict keys into a more user-readable value."""
    key = key.replace("_", " ")
    key = RE_KEY_NUMBEROF.sub("number of ", key)
    key = RE_KEY_MAX.sub("maximum", key)
    key = RE_KEY_MIN.sub("minimum", key)
    key = RE_KEY_PARAMS.sub("parameters", key)
    key = key.replace(" ", "_")
    return key


def get_tree_structure(tree: sklearn.tree._tree.Tree) -> t.Dict[str, t.Any]:
    """Transform the sklearn tree structure into a string object.

    For more information, check the sklearn documentation (url below.)
    https://scikit-learn.org/stable/auto_examples/tree/plot_unveil_tree_structure.html
    """
    attributes = inspect.getmembers(tree,
                                    lambda attr: not inspect.isroutine(attr))

    encoded_tree = {
        preprocess_key(attr_name): json_encoder_type_manager(attr_val)
        for attr_name, attr_val in attributes
        if not (attr_name.startswith('__') and attr_name.endswith('__'))
    }

    return encoded_tree


def json_encoder_type_manager(obj: t.Any) -> t.Any:
    """Manage non-native python data type to serialize as a JSON."""
    if isinstance(obj, (sklearn.tree.tree.DecisionTreeClassifier,
                        sklearn.tree.tree.DecisionTreeRegressor)):
        return serialize_decision_tree(obj)

    if isinstance(obj, (np.ndarray, list, tuple)):
        return list(map(json_encoder_type_manager, obj))

    if isinstance(obj, (np.int8, np.int16, np.int32, np.int64)):
        return int(obj)

    if isinstance(obj, sklearn.tree._tree.Tree):
        return get_tree_structure(obj)

    if isinstance(obj, dict):
        return {
            json_encoder_type_manager(key): json_encoder_type_manager(value)
            for key, value in obj.items()
        }

    return obj


def get_class_freqs(dt_model: sklearn.ensemble.forest.RandomForestClassifier,
                    instance: np.ndarray) -> t.Optional[t.Dict[str, t.Dict[str, str]]]:
    """Get the frequency of every class from a RF Classifier prediction."""
    if not isinstance(dt_model,
                      sklearn.ensemble.forest.RandomForestClassifier):
        return None

    class_by_tree = {str(class_label): 0
                     for class_label in dt_model.classes_
                     }  # type: t.Dict[str, int]

    for tree in dt_model.estimators_:
        pred_class = tree.predict(instance).astype(dt_model.classes_.dtype)
        class_by_tree[str(pred_class[0])] += 1

    ret = {
        key: {
            "value":
            "{} ({:.1f}%)".format(value,
                                  100.0 * value / dt_model.n_estimators),
            "description":
            "Number of trees in the forest that predicted class '{}'.".format(
                key),
        }
        for key, value in class_by_tree.items()
    }

    return ret


def serialize_decision_tree(
        dt_model: t.
        Union[sklearn.ensemble.forest.RandomForestClassifier, sklearn.ensemble.
              forest.RandomForestRegressor, sklearn.tree.tree.
              DecisionTreeRegressor, sklearn.tree.tree.DecisionTreeClassifier],
        attr_labels: t.Optional[t.Sequence[str]] = None,
) -> t.Dict[str, t.Any]:
    """Transform the given DT model into a serializable dictionary."""
    new_model = {
        preprocess_key(str(key)): {
            "value":
            json_encoder_type_manager(value),
            "description":
            ("Description for key {}. TODO: get description "
             "directly from sklearn documentation.".format(key)),
        }
        for key, value in dt_model.__dict__.items()
    }

    try:
        if attr_labels is None:
            attr_num = len(dt_model.feature_importances_)
            attr_labels = ["Attribute {}".format(i) for i in range(attr_num)]

        new_model["feature_importances_"] = {
            "value": json_encoder_type_manager(
                list(map(lambda item: "{}: {:.2f} %".format(item[1], 100 * item[0]),
                zip(dt_model.feature_importances_, attr_labels)))),
            "description": "TODO: this documentation properly."
        }

    except AttributeError:
        pass

    return new_model


def get_metrics(
        dt_model: t.
        Union[sklearn.ensemble.forest.RandomForestClassifier, sklearn.ensemble.
              forest.RandomForestRegressor, sklearn.tree.tree.
              DecisionTreeRegressor, sklearn.tree.tree.DecisionTreeClassifier],
        preds: np.array,
        true_labels: np.array,
) -> t.Dict[str, t.Any]:
    """Evaluate given DT/RF models using some chosen metrics."""
    def safe_call_func(func, true_labels, preds) -> t.Optional[str]:
        """Call an evaluation metric, catching ValueError exceptions."""
        try:
            res = func(true_labels, preds)

            if res is not None:
                res = "{:.2f}".format(res)

            return res

        except ValueError as val_err:
            return None

    chosen_metrics = None

    if isinstance(dt_model, (sklearn.ensemble.forest.RandomForestClassifier,
                             sklearn.tree.tree.DecisionTreeClassifier)):
        chosen_metrics = METRICS_CLASSIFICATION

    if isinstance(dt_model, (sklearn.ensemble.forest.RandomForestRegressor,
                             sklearn.tree.tree.DecisionTreeRegressor)):
        chosen_metrics = METRICS_REGRESSION

    if chosen_metrics:
        return {
            metric_name: {
                "value": safe_call_func(metric_func, true_labels, preds),
                "description":
                "Todo.",
            }
            for metric_name, metric_func in chosen_metrics.items()
        }

    return {}


def get_toy_model(forest: bool = False, regressor: bool = False):
    """Create a DT/RF toy model for testing purposes."""
    from sklearn.datasets import load_iris
    iris = load_iris()  # type: sklearn.utils.Bunch

    X = iris.data
    y = iris.target
    attr_labels = iris.feature_names

    ALGORITHMS = {
        (False, False): sklearn.tree.DecisionTreeClassifier,
        (False, True): sklearn.tree.DecisionTreeRegressor,
        (True, False): sklearn.ensemble.RandomForestClassifier,
        (True, True): sklearn.ensemble.RandomForestRegressor,
    }

    if forest:
        args = {"n_estimators": 10}
    else:
        args = {}

    model = ALGORITHMS.get(
        (forest, regressor),
        sklearn.tree.DecisionTreeClassifier)(**args)
    model.fit(iris.data, iris.target)

    return model, X, y, attr_labels


if __name__ == "__main__":
    print(serialize_decision_tree(get_toy_model()))
