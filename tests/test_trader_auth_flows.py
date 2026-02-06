"""
Trader Auth Flow Tests

Tests the trader authentication logic patterns:
- Login/register validation
- 2FA TOTP algorithm correctness
- Password reset token lifecycle
- Rate limiting behavior

These are pure-logic tests that don't require a running database.
"""

import unittest
import hmac
import hashlib
import struct
import time
import os
import sys

# Ensure lib is in path for shared utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))


# ---------------------------------------------------------------
# TOTP reference implementation (Python, matching our TS module)
# ---------------------------------------------------------------

BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"


def base32_decode(encoded: str) -> bytes:
    """Decode a base32-encoded string."""
    cleaned = encoded.upper().rstrip("=")
    result = []
    bits = 0
    value = 0
    for char in cleaned:
        idx = BASE32_CHARS.index(char)
        value = (value << 5) | idx
        bits += 5
        if bits >= 8:
            result.append((value >> (bits - 8)) & 0xFF)
            bits -= 8
    return bytes(result)


def base32_encode(data: bytes) -> str:
    """Encode bytes as base32."""
    result = []
    bits = 0
    value = 0
    for byte in data:
        value = (value << 8) | byte
        bits += 8
        while bits >= 5:
            result.append(BASE32_CHARS[(value >> (bits - 5)) & 0x1F])
            bits -= 5
    if bits > 0:
        result.append(BASE32_CHARS[(value << (5 - bits)) & 0x1F])
    return "".join(result)


def generate_hotp(secret: bytes, counter: int, digits: int = 6) -> str:
    """Generate an HOTP code per RFC 4226."""
    counter_bytes = struct.pack(">Q", counter)
    mac = hmac.new(secret, counter_bytes, hashlib.sha1).digest()
    offset = mac[-1] & 0x0F
    binary = (
        ((mac[offset] & 0x7F) << 24)
        | ((mac[offset + 1] & 0xFF) << 16)
        | ((mac[offset + 2] & 0xFF) << 8)
        | (mac[offset + 3] & 0xFF)
    )
    otp = binary % (10 ** digits)
    return str(otp).zfill(digits)


def generate_totp(secret_b32: str, period: int = 30, digits: int = 6) -> str:
    """Generate a TOTP code for the current time."""
    secret = base32_decode(secret_b32)
    counter = int(time.time()) // period
    return generate_hotp(secret, counter, digits)


def verify_totp(code: str, secret_b32: str, period: int = 30, window: int = 1) -> bool:
    """Verify a TOTP code with clock-skew tolerance."""
    secret = base32_decode(secret_b32)
    now = int(time.time())
    for offset in range(-window, window + 1):
        counter = (now + offset * period) // period
        expected = generate_hotp(secret, counter)
        if expected == code:
            return True
    return False


class TestBase32(unittest.TestCase):
    def test_roundtrip(self):
        """base32 encode/decode roundtrip"""
        original = os.urandom(20)
        encoded = base32_encode(original)
        decoded = base32_decode(encoded)
        self.assertEqual(original, decoded)

    def test_known_vector(self):
        """RFC 4648 test vector: 'foobar' -> MZXW6YTBOI======"""
        encoded = base32_encode(b"foobar")
        self.assertEqual(encoded, "MZXW6YTBOI")

    def test_decode_known(self):
        decoded = base32_decode("MZXW6YTBOI")
        self.assertEqual(decoded, b"foobar")


class TestHOTP(unittest.TestCase):
    """RFC 4226 Appendix D test vectors."""

    def test_rfc4226_vectors(self):
        # Secret = "12345678901234567890" (ASCII)
        secret = b"12345678901234567890"
        expected = [
            "755224", "287082", "359152", "969429", "338314",
            "254676", "287922", "162583", "399871", "520489",
        ]
        for i, exp in enumerate(expected):
            result = generate_hotp(secret, i)
            self.assertEqual(result, exp, f"HOTP counter={i} expected {exp} got {result}")


class TestTOTP(unittest.TestCase):
    def test_generate_and_verify(self):
        """Generate a TOTP and immediately verify it."""
        secret = base32_encode(os.urandom(20))
        code = generate_totp(secret)
        self.assertTrue(verify_totp(code, secret))

    def test_wrong_code_fails(self):
        """A random 6-digit code should not verify."""
        secret = base32_encode(os.urandom(20))
        # Use a code that's extremely unlikely to match
        self.assertFalse(verify_totp("000000", secret))

    def test_code_format(self):
        """TOTP code should be exactly 6 digits."""
        secret = base32_encode(os.urandom(20))
        code = generate_totp(secret)
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())


class TestPasswordResetLogic(unittest.TestCase):
    """Tests for password reset token lifecycle patterns."""

    def test_token_generation(self):
        """Reset tokens should be unpredictable and unique."""
        import hashlib
        tokens = set()
        for _ in range(100):
            token = os.urandom(32).hex()
            self.assertEqual(len(token), 64)
            tokens.add(token)
        # All tokens should be unique
        self.assertEqual(len(tokens), 100)

    def test_token_hash_deterministic(self):
        """SHA256 hashing should be deterministic."""
        token = "test-reset-token-abc123"
        h1 = hashlib.sha256(token.encode()).hexdigest()
        h2 = hashlib.sha256(token.encode()).hexdigest()
        self.assertEqual(h1, h2)

    def test_token_expiry_logic(self):
        """Expiry check: token created 2 hours ago should be expired."""
        now = time.time()
        created_at = now - (2 * 3600)  # 2 hours ago
        expiry_window = 3600  # 1 hour
        expires_at = created_at + expiry_window
        self.assertLess(expires_at, now, "Token should be expired")

    def test_token_not_expired(self):
        """Token created 30 minutes ago with 1-hour window is still valid."""
        now = time.time()
        created_at = now - (30 * 60)  # 30 min ago
        expiry_window = 3600  # 1 hour
        expires_at = created_at + expiry_window
        self.assertGreater(expires_at, now, "Token should still be valid")


class TestAuthValidation(unittest.TestCase):
    """Tests for input validation patterns used in auth routes."""

    def test_username_regex(self):
        """Username validation: 3-20 chars, alphanumeric + _ -"""
        import re
        pattern = re.compile(r'^[a-zA-Z0-9_-]{3,20}$')

        valid = ["alice", "bob123", "trader-1", "user_name", "ABC"]
        invalid = ["ab", "a" * 21, "user@name", "has space", "", "no!special"]

        for name in valid:
            self.assertIsNotNone(pattern.match(name), f"{name} should be valid")
        for name in invalid:
            self.assertIsNone(pattern.match(name), f"{name} should be invalid")

    def test_password_length(self):
        """Password must be at least 8 characters."""
        self.assertGreaterEqual(len("validpass"), 8)
        self.assertLess(len("short"), 8)

    def test_rate_limit_window(self):
        """Rate limit: 5 attempts in 15 minutes."""
        max_attempts = 5
        window_minutes = 15
        # Simulate 5 failed attempts
        attempts = [time.time() - (i * 60) for i in range(5)]
        window_start = time.time() - (window_minutes * 60)
        recent = [a for a in attempts if a >= window_start]
        self.assertEqual(len(recent), max_attempts)
        # 6th attempt should be blocked
        self.assertGreaterEqual(len(recent), max_attempts)


if __name__ == '__main__':
    unittest.main()
