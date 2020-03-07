"""Module dedicated to the visualization of a Decision Tree."""
import typing as t
import inspect
import re
import collections

import sklearn.tree
import sklearn.ensemble
import sklearn.metrics
import sklearn.preprocessing
import numpy as np
import scipy.cluster.hierarchy

RE_KEY_NUMBEROF = re.compile(r"\bn \b")
"""Regular expression for getting 'n ' string, to format JSON keys."""
RE_KEY_MIN = re.compile(r"\bmin\b")
"""Regular expression for getting 'min' string, to format JSON keys."""
RE_KEY_MAX = re.compile(r"\bmax\b")
"""Regular expression for getting 'max' string, to format JSON keys."""
RE_KEY_PARAMS = re.compile(r"\bparams\b")
"""Regular expression for getting 'params' string, to format JSON keys."""

METRICS_CLASSIFICATION = {
    "accuracy": (sklearn.metrics.accuracy_score, None),
    "balanced_accuracy": (sklearn.metrics.balanced_accuracy_score, None),
    "roc_auc_binary": (sklearn.metrics.roc_auc_score, {
        "average": "binary"
    }),
    "roc_auc_micro": (sklearn.metrics.roc_auc_score, {
        "average": "micro"
    }),
    "roc_auc_macro": (sklearn.metrics.roc_auc_score, {
        "average": "macro"
    }),
    "roc_auc_weighted": (sklearn.metrics.roc_auc_score, {
        "average": "weighted"
    }),
    "average_precision_binary": (sklearn.metrics.average_precision_score, {
        "average": "binary"
    }),
    "average_precision_micro": (sklearn.metrics.average_precision_score, {
        "average": "micro"
    }),
    "average_precision_macro": (sklearn.metrics.average_precision_score, {
        "average": "macro"
    }),
    "average_precision_weighted": (sklearn.metrics.average_precision_score, {
        "average": "weighted"
    }),
    "precision_binary": (sklearn.metrics.precision_score, {
        "average": "binary"
    }),
    "precision_micro": (sklearn.metrics.precision_score, {
        "average": "micro"
    }),
    "precision_macro": (sklearn.metrics.precision_score, {
        "average": "macro"
    }),
    "precision_weighted": (sklearn.metrics.precision_score, {
        "average": "weighted"
    }),
    "recall_binary": (sklearn.metrics.recall_score, {
        "average": "binary"
    }),
    "recall_micro": (sklearn.metrics.recall_score, {
        "average": "micro"
    }),
    "recall_macro": (sklearn.metrics.recall_score, {
        "average": "macro"
    }),
    "recall_weighted": (sklearn.metrics.recall_score, {
        "average": "weighted"
    }),
}  # type: t.Dict[str, t.Tuple[t.Callable[[np.ndarray, np.ndarray], float], t.Optional[t.Dict[str, t.Any]]]]
"""Chosen metrics to evaluate classifier models."""

METRICS_REGRESSION = {
    "mean_absolute_error": (sklearn.metrics.mean_absolute_error, None),
    "mean_squared_log_error": (sklearn.metrics.mean_squared_log_error, None),
    "explained_variance_score": (sklearn.metrics.explained_variance_score,
                                 None),
    "mean_squared_error": (sklearn.metrics.mean_squared_error, None),
    "median_absolute_error": (sklearn.metrics.median_absolute_error, None),
}  # type: t.Dict[str, t.Tuple[t.Callable[[np.ndarray, np.ndarray], float], t.Optional[t.Dict[str, t.Any]]]]
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
    if isinstance(obj, (sklearn.tree.DecisionTreeClassifier,
                        sklearn.tree.DecisionTreeRegressor)):
        return serialize_decision_tree(obj)

    if isinstance(obj, scipy.cluster.hierarchy.ClusterNode):
        return serialize_generic_obj(obj)

    if isinstance(obj, (np.ndarray, list, tuple)):
        return list(map(json_encoder_type_manager, obj))

    if isinstance(obj,
                  (np.uint, np.int, np.int8, np.int16, np.int32, np.int64)):
        return int(obj)

    if isinstance(obj, sklearn.tree._tree.Tree):
        return get_tree_structure(obj)

    if isinstance(obj, dict):
        return {
            json_encoder_type_manager(key): json_encoder_type_manager(value)
            for key, value in obj.items()
        }

    return obj


