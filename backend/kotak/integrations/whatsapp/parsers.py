from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ParsedWhatsAppMessage:
    phone: str
    message: str
    phone_number_id: str


def _normalize_phone(raw_phone: str) -> str:
    digits = "".join(ch for ch in raw_phone if ch.isdigit())
    if not digits:
        return ""
    return f"+{digits}"


def _extract_rating_raw(message_item: dict) -> str | None:
    """Pull user input for rating: text body or interactive button_reply id."""
    msg_type = message_item.get("type")
    if msg_type == "text":
        text = message_item.get("text")
        if not isinstance(text, dict):
            return None
        body = text.get("body")
        if body is None:
            return None
        return str(body).strip()
    if msg_type == "interactive":
        inter = message_item.get("interactive")
        if not isinstance(inter, dict):
            return None
        itype = inter.get("type")
        if itype == "button_reply":
            br = inter.get("button_reply")
            if not isinstance(br, dict):
                return None
            bid = br.get("id")
            if bid is None:
                return None
            return str(bid).strip()
        if itype == "list_reply":
            lr = inter.get("list_reply")
            if not isinstance(lr, dict):
                return None
            lid = lr.get("id")
            if lid is None:
                return None
            return str(lid).strip()
        return None
    if msg_type == "button":
        btn = message_item.get("button")
        if not isinstance(btn, dict):
            return None
        payload = btn.get("payload")
        if payload is not None:
            return str(payload).strip()
        text = btn.get("text")
        if text is not None:
            return str(text).strip()
        return None
    # Payloads without top-level type: try text only
    text = message_item.get("text")
    if isinstance(text, dict) and text.get("body") is not None:
        return str(text["body"]).strip()
    return None


def _try_parse_inbound_from_value(value: dict) -> ParsedWhatsAppMessage | None:
    """Parse the first user message in a webhook `value` object (metadata + messages)."""
    metadata = value.get("metadata")
    messages = value.get("messages")
    if not isinstance(metadata, dict) or not isinstance(messages, list):
        return None
    raw_pid = metadata.get("phone_number_id")
    if raw_pid is None:
        return None
    phone_number_id = str(raw_pid).strip()
    if not phone_number_id:
        return None

    for message_item in messages:
        if not isinstance(message_item, dict):
            continue
        raw_from = message_item.get("from")
        if raw_from is None:
            continue
        phone = _normalize_phone(str(raw_from))
        body = _extract_rating_raw(message_item)
        if not phone or body is None or not body:
            continue
        return ParsedWhatsAppMessage(
            phone=phone,
            message=body,
            phone_number_id=phone_number_id,
        )
    return None


def parse_rating_webhook_payload(payload: dict) -> ParsedWhatsAppMessage | None:
    """Walk all entries/changes; Meta may send multiple changes or non-message changes first."""
    if not isinstance(payload, dict):
        return None
    for entry in payload.get("entry") or []:
        if not isinstance(entry, dict):
            continue
        for change in entry.get("changes") or []:
            if not isinstance(change, dict):
                continue
            value = change.get("value")
            if not isinstance(value, dict):
                continue
            parsed = _try_parse_inbound_from_value(value)
            if parsed is not None:
                return parsed
    return None
