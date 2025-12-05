def stage_text(stage: int):
    mapping = {
        1: "Complaint Registered",
        2: "Complaint In Progress",
        3: "Additional Information Needed",
        4: "Reversal Initiated",
        5: "Reversal Processed"
    }
    return mapping.get(stage, "Unknown Stage")


def clean_value(raw: str):
    if raw is None:
        return None
    
    mapping = {
        "beneficiary_bank_response_awaited": "Beneficiary Bank Response Awaited",
        "documents_missing": "Additional Documents Required",
        "information_missing": "Additional Information Required",
        "document_rejected": "Document Rejected",
        "branch_visit_required": "Branch Visit Required",
        "Branch_Followup": "Branch Follow-up",
        "Reversal_Processing": "Reversal Processing",
        "Fraud_Team": "Fraud Handling Team",
        "Ops_Team_L1": "Operations Team",
        "Ops_Team_Escalation": "Escalation Team"
    }

    return mapping.get(raw, raw)


def user_friendly_status(stage_label: str, pending_action: str):
    # Required documents
    if pending_action == "documents_missing":
        return "We need additional documents from you."

    # Info missing
    if pending_action == "information_missing":
        return "We need additional information from you. Please contact your branch."

    # Bank response wait
    if pending_action == "beneficiary_bank_response_awaited":
        return "Waiting for the beneficiary bank to respond."

    # Document rejected
    if pending_action == "document_rejected":
        return "Your document was rejected. Please upload a valid document."

    # Branch visit required
    if pending_action == "branch_visit_required":
        return "Please visit your nearest branch to complete your dispute."

    # Default per stage
    stage_map = {
        "Complaint Registered": "Your dispute has been registered.",
        "Complaint In Progress": "Your dispute is being processed.",
        "Additional Information Needed": "Your dispute is pending additional details.",
        "Reversal Initiated": "A reversal has been initiated for your dispute.",
        "Reversal Processed": "Your dispute has been successfully resolved."
    }

    return stage_map.get(stage_label, "Your dispute is under review.")
