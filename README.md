# 🎓 Alumni Tracking & Networking Portal

### Software Engineering & Design Pattern Lab

> A web-based platform designed to connect alumni, students, and administrators through a centralized alumni networking and tracking system.

---

## 📌 Project Overview

The **Alumni Tracking & Networking Portal** is a web-based application developed as part of the **Software Engineering & Design Pattern Lab** course.

The system provides a centralized platform where:

* 🎓 **Alumni** can create profiles, share job opportunities, and connect with students.
* 👨‍🎓 **Students** can explore alumni, view job opportunities, and receive notifications.
* 🛠️ **Administrators** can manage users, alumni verification, jobs, events, and platform activities.

The project demonstrates the practical implementation of three important **Design Patterns**:

* **Singleton Pattern**
* **Factory Pattern**
* **Observer Pattern**

---

## 🎯 Project Objectives

The main objectives of this project are to:

* Build a centralized alumni networking platform.
* Maintain and manage alumni information efficiently.
* Connect current students with alumni.
* Allow alumni to share career and job opportunities.
* Provide event and notification management.
* Implement role-based access control.
* Demonstrate real-world applications of software design patterns.
* Apply software engineering principles in a practical project.

---

## 🛠️ Technology Stack

| Technology             | Purpose                  |
| ---------------------- | ------------------------ |
| **Node.js**            | Backend runtime          |
| **Express.js**         | Web framework & REST API |
| **SQLite**             | Database                 |
| **better-sqlite3**     | SQLite database driver   |
| **Tailwind CSS**       | User interface styling   |
| **Vanilla JavaScript** | Frontend functionality   |
| **HTML5**              | Application structure    |
| **Git & GitHub**       | Version control          |

---

## ✨ Key Features

### 👨‍🎓 Student Features

* Student registration and login
* Alumni directory
* Alumni profile viewing
* Job opportunity browsing
* Event information
* Notification system
* Networking with alumni

### 🎓 Alumni Features

* Alumni login
* Profile management
* Job opportunity posting
* Event participation
* Notification preferences
* Networking with students

### 🛡️ Admin Features

* Admin authentication
* User management
* Alumni verification
* Job management
* Event management
* Notification management
* Role-Based Access Control (RBAC)

---

# 🧩 Design Patterns Implementation

One of the main purposes of this project is to demonstrate practical implementation of **Design Patterns**.

## 1. 🔹 Singleton Pattern

### File

`src/patterns/Database.js`

### Implementation

The **Singleton Pattern** ensures that only **one shared database connection** is created and used throughout the application.

```text
Database.getInstance()
        ↓
Single Database Instance
        ↓
getDb()
        ↓
Application Routes
```

### Key Concept

* Private/static instance
* Guarded constructor
* Single shared database connection
* Reusable throughout the application

### Usage

The database is accessed through:

```javascript
getDb()
```

instead of creating multiple database connections.

**Purpose:**
To prevent unnecessary database connections and provide a single point of access to the database.

---

## 2. 🔹 Factory Pattern

### File

`src/patterns/NotificationFactory.js`

The **Factory Pattern** is responsible for creating different types of notification objects without exposing their creation logic to the rest of the application.

### Supported Notification Types

```text
NotificationFactory
        │
        ├── EmailNotification
        ├── SMSNotification
        └── InAppNotification
```

The application uses:

```javascript
NotificationFactory.create(type, user)
```

to create the appropriate notification object.

### Example

```text
type = "email"
      ↓
EmailNotification

type = "sms"
      ↓
SMSNotification

type = "inapp"
      ↓
InAppNotification
```

**Purpose:**
To make notification creation flexible, reusable, and easy to extend with new notification types.

---

## 3. 🔹 Observer Pattern

### File

`src/patterns/Observer.js`

The **Observer Pattern** is used to automatically notify verified users when important events occur.

### Main Components

* **Subject / Publisher** → Publishes events
* **UserObserver** → Receives updates
* **NotificationFactory** → Creates the required notification

### Flow

```text
New Job/Event Posted
        ↓
Publisher.notify()
        ↓
Verified Users
        ↓
UserObserver.update()
        ↓
NotificationFactory.create()
        ↓
Email / SMS / In-App Notification
```

The Observer Pattern is triggered when:

```text
POST /api/jobs
POST /api/events
```

is executed.

Each verified user is registered as a `UserObserver`.

The user's preferred notification channel determines which notification is created.

> Email and SMS notifications are simulated and displayed in the server console.

---

# 📂 Project Structure

```text
alumni-portal/
│
├── server.js
├── package.json
│
├── src/
│   ├── seed.js
│   │
│   ├── patterns/
│   │   ├── Database.js
│   │   ├── NotificationFactory.js
│   │   └── Observer.js
│   │
│   └── routes/
│       └── api.js
│
└── public/
    ├── index.html
    └── app.js
```

