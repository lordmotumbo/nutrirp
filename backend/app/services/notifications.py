"""
Serviço de notificações: Email (SMTP) e Telegram.
Configuração via variáveis de ambiente:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
  (Telegram já usa TelegramConfig do banco)
"""
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def send_email(to: str, subject: str, body_html: str, body_text: str = "") -> bool:
    """Envia email via SMTP. Retorna True se enviou, False se não configurado/erro."""
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM or SMTP_USER
        msg["To"] = to

        if body_text:
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM or SMTP_USER, to, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


async def send_telegram(bot_token: str, chat_id: str, text: str) -> bool:
    """Envia mensagem via Telegram Bot API."""
    if not bot_token or not chat_id:
        return False
    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
            })
            return r.status_code == 200
    except Exception as e:
        print(f"[TELEGRAM ERROR] {e}")
        return False


def meal_alert_email_html(patient_name: str, meal_name: str, meal_time: str, foods: list) -> str:
    foods_html = "".join(
        f"<li>{f.get('food_name', '')} — {f.get('quantity', '')} {f.get('unit', '')}</li>"
        for f in foods
    ) if foods else "<li>Consulte seu plano alimentar</li>"

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:12px">
      <div style="background:#2E7D32;color:white;padding:16px 20px;border-radius:8px;margin-bottom:16px">
        <h2 style="margin:0;font-size:18px">🍽 Hora da refeição!</h2>
        <p style="margin:4px 0 0;opacity:.85;font-size:13px">NUTRIRP — Lembrete alimentar</p>
      </div>
      <p style="color:#333">Olá, <b>{patient_name}</b>!</p>
      <p style="color:#333">Está na hora do seu <b>{meal_name}</b> ({meal_time}).</p>
      <div style="background:white;border-radius:8px;padding:14px;margin:12px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#2E7D32">Alimentos previstos:</p>
        <ul style="margin:0;padding-left:18px;color:#555">{foods_html}</ul>
      </div>
      <p style="color:#888;font-size:12px;margin-top:16px">
        Lembre-se de seguir seu plano alimentar. Bom apetite! 🥗
      </p>
    </div>
    """


def water_alert_email_html(patient_name: str, total_today_ml: int = 0) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f0f8ff;padding:20px;border-radius:12px">
      <div style="background:#1565C0;color:white;padding:16px 20px;border-radius:8px;margin-bottom:16px">
        <h2 style="margin:0;font-size:18px">💧 Hora de beber água!</h2>
        <p style="margin:4px 0 0;opacity:.85;font-size:13px">NUTRIRP — Lembrete de hidratação</p>
      </div>
      <p style="color:#333">Olá, <b>{patient_name}</b>!</p>
      <p style="color:#333">Lembre-se de se manter hidratado. Beba pelo menos um copo de água agora! 🥤</p>
      {"<p style='color:#555'>Você já consumiu <b>" + str(total_today_ml) + "ml</b> hoje.</p>" if total_today_ml else ""}
      <p style="color:#888;font-size:12px;margin-top:16px">
        A meta diária recomendada é de 2000ml. Acesse o app para registrar.
      </p>
    </div>
    """
