import typing as t
import re
import collections

import flask
import flask_cors
import flask_restful
import flask_restful.reqparse
import werkzeug
import numpy as np
import pandas as pd

from . import model_dt

NULL_VALUES = {
    "null",
    "nan",
    "na",
    "none",
    "noone",
    "",
    "nil",
}

RE_EMPTY_SPACE = re.compile(r"\s+|%20")


class DecisionTree(flask_restful.Resource):
    def __init__(self,
                 model,
                 X: np.ndarray,
                 y: np.ndarray,
                 attr_labels: t.Optional[t.Sequence[str]] = None):
        self.model = model
        self.X = X
        self.y = y
        self.attr_labels = attr_labels

    def get(self):
        return flask.jsonify(model_dt.serialize_decision_tree(
            dt_model=self.model,
            attr_labels=self.attr_labels))


class PredictDataset(flask_restful.Resource):
    def __init__(self,
                 model,
                 X: np.ndarray,
                 y: np.ndarray,
                 attr_labels: t.Optional[t.Sequence[str]] = None):
        self.model = model
        self.X = X
        self.y = y
        self.attr_labels = attr_labels

        self.reqparse = flask_restful.reqparse.RequestParser()

        self.reqparse.add_argument(
            "file",
            type=werkzeug.datastructures.FileStorage,
            location="files")

        self.reqparse.add_argument(
            "sep", type=str, location="form")

        self.reqparse.add_argument(
            "hasHeader", type=bool, location="form")

        self.reqparse.add_argument(
            "hasClasses", type=bool, location="form")

    def post(self):
        args = self.reqparse.parse_args()

        dataset_file = args["file"]
        sep = args["sep"]
        has_header = args["hasHeader"]
        has_classes = args["hasClasses"]

        data = pd.read_csv(
            filepath_or_buffer=dataset_file,
            sep=sep,
            header="infer" if has_header else None)

        if has_classes:
            X = data.iloc[:, :-1].values
            y = data.iloc[:,  -1].values

        else:
            X = data.values
            y = None

        preds = self.model.predict(X)

        return flask.jsonify(model_dt.get_metrics(
            dt_model=self.model,
            preds=preds,
            true_labels=y))
        

class PredictSingleInstance(flask_restful.Resource):
    def __init__(self,
                 model,
                 X: np.ndarray,
                 y: np.ndarray,
                 attr_labels: t.Optional[t.Sequence[str]] = None):
        self.model = model
        self.X = X
        self.y = y
        self.attr_labels = attr_labels

    def _preprocess_instance(self, instance: str,
                             sep: str = ",") -> t.Optional[np.ndarray]:
        preproc_inst = np.array(RE_EMPTY_SPACE.sub("", instance).split(sep))

        if not set(map(str.lower, preproc_inst)).isdisjoint(NULL_VALUES):
            return None

        return preproc_inst.astype(np.float32).reshape(1, -1)

    def _handle_errors(self, err_code: t.Sequence[str]) -> t.Dict[str, str]:
        err_msg = {}

        if "ERROR_MISSING_VAL" in err_code:
            err_msg["na_error"] = "Currently missing values are not supported."

        return err_msg

    def _decision_path(self, inst_proc: np.ndarray) -> t.Sequence[t.Sequence[int]]:
        dec_path, indices = self.model.decision_path(inst_proc)
        
        nodes = []
        base_index = 0
        next_tree_id = 0
        
        for value in dec_path.indices:
            if value == indices[next_tree_id]:
                base_index = value
                next_tree_id += 1
                nodes.append([])

            nodes[-1].append(value - base_index)

        return nodes

    def get(self, instance: str):
        inst_proc = self._preprocess_instance(instance)
        err_code = []

        if inst_proc is None:
            err_code.append("ERROR_MISSING_VAL")

        if err_code:
            return flask.jsonify(self._handle_errors(err_code))

        pred_vals = model_dt.json_encoder_type_manager(
            collections.OrderedDict((
                ("prediction_result", {
                    "value": self.model.predict(inst_proc)[0]
                }),
                ("classes_by_tree", {
                    "value": model_dt.get_class_freqs(self.model, inst_proc)
                }),
                ("decision_path", {
                    "value": self._decision_path(inst_proc)
                }),
                ("leaf_id", {
                    "value": self.model.apply(inst_proc)[0]
                }),
            )))

        return flask.jsonify(pred_vals)


def create_app():
    """DT visualization application factory."""
    app = flask.Flask(__name__, instance_relative_config=True)

    flask_cors.CORS(app)
    api = flask_restful.Api(app)

    dt_model, X, y, attr_labels = model_dt.get_toy_model()

    common_kwargs = {
        "model": dt_model,
        "X": X,
        "y": y,
        "attr_labels": attr_labels,
    }

    api.add_resource(
        DecisionTree, "/dt-visualization", resource_class_kwargs=common_kwargs)

    api.add_resource(
        PredictSingleInstance,
        "/predict-single-instance/<string:instance>",
        resource_class_kwargs=common_kwargs)

    api.add_resource(
        PredictDataset,
        "/predict-dataset",
        resource_class_kwargs=common_kwargs)

    return app
