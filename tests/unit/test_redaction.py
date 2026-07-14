from telcoassist.privacy.redaction import redact


def test_redacts_multiple_pii_types_and_keeps_placeholders_stable():
    text = "0555 123 45 67 ve 0555 123 45 67; user@example.com; 192.168.1.1; 00:1A:2B:3C:4D:5E"
    output, mapping = redact(text)
    assert output.count("[PHONE_1]") == 2
    assert "[EMAIL_1]" in output and "[IP_1]" in output and "[MAC_1]" in output
    assert mapping["[PHONE_1]"] == "0555 123 45 67"


def test_does_not_redact_ordinary_telecom_numbers():
    text = "Hat değeri 12.4 dB ve paket 100 Mbps."
    assert redact(text)[0] == text
