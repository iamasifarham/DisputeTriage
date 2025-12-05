from fastapi import APIRouter
from datetime import datetime
from fastapi import Depends
from fastapi.responses import FileResponse
import os
from pydantic import BaseModel
from typing import Optional, List
import json
from backend.auth.jwt_handler import employee_required

from backend.services.database import get_connection, get_case
from backend.logic.progress import stage_text
from backend.logic.triage import calculate_priority_from_days
from backend.logic.routing import compute_route
from backend.services.database import auto_age
from backend.services.notify import notify_customer
from backend.services.templates import (
    msg_documents_required,
    msg_document_rejected,
    msg_document_approved,
    msg_stage_updated,
    msg_branch_visit
)


router = APIRouter(prefix="/employee", tags=["employee"])


# -----------------------------
# MODELS
# -----------------------------
class StageUpdate(BaseModel):
    new_stage: int
    pending_action: Optional[str] = None

class DocumentRequest(BaseModel):
    required_docs: List[str]
    other: Optional[str] = None

class DocumentVerification(BaseModel):
    status: str   # "approved", "rejected", "branch"
    reason: Optional[str] = None


# -----------------------------
# EMPLOYEE: Get All Cases
# -----------------------------
@router.get("/cases")
def employee_cases(current_user = Depends(employee_required)):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT ticket_id, stage, stage_label, triage_score, priority_bucket,
               days_open, stage_days, complaint_type, routed_to
        FROM cases
        ORDER BY 
            priority_bucket ASC,
            triage_score DESC,
            days_open DESC
    """)

    rows = cur.fetchall()
    conn.close()

    result = []
    serial = 1

    for row in rows:
        item = auto_age(row)
        item["serial_no"] = serial
        serial += 1
        result.append(item)

    return result


# -----------------------------
# EMPLOYEE: Case Details
# -----------------------------
@router.get("/case/{ticket_id}")
def employee_case_details(ticket_id: str,  current_user = Depends(employee_required)):
    row = get_case(ticket_id)

    if not row:
        return {"error": "ticket not found"}

    return {
        "ticket_id": row["ticket_id"],
        "transaction_id": row["transaction_id"],
        "amount": row["amount"],
        "registered_date": row["registered_date"],
        "present_stage_date": row["present_stage_date"],
        "stage": row["stage"],
        "stage_label": row["stage_label"],
        "progress_percent": row["progress_percent"],
        "days_open": row["days_open"],
        "stage_days": row["stage_days"],
        "pending_action": row["pending_action"],
        "triage_score": row["triage_score"],
        "priority_bucket": row["priority_bucket"],
        "routed_to": row["routed_to"],
        "complaint_type": row["complaint_type"],
        "channel": row["channel"],
        "customer_mobile": row["customer_mobile"],
        "customer_email": row["customer_email"],
        "document_required": row["document_required"],
        "document_rejection_reason": row["document_rejection_reason"],
        "last_uploaded_document": row["last_uploaded_document"]
    }


# -----------------------------
# EMPLOYEE: Update Stage
# -----------------------------
@router.put("/case/{ticket_id}/stage")
def update_stage(ticket_id: str, update: StageUpdate,  current_user = Depends(employee_required)):
    row = get_case(ticket_id)
    if not row:
        return {"error": "ticket not found"}

    now = datetime.now()
    new_label = stage_text(update.new_stage)

    new_stage_days = 0
    new_days_open = row["days_open"]
    new_amount = row["amount"]

    # FIXED — remove wrong argument
    new_priority = calculate_priority_from_days(
        new_amount,
        new_days_open,
        new_stage_days,
        update.new_stage,
        row["complaint_type"]
    )


    new_routed_to = compute_route(
        update.new_stage,
        new_priority["score"],
        row["complaint_type"],
        new_amount
    )

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE cases 
        SET stage = ?,
            stage_label = ?,
            present_stage_date = ?,
            stage_days = ?,
            pending_action = ?,
            triage_score = ?,
            priority_bucket = ?,
            routed_to = ?
        WHERE ticket_id = ?
    """, (
        update.new_stage,
        new_label,
        now,
        new_stage_days,
        update.pending_action,
        new_priority["score"],
        new_priority["bucket"],
        new_routed_to,
        ticket_id
    ))

    conn.commit()
    conn.close()

    # SEND EMAIL: Stage updated
    notify_customer(
        row,
        subject="Dispute Status Updated",
        message=msg_stage_updated(ticket_id, new_label)
    )


    return {
        "ticket_id": ticket_id,
        "updated_stage": update.new_stage,
        "stage_label": new_label,
        "pending_action": update.pending_action,
        "triage_score": new_priority["score"],
        "priority_bucket": new_priority["bucket"],
        "routed_to": new_routed_to,
        "message": "Stage updated successfully."
    }


