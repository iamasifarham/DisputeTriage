

import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from passlib.hash import pbkdf2_sha256 as pwd_hasher

# -----------------------------
# DB PATH (absolute)
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent   # backend/
DB_PATH = BASE_DIR / "data" / "processed" / "users.db"
print("\nUSERS DB PATH:", DB_PATH, "\n")

# -----------------------------
# DB CONNECTION
# -----------------------------
def get_users_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# -----------------------------
# CREATE TABLE
# -----------------------------
def initialize_users_db():
    conn = get_users_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            username TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            otp_code TEXT,
            otp_expiry TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

# -----------------------------
# INIT FUNCTION  table + folder
# -----------------------------
def init_users_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    initialize_users_db()

# -----------------------------
# USER FUNCTIONS
# -----------------------------
def create_user(full_name, username, email, phone, password, role):
    conn = get_users_connection()
    cur = conn.cursor()

    password_hash = pwd_hasher.hash(password)

    cur.execute("""
        INSERT INTO users (full_name, username, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (full_name, username, email, phone, password_hash, role))

    conn.commit()
    conn.close()

def update_password(user_id, new_password):
    conn = get_users_connection()
    cur = conn.cursor()

    new_hash = pwd_hasher.hash(new_password)

    cur.execute("""
        UPDATE users SET password_hash = ? WHERE id = ?
    """, (new_hash, user_id))

    conn.commit()
    conn.close()

def verify_password(password, password_hash):
    return pwd_hasher.verify(password, password_hash)

def save_otp(username, otp_code, expiry_minutes=10):
    conn = get_users_connection()
    cur = conn.cursor()

    expiry = (datetime.utcnow() + timedelta(minutes=expiry_minutes)).isoformat()

    cur.execute("""
        UPDATE users
        SET otp_code = ?, otp_expiry = ?
        WHERE username = ?
    """, (otp_code, expiry, username))

    conn.commit()
    conn.close()

def verify_otp(username, otp_code):
    conn = get_users_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cur.fetchone()

    if not row:
        conn.close()
        return False, "User not found"

    # OTP was never generated
    if row["otp_code"] is None:
        conn.close()
        return False, "OTP not generated"

    # Expiry missing
    if row["otp_expiry"] is None:
        conn.close()
        return False, "OTP expired or invalid"

    # OTP mismatch
    if row["otp_code"] != otp_code:
        conn.close()
        return False, "Invalid OTP"

    # Parse expiry safely
    try:
        expiry = datetime.fromisoformat(row["otp_expiry"])
    except Exception:
        conn.close()
        return False, "Invalid expiry format"

    # Check expiration
    if expiry < datetime.utcnow():
        conn.close()
        return False, "OTP expired"

    conn.close()
    return True, row


def get_user_by_username(username):
    conn = get_users_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cur.fetchone()

    conn.close()
    return row

def get_user_by_id(user_id):
    conn = get_users_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()

    conn.close()
    return row


#init
init_users_db()


#SEED Admin

if __name__ == "__main__":
    print("Initializing users.db...")

    try:
        create_user(
            full_name="System Admin",
            username="admin",
            email="admin@test.com",
            phone="0000000000",
            password="admin123",
            role="admin"
        )
        print("Admin user created: username='admin', password='admin123'")
    except Exception as e:
        print("Admin user already exists or failed:", e)
