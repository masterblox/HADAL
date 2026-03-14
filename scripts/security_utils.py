#!/usr/bin/env python3
"""
Security Utilities for Gulf Watch
Provides input sanitization and security helpers
"""

import html
import re
from typing import Optional

def escape_html(text: Optional[str]) -> str:
    """
    Escape HTML special characters to prevent XSS
    Converts < > " ' & to their HTML entities
    """
    if not text:
        return ""
    return html.escape(str(text))

def sanitize_url(url: Optional[str]) -> str:
    """
    Sanitize URL to prevent javascript: protocol injection
    Only allows http:// https:// ftp:// protocols
    """
    if not url:
        return "#"
    
    url = str(url).strip()
    
    # Allow only safe protocols
    allowed_protocols = ('http://', 'https://', 'ftp://')
    
    # Check for javascript: data: vbscript: etc
    dangerous = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'chrome:']
    url_lower = url.lower()
    
    for d in dangerous:
        if url_lower.startswith(d):
            return "#"
    
    # If no protocol, check if it's a valid relative URL or add https
    if not any(url.startswith(p) for p in allowed_protocols):
        # If starts with /, it's relative
        if url.startswith('/'):
            return url
        # Otherwise assume http
        return "https://" + url
    
    return url

def sanitize_id(incident_id: Optional[str]) -> str:
    """
    Sanitize incident ID to prevent injection
    Only allows alphanumeric, dash, underscore
    """
    if not incident_id:
        return ""
    
    # Remove any non-alphanumeric characters except dash and underscore
    sanitized = re.sub(r'[^a-zA-Z0-9\-_]', '', str(incident_id))
    return sanitized[:100]  # Limit length

def validate_country_code(code: str) -> bool:
    """
    Validate country code is safe (2 letters only)
    Prevents SSRF via country code injection
    """
    if not code or len(code) != 2:
        return False
    return bool(re.match(r'^[a-zA-Z]{2}$', code))

def generate_safe_fingerprint(user_agent: str = '', ip: str = '') -> str:
    """
    Generate a safe device fingerprint
    Does NOT include raw IP to protect privacy
    """
    import hashlib
    
    # Use only non-sensitive browser characteristics
    # Never include raw IP address
    data = f"{user_agent}:{hashlib.md5(ip.encode()).hexdigest()[:8]}"
    
    hash_obj = hashlib.sha256(data.encode())
    return hash_obj.hexdigest()[:16]

class SecurityHeaders:
    """Security headers for API responses"""
    
    @staticmethod
    def get_cors_headers() -> dict:
        """Get CORS headers with restricted origin"""
        return {
            'Access-Control-Allow-Origin': 'https://gulfwatch-testing.vercel.app',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
        }
    
    @staticmethod
    def get_static_headers() -> dict:
        """Headers for static content"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        }

# Admin key should be set via environment variable
import os
ADMIN_KEY = os.environ.get('GULFWATCH_ADMIN_KEY', '')

def verify_admin_key(key: str) -> bool:
    """
    Verify admin key against environment variable
    NEVER hardcode admin keys
    """
    if not ADMIN_KEY or not key:
        return False
    
    # Use constant-time comparison to prevent timing attacks
    import hmac
    return hmac.compare_digest(key, ADMIN_KEY)
