## Local dev quickstart

- `ngrok http 8000`
- `cd backend && docker compose -f docker-compose.local.yml up --build`
- `cd frontend && npm run dev`

## OTP delivery (SMS + WhatsApp)

Login / first-time check-in uses **one shared 6-digit OTP** stored in the database; it can be delivered by **SMS** and/or **WhatsApp**.

### Order of delivery

1. If **MSG91 SMS** is fully configured (see below), the backend sends **SMS first**.
2. If SMS fails (provider error) but **WhatsApp OTP template** is set, it **falls back to WhatsApp** with the same code.
3. If SMS is **not** configured but WhatsApp OTP template **is**, it sends **WhatsApp only**.
4. If **neither** channel is configured, `POST /api/auth/send-otp/` returns **503** with a clear message.

### Configure SMS (MSG91)

Set **either** globally in `.env` / Docker env **or** per restaurant in Dashboard → Settings:

| Variable / field | Meaning |
|------------------|--------|
| `SMS_API_KEY` / `sms_api_key` | MSG91 auth key |
| `SMS_SENDER_ID` / `sms_sender_id` | Approved sender ID |
| `SMS_TEMPLATE_ID` / `sms_template_id` | MSG91 OTP template id |

API used: `https://control.msg91.com/api/v5/otp` (see `kotak/integrations/sms/msg91_client.py`).

**If logs say “OTP sent via SMS” but no SMS arrives:** MSG91 can return HTTP 200 with `{"type":"error","message":"..."}`. The backend now treats that as a failed send and returns an error to the client—check Docker logs for `msg91_send_otp_business_error`. Common fixes: real `SMS_API_KEY` (not placeholders), OTP **template id** from MSG91, approved **sender ID**, and India **DLT** registration for the template.

### Configure WhatsApp OTP

1. In **WhatsApp Manager**, create an approved template whose body has **`{{1}}`** = the OTP code (e.g. `login_otp`).
2. In **Dashboard → Settings → WhatsApp Integration**, set **WhatsApp OTP template name** and **language** (must match Meta exactly, e.g. `en` or `en_US`).
3. Optional env fallback: `WHATSAPP_OTP_TEMPLATE_NAME`, `WHATSAPP_OTP_TEMPLATE_LANGUAGE`.

WhatsApp still needs a valid **access token** and **phone number ID** (per restaurant or `WHATSAPP_*` env).

### API response

Successful send includes `delivery_channel`: `"sms"` or `"whatsapp"` so the customer UI can say “check SMS” vs “check WhatsApp”.

## WhatsApp webhook setup

- Meta Developers -> WhatsApp -> Configuration:
  - Callback URL: `<public-url>/webhooks/whatsapp/`
  - Verify token: `abc123` (must match backend env)

## WhatsApp templates required in Settings

Configure these per restaurant in Dashboard -> Settings -> WhatsApp Integration:

1) OTP template
- Field: `whatsapp_otp_template_name` and `whatsapp_otp_template_language`
- Purpose: OTP for first-time login/register
- Template body must include `{{1}}` (OTP code)
- Recommended template name: `login_otp`

2) Campaign template
- Field: `whatsapp_broadcast_template_name` and `whatsapp_broadcast_template_language`
- Purpose: outbound campaigns
- Existing template: `campaign_message` (keep using this)
- Template body must include `{{1}}` (campaign message text)

3) Feedback template
- Field: `whatsapp_feedback_template_name` and `whatsapp_feedback_template_language`
- Purpose: post-visit feedback when user is outside 24h chat window
- Template body must include `{{1}}` (restaurant/message context)
- Recommended template name: `feedback_message`

## Template creation steps (Meta WhatsApp Manager)

1. Open WhatsApp Manager -> Message templates -> Create template.
2. Create/confirm:
   - `login_otp` (Authentication or Utility), body includes `{{1}}`
   - `campaign_message` (Marketing), body includes `{{1}}`
   - `feedback_message` (Utility), body includes `{{1}}`
3. Submit for approval and wait for status `Approved`.
4. Use exact template name + exact language code in Dashboard Settings (example: `en` or `en_US`).

## Post–check-in feedback WhatsApp delay

- Celery schedules `send_feedback_message` with **`FEEDBACK_PROMPT_DELAY_SECONDS`** (default **1800** in [`config/settings/base.py`](backend/config/settings/base.py); override in Docker env e.g. [`backend/.envs/.local/.django`](backend/.envs/.local/.django)).
- **`POST /api/auth/check-in/`** uses this same delay for **every** check-in (including returning guests). Use something like **300–600** locally if you want a noticeable gap without waiting 30 minutes.

## Google review and CRM feedback (WhatsApp)

**High ratings (4 or 5)** after the feedback prompt:

- The app records a **completed** `Feedback` row (stars show in **Dashboard → Feedback** and customer detail).
- A **Google review** message is sent via the **`positive_feedback`** automation (same text as **Dashboard → Automations** for that trigger). It is **session text**, not a separate Meta template.
- You need a non-empty **`google_review_link`** on the restaurant (Dashboard → Settings), or set **`DEFAULT_GOOGLE_REVIEW_LINK`** in Django settings for dev.
- The **`positive_feedback`** rule must be **enabled** in Automations; otherwise the Google step is skipped.

**Low ratings (1–3)** still ask for a short comment on WhatsApp; the next inbound message completes that feedback (no Google prompt).

**If stars never appear in the dashboard:** the Meta webhook must reach Django (`/webhooks/whatsapp/`), the inbound `from` number must normalize to the same value as **`Customer.phone`** (E.164 with `+`), and the restaurant’s **`whatsapp_phone_number_id`** must match the WABA number in the webhook payload. If the outlet field is still empty but you use a single shared Cloud API number, set **`WHATSAPP_PHONE_NUMBER_ID`** in env to that id: the backend will then match inbound events to restaurants with a **blank** phone number id (disambiguated by customer phone). Prefer saving the id on each restaurant in Dashboard → Settings to avoid ambiguity when multiple outlets share one Meta app.

## Visit count and “First Timer” tag

- **`Customer.total_visits`** increments on every check-in that creates a `Visit`.
- After the **second** visit, if the tag is still **`first_time`**, the backend sets it to **`neutral`** so the CRM list is not stuck on “First Timer” forever.