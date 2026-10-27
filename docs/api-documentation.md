# API documentation

All routes are rooted at `/api`. JSON errors have `{ "error": "message" }`. Session cookie authentication is used. Public registration cannot select admin. Admin routes require a server-verified admin role.

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public, rate limited | Create student/alumni account |
| POST | `/auth/login` | Public, rate limited | Start session |
| POST | `/auth/logout` | Signed-in | Destroy session |
| GET | `/auth/me` | Signed-in | Current user |
| GET | `/alumni` | Public | Verified directory; `q`, `department`, `graduation_year`, `company`, `skill`, `page`, `limit` |
| GET | `/alumni/:id` | Public | Verified profile |
| GET/PATCH | `/alumni/me` | Signed-in | Read/update own profile |
| GET | `/connections` | Signed-in | Accepted connections |
| GET | `/connections/requests` | Signed-in | Incoming requests |
| POST | `/connections` | Signed-in | Send request with `user_id` |
| PATCH/DELETE | `/connections/:id` | Signed-in participant | Respond/remove request |
| GET | `/jobs` | Public | Active opportunities |
| POST/DELETE | `/jobs[/:id]` | Alumni author/admin | Create/remove opportunity |
| GET | `/events` | Public | List events |
| POST/DELETE | `/events/:id/register` | Signed-in | Register/cancel |
| PATCH | `/jobs/:id` | Job author/admin | Update opportunity |
| POST | `/mentorship/requests` | Signed-in | Request mentoring with `alumni_id`, `message` |
| GET/PATCH | `/mentorship/requests` | Signed-in / alumni recipient | List/respond |
| GET | `/notifications` | Signed-in | Own notifications |
| PATCH | `/notifications/:id/read` | Signed-in owner | Mark read |
| GET | `/announcements` | Public | List notices |
| GET | `/admin/dashboard` | Admin | Database counts |
| GET | `/admin/users` | Admin | User review list |
| PATCH | `/admin/users/:id/verification` | Admin | Verify/reject/pending with reason |
| PATCH | `/admin/users/:id/suspend` | Admin | Suspend/restore |
| POST | `/admin/events` | Admin | Publish event |
| GET/PATCH/DELETE | `/admin/events[/:id]` | Admin | List/update/delete events |
| GET | `/admin/events/:id/registrations` | Admin | View event attendees |
| POST | `/admin/announcements` | Admin | Publish notice |
| GET | `/admin/alumni/export` | Admin | CSV export |
| GET | `/admin/audit-logs` | Admin | Recent sensitive actions |
