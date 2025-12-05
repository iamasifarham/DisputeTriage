import random
from backend.services.database import ticket_exists

def generate_ticket_id(channel: str) -> str:
    prefix = channel.upper().strip()

    # Allow only valid prefixes; fallback for unknown channels
    if prefix not in ["UPI", "CARD"]:
        prefix = "GEN"

    while True:
        # 5-digit padded number (00000 to 99999)
        suffix = f"{random.randint(0, 99999):05d}"
        ticket = prefix + suffix

        # Ensure uniqueness using DB check
        if not ticket_exists(ticket):
            return ticket
