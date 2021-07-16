import typing as t

import pickle
import numpy as np
import sklearn.ensemble
import sklearn.tree


def dump(
    model,
    train_data: t.Optional[t.Tuple[np.ndarray, np.ndarray]] = None,
    attr_labels: t.Optional[t.Union[str, t.Sequence]] = "infer",
    output_uri: str = "nyata_package.pkl",
    protocol: int = pickle.HIGHEST_PROTOCOL,
):
    assert train_data is None or len(train_data) == 2, (
        "'train_data' argument, if given, must be in the form (X, y), "
        "where 'X' is the independent attributes and 'y' is the target attribute."
    )

    assert (
        attr_labels == "infer" or attr_labels is None or hasattr(attr_labels, "__len__")
    ), "'attr_labels' must be None, 'infer' or a sequence of values."

    assert isinstance(
        model,
        (
            sklearn.ensemble.RandomForestClassifier,
            sklearn.ensemble.RandomForestRegressor,
            sklearn.tree.DecisionTreeClassifier,
            sklearn.tree.DecisionTreeRegressor,
        ),
    )

    if not output_uri.endswith(".pkl"):
        output_uri += ".pkl"

    package = {
        "model": model,
        "train_data": train_data,
        "attr_labels": attr_labels,
    }

    with open(output_uri, "wb") as f_out:
        pickle.dump(package, f_out)
