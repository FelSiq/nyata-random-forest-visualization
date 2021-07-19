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
    attr_labels: t.Optional[t.Sequence] = None,
    output_uri: str = "nyata_package.pickle",
    preprocessing_pipeline: t.Optional[
        t.Union[sklearn.base.TransformerMixin, sklearn.pipeline.Pipeline]
    ] = None,
    protocol: int = pickle.HIGHEST_PROTOCOL,
):
    """Create a .pickle file specific for Nyata.

    Arguments
    ---------
    model : scikit-learn tree or ensemble model
        Fitted scikit-learn model. Can be one of the following:
            - sklearn.tree.DecisionTreeClassifier
            - sklearn.tree.DecisionTreeRegressor
            - sklearn.ensemble.RandomForestClassifier
            - sklearn.ensemble.RandomForestRegressor
            - sklearn.ensemble.ExtraTreesClassifier
            - sklearn.ensemble.ExtraTreesRegressor

    train_data : tuple (X, y) (optional)
        Tuple with the training data used to fit 'model'. It is necessary to
        provide the training data alongside the model if you plan to use the
        'DNA' strategy to perform hierarchical clustering in your forest.

    attr_labels : str or list-like (optional)
        Name of train dataset features. If not provided, generic feature names
        in the format 'attr_{i}', where 'i' is the feature index will be
        created.

    preprocessing_pipeline : scikit-learn data transformer or Pipeline (optional)
        A single scikit-learn data transformer or a full scikit-learn Pipeline
        to preprocess data/instances before providing to the tree/forest model
        for predictions. It can be useful, for instance, to handle missing values
        beforehand, since scikit-learn models does not support missing values.

    protocol : int (optional)
        Pickle protocol to be used. By default will be the highest protocol, which
        is more optimized but less compatible with older versions.
    """
    assert train_data is None or len(train_data) == 2, (
        "'train_data' argument, if given, must be in the form (X, y), "
        "where 'X' is the independent attributes and 'y' is the target attribute."
    )

    assert attr_labels is None or hasattr(
        attr_labels, "__len__"
    ), "'attr_labels' must be None, 'infer' or a sequence of values."

    if attr_labels is not None:
        attr_labels = tuple(attr_labels)

    if train_data is not None:
        X, y = train_data
        assert X.shape[1] == len(attr_labels)
        assert len(y) == len(X)

    assert utils.is_valid_model(
        model, deep_check_ensemble=True
    ), f"Invalid model: {type(model)}"

    assert preprocessing_pipeline is None or utils.is_valid_transformer(
        preprocessing_pipeline
    )

    if not output_uri.endswith(".pickle"):
        output_uri += ".pickle"

    sklearn.utils.validation.check_is_fitted(model)
    package = {"model": model}

    if train_data is not None:
        package["train_data"] = train_data

    if attr_labels is not None:
        package["attr_labels"] = attr_labels

    if preprocessing_pipeline is not None:
        if isinstance(preprocessing_pipeline, sklearn.pipeline.Pipeline):
            for p in preprocessing_pipeline:
                sklearn.utils.validation.check_is_fitted(p)
        else:
            sklearn.utils.validation.check_is_fitted(preprocessing_pipeline)

        package["preproc_pipeline"] = preprocessing_pipeline

    with open(output_uri, "wb") as f_out:
        pickle.dump(package, f_out)
