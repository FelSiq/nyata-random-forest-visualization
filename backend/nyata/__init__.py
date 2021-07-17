"""App module of the DT/TF visualization backend."""

import typing as t
import re
import collections
import pickle

import flask
import flask_cors
import flask_restful
import flask_restful.reqparse
import flask_session
import werkzeug
import numpy as np
import pandas as pd
import sklearn.tree
import sklearn.base

from . import utils
from . import model_dt
from . import serialize
from . import config
from . import gen_reports
from .create_pickle import *


class _BaseResourceClass(flask_restful.Resource):
    """Base class for DT/RF visualization resources."""

    def delete(self, verbose: bool = True):
        if verbose:
            print("Nothing to clean for", self.__class__)

        return "", 204


class SessionInformation(_BaseResourceClass):
    def __init__(self, **kwargs):
        super(SessionInformation, self).__init__()

    def get(self):
        """Serialize and jsonify a sklearn RF/DT model."""
        model = flask.session.get("model")
        X = flask.session.get("X")
        y = flask.session.get("y")

        res = flask.jsonify(
            {
                "is_forest": utils.is_forest(model),
                "is_classifier": sklearn.base.is_classifier(model),
                "X_given": X is not None,
                "y_given": y is not None,
            }
        )

        return res


class DecisionTree(_BaseResourceClass):
    """Class dedicated to serialize and jsonify a sklearn DT/RF model."""

    def __init__(self, **kwargs):
        super(DecisionTree, self).__init__()

        self.model = None
        self.X = None
        self.y = None
        self.attr_labels = None
        self.preproc_pipeline = None

        if flask.session and flask.session.get("model"):
            self.model = flask.session["model"]
            self.X = flask.session["X"]
            self.y = flask.session["y"]
            self.attr_labels = flask.session["attr_labels"]
            self.preproc_pipeline = flask.session["preproc_pipeline"]

        self.reqparse = flask_restful.reqparse.RequestParser()
        self.reqparse.add_argument(
            "file", type=werkzeug.datastructures.FileStorage, location="files"
        )

    def post(self):
        args = self.reqparse.parse_args()
        data_pickle = args["file"]
        data = pickle.load(data_pickle)

        model = data["model"]
        preproc_pipeline = data.get("preproc_pipeline")

        if model is None:
            return "Model not found in the given .pickle file.", 400

        if preproc_pipeline is not None and not utils.is_valid_transformer(
            preproc_pipeline
        ):
            return f"Unsupported preprocessing pipeline: {type(preproc_pipeline)}", 400

        if not utils.is_valid_model(model):
            return f"Unsupported model: {type(model)}", 400

        try:
            X, y = data.get("train_data")

        except TypeError:
            X, y = (None, None)

        attr_labels = data.get("attr_labels")

        self.model = model
        self.preproc_pipeline = preproc_pipeline
        self.attr_labels = attr_labels

        if X is not None:
            self.X = np.asfarray(X)

        if y is not None:
            self.y = np.asarray(y)

            if self.attr_labels is not None and self.attr_labels == "infer":
                self.attr_labels = np.unique(self.y)

        flask.session["model"] = self.model
        flask.session["X"] = self.X
        flask.session["y"] = self.y
        flask.session["attr_labels"] = self.attr_labels
        flask.session["preproc_pipeline"] = self.preproc_pipeline

        flask.session.modified = True

        return "Success", 200

    def get(self):
        """Serialize and jsonify a sklearn RF/DT model."""
        res = flask.jsonify(
            serialize.serialize_decision_tree(
                dt_model=flask.session["model"],
                attr_labels=flask.session["attr_labels"],
            )
        )

        return res

    def delete(self, verbose: bool = True):
        flask.session.clear()

        if verbose:
            print("Successfully cleared flask session for", self.__class__)

        flask.session.modified = True

        res = flask.make_response(("Success", 200, {"Content-Type": "text/plain"}))

        return res


class PredictDataset(_BaseResourceClass):
    """Class dedicated to give methods for predicting a whole dataset."""

    def __init__(self, **kwargs):
        """."""
        super(PredictDataset, self).__init__()

        self.reqparse = flask_restful.reqparse.RequestParser()
        self.reqparse.add_argument(
            "file", type=werkzeug.datastructures.FileStorage, location="files"
        )
        self.reqparse.add_argument("sep", type=str, location="form")
        self.reqparse.add_argument("hasHeader", type=int, location="form")
        self.reqparse.add_argument("hasClasses", type=int, location="form")

    def post(self):
        """Make predictions and give metrics for the user-given dataset."""
        model = flask.session.get("model")
        preproc_pipeline = flask.session.get("preproc_pipeline")

        args = self.reqparse.parse_args()

        dataset_file = args["file"]
        sep = args["sep"]
        has_header = bool(args["hasHeader"])
        has_classes = bool(args["hasClasses"])

        data = pd.read_csv(
            filepath_or_buffer=dataset_file,
            sep=sep,
            header="infer" if has_header else None,
        )

        if has_classes:
            X = data.iloc[:, :-1].values
            y = data.iloc[:, -1].values
            y_ohe = None  # model_dt.hot_encoding(y)
            preds_proba = None  # self.model.predict_proba(X)

        else:
            X = data.values
            y = None
            y_ohe = None
            preds_proba = None

        if preproc_pipeline is not None:
            X = preproc_pipeline.transform(X)

        preds = model.predict(X)

        res = flask.jsonify(
            model_dt.get_metrics(
                dt_model=model,
                preds=preds,
                true_labels=y,
                preds_proba=preds_proba,
                true_labels_ohe=y_ohe,
            )
        )

        return res