### Important Files

| File                     | Responsibility                         |
| ------------------------ | -------------------------------------- |
| `server.js`              | Application startup and initialization |
| `seed.js`                | Database schema and sample data        |
| `Database.js`            | Singleton database connection          |
| `NotificationFactory.js` | Factory implementation                 |
| `Observer.js`            | Observer implementation                |
| `api.js`                 | REST API, modules & RBAC               |
| `index.html`             | Frontend interface                     |
| `app.js`                 | Frontend application logic             |

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* **Node.js**
* **npm**
* **Git** *(optional)*

---

## 📥 Installation

Clone the repository and navigate to the project directory:

```bash
git clone <repository-url>
cd alumni-portal
```

Install the required dependencies:

```bash
npm install
```

---

## ▶️ Run the Application

Start the application using:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

On the first run, the application automatically creates and seeds the database.

### 🔄 Reset Database

To reset the application data:

1. Stop the server.
2. Delete:

```text
alumni.db
```

3. Start the application again:

```bash
npm start
```

The database will be recreated with the initial seed data.

---

# 🔐 Demo Login Credentials

| Role             | Email                 | Password      |
| ---------------- | --------------------- | ------------- |
| 🛡️ Admin        | `admin@alumni.edu`    | `admin123`    |
| 🎓 Alumni        | `rahim@alumni.edu`    | `password123` |
| 👨‍🎓 Student    | `student@alumni.edu`  | `password123` |
| ⏳ Pending Alumni | `pending1@alumni.edu` | `password123` |

> **Note:** For testing other seeded alumni accounts, use their seeded email/first-name information with the provided demo password.

---

# 🧪 Design Pattern Demonstration

For easy evaluation, the three patterns can be tested as follows:

### Singleton

Open:

```text
src/patterns/Database.js
```

Check:

```javascript
Database.getInstance()
```

The application uses a single shared database instance.

### Factory

Open:

```text
src/patterns/NotificationFactory.js
```

Check:

```javascript
NotificationFactory.create(type, user)
```

Different notification objects are created based on the requested type.

### Observer

Open:

```text
src/patterns/Observer.js
```

Then:

1. Login as an **Alumni**.
2. Go to **Jobs**.
3. Post a new job.
4. Login as a **Student**.
5. Open the **Notifications** tab.
6. The newly posted job notification should appear.

The same observer mechanism is also used for events.

---

# 🔄 Observer Flow Example

```text
Alumni Posts a Job
        │
        ▼
POST /api/jobs
        │
        ▼
Publisher.notify()
        │
        ▼
Verified UserObservers
        │
        ▼
UserObserver.update()
        │
        ▼
NotificationFactory
        │
        ├───────────────┐
        ▼               ▼
     Email            SMS
        │
        └───────┬───────┘
                ▼
          In-App Notification
```

---

# 🔒 Security & Access Control

The application includes **Role-Based Access Control (RBAC)** to restrict functionality based on user roles.

### User Roles

```text
Admin
  │
  ├── User Management
  ├── Alumni Verification
  ├── Job Management
  └── Event Management

Alumni
  │
  ├── Profile
  ├── Jobs
  └── Events

Student
  │
  ├── Alumni Directory
  ├── Jobs
  └── Notifications
```

---

# 🌱 Future Improvements

The project can be extended with:

* Real email notification integration
* Real SMS notification service
* Alumni-to-student messaging
* Advanced search and filtering
* LinkedIn profile integration
* Alumni mentorship system
* Career recommendation system
* Real-time notifications using WebSockets
* Advanced analytics dashboard
* Cloud database integration

---

# 👥 Project Information

**Project:** Alumni Tracking & Networking Portal
**Course:** Software Engineering & Design Pattern Lab
**Category:** Web Application
**Architecture:** Client–Server / REST API
**Database:** SQLite
**Design Patterns:** Singleton, Factory, Observer

---

# 📚 Learning Outcomes

Through this project, the team demonstrates practical understanding of:

* Software Engineering principles
* Object-Oriented Design
* Design Patterns
* RESTful API development
* Database management
* Role-Based Access Control
* Frontend–Backend integration
* Version control with Git/GitHub
* Practical software architecture

---

## ⭐ Conclusion

The **Alumni Tracking & Networking Portal** demonstrates how software engineering concepts and design patterns can be applied to a real-world networking platform.

The implementation of the **Singleton, Factory, and Observer Patterns** improves the application's structure, maintainability, scalability, and separation of responsibilities.

This project was developed as part of the:

> **Software Engineering & Design Pattern Lab**
