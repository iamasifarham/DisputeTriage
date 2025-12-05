def compute_route(stage: int, priority_score: float, complaint_type: str, amount: float, priority_bucket: str = None):
    """
    Routing rules:
    - Stage 3 → Branch Follow-up (docs/info missing)
    - Stage 4 → Reversal Processing
    - Fraud / Unauthorized high amount → Fraud Team
    - P0 → Escalation Team
    - Others → L1 Operations Team
    """

    c = complaint_type.lower()

    # Fraud / Unauthorized debit high amount
    if ("unauthorized" in c or "fraud" in c) and amount > 10000:
        return "Fraud_Team"

    # Stage-based routing
    if stage == 3:
        return "Branch_Followup"

    if stage == 4:
        return "Reversal_Processing"

    # Priority bucket (if provided)
    if priority_bucket is not None:
        if priority_bucket == "P0":
            return "Ops_Team_Escalation"
        else:
            return "Ops_Team_L1"

    # Fallback using score
    if priority_score >= 0.75:
        return "Ops_Team_Escalation"

    return "Ops_Team_L1"
