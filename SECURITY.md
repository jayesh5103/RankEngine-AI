# Security Reference — RankEngine AI API

This document covers the security controls applied in `/apps/api` per the project's
non-functional requirements. It is intended for the engineering team and security reviewers.

---

## 1. Password Hashing

| Field | Algorithm | Cost / Work Factor | Location |
|---|---|---|---|
| `User.passwordHash` | **bcrypt** | **12** (≈ 250 ms on a modern CPU) | `src/routes/auth.ts` |

**Why cost 12?**  OWASP recommends a minimum of 10; 12 is the practical balance between
brute-force resistance and acceptable registration/login latency (~250 ms).

Passwords are **never stored in plaintext**. The hash is compared at login via
`bcrypt.compare()`. The raw password is never logged.

---

## 2. Field-Level Encryption at Rest

Sensitive fields that must not be readable if the database is compromised are encrypted
using AES-256-GCM before storage.

| Algorithm | Key Size | Auth Tag | IV |
|---|---|---|---|
| **AES-256-GCM** | 256 bits (32 bytes) | 128 bits (detects tampering) | 96-bit random nonce per call |

### Encrypted fields

| Model | Field | Encrypted? | Notes |
|---|---|---|---|
| `Project` | `stagingCredentials` (future) | ✅ Yes | If/when staging server auth is added |
| Any model | Stored third-party API keys | ✅ Yes | Via `encrypt()`/`decrypt()` util |

### Wire format stored in MongoDB

```
<iv_hex>:<ciphertext_hex>:<authTag_hex>
```

All three segments are hex-encoded and delimited by `:`.

### Key management

| Env Var | Description |
|---|---|
| `ENCRYPTION_KEY` | 64-character hex string (32 bytes). **Must be cryptographically random in production.** |

> **Generate a key:**
> ```sh
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> ⚠️ **Never commit `ENCRYPTION_KEY` to source control.**
> The default value (`000...0`) is only accepted in `NODE_ENV=development` or `test`.
> The server exits at startup if the placeholder key is detected in production.

### Utility

`src/utils/encryption.ts` exports:
- `encrypt(plaintext: string): string`
- `decrypt(ciphertext: string): string`

Both throw on key misconfiguration or auth-tag mismatch (tampered data).

---

## 3. Rate Limiting

### Global limit (all endpoints)

| Setting | Value | Config |
|---|---|---|
| Window | **15 minutes** | `RATE_LIMIT_WINDOW_MS=900000` |
| Max requests per IP per window | **200** | `RATE_LIMIT_MAX=200` |
| Response headers | `RateLimit-*` (RFC 6585) | `standardHeaders: true` |
| Library | `express-rate-limit` | `src/app.ts` |
| Skipped in | `NODE_ENV=test` | Never blocks test suite |

### Grading endpoint — stricter per-route limit

| Endpoint | Algorithm | Limit | Window | Key |
|---|---|---|---|---|
| `POST /api/content/grade` | Sliding window in-memory | **10 requests** | **1 second** | `userId` (or IP fallback) |

This ensures the grader responds within the 500 ms SLA even under concurrent load,
while protecting the CPU-intensive local scoring logic from abuse.

Custom limiter: `src/middleware/rateLimiter.ts` (`rateLimiter(10, 1000)`)

---

## 4. HTTP Security Headers

Provided by **[helmet](https://helmetjs.github.io/)** (default configuration):

| Header | Protection |
|---|---|
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options: SAMEORIGIN` | Clickjacking protection |
| `Strict-Transport-Security` | Forces HTTPS in browsers |
| `Content-Security-Policy` | Restricts resource origins |
| `Referrer-Policy: no-referrer` | Hides URL from third parties |
| `X-XSS-Protection: 0` | Disables broken IE filter (modern CSP replaces it) |

---

## 5. CORS

| Setting | Value |
|---|---|
| Allowed origin | `CORS_ORIGIN` env var (default: `http://localhost:5173`) |
| Allowed methods | `GET, POST, PATCH, PUT, DELETE, OPTIONS` |
| Allowed headers | `Content-Type, Authorization` |
| Credentials | `true` |

**Production must set `CORS_ORIGIN` to the exact frontend domain** (e.g.
`https://app.rankengine.io`). Using `cors()` with no arguments (allows `*`) is
explicitly prohibited.

---

## 6. Request Logging

Library: **morgan**

| What IS logged | What is NEVER logged |
|---|---|
| Method, URL, status, response time | `Authorization` header |
| Remote IP (dev format) | Request bodies (passwords, API keys) |
| User-Agent, Referrer (prod format) | `Cookie` values |

Format: `combined` in production (Apache-compatible, suitable for log aggregators like
Datadog/CloudWatch), `dev` in development (coloured, concise).

Logging is skipped entirely in `NODE_ENV=test` to keep test output clean.

---

## 7. Error Handling

Centralized error handler (`src/middleware/errorHandler.ts`) mounted as the last middleware:

| Environment | Client sees | Server logs |
|---|---|---|
| `production` | Generic `"Internal server error"` for 5xx | Full message + stack trace |
| `production` | Original message for operational 4xx errors | Full message + stack trace |
| `development` / `test` | Full message + stack trace | Full message + stack trace |

**Stack traces are never exposed to API clients in production.**

---

## 8. Other Controls

- **JWT**: Signed with `JWT_SECRET` (min 8 chars, recommended 32+ in production).
  Expiry controlled by `JWT_EXPIRY`.
- **Body size cap**: `express.json({ limit: '1mb' })` prevents large payload attacks.
- **Bcrypt on registration**: `bcrypt.hash(password, 12)` — passwords hashed before
  any DB write.
- **Ownership checks**: Every protected route verifies `project.ownerId === req.user.userId`
  before returning data (tenant isolation).

---

## 9. Environment Variable Checklist for Production

```
# Required
MONGODB_URI=           # MongoDB connection string (use a secrets manager)
REDIS_URL=             # Redis connection string
JWT_SECRET=            # Min 32 random chars
JWT_EXPIRY=7d

# Security-critical
ENCRYPTION_KEY=        # 64 hex chars — generate fresh, store in secrets manager
CORS_ORIGIN=           # Exact frontend URL, e.g. https://app.rankengine.io

# Rate limiting (tune per load test results)
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX=200

# External APIs (store in secrets manager, never in .env committed to git)
LLM_API_KEY=
SERP_API_KEY=
```