def get_class_freqs(
        dt_model: sklearn.ensemble.RandomForestClassifier, instance: np.ndarray
) -> t.Tuple[t.Optional[t.Dict[str, t.Dict[str, str]]], t.Optional[str]]:
    """Get the frequency of every class from a RF Classifier prediction."""
    if not isinstance(dt_model, sklearn.ensemble.RandomForestClassifier):
        return None, None

    class_by_tree = {str(class_label): 0
                     for class_label in dt_model.classes_
                     }  # type: t.Dict[str, int]

    for tree in dt_model.estimators_:
        pred_class = tree.predict(instance).astype(dt_model.classes_.dtype)
        class_by_tree[str(pred_class[0])] += 1

    sorted_class_by_tree = sorted(
        class_by_tree.items(),
        key=lambda item: item[1],
        reverse=True)

    ret = collections.OrderedDict(
        (key, {
            "value": {
                "value": value,
                "proportion": value / dt_model.n_estimators,
            },
            "description":
            "Number of trees in the forest that predicted class '{}'.".format(
                key),
        })
        for key, value in sorted_class_by_tree
    )

    margin = None  # type: t.Optional[str]

    if len(class_by_tree) > 1:
        margin = "{:.2f}".format(
            (sorted_class_by_tree[0][1] - sorted_class_by_tree[1][1]) / dt_model.n_estimators)

    return ret, margin


def serialize_generic_obj(
        obj: t.Any, include_description: bool = False) -> t.Dict[str, t.Any]:
    """Serialize a generic object."""
    if include_description:
        res = {
            preprocess_key(str(key)): {
                "value": json_encoder_type_manager(value),
                "description": "Description for key {}. TODO.".format(key),
            }
            for key, value in obj.__dict__.items()
        }

    else:
        res = {
            preprocess_key(str(key)): json_encoder_type_manager(value)
            for key, value in obj.__dict__.items()
        }

    return res


def serialize_decision_tree(
        dt_model: t.Union[sklearn.ensemble.RandomForestClassifier,
                          sklearn.ensemble.RandomForestRegressor,
                          sklearn.tree.DecisionTreeRegressor,
                          sklearn.tree.DecisionTreeClassifier],
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
            reverse=True)

        new_model["feature_importances_"] = {
            "value":
            json_encoder_type_manager([{
                "value": item[1],
                "proportion": item[0]
            } for item in sorted_ft_imp]),
            "description":
            "TODO: this documentation properly."
        }

    except AttributeError:
        pass

    if attr_labels:
        new_model["attr_labels"] = attr_labels

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
            map(lambda item: {
                "value": item[0],
                "proportion": item[1], },
                sorted(
                    depth_freqs.items(),
                    key=lambda item: item[1],
                    reverse=True)))

        new_model["depth_frequencies"] = {
            "value": json_encoder_type_manager(depth_formatted_sorted),
            "description": "TODO.",
        }

    return new_model


def hot_encoding(labels: np.ndarray) -> np.ndarray:
    """One-Hot Encoding labels."""
    if labels.ndim == 1:
        labels = labels.reshape(-1, 1)

    labels_ohe = sklearn.preprocessing.OneHotEncoder().fit_transform(
        labels).todense()

    return labels_ohe


def get_metrics(
        dt_model: t.Union[sklearn.ensemble.RandomForestClassifier,
                          sklearn.ensemble.RandomForestRegressor,
                          sklearn.tree.DecisionTreeRegressor,
                          sklearn.tree.DecisionTreeClassifier],
        preds: np.ndarray,
        true_labels: np.ndarray,
        preds_proba: t.Optional[np.ndarray] = None,
        true_labels_ohe: t.Optional[np.ndarray] = None,
) -> t.Dict[str, t.Any]:
    """Evaluate given DT/RF models using some chosen metrics."""

    def safe_call_func(func: t.Callable[[np.ndarray, np.ndarray], float],
                       args: t.Optional[t.Dict[str, t.Any]],
                       true_labels: np.ndarray,
                       preds: np.ndarray) -> t.Optional[str]:
        """Call an evaluation metric, catching ValueError exceptions."""
        if args is None:
            args = {}

        try:
            res = func(true_labels, preds, **args)  # type: t.Union[str, float]

            if res is not None:
                res = "{:.2f}".format(res)

            return res

        except ValueError:
            return None

    chosen_metrics = None

    if isinstance(dt_model, (sklearn.ensemble.RandomForestClassifier,
                             sklearn.tree.DecisionTreeClassifier)):
        chosen_metrics = METRICS_CLASSIFICATION

    if isinstance(dt_model, (sklearn.ensemble.RandomForestRegressor,
                             sklearn.tree.DecisionTreeRegressor)):
        chosen_metrics = METRICS_REGRESSION

    if chosen_metrics:
        return {
            metric_name: {
                "value": safe_call_func(*metric_pack, true_labels, preds),
                "description": "Todo.",
            }
            for metric_name, metric_pack in chosen_metrics.items()
        }

    return {}


