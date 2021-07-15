def get_toy_model(forest: bool = True, regressor: bool = False):
    """Create a DT/RF toy model for testing purposes."""
    import numpy as np  # linear algebra
    import sklearn.tree
    import sklearn.ensemble
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
            "min_samples_split": 2,
            "min_samples_leaf": 1,
        }
    else:
        args = {}

    model = algorithms.get((forest, regressor), sklearn.tree.DecisionTreeClassifier)(
        **args
    )
    model.fit(iris.data, iris.target)

    return model, X, y, attr_labels


def get_custom_model():
    pass
