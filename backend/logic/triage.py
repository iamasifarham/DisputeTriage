# backend/logic/triage.py

from datetime import datetime

MAX_AMOUNT = 60000.0   # Normalization cap


# -------------------------
# Case Age Weight
# -------------------------
def case_age_weight(days: int) -> float:
    if days <= 3:
        return 0.1
    if days <= 11:
        return 0.4
    if days <= 25:
        return 0.7
    return 1.0


# -------------------------
# Stage Criticality Weight
# -------------------------
def stage_criticality(stage: int) -> float:
    return {
        1: 0.1,
        2: 0.2,
        3: 0.7,
        4: 0.8,
        5: 1.0
    }.get(stage, 0.5)


# -------------------------
# Complaint Risk
# -------------------------
def complaint_risk(ctype: str) -> float:
    if not isinstance(ctype, str):
        return 0.2

    t = ctype.lower()

    if "fraud" in t or "unauthorized" in t:
        return 1.0
    
    if "failed" in t or "reversal" in t:
        return 0.6

    if "wrong" in t or "merchant" in t:
        return 0.4

    return 0.2


# -------------------------
# Amount Weight
# -------------------------
def amount_weight(amount: float) -> float:
    try:
        A = float(amount) / MAX_AMOUNT
    except:
        A = 0.0
    return min(max(A, 0.0), 1.0)


# -------------------------
# Stage Age Weight
# -------------------------
def stage_age_weight(stage_days: int) -> float:
    try:
        SA = float(stage_days) / 15.0
    except:
        SA = 0.0
    return min(max(SA, 0.0), 1.0)


# -------------------------
# MAIN: Triage using Days
# -------------------------
def calculate_priority_from_days(amount: float, days_open: int, stage_days: int, stage: int, complaint_type: str = ""):
    A  = amount_weight(amount)
    CA = case_age_weight(days_open)
    SA = stage_age_weight(stage_days)
    SC = stage_criticality(stage)
    CR = complaint_risk(complaint_type)

    score = (
        (A  * 0.25) +
        (CA * 0.30) +
        (SA * 0.15) +
        (SC * 0.10) +
        (CR * 0.20)
    )

    score = round(score, 4)

    if score >= 0.75:
        bucket = "P0"
    elif score >= 0.55:
        bucket = "P1"
    elif score >= 0.35:
        bucket = "P2"
    else:
        bucket = "P3"

    return {
        "score": score,
        "bucket": bucket,
        "components": {
            "A": A,
            "CA": CA,
            "SA": SA,
            "SC": SC,
            "CR": CR
        }
    }


# -------------------------
# MAIN: Timestamps Mode
# -------------------------
def calculate_priority_from_timestamps(amount: float, registered_date: datetime, present_stage_date: datetime, stage: int, complaint_type: str = ""):
    now = datetime.now()
    days_open = (now - registered_date).days
    stage_days = (now - present_stage_date).days

    return calculate_priority_from_days(amount, days_open, stage_days, stage, complaint_type)