def top_most_common_attr_seq(
        dt_model: t.Union[sklearn.ensemble.RandomForestClassifier,
                          sklearn.ensemble.RandomForestRegressor,
                          sklearn.tree.DecisionTreeRegressor,
                          sklearn.tree.DecisionTreeClassifier],
        seq_num: int = 10,
        include_node_decision: bool = False,
) -> t.Tuple[t.Tuple[t.Tuple[int, ...]], t.Tuple[float]]:
    """."""

    def _traverse_tree(tree: t.Union[sklearn.tree.DecisionTreeRegressor,
                                     sklearn.tree.DecisionTreeClassifier],
                       cur_ind: int, cur_attr_seq: t.List[int]) -> None:
        """Traverse a tree recursively through all possible paths."""
        if tree.feature[cur_ind] < 0:
            path = tuple(cur_attr_seq)
            seqs.setdefault(path, 0)
            seqs[path] += tree.weighted_n_node_samples[cur_ind]
            return

        if include_node_decision:
            cur_attr_seq.append((tree.feature[cur_ind], "<="))
            _traverse_tree(tree, tree.children_left[cur_ind], cur_attr_seq)
            cur_attr_seq.pop()

            cur_attr_seq.append((tree.feature[cur_ind], ">"))
            _traverse_tree(tree, tree.children_right[cur_ind], cur_attr_seq)
            cur_attr_seq.pop()

        else:
            cur_attr_seq.append(tree.feature[cur_ind])
            _traverse_tree(tree, tree.children_left[cur_ind], cur_attr_seq)
            _traverse_tree(tree, tree.children_right[cur_ind], cur_attr_seq)
            cur_attr_seq.pop()

    seqs = {}  # type: t.Dict[t.Tuple[int, ...], int]

    try:
        trees = dt_model.estimators_

    except AttributeError:
        trees = [dt_model]

    for tree in trees:
        _traverse_tree(tree.tree_, cur_ind=0, cur_attr_seq=[])

    if seqs:
        sorted_seqs, abs_freqs = zip(
            *sorted(seqs.items(), key=lambda item: item[1], reverse=True))
        freqs = tuple(np.asarray(abs_freqs, dtype=np.float) / sum(abs_freqs))

    else:
        sorted_seqs = freqs = tuple()

    if seq_num >= len(sorted_seqs):
        return sorted_seqs, freqs

    return sorted_seqs[:seq_num], freqs[:seq_num]


def get_hierarchical_cluster(
        model: t.Union[sklearn.ensemble.RandomForestClassifier,
                       sklearn.ensemble.RandomForestRegressor], X: np.ndarray,
        threshold_cut: t.Union[int, float]) -> t.Dict[str, np.ndarray]:
    """."""
    inst_num = X.shape[0]
    dna = np.zeros((model.n_estimators, inst_num), dtype=X.dtype)

    for tree_ind, tree in enumerate(model.estimators_):
        dna[tree_ind, :] = tree.predict(X)

    # Shift Cohen's Kappa to prevent negative values, and also transform
    # it to a distance measure (i.e., the higher is the correlation, the
    # smaller will be the dna_dists value.)
    # Note: this distance measure is in [0, 2], with 0 being 'totally
    # equal' and 2 being 'totally distinct.'
    dna_dists = 1.0 - scipy.spatial.distance.pdist(
        X=dna, metric=sklearn.metrics.cohen_kappa_score)
    """
    From scipy.cluster.hierarchical.linkage notes:

    Methods ‘centroid’, ‘median’ and ‘ward’ are correctly defined only if Euclidean pairwise
    metric is used. If y is passed as precomputed pairwise distances, then it is a user
    responsibility to assure that these distances are in fact Euclidean, otherwise the
    produced result will be incorrect.
    """
    dendrogram = scipy.cluster.hierarchy.linkage(dna_dists, method="average")

    clust_assignment = scipy.cluster.hierarchy.fcluster(
        dendrogram, t=threshold_cut, criterion='distance')

    dendrogram_tree = scipy.cluster.hierarchy.to_tree(dendrogram)

    num_cluster = np.unique(clust_assignment).size

    clust_buckets = [
        np.flatnonzero(clust_assignment == i)
        for i in np.arange(1, 1 + num_cluster)
    ]

    return {
        "dendrogram": dendrogram,
        "dendrogram_tree": dendrogram_tree,
        "clust_assignment": clust_buckets,
        "num_cluster": num_cluster
    }


def get_toy_model(forest: bool = True, regressor: bool = False):
    """Create a DT/RF toy model for testing purposes."""
    from sklearn.datasets import load_iris
    iris = load_iris()  # type: sklearn.utils.Bunch

    X = iris.data
    y = iris.target
    attr_labels = iris.feature_names

    algorithms = {
        (False, False): sklearn.tree.DecisionTreeClassifier,
        (False, True): sklearn.tree.DecisionTreeRegressor,
        (True, False): sklearn.ensemble.RandomForestClassifier,
        (True, True): sklearn.ensemble.RandomForestRegressor,
    }

    if forest:
        args = {
            "n_estimators": 10,
            "min_samples_split": 10,
            "min_samples_leaf": 5,
        }
    else:
        args = {}

    model = algorithms.get((forest, regressor),
                           sklearn.tree.DecisionTreeClassifier)(**args)
    model.fit(iris.data, iris.target)

    return model, X, y, attr_labels


if __name__ == "__main__":
    print(serialize_decision_tree(get_toy_model()))
