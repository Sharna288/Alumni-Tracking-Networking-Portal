# Architecture

The application is a modular monolith. The browser calls REST endpoints over same-origin HTTP; Express provides session and role middleware, endpoint validation, and domain actions. SQLite is shared through the `Database` singleton. Notification subscribers react to domain events through an in-process event bus.

```mermaid
flowchart TB
  UI[Responsive HTML/CSS/vanilla JS]
  API[Express REST API]
  AUTH[Session + role authorization]
  DOMAIN[Alumni · Connections · Jobs · Events · Mentorship · Admin]
  P[Factory · Observer · Strategy]
  SQL[(SQLite)]
  UI --> API --> AUTH --> DOMAIN --> SQL
  DOMAIN --> P --> SQL
```

## UML source

### Use cases

```mermaid
flowchart LR
  Student((Student)) --> Browse[Browse verified alumni]
  Student --> Connect[Send connection request]
  Student --> Mentor[Request mentorship]
  Student --> Register[Register for event]
  Alumni((Alumni)) --> Profile[Edit profile / request verification]
  Alumni --> Job[Post opportunity]
  Alumni --> Respond[Respond to mentorship]
  Admin((Administrator)) --> Verify[Review alumni]
  Admin --> Manage[Manage events and announcements]
  Admin --> Export[Export directory]
```

### Class diagram

```mermaid
classDiagram
  class Database { +getInstance() }
  class EventBus { +subscribe(name, handler) +publish(name, payload) }
  class NotificationFactory { +create(channel, data) }
  class InAppNotification { +deliver(db) }
  class SearchStrategy { <<contract>> +matches(profile, value) }
  class AlumniSearchService { +search(db, filters) }
  NotificationFactory --> InAppNotification
  AlumniSearchService --> SearchStrategy
  Database --> AlumniSearchService
  EventBus --> NotificationFactory
```

### ER diagram

```mermaid
erDiagram
  USERS ||--o{ CONNECTIONS : requests
  USERS ||--o{ JOBS : authors
  USERS ||--o{ EVENT_REGISTRATIONS : registers
  EVENTS ||--o{ EVENT_REGISTRATIONS : has
  USERS ||--o{ MENTORSHIP_REQUESTS : student_or_alumni
  USERS ||--o{ NOTIFICATIONS : receives
  USERS ||--o{ AUDIT_LOGS : performs
  USERS { int id PK string email UK string role string verification_status }
  CONNECTIONS { int id PK int requester_id FK int recipient_id FK string status }
  JOBS { int id PK int author_id FK string title string company }
  EVENTS { int id PK string title datetime starts_at }
  EVENT_REGISTRATIONS { int id PK int event_id FK int user_id FK }
```
