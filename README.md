# Alumni Tracking & Networking Portal (Design Pattern Lab)

**Stack:** Node.js + Express + SQLite (better-sqlite3) · Tailwind CSS (CDN) + vanilla JS

## Run
```bash
npm install
npm start          # http://localhost:3000
```
The database `alumni.db` is created and seeded on first run (delete it to reset).

## Demo logins
| Role | Email | Password |
|---|---|---|
| Admin | admin@alumni.edu | admin123 |
| Alumni | rahim@alumni.edu (any seeded alumni first name) | password123 |
| Student | student@alumni.edu | password123 |
| Pending alumni | pending1@alumni.edu | password123 |

## Folder structure
```
alumni-portal/
├── server.js                       # boot: seed -> observers -> Express
├── package.json
├── src/
│   ├── seed.js                     # schema + placeholder data (randomuser.me photos)
│   ├── patterns/
│   │   ├── Database.js             # SINGLETON  – one shared DB connection
│   │   ├── NotificationFactory.js  # FACTORY    – Email / SMS / InApp notifications
│   │   └── Observer.js             # OBSERVER   – Subject (publisher) + UserObserver
│   └── routes/api.js               # REST API for all 6 modules + RBAC
└── public/ index.html, app.js      # Tailwind SPA
```

## Where the patterns live (for evaluation)
- **Singleton:** `Database.getInstance()` – private static instance, guarded constructor; used via `getDb()` everywhere.
- **Factory:** `NotificationFactory.create(type, user)` – returns EmailNotification / SMSNotification / InAppNotification.
- **Observer:** `publisher.notify()` is called in `POST /api/jobs` and `POST /api/events`; each verified user is a `UserObserver`
  whose `update()` asks the Factory for a notification in their preferred channel (email/SMS are simulated in the server console).

## Try the Observer flow
Log in as an alumnus -> Jobs -> post a job. Log in as a student -> Notifications tab shows it.
