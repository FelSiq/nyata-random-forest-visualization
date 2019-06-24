import flask

from . import model_dt

def create_app():
    """DT visualization application factory."""
    app = flask.Flask(__name__, instance_relative_config=True)

    @app.route("/dt-visualization")
    def visualization():
        return model_dt.serialize_decision_tree(model_dt.get_toy_model())

    return app
