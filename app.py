from pathlib import Path

from flask import Flask, render_template, request, redirect, url_for, session

from config import Config, INSTANCE_DIR
from routes.api import api_bp
from services.database import init_db, get_user, create_user
from werkzeug.security import generate_password_hash, check_password_hash
import re


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    Path(INSTANCE_DIR).mkdir(parents=True, exist_ok=True)
    init_db(app.config["DATABASE"])

    # Auto-seed users on startup
    with app.app_context():
        db = app.config["DATABASE"]
        default_users = [
            ("superadmin", "SafeSight2026!", "superadmin"),
            ("admin", "SafeSight2026!", "admin")
        ]
        for uname, pword, role in default_users:
            if not get_user(db, uname):
                create_user(db, uname, generate_password_hash(pword), role)



    def is_strong_password(password):
        if len(password) < 8: return False
        if not re.search("[a-z]", password): return False
        if not re.search("[A-Z]", password): return False
        if not re.search("[0-9]", password): return False
        if not re.search("[_@$!%*#?&]", password): return False
        return True

    @app.route("/", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            username = request.form.get("username")
            password = request.form.get("password")
            
            user = get_user(app.config["DATABASE"], username)
            
            if user and check_password_hash(user["password"], password):
                session["user"] = username
                session["role"] = user["role"]
                return redirect(url_for("dashboard"))

            return render_template("login.html", error="Invalid username or password")

        return render_template("login.html")

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            username = request.form.get("username")
            password = request.form.get("password")

            if not is_strong_password(password):
                return render_template("register.html", error="Password is too weak! Use 8+ chars, uppercase, number, and symbol.")

            if get_user(app.config["DATABASE"], username):
                return render_template("register.html", error="Username already exists!")

            hashed_pw = generate_password_hash(password)
            if create_user(app.config["DATABASE"], username, hashed_pw):
                return redirect(url_for("login"))
            
            return render_template("register.html", error="Something went wrong.")

        return render_template("register.html")

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