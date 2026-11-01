# AlumniConnect

**Your Past Connects to Your Future.**

AlumniConnect is a local alumni networking demo for university students, alumni, and administrators. It uses a static frontend, an Express JSON API, SQLite persistence, and server-side session authorization.

## Features

- Student and alumni sign-up and sign-in; public registration cannot create administrators.
- Alumni profiles with administrator verification and a public directory of verified profiles.
- Configurable departments with alumni totals, featured profiles, and graduation-year breakdowns.
- Dedicated Alumni Network and Explore Alumni pages with combined filters for department, degree, year range, profession, company, industry, location, skills, mentor availability, and hiring status.
- Global search across alumni, departments, jobs, and events; directory filters are bookmarkable.
- Individual alumni profile routes with privacy-aware email visibility, education and career timelines, skills, achievements, projects, certifications, and optional HTTPS professional links.
- Personalized dashboard with profile completion, connection requests, suggested alumni, mentors, opportunities, and upcoming events.
- Connection requests, accepted connections, blocking, reporting, and in-app notifications.
- Database-backed direct messaging for accepted connections, including conversation history and unread counts.
- Mentorship requests between students and verified alumni.
- Job and internship listings, including authorized alumni posting and ownership checks.
- Searchable jobs and internships, saved-job API support, and ownership-aware status controls.
- Community posts, reactions, and comments backed by SQLite.
- Event listings and authenticated event registration/cancellation.
- Announcements and an administrator area for verification, user suspension, department configuration, report review, event management, and CSV export.
- Original AlumniConnect SVG brand assets and a responsive, keyboard-accessible interface.

The home page figures and sample content come from the local database. Five alumni profiles and their seeded education and career histories are fictional; the interface labels them as local demo content and does not mark fictional profiles as verified.

## Technology

- Node.js and Express 4
- SQLite with `better-sqlite3`
- Vanilla JavaScript, HTML, and CSS
- `express-session`, `bcryptjs`, `helmet`, and `express-rate-limit`
- Node's built-in test runner

There is no Vite, React, TypeScript, Tailwind build, or separate production build command in this repository. The unused Tailwind CDN reference has been removed; the interface uses the local stylesheet.

## Requirements

- Node.js 20 or newer
- npm

## Install and run

From the project directory:

```powershell
npm install
npm start
```

Open <http://localhost:3000>. If port 3000 is taken, choose another port in PowerShell:

```powershell
$env:PORT = '3001'
npm start
```

The SQLite database is created and seeded on first startup at `data/alumni.db`. Local account changes, registrations, and other implemented API writes are stored in that database and survive page reloads and server restarts. Stop the server before backing up or removing the database. Do not use demo data as a production dataset.

## Demo accounts

These seeded credentials are for local evaluation only:

| Role          | Email                       | Password        |
| ------------- | --------------------------- | --------------- |
| Administrator | `admin@example.edu`         | `AdminDemo123!` |
| Student       | `nadia.student@example.edu` | `DemoPass123!`  |
| Student       | `arif.student@example.edu`  | `DemoPass123!`  |
| Verified alum | `maliha.alumni@example.edu` | `DemoPass123!`  |
| Verified alum | `rafi.alumni@example.edu`   | `DemoPass123!`  |
| Pending alum  | `samira.alumni@example.edu` | `DemoPass123!`  |

The seeded administrator must never be exposed on a public deployment. The demo database intentionally contains this account to make the admin workflow testable locally.

## Configuration

`.env.example` documents supported variables. The application does not load `.env` files itself; set variables in the process environment or deployment platform.

| Variable           | Purpose                                  | Default                                |
| ------------------ | ---------------------------------------- | -------------------------------------- |
| `PORT`             | HTTP port                                | `3000`                                 |
| `DATABASE_FILE`    | SQLite database path                     | `./data/alumni.db`                     |
| `SESSION_SECRET`   | Session signing secret                   | Local-only fallback outside production |
| `INSTITUTION_NAME` | Reserved institution customization value | `Your University`                      |
| `NODE_ENV`         | Runtime environment                      | Node default                           |

In production, `SESSION_SECRET` is required. Generate a value with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and configure it directly in the deployment environment. Never commit the generated value.

## Tests and checks

```powershell
npm test
node --check server.js
node --check public/app.js
```

The integration tests launch an isolated server and temporary SQLite database. They cover password hashing, registration, anonymous session state, admin authorization, CSRF, directory privacy and filtering, connection workflows, job ownership, event registration, and admin export.

## Architecture and data

- `server.js` defines the API, session and CSRF middleware, and role checks.
- `src/db.js` initializes the SQLite schema and fictional seed records; `src/migrations.js` adds backward-compatible profile, directory, messaging, job, event, and community tables and fields.
- `src/feature-routes.js` defines department, search, detailed profile, messaging, community, privacy, and dashboard endpoints.
- `src/patterns/` contains the database singleton, notification factory, event bus, and alumni search strategies.
- `public/index.html`, `public/app.js`, and `public/styles.css` implement the frontend and hash-based page navigation.
- `public/assets/` contains the AlumniConnect symbol and horizontal logo variants.
- `tests/` contains API integration and design-pattern tests.
- `docs/` contains schema, API, architecture, security, and testing notes.

Passwords are bcrypt-hashed. Admin routes use server-side role checks, authenticated writes require a session CSRF token, and public alumni responses omit email addresses. Public registration only accepts student and alumni roles.

## Demo limits and production work

This is a functional local demo, not a production-ready hosted service. It does not integrate an external authentication provider, email/SMS delivery, real-time messaging, job applications, image uploads, password reset, or Supabase. Messaging is database-backed and refresh-based; the community feed currently supports text posts and reactions, while moderation and advanced job workflow coverage remain limited. Email and SMS are not sent. Do not represent an external application or message as delivered.

Before a real deployment, replace the in-memory Express session store with a persistent store, remove or securely provision the seeded demo administrator, configure HTTPS and a strong session secret, review Content Security Policy and proxy settings, define privacy/retention policies, add comprehensive input validation and moderation workflows, and perform security testing. The current Helmet configuration disables CSP, and the default session store is not suitable for production.

No external backend credentials are required for local use. Remote Google Fonts and Unsplash images are used for visual presentation; a network connection is needed for those assets, but core app data is local.
