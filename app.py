from pathlib import Path

from flask import Flask, render_template, request, redirect, url_for, session

from config import Config, INSTANCE_DIR
from routes.api import api_bp
from services.database import init_db


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    Path(INSTANCE_DIR).mkdir(parents=True, exist_ok=True)
    init_db(app.config["DATABASE"])

    USERS = {
        "superadmin": {"password": "123", "role": "superadmin"},
        "admin": {"password": "123", "role": "admin"}
    }

    @app.route("/", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            username = request.form.get("username")
            password = request.form.get("password")

            if username in USERS and USERS[username]["password"] == password:
                session["user"] = username
                session["role"] = USERS[username]["role"]
                return redirect(url_for("dashboard"))

            return render_template("login.html", error="Username atau password salah")

        return render_template("login.html")

    @app.route("/dashboard")
    def dashboard():
        if "user" not in session:
            return redirect(url_for("login"))

        return render_template(
            "index.html",
            app_name="SafeSight K3",
            capture_interval=app.config["CAPTURE_INTERVAL_MS"],
            role=session.get("role", "admin")
        )

    @app.route("/logout")
    def logout():
        session.pop("user", None)
        return redirect(url_for("login"))

    app.register_blueprint(api_bp, url_prefix="/api")
    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)