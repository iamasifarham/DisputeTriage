# backend/services/templates.py

BASE_URL = "http://127.0.0.1:8000"


def status_link(ticket_id: str):
    return f"{BASE_URL}/customer/dispute/{ticket_id}/status"


def upload_link(ticket_id: str):
    return f"{BASE_URL}/customer/dispute/{ticket_id}/upload"


def msg_dispute_registered(ticket):
    return (
        f"Your dispute has been successfully registered.\n"
        f"Ticket ID: {ticket}\n\n"
        f"Check status here:\n{status_link(ticket)}"
    )


def msg_documents_required(ticket, docs):
    return (
        "Additional documents are required to process your dispute.\n\n"
        "Required documents:\n"
        + "\n".join(f"- {d}" for d in docs)
        + "\n\nUpload here:\n"
        f"{upload_link(ticket)}"
    )


def msg_information_required(ticket):
    return (
        "Additional information is required to proceed with your dispute.\n"
        "Please visit your nearest branch.\n\n"
        f"Status link:\n{status_link(ticket)}"
    )


def msg_bank_response_wait(ticket):
    return (
        "We are waiting for a response from the beneficiary bank.\n"
        "We will notify you once we receive an update.\n\n"
        f"Status link:\n{status_link(ticket)}"
    )


def msg_document_rejected(ticket, reason):
    return (
        "Your submitted document was rejected.\n"
        f"Reason: {reason}\n\n"
        f"Upload a valid document here:\n{upload_link(ticket)}"
    )


def msg_document_approved(ticket):
    return (
        "Your document has been approved.\n"
        "Your dispute is now progressing to the next stage.\n\n"
        f"Status link:\n{status_link(ticket)}"
    )


def msg_stage_updated(ticket, stage_label):
    return (
        f"Your dispute has moved to a new stage: {stage_label}\n\n"
        f"Check updated status:\n{status_link(ticket)}"
    )


def msg_branch_visit(ticket):
    return (
        "Please visit your nearest branch to complete your dispute verification.\n\n"
        f"Status link:\n{status_link(ticket)}"
    )
