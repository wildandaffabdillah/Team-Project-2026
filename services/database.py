import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    worker_detected INTEGER NOT NULL,
    helmet INTEGER NOT NULL,
    vest INTEGER NOT NULL,
    shoes INTEGER NOT NULL,
    compliant INTEGER NOT NULL,
    violation_text TEXT NOT NULL,
    confidence REAL NOT NULL,
    mode TEXT NOT NULL
);
"""


def get_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str) -> None:
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    with closing(get_connection(db_path)) as conn:
        conn.executescript(SCHEMA_SQL)
        conn.commit()


def insert_violation(db_path: str, payload: dict) -> int:
    with closing(get_connection(db_path)) as conn:
        cur = conn.execute(
            """
            INSERT INTO violations (
                created_at,
                worker_detected,
                helmet,
                vest,
                shoes,
                compliant,
                violation_text,
                confidence,
                mode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["created_at"],
                int(payload["worker_detected"]),
                int(payload["helmet"]),
                int(payload["vest"]),
                int(payload["shoes"]),
                int(payload["compliant"]),
                payload["violation_text"],
                float(payload["confidence"]),
                payload["mode"],
            ),
        )
        conn.commit()
        return int(cur.lastrowid)


def fetch_recent_logs(db_path: str, limit: int = 10) -> list[dict]:
    with closing(get_connection(db_path)) as conn:
        rows = conn.execute(
            "SELECT * FROM violations ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]


def fetch_summary(db_path: str) -> dict:
    with closing(get_connection(db_path)) as conn:
        total = conn.execute("SELECT COUNT(*) AS c FROM violations").fetchone()["c"]
        violations = conn.execute(
            "SELECT COUNT(*) AS c FROM violations WHERE compliant = 0"
        ).fetchone()["c"]
        compliant = conn.execute(
            "SELECT COUNT(*) AS c FROM violations WHERE compliant = 1"
        ).fetchone()["c"]
        latest = conn.execute(
            "SELECT created_at FROM violations ORDER BY id DESC LIMIT 1"
        ).fetchone()

        return {
            "total_logs": total,
            "violations": violations,
            "compliant_logs": compliant,
            "last_activity": latest["created_at"] if latest else None,
        }


def export_report_csv(db_path: str) -> str:
    rows = fetch_recent_logs(db_path, limit=500)
    header = [
        "id",
        "created_at",
        "worker_detected",
        "helmet",
        "vest",
        "shoes",
        "compliant",
        "violation_text",
        "confidence",
        "mode",
    ]

    lines = [",".join(header)]

    for row in rows:
        violation_text = str(row["violation_text"]).replace('"', "'")
        lines.append(
            ",".join(
                [
                    str(row["id"]),
                    str(row["created_at"]),
                    str(row["worker_detected"]),
                    str(row["helmet"]),
                    str(row["vest"]),
                    str(row["shoes"]),
                    str(row["compliant"]),
                    f'"{violation_text}"',
                    str(row["confidence"]),
                    str(row["mode"]),
                ]
            )
        )

    return "\n".join(lines)


def now_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")