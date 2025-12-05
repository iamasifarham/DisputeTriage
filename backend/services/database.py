import sqlite3
from datetime import datetime

DB_PATH = "backend/data/processed/disputes.db"


def auto_age(row):
    if not row:
        return None

    r = dict(row)
    now = datetime.now()

    # days_open
    if r.get("registered_date"):
        rd = datetime.fromisoformat(str(r["registered_date"]))
        r["days_open"] = max((now - rd).days, 0)

    # stage_days
    if r.get("present_stage_date"):
        sd = datetime.fromisoformat(str(r["present_stage_date"]))
        r["stage_days"] = max((now - sd).days, 0)

    return r


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            ticket_id TEXT PRIMARY KEY,
            transaction_id TEXT,
            amount REAL,
            days_open INTEGER,
            stage_days INTEGER,
            registered_date TIMESTAMP,
            present_stage_date TIMESTAMP,
            sla_bucket TEXT,
            triage_score REAL,
            priority_bucket TEXT,
            stage INTEGER,
            stage_label TEXT,
            progress_percent INTEGER,
            complaint_type TEXT,
            pending_action TEXT,
            routed_to TEXT,
            channel TEXT,
            customer_mobile TEXT,
            customer_email TEXT,
            document_required TEXT,
            document_rejection_reason TEXT,
            last_uploaded_document TEXT
        )
    """)

    conn.commit()
    conn.close()


def insert_cases(rows):
    conn = get_connection()
    cur = conn.cursor()

    for row in rows:
        cur.execute("""
            INSERT OR REPLACE INTO cases (
                ticket_id,
                transaction_id,
                amount,
                days_open,
                stage_days,
                registered_date,
                present_stage_date,
                sla_bucket,
                triage_score,
                priority_bucket,
                stage,
                stage_label,
                progress_percent,
                complaint_type,
                pending_action,
                routed_to,
                channel,
                customer_mobile,
                customer_email,
                document_required,
                document_rejection_reason,
                last_uploaded_document
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row.get("ticket_id"),
            row.get("transaction_id"),
            row.get("amount"),
            row.get("days_open"),
            row.get("stage_days"),
            row.get("registered_date"),
            row.get("present_stage_date"),
            row.get("sla_bucket"),
            row.get("triage_score"),
            row.get("priority_bucket"),
            row.get("stage"),
            row.get("stage_label"),
            row.get("progress_percent"),
            row.get("complaint_type"),
            row.get("pending_action"),
            row.get("routed_to"),
            row.get("channel"),
            row.get("customer_mobile"),
            row.get("customer_email"),
            row.get("document_required"),
            row.get("document_rejection_reason"),
            row.get("last_uploaded_document")
        ))

    conn.commit()
    conn.close()


def ticket_exists(ticket_id: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM cases WHERE ticket_id = ?", (ticket_id,))
    row = cur.fetchone()
    conn.close()
    return row is not None


def get_case(ticket_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases WHERE ticket_id = ?", (ticket_id,))
    row = cur.fetchone()
    conn.close()
    return auto_age(row)
