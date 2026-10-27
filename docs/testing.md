# Testing

Run `npm test` after installing dependencies. The Node test runner covers singleton identity, notification factory behavior, observer delivery, composed directory filtering, registration and duplicate email handling, password hashing, invalid credentials, student/alumni role restrictions, directory filters, connection uniqueness and notification delivery, job ownership, event registration uniqueness, and CSV export authorization. API integration tests launch an isolated server backed by a temporary SQLite database and remove it after the run.

Manual smoke steps: register a student; log in as seeded alumni and post a job; connect from a student account and review the request; register/cancel an event; log in as admin and verify the pending demo alumnus; inspect CSV export. Test with the demo database only.
