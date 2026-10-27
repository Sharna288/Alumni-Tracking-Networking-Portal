# Security

Passwords use bcrypt hashing and hashes are excluded from API projections. Public registration only permits student/alumni. Authorization is checked in Express middleware and mutation queries scope access to owners/recipients. SQL values use placeholders; mutable profile fields use an allowlist. Login/register rate limiting and Helmet are enabled. Session cookies are HTTP-only, SameSite Lax, and Secure in production. Authenticated state-changing requests require an unpredictable session-bound `X-CSRF-Token`; the current token is returned by `/api/auth/me` and login/register responses for the same-origin client.

## Remaining work before production

Use a persistent session store; enforce HTTPS; set a deployment secret; add comprehensive field validation and audit events for every administrative mutation; review and tighten CSP; implement backups and migrations; assess data retention/consent rules; and run security testing. Do not expose the seeded administrator credentials publicly.
