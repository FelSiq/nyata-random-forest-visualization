import flask
import flask_cors
import flask_restful
import numpy as np

from . import model_dt

class DecisionTree(flask_restful.Resource):
    def __init__(self, model):
        self.model = model

    def get(self):
        return flask.jsonify(model_dt.serialize_decision_tree(self.model))

class PredictSingleInstance(flask_restful.Resource):
    def __init__(self, model):
        self.model = model

    def _preprocess_instance(self, instance: str) -> np.ndarray:
        return np.array(instance.split(','), dtype=np.float).reshape(1, -1)

    def get(self, instance: str):
        inst_proc = self._preprocess_instance(instance)
        preds = self.model.predict(inst_proc)
        print(instance, preds)
        return flask.jsonify(model_dt.json_encoder_type_manager(preds))

def create_app():
    """DT visualization application factory."""
    app = flask.Flask(__name__, instance_relative_config=True)

    flask_cors.CORS(app)
    api = flask_restful.Api(app)

    dt_model = model_dt.get_toy_model()

    common_kwargs = {'model': dt_model}

    api.add_resource(
        DecisionTree,
        '/dt-visualization',
        resource_class_kwargs=common_kwargs)

    api.add_resource(
        PredictSingleInstance,
        '/predict-single-instance/<string:instance>',
        resource_class_kwargs=common_kwargs)

    return app
