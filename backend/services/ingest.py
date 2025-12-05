import pandas as pd
from datetime import datetime, timedelta

from backend.logic.triage import calculate_priority_from_days
from backend.logic.routing import compute_route
from backend.logic.progress import stage_text


# -----------------------------------------
# Detect missing docs / info / response
# -----------------------------------------
def detect_pending_action(text: str):
    if not isinstance(text, str):
        return None

    t = text.lower()

    if "document" in t:
        return "documents_missing"

    if "information" in t:
        return "information_missing"

    if "response" in t and "awaited" in t:
        return "beneficiary_bank_response_awaited"

    return None


# -----------------------------------------
# SLA bucket (Excel logic only)
# -----------------------------------------
def map_sla(days: int):
    if days <= 3:
        return "L3"
    if 4 <= days <= 11:
        return "L2"
    if 12 <= days <= 25:
        return "L1"
    return "L0"


# -----------------------------------------
# Main processing function
# -----------------------------------------
def process_excel(path: str):
    # Load file using correct header row
    df = pd.read_excel(path, header=1)

    required = [
        "Ticket ID",
        "Channel",
        "Amount (in INR)",
        "Days Open",
        "Issue Category",
        "Stage",
        "Present Stage"
    ]

    for col in required:
        if col not in df.columns:
            raise Exception(f"Missing required column: {col}")

    processed = []
    now = datetime.now()

    for _, row in df.iterrows():

        ticket = str(row["Ticket ID"])
        amount = float(row["Amount (in INR)"])
        days = int(row["Days Open"])
        ctype = str(row["Issue Category"])
        stage_text_raw = str(row["Present Stage"])

        # -------------------------
        # Parse Stage
        # -------------------------
        raw_stage = str(row["Stage"]).strip()

        if raw_stage.lower().startswith("stage"):
            parts = raw_stage.split()
            if len(parts) == 2 and parts[1].isdigit():
                stage = int(parts[1])
            else:
                raise Exception(f"Invalid stage format: {raw_stage}")
        else:
            try:
                stage = int(raw_stage)
            except:
                raise Exception(f"Invalid stage value: {raw_stage}")

        # -------------------------
        # Progress mapping (simple)
        # -------------------------
        progress = {1: 0, 2: 25, 3: 50, 4: 75, 5: 100}.get(stage, 0)

        # -------------------------
        #Stage days (Excel has this column but values may be messy)
        # -------------------------
        raw_stage_age = row.get("Days in Present Stage")

        try:
            stage_days = int(raw_stage_age)
        except:
            stage_days = 0

        # -------------------------
        # New triage system (now stage_days EXISTS)
        # -------------------------
        priority = calculate_priority_from_days(amount, days, stage_days, stage, ctype)
        priority_score = priority["score"]
        priority_bucket = priority["bucket"]

        # -------------------------
        # Pending action detection
        # -------------------------
        pending = detect_pending_action(stage_text_raw)

        # -------------------------
        # Routing
        # -------------------------
        category = compute_route(stage, priority_score, ctype, amount, priority_bucket)

        # -------------------------
        # Stage label
        # -------------------------
        stage_label = stage_text(stage)

        # -------------------------
        # Excel does not have timestamps → reconstruct using days
        # -------------------------
        registered_date = now - timedelta(days=days)
        present_stage_date = now - timedelta(days=stage_days)
        
        # -------------------------
        # Append final row (matches DB schema)
        # -------------------------
        processed.append({
            "ticket_id": ticket,
            "transaction_id": None,
            "amount": amount,
            "days_open": days,
            "stage_days": stage_days,
            "registered_date": registered_date,
            "present_stage_date": present_stage_date,
            "sla_bucket": map_sla(days),
            "triage_score": priority_score,
            "priority_bucket": priority_bucket,
            "stage": stage,
            "stage_label": stage_label,
            "progress_percent": progress,
            "complaint_type": ctype,
            "pending_action": pending,
            "routed_to": category,
            "channel": row["Channel"],
            "customer_mobile": None,
            "customer_email": None
        })

    return processed
