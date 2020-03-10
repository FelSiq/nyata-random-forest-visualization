"""Generic utility functions."""
import re

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
