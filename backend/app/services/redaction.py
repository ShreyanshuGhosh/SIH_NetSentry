import re
from typing import Tuple

SECRET_PATTERNS = [
    # Cisco enable secret / password hashes (type 5, 7, 8, 9)
    (r'(enable[^\S\r\n]+secret[^\S\r\n]+\d+[^\S\r\n]+)\S+', r'\g<1>[REDACTED_ENABLE_SECRET]'),
    (r'(enable[^\S\r\n]+password[^\S\r\n]+\d+[^\S\r\n]+)\S+', r'\g<1>[REDACTED_PASSWORD]'),
    (r'(username[^\S\r\n]+\S+[^\S\r\n]+(?:privilege[^\S\r\n]+\d+[^\S\r\n]+)?secret[^\S\r\n]+\d+[^\S\r\n]+)\S+', r'\g<1>[REDACTED_USER_SECRET]'),
    (r'(password[^\S\r\n]+\d+[^\S\r\n]+)\S+', r'\g<1>[REDACTED_PASSWORD]'),
    
    # SNMP communities
    (r'(snmp-server[^\S\r\n]+community[^\S\r\n]+)(\S+)', r'\g<1>[REDACTED_COMMUNITY]'),
    (r'(set[^\S\r\n]+snmp[^\S\r\n]+community[^\S\r\n]+)(\S+)', r'\g<1>[REDACTED_COMMUNITY]'),
    (r'(community[^\S\r\n]+)(\S+)([^\S\r\n]*\{)', r'\g<1>[REDACTED_COMMUNITY]\g<3>'),
    
    # NTP authentication keys
    (r'(ntp[^\S\r\n]+authentication-key[^\S\r\n]+\d+[^\S\r\n]+md5[^\S\r\n]+)\S+', r'\g<1>[REDACTED_NTP_KEY]'),
    
    # Juniper encrypted-password & auth keys
    (r'(encrypted-password[^\S\r\n]+)"[^"]+"', r'\g<1>"[REDACTED_JUNOS_HASH]"'),
    (r'(authentication-key[^\S\r\n]+)"[^"]+"', r'\g<1>"[REDACTED_AUTH_KEY]"'),
    (r'(pre-shared-secret[^\S\r\n]+)"[^"]+"', r'\g<1>"[REDACTED_PSK]"'),
    
    # Palo Alto PAN-OS hashes & phash
    (r'(<phash>)[^<]+(</phash>)', r'\g<1>[REDACTED_PANOS_PHASH]\g<2>'),
    (r'(phash[^\S\r\n]+)\S+', r'\g<1>[REDACTED_PHASH]'),
    
    # FortiOS passwords & enc keys
    (r'(set[^\S\r\n]+password[^\S\r\n]+)ENC[^\S\r\n]+\S+', r'\g<1>ENC [REDACTED_FORTI_ENC]'),
    (r'(set[^\S\r\n]+private-key[^\S\r\n]+)"[^"]+"', r'\g<1>"[REDACTED_PRIVATE_KEY]"'),
    
    # Arista EOS secret hashes
    (r'(secret[^\S\r\n]+sha512[^\S\r\n]+)\S+', r'\g<1>[REDACTED_ARISTA_SHA512]'),
    
    # Generic Private Keys
    (r'-----BEGIN [A-Z ]+ PRIVATE KEY-----[^-]+-----END [A-Z ]+ PRIVATE KEY-----', '[REDACTED_PRIVATE_KEY_BLOCK]')
]

def redact_secrets(raw_config: str) -> Tuple[str, int]:
    redacted = raw_config
    total_matches = 0
    for pattern, repl in SECRET_PATTERNS:
        matches = len(re.findall(pattern, redacted, flags=re.MULTILINE))
        total_matches += matches
        redacted = re.sub(pattern, repl, redacted, flags=re.MULTILINE)
    return redacted, total_matches
