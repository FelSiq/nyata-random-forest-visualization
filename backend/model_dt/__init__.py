import flask


def create_app():
    """DT visualization application factory."""
    app = flask.Flask(__name__, instance_relative_config=True)

    @app.route("/dt-visualization")
    def visualization():
        return "Hello world!"

    return app
