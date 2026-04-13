# ruff: noqa: COM812
from kotak.integrations.whatsapp.parsers import ParsedWhatsAppMessage
from kotak.integrations.whatsapp.parsers import parse_rating_webhook_payload


def test_parse_rating_payload_success():
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "metadata": {"phone_number_id": "1021223604414193"},
                            "messages": [
                                {
                                    "from": "919812345678",
                                    "type": "text",
                                    "text": {"body": "5"},
                                }
                            ],
                        }
                    }
                ]
            }
        ]
    }

    parsed = parse_rating_webhook_payload(payload)

    assert parsed == ParsedWhatsAppMessage(
        phone="+919812345678",
        message="5",
        phone_number_id="1021223604414193",
    )


def test_parse_rating_payload_invalid_returns_none():
    parsed = parse_rating_webhook_payload({"entry": []})

    assert parsed is None


def test_parse_rating_payload_skips_status_change_uses_later_messages_change():
    """Meta can send multiple `changes`; first may be statuses-only."""
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "field": "messages",
                        "value": {
                            "metadata": {"phone_number_id": "1021223604414193"},
                            "statuses": [{"id": "wamid.x", "status": "delivered"}],
                        },
                    },
                    {
                        "field": "messages",
                        "value": {
                            "metadata": {"phone_number_id": "1021223604414193"},
                            "messages": [
                                {
                                    "from": "919812345678",
                                    "type": "text",
                                    "text": {"body": "5"},
                                }
                            ],
                        },
                    },
                ]
            }
        ]
    }

    parsed = parse_rating_webhook_payload(payload)

    assert parsed == ParsedWhatsAppMessage(
        phone="+919812345678",
        message="5",
        phone_number_id="1021223604414193",
    )


def test_parse_rating_payload_button_quick_reply():
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "metadata": {"phone_number_id": "1021223604414193"},
                            "messages": [
                                {
                                    "from": "919812345678",
                                    "type": "button",
                                    "button": {"payload": "5", "text": "5 stars"},
                                }
                            ],
                        }
                    }
                ]
            }
        ]
    }

    parsed = parse_rating_webhook_payload(payload)

    assert parsed == ParsedWhatsAppMessage(
        phone="+919812345678",
        message="5",
        phone_number_id="1021223604414193",
    )


def test_parse_rating_payload_interactive_list_reply():
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "metadata": {"phone_number_id": "1021223604414193"},
                            "messages": [
                                {
                                    "from": "919812345678",
                                    "type": "interactive",
                                    "interactive": {
                                        "type": "list_reply",
                                        "list_reply": {"id": "3", "title": "Good"},
                                    },
                                }
                            ],
                        }
                    }
                ]
            }
        ]
    }

    parsed = parse_rating_webhook_payload(payload)

    assert parsed == ParsedWhatsAppMessage(
        phone="+919812345678",
        message="3",
        phone_number_id="1021223604414193",
    )


def test_parse_rating_payload_interactive_button_reply():
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "metadata": {"phone_number_id": "1021223604414193"},
                            "messages": [
                                {
                                    "from": "919812345678",
                                    "type": "interactive",
                                    "interactive": {
                                        "type": "button_reply",
                                        "button_reply": {"id": "4", "title": "Great"},
                                    },
                                }
                            ],
                        }
                    }
                ]
            }
        ]
    }

    parsed = parse_rating_webhook_payload(payload)

    assert parsed == ParsedWhatsAppMessage(
        phone="+919812345678",
        message="4",
        phone_number_id="1021223604414193",
    )