class PredictSingleInstance(_BaseResourceClass):
    """Class dedicated to provide methods for predicting a single instance."""

    def __init__(self, **kwargs):
        """."""
        super(PredictSingleInstance, self).__init__()

        self.reqparse = flask_restful.reqparse.RequestParser()
        self.reqparse.add_argument("instance", type=str)

    @staticmethod
    def _preproc_single_inst(instance: str, sep: str = ",") -> t.Optional[np.ndarray]:
        """Preprocess the user-given single instance."""
        inst_proc = np.array(utils.RE_EMPTY_SPACE.sub("", instance).split(sep))

        if not set(map(str.lower, inst_proc)).isdisjoint(utils.NULL_VALUES):
            return None, {"ERROR_MISSING_VAL"}

        try:
            inst_proc = np.asfarray(inst_proc)

        except ValueError:
            return None, {"ERROR_INVALID_VAL"}

        inst_proc = np.atleast_2d(inst_proc)

        preproc_pipeline = flask.session.get("preproc_pipeline")

        if preproc_pipeline is not None:
            inst_proc = preproc_pipeline.transform(inst_proc)

        return inst_proc, {}

    @staticmethod
    def _handle_errors(err_code: t.Sequence[str]) -> t.Dict[str, t.Dict[str, str]]:
        """Handle probable errors found while predicting the instance."""
        err_msg = {}

        if "ERROR_MISSING_VAL" in err_code:
            err_msg["error"] = {"value": "Currently missing values are not supported."}

        if "ERROR_INVALID_VAL" in err_code:
            err_msg["error"] = {
                "value": (
                    "Invalid values in instance features. "
                    "Please provide numeric-only values."
                ),
            }

        return err_msg

    def _decision_path(
        self, model, inst_proc: np.ndarray
    ) -> t.Sequence[t.Sequence[int]]:
        """Get the decision path of the instace for every tree in the model."""
        if utils.is_tree(model):
            nodes = [model.decision_path(inst_proc).indices]

        else:
            dec_path, indices = model.decision_path(inst_proc)

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

    def post(self):
        """Predict single instance and provide information."""
        args = self.reqparse.parse_args()
        instance = args["instance"]

        model = flask.session.get("model")

        inst_proc, err_codes = self._preproc_single_inst(instance)

        if err_codes:
            return flask.jsonify(self._handle_errors(err_codes))

        classes_by_tree, margin = model_dt.get_class_freqs(model, inst_proc)
        preds_quants, preds_std = model_dt.get_regression_distrib_stats(
            model, inst_proc
        )
        preds = f"{model.predict(inst_proc).squeeze():.3f}"

        pred_vals = serialize.json_encoder_type_manager(
            collections.OrderedDict(
                (
                    (
                        "prediction_result",
                        descriptions.add_desc(
                            value=preds,
                            from_id="prediction_result",
                        ),
                    ),
                    (
                        "classes_by_tree",
                        descriptions.add_desc(
                            value=classes_by_tree,
                            from_id="classes_by_tree",
                        ),
                    ),
                    (
                        "margin",
                        descriptions.add_desc(
                            value=margin,
                            from_id="pred_margin",
                        ),
                    ),
                    (
                        "predictions_standard_deviation",
                        descriptions.add_desc(
                            value=preds_std,
                            from_id="preds_std",
                        ),
                    ),
                    (
                        "predictions_quantiles",
                        descriptions.add_desc(
                            value=preds_quants,
                            from_id="preds_quantiles",
                        ),
                    ),
                    (
                        "decision_path",
                        {
                            "value": self._decision_path(model, inst_proc),
                        },
                    ),
                    (
                        "leaf_id",
                        {
                            "value": model.apply(inst_proc)[0],
                        },
                    ),
                )
            )
        )

        res = flask.jsonify(pred_vals)

        return res


class MostCommonAttrSeq(_BaseResourceClass):
    """Find the most common sequence of attributes in the forest."""

    def __init__(self, **kwargs):
        super(MostCommonAttrSeq, self).__init__()

        self.reqparse = flask_restful.reqparse.RequestParser()
        self.reqparse.add_argument("seq_num", type=int)
        self.reqparse.add_argument("include_node_decision", type=int)

    def post(self, gen_report: bool = True):
        model = flask.session.get("model")

        args = self.reqparse.parse_args()
        seq_num = args["seq_num"]
        include_node_decision = bool(args["include_node_decision"])

        top_common_seqs = model_dt.top_most_common_attr_seq(
            model, seq_num=seq_num, include_node_decision=include_node_decision
        )

        if gen_report:
            gen_reports.report_most_common_seq(
                top_common_seqs=top_common_seqs,
                include_node_decision=include_node_decision,
            )

        res = flask.jsonify(serialize.json_encoder_type_manager(top_common_seqs))

        return res


