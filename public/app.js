const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
let me = null,
  csrfToken = null;
const content = $("#content"),
  modal = $("#modal");
async function api(url, opts = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && csrfToken)
    headers["X-CSRF-Token"] = csrfToken;
  const r = await fetch("/api" + url, { ...opts, headers });
  if (r.status === 204) return null;
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "Request failed");
  return d;
}
function toast(t) {
  const e = $("#toast");
  e.textContent = t;
  e.classList.add("show");
  setTimeout(() => e.classList.remove("show"), 2800);
}
function esc(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function empty(title, desc = "Try a different search or come back later.") {
  return `<div class="empty"><strong>${title}</strong>${desc}</div>`;
}
function heading(title, desc, action = "") {
  return `<div class="section-head"><div><h1 class="page-title">${title}</h1><p>${desc}</p></div>${action}</div>`;
}
function cardPerson(u, btn = true) {
  const portraits = [
    "photo-1494790108377-be9c29b29330",
    "photo-1500648767791-00dcc994a43e",
    "photo-1534528741775-53994a69daeb",
  ];
  const portrait = portraits[(Number(u.id) || 0) % portraits.length];
  return `<article class="card"><div class="person"><img class="person-photo" src="https://images.unsplash.com/${portrait}?auto=format&fit=crop&w=120&h=120&q=80" alt="" loading="lazy"><div><h3>${esc(u.name)}</h3><p>${esc(u.job_title || u.role)}${u.company ? " · " + esc(u.company) : ""}</p></div></div><div class="tags"><span class="tag">${esc(u.department || "Department not set")}</span>${u.graduation_year ? `<span class="tag">Class of ${esc(u.graduation_year)}</span>` : ""}${u.verification_status === "verified" ? '<span class="tag verified">✓ Verified</span>' : ""}</div><p>${esc(u.bio || "Profile details coming soon.")}</p><div class="card-actions">${u.role === "alumni" ? `<a class="button button-outline button-small" href="#alumni/${u.id}">View profile</a>` : ""}${btn ? `<button class="button button-outline button-small" data-connect="${u.id}">Connect</button>` : ""}</div></article>`;
}
function openModal(html) {
  $("#modalBody").innerHTML = html;
  modal.showModal();
}
function formModal(title, fields, submit, submitText = "Save") {
  openModal(
    `<h2 class="page-title">${title}</h2><form id="modalForm" class="form-grid">${fields}<div class="field full"><button class="button">${submitText}</button></div></form>`,
  );
  $("#modalForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await submit(data);
      modal.close();
      toast("Saved successfully");
      render();
    } catch (err) {
      toast(err.message);
    }
  };
}
function field(label, name, type = "text", required = false, placeholder = "") {
  return `<div class="field"><label for="${name}">${label}</label><input class="input" id="${name}" name="${name}" type="${type}" ${required ? "required" : ""} placeholder="${placeholder}"></div>`;
}
async function refreshMe() {
  try {
    const current = await api("/auth/me");
    me = current.user;
    csrfToken = current.csrfToken;
  } catch {
    me = null;
    csrfToken = null;
  }
  document.body.classList.toggle("is-admin", me?.role === "admin");
  $("#authBtn").classList.toggle("hidden", !!me);
  $("#joinBtn").classList.toggle("hidden", !!me);
  $("#logout").classList.toggle("hidden", !me);
  $("#avatar").classList.toggle("hidden", !me);
  $("#avatar").textContent = me?.name?.[0] || "A";
  $("#greeting").textContent = me
    ? `Welcome back, ${me.name.split(" ")[0]}.`
    : "A community that moves forward together.";
}
async function render() {
  await refreshMe();
  const view = location.hash.slice(1) || "home";
  $$("#nav a").forEach((a) =>
    a.classList.toggle("active", a.dataset.view === view),
  );
  try {
    if (view.startsWith("alumni/")) {
      await alumniProfile(view.slice("alumni/".length));
      return;
    }
    const f =
      {
        home: home,
        profile: profile,
        directory: directory,
        connections: connections,
        opportunities: opportunities,
        events: events,
        mentorship: mentorship,
        announcements: announcements,
        admin: admin,
      }[view] || home;
    await f();
  } catch (e) {
    content.innerHTML = empty("Could not load this page", esc(e.message));
  }
}
async function alumniProfile(id) {
  const { user } = await api("/alumni/" + encodeURIComponent(id));
  const skills = (user.skills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  content.innerHTML = `<a class="text-link back-link" href="#directory">← Back to the alumni network</a><section class="profile-hero"><img class="profile-photo" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&h=320&q=85" alt=""><div class="profile-intro"><div class="eyebrow">${esc(user.department || "ALUMNI COMMUNITY")}${user.graduation_year ? ` · CLASS OF ${esc(user.graduation_year)}` : ""}</div><h1>${esc(user.name)}</h1><p>${esc(user.job_title || "Alumni member")}${user.company ? ` at ${esc(user.company)}` : ""}</p><div class="tags"><span class="tag">${esc(user.degree || "Alumni")}</span>${user.verification_status === "verified" ? '<span class="tag verified">✓ Verified alum</span>' : ""}</div><div class="card-actions">${me?.id !== user.id ? `<button class="button" data-connect="${user.id}">Connect</button><a class="button button-outline" href="#mentorship">Request mentorship</a>` : '<a class="button" href="#profile">Edit my profile</a>'}</div></div></section><div class="profile-columns"><section class="panel profile-about"><div class="eyebrow">A LITTLE ABOUT</div><h2>About ${esc(user.name.split(" ")[0])}</h2><p>${esc(user.bio || "This alum has not added a biography yet.")}</p></section><section class="panel"><div class="eyebrow">EXPERIENCE & SKILLS</div><h2>What they bring</h2><p>${esc(user.job_title || "Professional")}${user.company ? ` · ${esc(user.company)}` : ""}</p><div class="tags">${skills.map((skill) => `<span class="tag">${esc(skill)}</span>`).join("") || '<span class="subtle">No skills listed yet.</span>'}</div>${user.linkedin_url ? `<a class="text-link" href="${esc(user.linkedin_url)}" target="_blank" rel="noopener noreferrer">Professional profile ↗</a>` : ""}</section></div>`;
}
async function home() {
  const [directoryData, jobsData, eventsData, featuredData] = await Promise.all(
    [
      api("/alumni?limit=1"),
      api("/jobs"),
      api("/events"),
      api("/alumni?limit=3"),
    ],
  );
  const alumni = featuredData.items;
  const jobs = jobsData.items;
  const events = eventsData.items.filter(
    (event) => new Date(event.starts_at) >= new Date(),
  );
  content.innerHTML = `<section class="hero"><div class="hero-copy"><div class="eyebrow">A COMMUNITY THAT MOVES WITH YOU</div><h1>Your Past Connects to Your Future.</h1><p>Reconnect with your university community, discover new opportunities, find inspiring mentors, and build relationships that move your future forward.</p><div class="hero-actions"><a class="button" href="#directory">Explore the network <span aria-hidden="true">→</span></a><button class="button button-light" id="heroJoin">Become a member</button></div><div class="hero-proof"><span class="proof-mark">AC</span><span>One community. Every next chapter.</span></div></div><div class="hero-visual" role="img" aria-label="University alumni collaborating around a table"><div class="hero-caption"><span class="eyebrow">CONNECTED FOR WHAT'S NEXT</span><strong>Good things grow<br>through connection.</strong><a href="#mentorship">Meet your mentors <span aria-hidden="true">↗</span></a></div></div></section><div class="demo-strip"><span class="demo-dot"></span><span>Local demo · Sample figures from fictional community data</span></div><section class="stats stats-editorial" aria-label="Demo network figures"><div class="stat"><small>Verified alumni in demo</small><strong>${directoryData.total.toLocaleString()}</strong><span class="trend">Profiles ready to explore</span></div><div class="stat"><small>Open opportunities</small><strong>${jobs.length.toLocaleString()}</strong><span class="trend">Jobs shared by the community</span></div><div class="stat"><small>Upcoming events</small><strong>${events.length.toLocaleString()}</strong><span class="trend">Ways to meet your network</span></div><div class="stat stat-note"><small>AlumniConnect</small><strong>For the long run</strong><span class="trend">Your next connection starts here</span></div></section><section class="community-section"><div class="section-head"><div><div class="eyebrow">PEOPLE MAKE THE NETWORK</div><h2>Meet the community</h2><p>Fictional alumni profiles from our local demo environment.</p></div><a class="text-link" href="#directory">Explore all alumni <span aria-hidden="true">→</span></a></div><div class="grid">${alumni.map((u) => cardPerson(u)).join("") || empty("No verified profiles yet")}</div></section><section class="next-steps"><div><div class="eyebrow">A LITTLE CLOSER, EVERY DAY</div><h2>Make your next move<br>with people who get it.</h2></div><div class="next-links"><a href="#mentorship"><span>01</span><strong>Find a mentor</strong><span aria-hidden="true">↗</span></a><a href="#opportunities"><span>02</span><strong>Explore careers</strong><span aria-hidden="true">↗</span></a><a href="#events"><span>03</span><strong>Meet in person</strong><span aria-hidden="true">↗</span></a></div></section>`;
  $("#heroJoin").onclick = () => authForm("register");
}
async function profile() {
  if (!me) {
    authPrompt();
    return;
  }
  const fields = [
    ["Department", "department"],
    ["Graduation year", "graduation_year"],
    ["Degree", "degree"],
    ["Skills (comma separated)", "skills"],
    ["Company", "company"],
    ["Job title", "job_title"],
    ["Professional profile URL", "linkedin_url"],
  ];
  content.innerHTML =
    heading(
      "My profile",
      "Keep your education and career information current",
    ) +
    (me.role === "alumni"
      ? '<div class="notice">Alumni profile changes return the profile to pending review until an administrator verifies the updated information.</div>'
      : "") +
    `<section class="panel"><form id="profileForm" class="form-grid">${fields.map(([label, key]) => `<div class="field"><label>${label}</label><input class="input" name="${key}" value="${esc(me[key] || "")}" ${key === "graduation_year" ? 'type="number" min="1950" max="2100"' : ""}></div>`).join("")}<div class="field full"><label>Professional biography</label><textarea class="input" name="bio" rows="4">${esc(me.bio || "")}</textarea></div><div class="field full"><button class="button">Save profile</button></div></form></section>`;
  $("#profileForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      await api("/alumni/me", { method: "PATCH", body: JSON.stringify(d) });
      toast("Profile updated");
      render();
    } catch (x) {
      toast(x.message);
    }
  };
}
async function directory() {
  content.innerHTML =
    heading(
      "Alumni directory",
      "Discover people, skills, and experience across the network",
    ) +
    `<div class="notice">Local demo · Fictional profiles; verified status demonstrates administrator review only.</div><div class="directory-tools"><div class="toolbar"><input class="input" id="q" aria-label="Search alumni" placeholder="Search by name, title, or skill"><select id="department" aria-label="Filter by department"><option value="">All departments</option>${["Computer Science", "Electrical Engineering", "Business Administration"].map((x) => `<option>${x}</option>`).join("")}</select><input class="input" id="year" aria-label="Filter by graduation year" placeholder="Graduation year" type="number"><input class="input" id="skill" aria-label="Filter by skill" placeholder="Skill"><input class="input" id="company" aria-label="Filter by company" placeholder="Company"><button class="button" id="search">Search</button><button class="button button-outline" id="clearFilters" type="button">Reset</button></div></div><div id="results" class="grid"></div><div class="load-more-wrap"><button class="button button-outline" id="loadMore" type="button">Show more alumni</button></div>`;
  let page = 1;
  let total = 0;
  const run = async () => {
    page = 1;
    const p = new URLSearchParams();
    for (const k of [
      "q",
      "department",
      "graduation_year",
      "skill",
      "company",
    ]) {
      const el = $("#" + (k === "graduation_year" ? "year" : k));
      if (el?.value) p.set(k, el.value);
    }
    p.set("page", page);
    p.set("limit", "9");
    const r = await api("/alumni?" + p);
    total = r.total;
    $("#results").innerHTML =
      r.items.map((u) => cardPerson(u)).join("") ||
      empty(
        "No matching alumni",
        "Try removing a filter or changing the search.",
      );
    $("#loadMore").classList.toggle("hidden", r.items.length >= total);
  };
  $("#search").onclick = run;
  $("#clearFilters").onclick = () => {
    $("#q").value = "";
    $("#department").value = "";
    $("#year").value = "";
    $("#skill").value = "";
    $("#company").value = "";
    run();
  };
  $("#loadMore").onclick = async () => {
    page += 1;
    const p = new URLSearchParams();
    for (const k of [
      "q",
      "department",
      "graduation_year",
      "skill",
      "company",
    ]) {
      const el = $("#" + (k === "graduation_year" ? "year" : k));
      if (el?.value) p.set(k, el.value);
    }
    p.set("page", page);
    p.set("limit", "9");
    const r = await api("/alumni?" + p);
    $("#results").insertAdjacentHTML(
      "beforeend",
      r.items.map((u) => cardPerson(u)).join(""),
    );
    $("#loadMore").classList.toggle("hidden", page * 9 >= total);
  };
  $("#q").onkeydown = (e) => e.key === "Enter" && run();
  run();
}
async function connections() {
  if (!me) return authPrompt();
  const [a, b] = await Promise.all([
    api("/connections"),
    api("/connections/requests"),
  ]);
  content.innerHTML =
    heading("Connections", "Build and manage your professional network") +
    `<div class="section-head"><div><h2>Your network</h2><p>${a.items.length} accepted connections</p></div></div><div class="grid">${a.items.map((u) => cardPerson({ ...u, id: u.user_id }, false)).join("") || empty("Your network starts here", "Explore alumni profiles and send a connection request.")}</div><div class="section-head"><div><h2>Incoming requests</h2><p>Respond to people who want to connect.</p></div></div><div class="list">${b.items.map((u) => `<div class="panel listing"><div><strong>${esc(u.name)}</strong><div class="subtle">${esc(u.department || u.role)} · Sent ${new Date(u.created_at).toLocaleDateString()}</div></div><div class="card-actions"><button class="button button-small" data-respond="${u.id}" data-status="accepted">Accept</button><button class="button button-outline button-small" data-respond="${u.id}" data-status="rejected">Decline</button></div></div>`).join("") || empty("No pending requests")}</div>`;
  $$("[data-respond]").forEach(
    (b) =>
      (b.onclick = async () => {
        await api("/connections/" + b.dataset.respond, {
          method: "PATCH",
          body: JSON.stringify({ status: b.dataset.status }),
        });
        toast("Request updated");
        connections();
      }),
  );
}
async function opportunities() {
  const j = (await api("/jobs")).items;
  content.innerHTML =
    heading(
      "Opportunities",
      "Jobs and internships shared by the community",
      me?.role === "alumni"
        ? '<button id="postJob" class="button">＋ Post an opportunity</button>'
        : "",
    ) +
    `<div class="toolbar"><select id="jobFilter"><option value="">All opportunities</option><option value="job">Jobs</option><option value="internship">Internships</option></select></div><div id="jobList" class="list"></div>`;
  const draw = () =>
    ($("#jobList").innerHTML =
      j
        .filter(
          (x) => !$("#jobFilter").value || x.type === $("#jobFilter").value,
        )
        .map(
          (x) =>
            `<article class="panel listing"><div><div class="tags"><span class="tag">${esc(x.type)}</span><span class="tag">${esc(x.location || "Location flexible")}</span></div><h3>${esc(x.title)}</h3><div class="subtle">${esc(x.company)} · Posted by ${esc(x.author_name)}</div><p>${esc(x.description)}</p>${x.apply_url ? `<a target="_blank" rel="noopener" href="${esc(x.apply_url)}">Application details ↗</a>` : ""}</div>${me?.role === "admin" || me?.id === x.author_id ? `<button class="button button-danger button-small" data-jobdelete="${x.id}">Remove</button>` : ""}</article>`,
        )
        .join("") || empty("No opportunities posted yet"));
  $("#jobFilter").onchange = draw;
  draw();
  if ($("#postJob"))
    $("#postJob").onclick = () =>
      formModal(
        "Post an opportunity",
        field("Title", "title", "text", true) +
          field("Company", "company", "text", true) +
          field("Location", "location") +
          `<div class="field"><label>Type</label><select class="input" name="type"><option value="job">Job</option><option value="internship">Internship</option></select></div>` +
          `<div class="field full"><label>Description</label><textarea class="input" name="description" required></textarea></div>` +
          field("Apply URL", "apply_url", "url"),
        (d) => api("/jobs", { method: "POST", body: JSON.stringify(d) }),
        "Publish",
      );
  $$("[data-jobdelete]").forEach(
    (b) =>
      (b.onclick = async () => {
        await api("/jobs/" + b.dataset.jobdelete, { method: "DELETE" });
        render();
      }),
  );
}
async function events() {
  const ev = (await api("/events")).items;
  content.innerHTML =
    heading("Events & gatherings", "Find your people at the next meetup") +
    `<div class="notice">All listed events are fictional local demo content.</div><div class="grid">${ev.map((x) => `<article class="card"><div class="eyebrow">${new Date(x.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div><h3 style="margin-top:12px">${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="subtle">⌖ ${esc(x.location)} · ${x.registrations} attending</div>${me ? `<div class="card-actions">${x.is_registered ? `<button class="button button-outline button-small" data-cancel="${x.id}">Cancel registration</button>` : `<button class="button button-small" data-register="${x.id}">Register</button>`}</div>` : '<button class="button button-outline button-small" data-event-auth>Sign in to register</button>'}</article>`).join("") || empty("No events scheduled")}</div>`;
  $$("[data-event-auth]").forEach((button) => {
    button.onclick = () => authForm("login");
  });
  $$("[data-register]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await api("/events/" + b.dataset.register + "/register", {
            method: "POST",
          });
          toast("You are registered");
          events();
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  $$("[data-cancel]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await api("/events/" + b.dataset.cancel + "/register", {
            method: "DELETE",
          });
          toast("Registration cancelled");
          events();
        } catch (e) {
          toast(e.message);
        }
      }),
  );
}
async function mentorship() {
  if (!me) return authPrompt();
  const r = await api("/mentorship/requests");
  content.innerHTML =
    heading("Mentorship", "Ask an experienced alum for guidance") +
    `<div class="panel"><h3>Request mentorship</h3><form id="mentorForm" class="toolbar"><select class="input" name="alumni_id" required>${(await api("/alumni")).items.map((u) => `<option value="${u.id}">${esc(u.name)} · ${esc(u.job_title || u.department)}</option>`).join("")}</select><input class="input" name="message" placeholder="What would you like guidance on?" required><button class="button">Send request</button></form></div><div class="section-head"><div><h2>Your requests</h2></div></div><div class="list">${r.items.map((x) => `<div class="panel listing"><div><b>${esc(x.student_name)} → ${esc(x.alumni_name)}</b><p>${esc(x.message)}</p></div><span class="pill-status">${esc(x.status)}</span>${me.role === "alumni" && x.status === "pending" ? `<button class="button button-small" data-mentor="${x.id}">Accept</button>` : ""}</div>`).join("") || empty("No mentorship requests yet")}</div>`;
  $("#mentorForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      await api("/mentorship/requests", {
        method: "POST",
        body: JSON.stringify(d),
      });
      toast("Request sent");
      mentorship();
    } catch (x) {
      toast(x.message);
    }
  };
  $$("[data-mentor]").forEach(
    (b) =>
      (b.onclick = async () => {
        await api("/mentorship/requests/" + b.dataset.mentor, {
          method: "PATCH",
          body: JSON.stringify({ status: "accepted" }),
        });
        mentorship();
      }),
  );
}
async function announcements() {
  const a = (await api("/announcements")).items;
  content.innerHTML =
    heading(
      "Announcements",
      "News and updates from your university community",
    ) +
    `<div class="list">${a.map((x) => `<article class="panel"><div class="eyebrow">${new Date(x.created_at).toLocaleDateString()}</div><h3 style="margin-top:8px">${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`).join("") || empty("No announcements yet")}</div>`;
}
async function admin() {
  if (me?.role !== "admin") {
    content.innerHTML = empty(
      "Administrator access required",
      "Sign in with the local demo administrator account.",
    );
    return;
  }
  const [counts, users] = await Promise.all([
    api("/admin/dashboard"),
    api("/admin/users"),
  ]);
  content.innerHTML =
    heading(
      "Administration",
      "Review profiles and manage the local demo community",
      `<a class="button button-outline button-small" href="/api/admin/alumni/export">Export alumni CSV</a>`,
    ) +
    `<div class="stats">${[
      ["Users", counts.users],
      ["Alumni", counts.alumni],
      ["Verified", counts.verified],
      ["Pending review", counts.pending],
      ["Jobs", counts.jobs],
      ["Events", counts.events],
    ]
      .map(
        (x) =>
          `<div class="stat"><small>${x[0]}</small><strong>${x[1]}</strong></div>`,
      )
      .join(
        "",
      )}</div><div class="section-head"><div><h2>Alumni verification</h2><p>Only administrators can approve alumni status.</p></div></div><div class="list">${users.items
      .filter((u) => u.role === "alumni")
      .map(
        (u) =>
          `<article class="panel listing"><div><b>${esc(u.name)}</b><div class="subtle">${esc(u.email)} · ${esc(u.department)} · ${esc(u.source_type)}</div></div><span class="pill-status ${u.verification_status === "verified" ? "verified" : ""}">${esc(u.verification_status)}</span><div class="card-actions"><button class="button button-small" data-verify="${u.id}" data-status="verified">Verify</button><button class="button button-outline button-small" data-verify="${u.id}" data-status="rejected">Reject</button><button class="button button-danger button-small" data-suspend="${u.id}" data-value="${u.suspended ? 0 : 1}">${u.suspended ? "Restore" : "Suspend"}</button></div></article>`,
      )
      .join(
        "",
      )}</div><div class="section-head"><div><h2>Publish to community</h2></div></div><div class="card-actions"><button class="button button-outline" id="newEvent">＋ New event</button><button class="button button-outline" id="newAnnouncement">＋ Announcement</button></div>`;
  $$("[data-verify]").forEach(
    (b) =>
      (b.onclick = async () => {
        const reason = prompt("Reason (optional)") || "";
        await api("/admin/users/" + b.dataset.verify + "/verification", {
          method: "PATCH",
          body: JSON.stringify({ status: b.dataset.status, reason }),
        });
        toast("Review saved");
        admin();
      }),
  );
  $$("[data-suspend]").forEach(
    (b) =>
      (b.onclick = async () => {
        await api("/admin/users/" + b.dataset.suspend + "/suspend", {
          method: "PATCH",
          body: JSON.stringify({ suspended: Number(b.dataset.value) }),
        });
        admin();
      }),
  );
  $("#newEvent").onclick = () =>
    formModal(
      "Create event",
      field("Title", "title", "text", true) +
        field("Location", "location") +
        field("Starts at", "starts_at", "datetime-local", true) +
        `<div class="field full"><label>Description</label><textarea class="input" name="description"></textarea></div>`,
      (d) => api("/admin/events", { method: "POST", body: JSON.stringify(d) }),
      "Publish",
    );
  $("#newAnnouncement").onclick = () =>
    formModal(
      "Publish announcement",
      field("Title", "title", "text", true) +
        `<div class="field full"><label>Message</label><textarea class="input" name="body" required></textarea></div>`,
      (d) =>
        api("/admin/announcements", {
          method: "POST",
          body: JSON.stringify(d),
        }),
      "Publish",
    );
}
function authPrompt() {
  content.innerHTML = empty(
    "Sign in to continue",
    "Your account keeps connections and registrations in one place.",
  );
  $("#authBtn").click();
}
function authForm(mode) {
  const registering = mode === "register";
  openModal(
    `<h2 class="page-title">${registering ? "Create your account" : "Welcome back"}</h2><p class="subtle" style="margin:8px 0 20px">${registering ? "Join your university community." : "Sign in to your AlumniConnect account."}</p><form id="authForm">${registering ? `<div class="field"><label for="authName">Name</label><input class="input" id="authName" name="name" autocomplete="name" required></div>` : ""}<div class="field"><label for="authEmail">Email</label><input class="input" id="authEmail" name="email" type="email" autocomplete="email" required></div><div class="field"><label for="authPassword">Password</label><div class="password-control"><input class="input" id="authPassword" name="password" type="password" minlength="8" autocomplete="${registering ? "new-password" : "current-password"}" required><button class="password-toggle" id="togglePassword" type="button" aria-label="Show password">Show</button></div></div>${registering ? `<div class="field"><label for="authRole">Account type</label><select class="input" id="authRole" name="role"><option value="student">Student</option><option value="alumni">Alumni (requires verification)</option></select></div>` : ""}<button class="button" style="width:100%;margin-top:8px">${registering ? "Create account" : "Sign in"}</button></form><p class="subtle" style="margin-top:14px">${registering ? "Already registered?" : "New here?"} <a href="#" id="swapAuth">${registering ? "Sign in" : "Create an account"}</a></p><div class="notice">Local demo credentials are listed in README.md.</div>`,
  );
  $("#togglePassword").onclick = () => {
    const password = $("#authPassword");
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    $("#togglePassword").textContent = show ? "Hide" : "Show";
    $("#togglePassword").setAttribute(
      "aria-label",
      show ? "Hide password" : "Show password",
    );
  };
  $("#swapAuth").onclick = (e) => {
    e.preventDefault();
    authForm(registering ? "login" : "register");
  };
  $("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      await api("/auth/" + (registering ? "register" : "login"), {
        method: "POST",
        body: JSON.stringify(d),
      });
      modal.close();
      toast(registering ? "Account created" : "Signed in");
      render();
    } catch (x) {
      toast(x.message);
    }
  };
}
$("#authBtn").onclick = () => authForm("login");
$("#joinBtn").onclick = () => authForm("register");
$("#logout").onclick = async () => {
  await api("/auth/logout", { method: "POST" });
  render();
  toast("Signed out");
};
$("#notifyBtn").onclick = async () => {
  if (!me) return authPrompt();
  const r = await api("/notifications");
  openModal(
    `<h2 class="page-title">Notifications</h2><div class="list" style="margin-top:18px">${r.items.map((n) => `<article class="panel listing"><span>${esc(n.message)}</span>${n.is_read ? "" : '<button class="button button-small" data-read="' + n.id + '">Mark read</button>'}</article>`).join("") || empty("You are all caught up")}</div>`,
  );
  $$("[data-read]").forEach(
    (b) =>
      (b.onclick = async () => {
        await api("/notifications/" + b.dataset.read + "/read", {
          method: "PATCH",
        });
        b.closest("article").remove();
      }),
  );
};
$("#menu").onclick = () => {
  const isOpen = $(".sidebar").classList.toggle("open");
  $("#menu").setAttribute("aria-expanded", String(isOpen));
};
$("#menuClose").onclick = () => {
  $(".sidebar").classList.remove("open");
  $("#menu").setAttribute("aria-expanded", "false");
};
$("#nav").onclick = (e) => {
  if (e.target.closest("a")) {
    $(".sidebar").classList.remove("open");
    $("#menu").setAttribute("aria-expanded", "false");
  }
};
content.onclick = async (e) => {
  const b = e.target.closest("[data-connect]");
  if (b) {
    if (!me) return authPrompt();
    try {
      await api("/connections", {
        method: "POST",
        body: JSON.stringify({ user_id: Number(b.dataset.connect) }),
      });
      b.textContent = "Request sent";
      b.disabled = true;
      toast("Connection request sent");
    } catch (x) {
      toast(x.message);
    }
  }
};
window.onhashchange = render;
render();
