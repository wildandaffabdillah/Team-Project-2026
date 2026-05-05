from services.database import init_db, create_user, get_user
from werkzeug.security import generate_password_hash
from config import Config

def seed_users():
    db_path = Config.DATABASE
    init_db(db_path)
    
    # Create default users if they don't exist
    users_to_seed = [
        ("superadmin", "SafeSight2026!", "superadmin"),
        ("admin", "SafeSight2026!", "admin")
    ]
    
    for username, password, role in users_to_seed:
        if not get_user(db_path, username):
            hashed_pw = generate_password_hash(password)
            create_user(db_path, username, hashed_pw, role)
            print(f"User {username} seeded successfully.")
        else:
            print(f"User {username} already exists.")

if __name__ == "__main__":
    seed_users()