class ForestHierarchicalClustering(_BaseResourceClass):
    """Perform a hierarchical clustering using each tree DNA."""

    def __init__(self, **kwargs):
        super(ForestHierarchicalClustering, self).__init__()

        self.reqparse_post = flask_restful.reqparse.RequestParser()
        self.reqparse_post.add_argument("threshold_cut", type=float)
        self.reqparse_post.add_argument("linkage", type=str)
        self.reqparse_post.add_argument("strategy", type=str)

        self.reqparse_update = flask_restful.reqparse.RequestParser()
        self.reqparse_update.add_argument("threshold_cut", type=float)

    def post(self, gen_report: bool = True):
        model = flask.session.get("model")
        X = flask.session.get("X")

        args = self.reqparse_post.parse_args()

        threshold_cut = args.get("threshold_cut", 0.5)
        linkage = args.get("linkage", "average")
        strategy = args.get("strategy", "dna")

        if strategy not in ("dna", "metafeatures"):
            raise ValueError("'strategy' must be either 'dna' or 'metafeatures.'")

        if strategy == "dna":
            if X is None:
                return "DNA strategy requires training data alongside the model.", 400

            dist_mat, dist_formula, max_dist = model_dt.calc_dna_dist_mat(
                model=model, X=X
            )

        else:
            dist_mat, dist_formula, max_dist = model_dt.calc_mtf_dist_mat(model=model)

        dist_mat[np.isnan(dist_mat)] = 0.0
        hier_clus_data = model_dt.get_hierarchical_cluster(
            dist_mat=dist_mat, linkage=linkage
        )

        hier_clus_data.update(
            model_dt.make_hier_clus_cut(
                dendrogram=hier_clus_data.get("dendrogram"),
                dist_mat=dist_mat,
                threshold_cut=max_dist * threshold_cut,
            )
        )

        hier_clus_data.update(
            {
                "hier_clus_distance": "f(x) = {}".format(dist_formula),
                "max_limit": max_dist,
            }
        )

        flask.session["hier_clus_data"] = hier_clus_data
        flask.session["dist_mat"] = dist_mat
        flask.session["max_dist"] = max_dist

        if gen_report:
            gen_reports.report_hier_clus(
                hier_clus_data=hier_clus_data, threshold_cut=max_dist * threshold_cut
            )

        response = flask.jsonify(serialize.json_encoder_type_manager(hier_clus_data))

        flask.session.modified = True

        return response

    def delete(self, verbose: bool = True):
        flask.session.pop("hier_clus_data", None)
        flask.session.pop("dist_mat", None)
        flask.session.pop("max_dist", None)

        if verbose:
            print("Deleted session data for", self.__class__)

        flask.session.modified = True

        res = flask.make_response(("Success", 200, {"Content-Type": "text/plain"}))

        return res

    def put(self, gen_report: bool = False):
        args = self.reqparse_update.parse_args()

        threshold_cut = args.get("threshold_cut", 0.5)

        hier_clus_data = flask.session.get("hier_clus_data")
        dist_mat = flask.session.get("dist_mat")
        max_dist = flask.session.get("max_dist")

        if hier_clus_data is None:
            raise ValueError("No hierarchical clustering hier_clus_data found.")

        hier_clus_data = model_dt.make_hier_clus_cut(
            dendrogram=hier_clus_data.get("dendrogram"),
            dist_mat=dist_mat,
            threshold_cut=max_dist * threshold_cut,
        )

        flask.session["hier_clus_data"].update(hier_clus_data)

        if gen_report:
            gen_reports.report_hier_clus(
                hier_clus_data=hier_clus_data, threshold_cut=max_dist * threshold_cut
            )

        response = flask.jsonify(serialize.json_encoder_type_manager(hier_clus_data))

        flask.session.modified = True

        return response


def create_app():
    """DT visualization application factory."""
    app = flask.Flask(__name__, instance_relative_config=False)
    app.config.from_object(config.Config)
    flask_cors.CORS(app, supports_credentials=True)
    api = flask_restful.Api(app)
    flask_session.Session(app)

    api.add_resource(SessionInformation, "/session-information")
    api.add_resource(DecisionTree, "/dt-visualization")
    api.add_resource(PredictSingleInstance, "/predict-single-instance")
    api.add_resource(PredictDataset, "/predict-dataset")
    api.add_resource(MostCommonAttrSeq, "/most-common-attr-seq")
    api.add_resource(ForestHierarchicalClustering, "/forest-hierarchical-clustering")

    return app
