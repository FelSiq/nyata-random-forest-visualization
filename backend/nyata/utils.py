"""Generic utility functions."""
import sklearn.tree
import sklearn.ensemble
import re

NULL_VALUES = {
    "null",
    "nan",
    "na",
    "none",
    "noone",
    "",
    "nil",
}
"""Values in the instances to be interpreted as missing values."""

RE_EMPTY_SPACE = re.compile(r"\s+|%20")
"""Regular expression for empty spaces to preprocess given instances."""

RE_KEY_NUMBEROF = re.compile(r"\bn \b")
"""Regular expression for getting 'n ' string, to format JSON keys."""
RE_KEY_MIN = re.compile(r"\bmin\b")
"""Regular expression for getting 'min' string, to format JSON keys."""
RE_KEY_MAX = re.compile(r"\bmax\b")
"""Regular expression for getting 'max' string, to format JSON keys."""
RE_KEY_PARAMS = re.compile(r"\bparams\b")
"""Regular expression for getting 'params' string, to format JSON keys."""


def preprocess_key(key: str) -> str:
    """Transform the sklearn model dict keys into a more user-readable value."""
    key = key.replace("_", " ")
    key = RE_KEY_NUMBEROF.sub("number of ", key)
    key = RE_KEY_MAX.sub("maximum", key)
    key = RE_KEY_MIN.sub("minimum", key)
    key = RE_KEY_PARAMS.sub("parameters", key)
    key = key.replace(" ", "_")
    return key


def is_tree(model):
    return isinstance(
        model, (sklearn.tree.DecisionTreeClassifier, sklearn.tree.DecisionTreeRegressor)
    )


def is_forest(model):
    return isinstance(
        model,
        (
            sklearn.ensemble.RandomForestClassifier,
            sklearn.ensemble.RandomForestRegressor,
        ),
    )


def is_valid_model(model):
    return is_tree(model) or is_forest(model)
