from fastapi import APIRouter, File, UploadFile
from datetime import datetime
from typing import Optional, List
import os
import json
from pydantic import BaseModel

from backend.services.utils import generate_ticket_id
from backend.services.database import insert_cases, get_case, get_connection
from backend.logic.triage import calculate_priority_from_timestamps
from backend.logic.progress import user_friendly_status
from backend.services.notify import notify_customer
from backend.services.templates import msg_dispute_registered

router = APIRouter(prefix="/customer", tags=["customer"])

# -----------------------------
# MODELS
# -----------------------------
class ContactInfo(BaseModel):
    mobile: Optional[str] = None
    email: Optional[str] = None

class NewDispute(BaseModel):
    channel: str
    amount: float
    issue_category: str
    transaction_id: Optional[str] = None
    contact: Optional[ContactInfo] = None

UPLOAD_DIR = "backend/data/uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -----------------------------
# CUSTOMER: Create New Dispute
# -----------------------------
@router.post("/dispute")
def create_dispute(req: NewDispute):
    ticket = generate_ticket_id(req.channel)
    now = datetime.now()

    # FIXED — include complaint type
    triage = calculate_priority_from_timestamps(
        req.amount,
        now,
        now,
        1,
        req.issue_category
    )

    row = {
        "ticket_id": ticket,
        "transaction_id": req.transaction_id,
        "amount": req.amount,
        "days_open": 0,
        "stage_days": 0,
        "registered_date": now,
        "present_stage_date": now,
        "sla_bucket": "L3",
        "triage_score": triage["score"],
        "priority_bucket": triage["bucket"],
        "stage": 1,
        "stage_label": "Complaint Registered",
        "progress_percent": 0,
        "complaint_type": req.issue_category,
        "pending_action": None,
        "routed_to": None,
        "channel": req.channel,
        "customer_mobile": req.contact.mobile if req.contact else None,
        "customer_email": req.contact.email if req.contact else None
    }

    insert_cases([row])

    # SEND EMAIL
    notify_customer(
        row,
        subject="Dispute Registered",
        message=msg_dispute_registered(ticket)
    )

    return {
        "ticket_id": ticket,
        "message": "Your dispute has been registered successfully."
    }

# -----------------------------
# CUSTOMER: Status Check
# -----------------------------
@router.get("/dispute/{ticket_id}/status")
def customer_status(ticket_id: str):
    row = get_case(ticket_id)

    if not row:
        return {"error": "ticket not found"}

    pending = row["pending_action"]
    message = ""
    required_docs = []
    rejection_reason = row["document_rejection_reason"]

    if pending == "documents_missing":
        if row["document_required"]:
            required_docs = json.loads(row["document_required"])
            message = "Additional documents required: " + ", ".join(required_docs)
        else:
            message = "Additional documents are required."

    elif pending == "document_rejected":
        message = f"Your document was rejected: {rejection_reason}. Please upload a valid document."

    elif pending == "branch_visit_required":
        message = "Please visit your nearest branch to complete your dispute."

    elif pending == "information_missing":
        message = "We need additional information from you. Please contact your branch."

    else:
        message = user_friendly_status(row["stage_label"], pending)

    return {
        "ticket_id": row["ticket_id"],
        "status": row["stage_label"],
        "message": message,
        "progress": row["progress_percent"],
        "pending_action": pending,
        "required_documents": required_docs,
        "rejection_reason": rejection_reason,
        "issue": row["complaint_type"],
        "channel": row["channel"]
    }

# -----------------------------
# CUSTOMER: Upload Document
# -----------------------------
@router.post("/dispute/{ticket_id}/upload")
def upload_document(ticket_id: str, file: UploadFile = File(...)):
    row = get_case(ticket_id)
    if not row:
        return {"error": "ticket not found"}

    # -----------------------------------------
    # 1. FILE TYPE VALIDATION
    # -----------------------------------------
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        return {"error": "Invalid file type. Only PDF, JPG, PNG allowed."}

    # -----------------------------------------
    # 2. FILE SIZE VALIDATION (5 MB)
    # -----------------------------------------
    file_bytes = file.file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        return {"error": "File too large. Maximum allowed size is 5 MB."}

    # Reset cursor so we can save file normally
    file.file.seek(0)

    # -----------------------------------------
    # 3. SAVE FILE
    # -----------------------------------------
    file_ext = os.path.splitext(file.filename)[1]
    saved_name = f"{ticket_id}_{int(datetime.now().timestamp())}{file_ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)

    with open(saved_path, "wb") as buffer:
        buffer.write(file.file.read())

    # -----------------------------------------
    # 4. UPDATE DATABASE
    # -----------------------------------------
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE cases
        SET pending_action = NULL,
            document_rejection_reason = NULL,
            last_uploaded_document = ?
        WHERE ticket_id = ?
    """, (saved_name, ticket_id))

    conn.commit()
    conn.close()

    # Reload row after update
    new_row = get_case(ticket_id)

    # Send confirmation email
    notify_customer(
        new_row,
        subject="Document Received",
        message="Your document has been received. We will verify it shortly."
    )

    return {
        "ticket_id": ticket_id,
        "uploaded_file": saved_name,
        "message": "Document uploaded successfully. We will verify it soon."
    }
