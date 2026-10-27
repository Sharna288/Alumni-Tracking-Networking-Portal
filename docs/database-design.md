# Database design

SQLite uses foreign-key enforcement, prepared statements, timestamps, indexes, and normalized records for users, jobs, events, registrations, connections, mentorship, notifications, announcements, and audit logs. Departments are available as a reference table; profile department remains a text field in the current demo for flexible onboarding.

## Tables and integrity

- `users`: authentication, role, profile, verification, provenance, suspension, and timestamps. Role and verification state use `CHECK` constraints. Email is unique.
- `connections`: requester and recipient references, constrained status, self-connection prevention, and unique directed pair.
- `jobs`: author-owned opportunity and active status.
- `events` and `event_registrations`: registrations have unique event/user pairs.
- `mentorship_requests`: student/alumni links with unique pair and status.
- `notifications`: per-user in-app message/read state.
- `announcements`: admin-authored notices.
- `audit_logs`: actor, action, target, and JSON details for admin actions.

The seed is idempotent: demo records are added only if the user table is empty. Password hashes use bcrypt. CSV export excludes hashes and emits provenance fields.