# -----------------------------
# EMPLOYEE: Request Documents
# -----------------------------
@router.put("/case/{ticket_id}/request-documents")
def request_documents(ticket_id: str, req: DocumentRequest,  current_user = Depends(employee_required)):
    row = get_case(ticket_id)
    if not row:
        return {"error": "ticket not found"}

    docs = req.required_docs.copy()
    if req.other:
        docs.append(req.other)

    docs_json = json.dumps(docs)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE cases
        SET 
            stage = 3,
            stage_label = 'Additional Information Needed',
            pending_action = 'documents_missing',
            document_required = ?,
            document_rejection_reason = NULL,
            stage_days = 0,
            present_stage_date = CURRENT_TIMESTAMP
        WHERE ticket_id = ?
    """, (docs_json, ticket_id))

    conn.commit()
    conn.close()

    # SEND EMAIL — using template
    notify_customer(
        row,
        subject="Documents Required",
        message=msg_documents_required(ticket_id, docs)
    )

    return {
        "ticket_id": ticket_id,
        "required_documents": docs,
        "message": "Document request recorded and case moved to Stage 3."
    }


# -----------------------------
# EMPLOYEE: Verify Document
# -----------------------------
@router.put("/case/{ticket_id}/verify-document")
def verify_document(ticket_id: str, req: DocumentVerification,  current_user = Depends(employee_required)):
    row = get_case(ticket_id)
    if not row:
        return {"error": "ticket not found"}

    now = datetime.now()
    new_stage = row["stage"]
    pending_action = None
    rejection_reason = None

    # CASE 1 — APPROVED → stage 4
    if req.status == "approved":
        new_stage = 4
        new_stage_label = "Reversal Initiated"
        pending_action = None
        rejection_reason = None
        stage_days = 0

    # CASE 2 — REJECTED
    elif req.status == "rejected":
        new_stage_label = row["stage_label"]
        pending_action = "document_rejected"
        rejection_reason = req.reason or "Document rejected"
        stage_days = row["stage_days"] + 1

    # CASE 3 — BRANCH REQUIRED
    elif req.status == "branch":
        new_stage_label = row["stage_label"]
        pending_action = "branch_visit_required"
        rejection_reason = req.reason or "Please visit branch"
        stage_days = row["stage_days"] + 1

    else:
        return {"error": "Invalid status"}

    # FIXED — correct triage arguments
    new_priority = calculate_priority_from_days(
        row["amount"],
        row["days_open"],
        stage_days,
        new_stage
    )

    new_routed_to = compute_route(
        new_stage,
        new_priority["score"],
        row["complaint_type"],
        row["amount"]
    )

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE cases
        SET 
            stage = ?,
            stage_label = ?,
            pending_action = ?,
            document_rejection_reason = ?,
            triage_score = ?,
            priority_bucket = ?,
            routed_to = ?,
            present_stage_date = ?,
            stage_days = ?
        WHERE ticket_id = ?
    """, (
        new_stage,
        new_stage_label,
        pending_action,
        rejection_reason,
        new_priority["score"],
        new_priority["bucket"],
        new_routed_to,
        now,
        stage_days,
        ticket_id
    ))

    conn.commit()
    conn.close()

    # SEND EMAIL BASED ON STATUS
    if req.status == "approved":
        notify_customer(
            row,
            subject="Document Approved",
            message=msg_document_approved(ticket_id)
        )
    elif req.status == "rejected":
        notify_customer(
            row,
            subject="Document Rejected",
            message=msg_document_rejected(ticket_id, rejection_reason)
        )
    elif req.status == "branch":
        notify_customer(
            row,
            subject="Branch Visit Required",
            message=msg_branch_visit(ticket_id)
        )

    return {
        "ticket_id": ticket_id,
        "new_stage": new_stage,
        "stage_label": new_stage_label,
        "pending_action": pending_action,
        "rejection_reason": rejection_reason,
        "triage_score": new_priority["score"],
        "priority_bucket": new_priority["bucket"],
        "routed_to": new_routed_to,
        "message": "Verification processed."
    }


# -----------------------------
# PREVIEW LAST DOCUMENT
# -----------------------------
UPLOAD_DIR = "backend/data/uploads/"

@router.get("/case/{ticket_id}/document")
def view_last_document(ticket_id: str,  current_user = Depends(employee_required)):
    row = get_case(ticket_id)
    if not row:
        return {"error": "ticket not found"}

    filename = row["last_uploaded_document"]
    if not filename:
        return {"message": "No document uploaded yet."}

    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        return {"error": "File not found on server."}

    return FileResponse(file_path)


# -----------------------------
# DOWNLOAD DOCUMENT
# -----------------------------
@router.get("/case/{ticket_id}/document/download")
def download_last_document(ticket_id: str,  current_user = Depends(employee_required)):
    row = get_case(ticket_id)
    if not row:
        return {"error": "ticket not found"}

    filename = row["last_uploaded_document"]
    if not filename:
        return {"message": "No document uploaded yet."}

    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        return {"error": "File not found on server."}

    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=filename
    )

@router.get("/me")
def employee_me(current_user = Depends(employee_required)):
    return {
        "full_name": current_user["full_name"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

# -----------------------------
# DEBUG SCHEMA
# -----------------------------
@router.get("/debug/schema")
def debug_schema():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(cases)")
    return cur.fetchall()
