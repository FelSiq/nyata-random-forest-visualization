import typing as t

import pickle
import numpy as np
import sklearn.ensemble
import sklearn.tree
import sklearn.base
import sklearn.pipeline

from . import utils


def dump(
    model,
    train_data: t.Optional[t.Tuple[np.ndarray, np.ndarray]] = None,
    attr_labels: t.Optional[t.Union[str, t.Sequence]] = "infer",
    output_uri: str = "nyata_package.pickle",
    preprocessing_pipeline: t.Optional[
        t.Union[sklearn.base.TransformerMixin, sklearn.pipeline.Pipeline]
    ] = None,
    protocol: int = pickle.HIGHEST_PROTOCOL,
):
    assert train_data is None or len(train_data) == 2, (
        "'train_data' argument, if given, must be in the form (X, y), "
        "where 'X' is the independent attributes and 'y' is the target attribute."
    )

    assert (
        attr_labels == "infer" or attr_labels is None or hasattr(attr_labels, "__len__")
    ), "'attr_labels' must be None, 'infer' or a sequence of values."

    assert utils.is_valid_model(
        model, deep_check_ensemble=True
    ), f"Invalid model: {type(model)}"

    assert preprocessing_pipeline is None or utils.is_valid_transformer(
        preprocessing_pipeline
    )

    if not output_uri.endswith(".pickle"):
        output_uri += ".pickle"

    package = {"model": model}

    if train_data is not None:
        package["train_data"] = train_data

    if attr_labels is not None:
        package["attr_labels"] = attr_labels

    if attr_labels is not None:
        package["preproc_pipeline"] = preprocessing_pipeline

    with open(output_uri, "wb") as f_out:
        pickle.dump(package, f_out)
