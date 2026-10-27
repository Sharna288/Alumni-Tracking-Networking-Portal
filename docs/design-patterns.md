# Design patterns

## Singleton — creational

`src/db.js` uses `Database.getInstance()` to share one SQLite handle and enable foreign keys once. This avoids creating a new database connection per request. Trade-off: one local process owns the connection; clustered deployments need a shared database service.

## Factory — creational

`NotificationFactory.create(channel, data)` selects in-app, email, or SMS notification implementations. In-app delivery writes to SQLite. Email and SMS return an explicit unavailable result because no provider is configured; no false delivery claim is made.

## Observer — behavioral

`EventBus` separates publishers from subscribers. A connection request emits `connection.requested`; the notification subscriber writes a recipient notification. Job creation emits `job.created` and notifies users. The current bus is synchronous and process-local.

## Strategy — behavioral

`search-strategies.js` defines independent predicates for department, year, company, skill, and text matching. The search service composes active filters and only searches verified, unsuspended profiles. Add a predicate without rewriting endpoint flow.

Unit examples are in `tests/patterns.test.js` and run with `npm test`.
