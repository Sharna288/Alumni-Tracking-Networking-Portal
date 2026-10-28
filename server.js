const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const crypto = require("crypto");
const { initialize } = require("./src/db");
const { NotificationFactory } = require("./src/patterns/notification-factory");
const { events } = require("./src/patterns/event-bus");
const { searchAlumni } = require("./src/patterns/search-strategies");

const db = initialize();
const app = express();
const sessionSecret =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "local-demo-only-change-me");
if (!sessionSecret)
  throw new Error("SESSION_SECRET must be configured in production.");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);
app.use((req, res, next) => {
  if (
    !["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ||
    ["/api/auth/login", "/api/auth/register"].includes(req.path) ||
    !req.session.user
  )
    return next();
  const supplied = req.get("x-csrf-token");
  if (
    !supplied ||
    !req.session.csrfToken ||
    supplied.length !== req.session.csrfToken.length ||
    !crypto.timingSafeEqual(
      Buffer.from(supplied),
      Buffer.from(req.session.csrfToken),
    )
  )
    return res.status(403).json({ error: "Invalid or missing CSRF token" });
  next();
});
app.use(express.static(path.join(__dirname, "public")));
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  graduation_year: u.graduation_year,
  degree: u.degree,
  skills: u.skills,
  company: u.company,
  job_title: u.job_title,
  bio: u.bio,
  linkedin_url: u.linkedin_url,
  verification_status: u.verification_status,
  source_type: u.source_type,
});
const publicAlumni = (u) => {
  const { email, ...profile } = safeUser(u);
  return profile;
};
const requireAuth = (req, res, next) =>
  req.session.user
    ? next()
    : res.status(401).json({ error: "Sign in required" });
const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.session.user?.role)
      ? next()
      : res.status(403).json({ error: "Not authorized" });
function notify(userId, type, message) {
  const n = NotificationFactory.create("in_app", { userId, type, message });
  n.deliver(db);
}
events.subscribe("connection.requested", (e) =>
  notify(e.to, "connection", `${e.name} sent you a connection request.`),
);
events.subscribe("job.created", (e) => {
  for (const u of db
    .prepare(
      "SELECT id FROM users WHERE role IN ('student','alumni') AND id != ?",
    )
    .all(e.author))
    notify(u.id, "job", `New opportunity: ${e.title}`);
});

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "Alumni Portal" }),
);
app.post("/api/auth/register", authLimit, (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = "student",
      department = "",
      graduation_year = null,
      degree = "",
    } = req.body;
    if (
      !name ||
      !/^\S+@\S+\.\S+$/.test(email || "") ||
      !password ||
      password.length < 8
    )
      return res.status(400).json({
        error: "Name, valid email, and password (8+ characters) are required",
      });
    if (!["student", "alumni"].includes(role))
      return res.status(400).json({ error: "Choose student or alumni" });
    const bcrypt = require("bcryptjs");
    const hash = bcrypt.hashSync(password, 12);
    const status = role === "alumni" ? "pending" : "not_applicable";
    const result = db
      .prepare(
        "INSERT INTO users(name,email,password_hash,role,department,graduation_year,degree,verification_status,source_type) VALUES(?,?,?,?,?,?,?,?,?)",
      )
      .run(
        name.trim(),
        email.toLowerCase(),
        hash,
        role,
        department,
        graduation_year ? Number(graduation_year) : null,
        degree,
        status,
        "user_submitted",
      );
    req.session.user = {
      id: Number(result.lastInsertRowid),
      role,
      name: name.trim(),
    };
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    res.status(201).json({
      user: {
        id: Number(result.lastInsertRowid),
        name,
        email: email.toLowerCase(),
        role,
        verification_status: status,
      },
      csrfToken: req.session.csrfToken,
    });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res.status(409).json({ error: "Email is already registered" });
    next(e);
  }
});
app.post("/api/auth/login", authLimit, (req, res) => {
  const u = db
    .prepare("SELECT * FROM users WHERE email=?")
    .get(String(req.body.email || "").toLowerCase());
  if (
    !u ||
    !require("bcryptjs").compareSync(req.body.password || "", u.password_hash)
  )
    return res.status(401).json({ error: "Invalid email or password" });
  if (u.suspended)
    return res.status(403).json({ error: "This account is suspended" });
  req.session.user = { id: u.id, role: u.role, name: u.name };
  req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  res.json({ user: safeUser(u), csrfToken: req.session.csrfToken });
});
app.post("/api/auth/logout", requireAuth, (req, res) =>
  req.session.destroy(() => res.json({ ok: true })),
);
app.get("/api/auth/me", (req, res) => {
  if (!req.session.user) return res.json({ user: null, csrfToken: null });
  res.json({
    user: safeUser(
      db.prepare("SELECT * FROM users WHERE id=?").get(req.session.user.id),
    ),
    csrfToken: req.session.csrfToken,
  });
});

