import os 

import redis


class Config:
    """Set Flask configuration vars from .env file."""
    FLASK_ENV = os.environ.get("FLASK_ENV")
    FLASK_APP = os.environ.get("FLASK_APP")
    FLASK_DEBUG = os.environ.get("FLASK_DEBUG")
    SESSION_COOKIE_NAME = os.environ.get("SESSION_COOKIE_NAME", "rfvisual")
    SESSION_TYPE = os.environ.get("SESSION_TYPE", "redis")
    SESSION_REDIS = redis.from_url(
        os.environ.get("SESSION_REDIS", "redis://127.0.0.1:6379"))
    SESSION_USE_SIGNER = os.environ.get("SESSION_USE_SIGNER", False)
    SECRET_KEY = os.environ.get("SECRET_KEY")
    SESSION_COOKIE_SECURE = bool(int(os.environ.get("SESSION_COOKIE_SECURE", False)))
    SESSION_PERMANENT = bool(int(os.environ.get("SESSION_PERMANENT", False)))
    PERMANENT_SESSION_LIFETIME = int(os.environ.get("PERMANENT_SESSION_LIFETIME", 60 * 60 * 2))
