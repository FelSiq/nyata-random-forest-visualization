import typing as t
import re
import collections

import flask
import flask_cors
import flask_restful
import numpy as np

from . import model_dt

NULL_VALUES = {
    'null',
    'nan',
    'na',
    'none',
    'noone',
    '',
    'nil',
}

RE_EMPTY_SPACE = re.compile(r'\s+|%20')


class DecisionTree(flask_restful.Resource):
    def __init__(self, model):
        self.model = model

    def get(self):
        return flask.jsonify(model_dt.serialize_decision_tree(self.model))


class PredictSingleInstance(flask_restful.Resource):
    def __init__(self, model):
        self.model = model

    def _preprocess_instance(self, instance: str,
                             sep: str = ',') -> t.Optional[np.ndarray]:
        preproc_inst = np.array(RE_EMPTY_SPACE.sub('', instance).split(sep))

        if not set(map(str.lower, preproc_inst)).isdisjoint(NULL_VALUES):
            return None

        return preproc_inst.astype(np.float32).reshape(1, -1)

    def _handle_errors(self, err_code: t.Sequence[str]) -> t.Dict[str, str]:
        err_msg = {}

        if 'NA_ERROR' in err_code:
            err_msg['na_error'] = 'Currently missing values are not supported.'

        return err_msg

    def get(self, instance: str):
        inst_proc = self._preprocess_instance(instance)
        err_code = []

        if inst_proc is None:
            err_code.append('NA_ERROR')

        if err_code:
            return flask.jsonify(self._handle_errors(err_code))

        pred_vals = model_dt.json_encoder_type_manager(
            collections.OrderedDict((
                ('predicted_class', {
                    'value': self.model.predict(inst_proc)[0]
                }),
                ('classes_by_tree', {
                    'value': model_dt.get_class_freqs(self.model, inst_proc)
                }),
                ('decision_path', {
                    'value': self.model.decision_path(inst_proc)
                }),
                ('leaf_id', {
                    'value': self.model.apply(inst_proc)[0]
                }),
            )))

        return flask.jsonify(pred_vals)


def create_app():
    """DT visualization application factory."""
    app = flask.Flask(__name__, instance_relative_config=True)

    flask_cors.CORS(app)
    api = flask_restful.Api(app)

    dt_model = model_dt.get_toy_model()

    common_kwargs = {'model': dt_model}

    api.add_resource(
        DecisionTree, '/dt-visualization', resource_class_kwargs=common_kwargs)

    api.add_resource(
        PredictSingleInstance,
        '/predict-single-instance/<string:instance>',
        resource_class_kwargs=common_kwargs)

    return app
