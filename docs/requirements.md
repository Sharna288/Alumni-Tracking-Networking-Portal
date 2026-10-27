# Requirements

## Problem and objective

University communities need one place to discover graduates, share career opportunities, build connections, and arrange mentorship and events. The portal supports these workflows while reserving official alumni verification for administrators.

## Scope

The local demonstration includes student, alumni, and administrator roles; profile discovery; connections; jobs; events; mentorship; notifications; announcements; admin review; audit history; and CSV export. Institution-specific integrations, outbound email/SMS, image hosting, production deployment, and real-person data collection are outside this build.

## Functional requirements

1. Users can register and authenticate; roles are constrained to student/alumni at public registration.
2. Students and alumni can edit only their own profile fields.
3. Visitors can search only verified alumni; results support department, graduation year, skill, company, and text search.
4. Signed-in users can request connections; recipients can accept/reject; participants can remove a connection.
5. Alumni can publish jobs/internships and manage their own posts.
6. Signed-in users can browse events and register/cancel; uniqueness is enforced by SQLite.
7. Students can request mentorship from verified alumni; recipients can respond.
8. Users can read and mark their notifications; announcements are readable by all.
9. Administrators can review alumni profiles, suspend accounts, publish events and announcements, inspect dashboard counts, audit actions, and export alumni data.

## Non-functional requirements

Prepared SQL statements and relational constraints protect integrity. Passwords are hashed. Backend authorization protects role-sensitive actions. Responsive layout supports mobile and desktop. Seed data is fictional and clearly disclosed. The application is a modular monolith suitable for a local classroom demonstration.

## Roles and use cases

| Role | Primary use cases |
|---|---|
| Student | Browse verified directory, connect, request mentorship, register for events, read updates |
| Alumni | Maintain profile, request verification, connect, post opportunities, respond to mentorship |
| Administrator | Verify/reject/suspend accounts, manage events/announcements, inspect metrics, export directory |
