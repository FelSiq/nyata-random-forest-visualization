import flask
import flask_cors
import flask_restful

from . import model_dt

class DecisionTree(flask_restful.Resource):
    def get(self):
        return flask.jsonify(model_dt.serialize_decision_tree(model_dt.get_toy_model()))

def create_app():
    """DT visualization application factory."""
    app = flask.Flask(__name__, instance_relative_config=True)

    flask_cors.CORS(app)
    api = flask_restful.Api(app)

    api.add_resource(DecisionTree, '/dt-visualization')

    return app
