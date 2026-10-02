import smtplib
from email.message import EmailMessage

from app.core.config import settings


def enviar_email(
    destinatario: str,
    assunto: str,
    corpo: str,
    html: str | None = None,
) -> None:
    mensagem = EmailMessage()

    mensagem["From"] = settings.smtp_from
    mensagem["To"] = destinatario
    mensagem["Subject"] = assunto

    mensagem.set_content(corpo)

    if html:
        mensagem.add_alternative(html, subtype="html")

    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port,
        timeout=15,
    ) as smtp:
        smtp.ehlo()

        if settings.smtp_starttls:
            smtp.starttls()
            smtp.ehlo()

        smtp.login(
            settings.smtp_username,
            settings.smtp_password,
        )

        smtp.send_message(mensagem)