# backend/services/notify.py

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from backend.settings import (
    USE_MAILTRAP,
    MAILTRAP_SMTP_HOST,
    MAILTRAP_SMTP_PORT,
    MAILTRAP_SMTP_USER,
    MAILTRAP_SMTP_PASS,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SENDER_EMAIL
)


def _get_smtp_credentials():
    """Returns SMTP settings depending on whether Mailtrap is enabled."""
    if USE_MAILTRAP:
        return (
            MAILTRAP_SMTP_HOST,
            MAILTRAP_SMTP_PORT,
            MAILTRAP_SMTP_USER,
            MAILTRAP_SMTP_PASS
        )
    else:
        return (
            SMTP_HOST,
            SMTP_PORT,
            SMTP_USER,
            SMTP_PASS
        )


def send_email(recipient: str, subject: str, message: str):
    if not recipient:
        print("[notify] No customer email available. Skipping email.")
        return False

    host, port, user, password = _get_smtp_credentials()

    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.attach(MIMEText(message, "plain"))

        server = smtplib.SMTP(host, port)
        server.starttls()
        server.login(user, password)
        server.sendmail(SENDER_EMAIL, recipient, msg.as_string())
        server.quit()

        print(f"[notify] Email sent → {recipient}")
        return True

    except Exception as e:
        print(f"[notify ERROR] {e}")
        return False


def notify_customer(row, subject: str, message: str):
    """Sends email to customer using their stored email address."""
    return send_email(row["customer_email"], subject, message)


def send_otp_email(to_email: str, otp: str, username: str):
    subject = "Your Login OTP"
    body = (
    f"Hello {username},\n\n"
    f"Your login OTP is: {otp}\n\n"
    f"It will expire in 10 minutes.\n"
    f"If you did not request this OTP, please ignore this email."
)

    # Reuse your existing email logic
    # Nothing new, just using your configured settings
    send_email(
    recipient=to_email,
    subject=subject,
    message=body
)


def notify_password_changed(user):
    subject = "Your Password Has Been Reset"
    body = f"""
    Hello {user['full_name']},

    Your password has been reset by an administrator.

    For security reasons, your new password has NOT been sent by email.
    Please contact your administrator directly to get the new credentials.

    - Dispute Management System
    """

    send_email(
        recipient=user["email"],
        subject=subject,
        message=body
    )
