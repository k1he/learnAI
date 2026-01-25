"""
Email service for sending verification and password reset emails.
"""
import logging
from typing import Optional
from app.core.config import settings


logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""

    @staticmethod
    async def send_verification_email(email: str, code: str) -> bool:
        """Send email verification code."""
        subject = "Verify Your ConceptCanvas Account"
        html_body = f"""
        <h2>Welcome to ConceptCanvas!</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; color: #007AFF; font-weight: bold;">{code}</p>
        <p>This code will expire in {settings.verification_code_expire_minutes} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        """
        return await EmailService._send_email(email, subject, html_body)

    @staticmethod
    async def send_password_reset_email(email: str, token: str) -> bool:
        """Send password reset token."""
        subject = "Reset Your ConceptCanvas Password"
        html_body = f"""
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password.</p>
        <p>Use this token to reset your password:</p>
        <p style="background: #f5f5f5; padding: 12px; font-family: monospace;">{token}</p>
        <p>This token will expire in {settings.password_reset_expire_hours} hour(s).</p>
        <p>If you didn't request this, please ignore this email.</p>
        """
        return await EmailService._send_email(email, subject, html_body)

    @staticmethod
    async def _send_email(to_email: str, subject: str, html_body: str) -> bool:
        """Send email (or dry run in development)."""
        if not settings.smtp_server or settings.debug:
            logger.info(f"[Email Mock] To: {to_email}, Subject: {subject}\n{html_body}")
            return True

        try:
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_server,
                port=settings.smtp_port,
                username=settings.smtp_username,
                password=settings.smtp_password,
                use_tls=True,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
