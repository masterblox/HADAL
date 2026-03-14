# Security Policy

## GulfWatch Testing - Security Hardening

### Critical Fixes Applied

#### 1. XSS Prevention (CRITICAL)
- **Issue**: User-controlled content (titles, sources) was inserted directly into innerHTML
- **Fix**: Added `escapeHtml()` and `sanitizeUrl()` functions to sanitize all user content
- **Files Modified**: `public/index.html`

#### 2. Hardcoded Admin Key (CRITICAL)
- **Issue**: Admin key `gulfwatch_admin_2024` was hardcoded in source
- **Fix**: Moved to environment variable `GULFWATCH_ADMIN_KEY`
- **Files Modified**: `scripts/user_report_system.py`

#### 3. Privacy Protection (HIGH)
- **Issue**: Raw IP addresses could be stored in fingerprints
- **Fix**: Hash IP addresses before storing
- **Files Modified**: `scripts/user_report_system.py`

#### 4. Timing Attack Prevention (MEDIUM)
- **Issue**: String comparison for admin key vulnerable to timing attacks
- **Fix**: Use `hmac.compare_digest()` for constant-time comparison
- **Files Modified**: `scripts/user_report_system.py`

### Security Checklist

| Threat | Status | Mitigation |
|--------|--------|------------|
| XSS | ✅ FIXED | HTML escaping on all user content |
| Hardcoded Secrets | ✅ FIXED | Environment variables |
| Privacy Leak | ✅ FIXED | IP hashing |
| Timing Attacks | ✅ FIXED | Constant-time comparison |
| SSRF | ✅ SAFE | Hardcoded URLs only |
| Command Injection | ✅ SAFE | No shell commands |
| SQL Injection | ✅ SAFE | JSON files, no SQL |
| CSRF | ⚠️ ACCEPTABLE | Static site, no session state |
| Rate Limiting | ⚠️ PARTIAL | GitHub Actions schedule only |

### Required Environment Variables

```bash
# Required for admin functions
export GULFWATCH_ADMIN_KEY="your-secure-random-key-here"

# Required for NewsData.io API (optional)
export NEWSDATA_API_KEY="your-newsdata-api-key"
```

### Security Headers

Add these headers in your web server/CDN configuration:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self' https://*.vercel.app https://unpkg.com
Referrer-Policy: strict-origin-when-cross-origin
```

### Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT open a public issue
2. Email security@gulf-watch.app
3. Allow 48 hours for response before public disclosure

### Security Audit Log

- **2026-03-14**: Initial security audit and hardening
  - Fixed XSS vulnerabilities
  - Removed hardcoded admin key
  - Added IP hashing for privacy
  - Added security utilities module
