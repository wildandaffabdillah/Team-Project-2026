import sqlite3

conn = sqlite3.connect("ppe.db", check_same_thread=False)
c = conn.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    camera TEXT,
    type TEXT
)
""")
conn.commit()

def get_cursor():
    return conn.cursor()