app.get("/api/alumni", (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const items = searchAlumni(db, req.query);
  res.json({
    items: items.slice((page - 1) * limit, page * limit).map(publicAlumni),
    page,
    limit,
    total: items.length,
  });
});
app.get("/api/alumni/me", requireAuth, (req, res) =>
  res.json({
    user: safeUser(
      db.prepare("SELECT * FROM users WHERE id=?").get(req.session.user.id),
    ),
  }),
);
app.patch("/api/alumni/me", requireAuth, (req, res) => {
  const allowed = [
    "department",
    "graduation_year",
    "degree",
    "skills",
    "company",
    "job_title",
    "bio",
    "linkedin_url",
  ];
  const fields = allowed.filter((k) => Object.hasOwn(req.body, k));
  if (!fields.length)
    return res.status(400).json({ error: "No editable fields provided" });
  if (req.body.linkedin_url && !/^https:\/\//i.test(req.body.linkedin_url))
    return res
      .status(400)
      .json({ error: "Professional profile URL must use HTTPS" });
  if (
    req.body.graduation_year &&
    (!Number.isInteger(Number(req.body.graduation_year)) ||
      Number(req.body.graduation_year) < 1950 ||
      Number(req.body.graduation_year) > 2100)
  )
    return res.status(400).json({ error: "Invalid graduation year" });
  const sql = fields.map((k) => `${k}=?`).join(",");
  const reverify =
    db.prepare("SELECT role FROM users WHERE id=?").get(req.session.user.id)
      ?.role === "alumni";
  db.prepare(
    `UPDATE users SET ${sql},${reverify ? "verification_status='pending',verified_by=NULL,verified_at=NULL," : ""}updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).run(...fields.map((k) => req.body[k]), req.session.user.id);
  res.json({
    user: safeUser(
      db.prepare("SELECT * FROM users WHERE id=?").get(req.session.user.id),
    ),
  });
});
app.get("/api/alumni/:id", (req, res) => {
  const u = db
    .prepare(
      "SELECT * FROM users WHERE id=? AND role='alumni' AND verification_status='verified'",
    )
    .get(req.params.id);
  if (!u)
    return res.status(404).json({ error: "Verified alumni profile not found" });
  res.json({ user: publicAlumni(u) });
});

app.get("/api/connections", requireAuth, (req, res) => {
  const id = req.session.user.id;
  const items = db
    .prepare(
      "SELECT c.id,c.status,c.created_at,u.id AS user_id,u.name,u.role,u.department,u.company,u.job_title FROM connections c JOIN users u ON u.id=CASE WHEN c.requester_id=? THEN c.recipient_id ELSE c.requester_id END WHERE (c.requester_id=? OR c.recipient_id=?) AND c.status='accepted'",
    )
    .all(id, id, id);
  res.json({ items });
});
app.get("/api/connections/requests", requireAuth, (req, res) =>
  res.json({
    items: db
      .prepare(
        "SELECT c.*,u.name,u.role,u.department FROM connections c JOIN users u ON u.id=c.requester_id WHERE c.recipient_id=? AND c.status='pending'",
      )
      .all(req.session.user.id),
  }),
);
app.post("/api/connections", requireAuth, (req, res) => {
  const to = Number(req.body.user_id);
  if (!to || to === req.session.user.id)
    return res.status(400).json({ error: "Choose another user" });
  if (!db.prepare("SELECT id FROM users WHERE id=? AND suspended=0").get(to))
    return res.status(404).json({ error: "User not found" });
  if (
    db
      .prepare(
        "SELECT id FROM connections WHERE min(requester_id,recipient_id)=min(?,?) AND max(requester_id,recipient_id)=max(?,?)",
      )
      .get(req.session.user.id, to, req.session.user.id, to)
  )
    return res.status(409).json({ error: "A connection already exists" });
  try {
    const r = db
      .prepare("INSERT INTO connections(requester_id,recipient_id) VALUES(?,?)")
      .run(req.session.user.id, to);
    events.publish("connection.requested", {
      to,
      name: req.session.user.name || "A user",
    });
    res.status(201).json({ id: r.lastInsertRowid, status: "pending" });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res.status(409).json({ error: "A connection already exists" });
    throw e;
  }
});
app.patch("/api/connections/:id", requireAuth, (req, res) => {
  if (!["accepted", "rejected"].includes(req.body.status))
    return res
      .status(400)
      .json({ error: "Status must be accepted or rejected" });
  const r = db
    .prepare(
      "UPDATE connections SET status=? WHERE id=? AND recipient_id=? AND status='pending'",
    )
    .run(req.body.status, req.params.id, req.session.user.id);
  if (!r.changes)
    return res.status(404).json({ error: "Pending request not found" });
  res.json({ ok: true, status: req.body.status });
});
app.delete("/api/connections/:id", requireAuth, (req, res) => {
  const r = db
    .prepare(
      "DELETE FROM connections WHERE id=? AND (requester_id=? OR recipient_id=?)",
    )
    .run(req.params.id, req.session.user.id, req.session.user.id);
  res.status(r.changes ? 204 : 404).end();
});

app.get("/api/jobs", (req, res) =>
  res.json({
    items: db
      .prepare(
        "SELECT j.*,u.name AS author_name FROM jobs j JOIN users u ON u.id=j.author_id WHERE j.status='active' ORDER BY j.created_at DESC",
      )
      .all(),
  }),
);
app.post(
  "/api/jobs",
  requireAuth,
  requireRole("alumni", "admin"),
  (req, res) => {
    const {
      title,
      company,
      location = "",
      description = "",
      type = "job",
      apply_url = "",
    } = req.body;
    if (
      !title ||
      !company ||
      !description ||
      !["job", "internship"].includes(type)
    )
      return res.status(400).json({
        error: "Title, company, description and valid type are required",
      });
    const r = db
      .prepare(
        "INSERT INTO jobs(author_id,title,company,location,description,type,apply_url) VALUES(?,?,?,?,?,?,?)",
      )
      .run(
        req.session.user.id,
        title,
        company,
        location,
        description,
        type,
        apply_url,
      );
    events.publish("job.created", { author: req.session.user.id, title });
    res.status(201).json({ id: r.lastInsertRowid });
  },
);
app.patch("/api/jobs/:id", requireAuth, (req, res) => {
  const allowed = [
    "title",
    "company",
    "location",
    "description",
    "type",
    "apply_url",
  ];
  const fields = allowed.filter((k) => Object.hasOwn(req.body, k));
  if (!fields.length)
    return res.status(400).json({ error: "No editable fields provided" });
  if (req.body.type && !["job", "internship"].includes(req.body.type))
    return res.status(400).json({ error: "Invalid opportunity type" });
  const sql = fields.map((k) => `${k}=?`).join(",");
  const r = db
    .prepare(`UPDATE jobs SET ${sql} WHERE id=? AND (author_id=? OR ?='admin')`)
    .run(
      ...fields.map((k) => req.body[k]),
      req.params.id,
      req.session.user.id,
      req.session.user.role,
    );
  res.status(r.changes ? 200 : 404).json({ ok: !!r.changes });
});
app.delete("/api/jobs/:id", requireAuth, (req, res) => {
  const r = db
    .prepare("DELETE FROM jobs WHERE id=? AND (author_id=? OR ?='admin')")
    .run(req.params.id, req.session.user.id, req.session.user.role);
  res.status(r.changes ? 204 : 404).end();
});
app.get("/api/events", (req, res) =>
  res.json({
    items: db
      .prepare(
        "SELECT e.*,u.name AS creator_name,(SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id) AS registrations,EXISTS(SELECT 1 FROM event_registrations mine WHERE mine.event_id=e.id AND mine.user_id=?) AS is_registered FROM events e LEFT JOIN users u ON u.id=e.created_by ORDER BY e.starts_at",
      )
      .all(req.session.user?.id || 0),
  }),
);
app.post("/api/events/:id/register", requireAuth, (req, res) => {
  try {
    db.prepare(
      "INSERT INTO event_registrations(event_id,user_id) VALUES(?,?)",
    ).run(req.params.id, req.session.user.id);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res.status(409).json({ error: "Already registered" });
    if (e.code === "SQLITE_CONSTRAINT_FOREIGNKEY")
      return res.status(404).json({ error: "Event not found" });
    throw e;
  }
});
app.delete("/api/events/:id/register", requireAuth, (req, res) => {
  db.prepare(
    "DELETE FROM event_registrations WHERE event_id=? AND user_id=?",
  ).run(req.params.id, req.session.user.id);
  res.status(204).end();
});
app.get("/api/notifications", requireAuth, (req, res) =>
  res.json({
    items: db
      .prepare(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC",
      )
      .all(req.session.user.id),
  }),
);
app.patch("/api/notifications/:id/read", requireAuth, (req, res) => {
  const r = db
    .prepare("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?")
    .run(req.params.id, req.session.user.id);
  res.status(r.changes ? 200 : 404).json({ ok: !!r.changes });
});
app.post("/api/mentorship/requests", requireAuth, (req, res) => {
  const { alumni_id, message = "" } = req.body;
  if (!alumni_id || !message.trim())
    return res
      .status(400)
      .json({ error: "Alumni and request message are required" });
  try {
    const r = db
      .prepare(
        "INSERT INTO mentorship_requests(student_id,alumni_id,message) SELECT ?,id,? FROM users WHERE id=? AND role='alumni' AND verification_status='verified'",
      )
      .run(req.session.user.id, message, alumni_id);
    if (!r.changes)
      return res.status(404).json({ error: "Verified alumnus not found" });
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res.status(409).json({ error: "Request already exists" });
    throw e;
  }
});
app.get("/api/mentorship/requests", requireAuth, (req, res) =>
  res.json({
    items: db
      .prepare(
        "SELECT m.*,s.name AS student_name,a.name AS alumni_name FROM mentorship_requests m JOIN users s ON s.id=m.student_id JOIN users a ON a.id=m.alumni_id WHERE m.student_id=? OR m.alumni_id=? ORDER BY m.created_at DESC",
      )
      .all(req.session.user.id, req.session.user.id),
  }),
);
app.patch(
  "/api/mentorship/requests/:id",
  requireAuth,
  requireRole("alumni"),
  (req, res) => {
    if (!["accepted", "declined"].includes(req.body.status))
      return res.status(400).json({ error: "Invalid response" });
    const r = db
      .prepare(
        "UPDATE mentorship_requests SET status=? WHERE id=? AND alumni_id=? AND status='pending'",
      )
      .run(req.body.status, req.params.id, req.session.user.id);
    res.status(r.changes ? 200 : 404).json({ ok: !!r.changes });
  },
);
app.get("/api/announcements", (req, res) =>
  res.json({
    items: db
      .prepare("SELECT * FROM announcements ORDER BY created_at DESC")
      .all(),
  }),
);

app.get("/api/admin/dashboard", requireAuth, requireRole("admin"), (req, res) =>
  res.json({
    users: db.prepare("SELECT COUNT(*) n FROM users").get().n,
    alumni: db.prepare("SELECT COUNT(*) n FROM users WHERE role='alumni'").get()
      .n,
    verified: db
      .prepare(
        "SELECT COUNT(*) n FROM users WHERE role='alumni' AND verification_status='verified'",
      )
      .get().n,
    pending: db
      .prepare(
        "SELECT COUNT(*) n FROM users WHERE role='alumni' AND verification_status='pending'",
      )
      .get().n,
    jobs: db.prepare("SELECT COUNT(*) n FROM jobs").get().n,
    events: db.prepare("SELECT COUNT(*) n FROM events").get().n,
  }),
);
app.get("/api/admin/users", requireAuth, requireRole("admin"), (req, res) =>
  res.json({
    items: db
      .prepare(
        "SELECT id,name,email,role,department,graduation_year,verification_status,suspended,source_type,source_url,created_at FROM users ORDER BY created_at DESC",
      )
      .all(),
  }),
);
app.patch(
  "/api/admin/users/:id/verification",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const { status, reason = "" } = req.body;
    if (!["verified", "rejected", "pending"].includes(status))
      return res.status(400).json({ error: "Invalid verification status" });
    const u = db
      .prepare("SELECT id FROM users WHERE id=? AND role='alumni'")
      .get(req.params.id);
    if (!u) return res.status(404).json({ error: "Alumni not found" });
    db.transaction(() => {
      db.prepare(
        "UPDATE users SET verification_status=?,verified_by=?,verified_at=CASE WHEN ?='verified' THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(status, req.session.user.id, status, req.params.id);
      db.prepare(
        "INSERT INTO audit_logs(actor_id,action,target_type,target_id,details) VALUES(?,?,?,?,?)",
      ).run(
        req.session.user.id,
        "alumni_verification",
        "user",
        req.params.id,
        JSON.stringify({ status, reason }),
      );
    })();
    res.json({ ok: true, status });
  },
);
app.patch(
  "/api/admin/users/:id/suspend",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const suspended = req.body.suspended ? 1 : 0;
    db.prepare(
      "UPDATE users SET suspended=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND role!='admin'",
    ).run(suspended, req.params.id);
    db.prepare(
      "INSERT INTO audit_logs(actor_id,action,target_type,target_id,details) VALUES(?,?,?,?,?)",
    ).run(
      req.session.user.id,
      "user_suspension",
      "user",
      req.params.id,
      JSON.stringify({ suspended, reason: req.body.reason || "" }),
    );
    res.json({ ok: true });
  },
);
app.post("/api/admin/events", requireAuth, requireRole("admin"), (req, res) => {
  const {
    title,
    description = "",
    location = "",
    starts_at,
    ends_at,
  } = req.body;
  if (!title || !starts_at)
    return res.status(400).json({ error: "Title and start time are required" });
  const r = db
    .prepare(
      "INSERT INTO events(title,description,location,starts_at,ends_at,created_by) VALUES(?,?,?,?,?,?)",
    )
    .run(
      title,
      description,
      location,
      starts_at,
      ends_at || null,
      req.session.user.id,
    );
  res.status(201).json({ id: r.lastInsertRowid });
});
app.get("/api/admin/events", requireAuth, requireRole("admin"), (req, res) =>
  res.json({
    items: db
      .prepare(
        "SELECT e.*,(SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id) AS registrations FROM events e ORDER BY e.starts_at",
      )
      .all(),
  }),
);
app.get(
  "/api/admin/events/:id/registrations",
  requireAuth,
  requireRole("admin"),
  (req, res) =>
    res.json({
      items: db
        .prepare(
          "SELECT u.id,u.name,u.email,u.role,r.created_at AS registered_at FROM event_registrations r JOIN users u ON u.id=r.user_id WHERE r.event_id=? ORDER BY r.created_at",
        )
        .all(req.params.id),
    }),
);
app.patch(
  "/api/admin/events/:id",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const allowed = [
      "title",
      "description",
      "location",
      "starts_at",
      "ends_at",
    ];
    const fields = allowed.filter((k) => Object.hasOwn(req.body, k));
    if (!fields.length)
      return res.status(400).json({ error: "No editable fields provided" });
    const sql = fields.map((k) => `${k}=?`).join(",");
    const r = db
      .prepare(`UPDATE events SET ${sql} WHERE id=?`)
      .run(...fields.map((k) => req.body[k]), req.params.id);
    res.status(r.changes ? 200 : 404).json({ ok: !!r.changes });
  },
);
app.delete(
  "/api/admin/events/:id",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const r = db.prepare("DELETE FROM events WHERE id=?").run(req.params.id);
    res.status(r.changes ? 204 : 404).end();
  },
);
app.post(
  "/api/admin/announcements",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    if (!req.body.title || !req.body.body)
      return res.status(400).json({ error: "Title and body required" });
    const r = db
      .prepare("INSERT INTO announcements(title,body,author_id) VALUES(?,?,?)")
      .run(req.body.title, req.body.body, req.session.user.id);
    res.status(201).json({ id: r.lastInsertRowid });
  },
);
app.get(
  "/api/admin/alumni/export",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const rows = db
      .prepare(
        "SELECT name,email,department,degree,graduation_year,company,job_title,skills,verification_status,source_type,source_url,last_checked_at FROM users WHERE role='alumni' ORDER BY name",
      )
      .all();
    const esc = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
    res
      .type("text/csv")
      .attachment("alumni-directory.csv")
      .send(
        [
          Object.keys(
            rows[0] || {
              name: "",
              email: "",
              department: "",
              degree: "",
              graduation_year: "",
              company: "",
              job_title: "",
              skills: "",
              verification_status: "",
              source_type: "",
              source_url: "",
              last_checked_at: "",
            },
          ).join(","),
          ...rows.map((r) => Object.values(r).map(esc).join(",")),
        ].join("\r\n"),
      );
  },
);
app.get(
  "/api/admin/audit-logs",
  requireAuth,
  requireRole("admin"),
  (req, res) =>
    res.json({
      items: db
        .prepare(
          "SELECT a.*,u.name AS actor_name FROM audit_logs a JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 200",
        )
        .all(),
    }),
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "API route not found" }),
);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () =>
    console.log(`Alumni Portal running at http://localhost:${port}`),
  );
}
module.exports = { app, db };
