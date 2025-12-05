# backend/settings.py


JWT_SECRET = "change_this_secret_soon"
JWT_ALGORITHM = "HS256"
JWT_EXP_MINUTES = 120

# ===============================
# EMAIL CONFIG (Switchable)
# ===============================

# Use MAILTRAP for development
USE_MAILTRAP = True

# ----------------------
# MAILTRAP SETTINGS
# ----------------------
MAILTRAP_SMTP_HOST = "sandbox.smtp.mailtrap.io"
MAILTRAP_SMTP_PORT = 2525
MAILTRAP_SMTP_USER = "f5c4b8df59ff25"
MAILTRAP_SMTP_PASS = "33450aa651d22a"

# ----------------------
# REAL SMTP SETTINGS (Gmail / Outlook / Custom)
# ----------------------
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "your-real-email@gmail.com"
SMTP_PASS = "your-real-app-password"

SENDER_EMAIL = "noreply@dispute-system.local"
