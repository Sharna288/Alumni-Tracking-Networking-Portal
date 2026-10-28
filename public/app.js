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
function welcomePage(mode = "login") {
  const registering = mode === "register";
  const fields = (registering ? '<div class="field"><label for="welcomeName">Full name</label><input class="input" id="welcomeName" name="name" autocomplete="name" placeholder="Your name" required></div>' : "") + '<div class="field"><label for="welcomeEmail">University email</label><input class="input" id="welcomeEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div><div class="field"><label for="welcomePassword">Password</label><div class="password-control"><input class="input" id="welcomePassword" name="password" type="password" minlength="8" autocomplete="' + (registering ? "new-password" : "current-password") + '" placeholder="' + (registering ? "At least 8 characters" : "Enter your password") + '" required><button class="password-toggle" id="welcomePasswordToggle" type="button">Show</button></div></div>';
  const role = registering ? '<div class="field"><label for="welcomeRole">I am joining as</label><select class="input" id="welcomeRole" name="role"><option value="student">Student</option><option value="alumni">Alumni (requires verification)</option></select></div>' : '<div class="auth-meta"><span>Secure sign in</span><span>●</span><span>Your community awaits</span></div>';
  content.innerHTML = '<main class="welcome-screen"><section class="welcome-photo" aria-label="Alumni reconnecting on a university campus"><a class="welcome-brand" href="#home"><img src="/assets/alumniconnect-logo-light.svg" alt="AlumniConnect"></a><div class="photo-shade"></div><div class="welcome-story"><h1>Your University.<br>Your People.<br>Your Next Chapter.</h1><p>Reconnect with your alumni community, discover new opportunities, and build relationships that move your future forward.</p><div class="welcome-caption">Connect <span aria-hidden="true">•</span> Grow <span aria-hidden="true">•</span> Give Back</div></div><span class="photo-credit">ALUMNICONNECT · YOUR LIFELONG NETWORK</span></section><section class="welcome-panel"><div class="welcome-mobile-brand"><img src="/assets/alumniconnect-logo.svg" alt="AlumniConnect"></div><div class="auth-card"><span class="auth-eyebrow">' + (registering ? "BECOME PART OF THE COMMUNITY" : "WELCOME TO ALUMNICONNECT") + '</span><h2>' + (registering ? "Join your network" : "Welcome back") + '</h2><p class="auth-intro">' + (registering ? "Create an account to connect with your university community." : "Sign in to reconnect, find opportunities, and keep in touch.") + '</p><form id="welcomeAuthForm" class="welcome-form">' + fields + role + '<button class="button welcome-submit" type="submit">' + (registering ? "Create my account" : "Sign in to your account") + '<span aria-hidden="true">→</span></button></form><div class="auth-switch">' + (registering ? "Already have an account?" : "New to the network?") + ' <button id="welcomeSwap" type="button">' + (registering ? "Sign in" : "Create an account") + '</button></div><div class="welcome-demo"><span aria-hidden="true">✦</span><span>Local demo · Sample profiles are fictional</span></div></div><p class="welcome-footer">© AlumniConnect <span>·</span> Your Past Connects to Your Future</p></section></main>';
  $("#welcomeSwap").onclick = () => welcomePage(registering ? "login" : "register");
  $("#welcomePasswordToggle").onclick = () => { const input = $("#welcomePassword"); input.type = input.type === "password" ? "text" : "password"; $("#welcomePasswordToggle").textContent = input.type === "password" ? "Show" : "Hide"; };
  $("#welcomeAuthForm").onsubmit = async (e) => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.target)); try { await api("/auth/" + (registering ? "register" : "login"), { method: "POST", body: JSON.stringify(data) }); document.body.classList.remove("guest-mode"); toast(registering ? "Account created" : "Signed in"); await render(); } catch (err) { toast(err.message); } };
}
async function render() {
  await refreshMe();
  if (!me) { document.body.classList.add("guest-mode"); welcomePage(); return; }
  document.body.classList.remove("guest-mode");
  const route = location.hash.slice(1) || "home";
  const view = route.split(/[/?]/)[0];
  const activeView = route.startsWith("department/") ? "departments" : route.startsWith("alumni/") ? "alumni-network" : view;
  $$("#nav a").forEach((a) =>
    a.classList.toggle("active", a.dataset.view === activeView),
  );
  try {
    if (route.startsWith("department/")) { await departmentDetail(route.slice(11)); return; }
    if (route.startsWith("alumni/")) {
      await alumniProfile(route.slice("alumni/".length));
      return;
    }
    const f =
      {
        home: home,
        profile: profile,
        directory: directory,
        "alumni-network": alumniNetwork,
        connections: connections,
        opportunities: opportunities,
        events: events,
        mentorship: mentorship,
        announcements: announcements, departments: departments, messages: messages, community: community, settings: settings,
        admin: admin,
      }[view] || home;
    await f(new URLSearchParams(location.hash.split("?")[1] || ""));
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
    ["Professional headline", "headline"], ["Department", "department"], ["Graduation year", "graduation_year"], ["Degree / program", "degree"], ["Current job title", "job_title"], ["Company / organization", "company"], ["Industry", "industry"], ["City", "city"], ["Country", "country"], ["Skills (comma separated)", "skills"], ["Career interests", "career_interests"], ["Research interests", "research_interests"], ["Achievements", "achievements"], ["LinkedIn profile URL", "linkedin_url"], ["GitHub profile URL", "github_url"], ["Portfolio / website URL", "portfolio_url"], ["Profile photo URL (HTTPS)", "profile_photo_url"], ["Cover photo URL (HTTPS)", "cover_photo_url"],
  ];
  content.innerHTML =
    heading(
      "My profile",
      "Keep your education and career information current",
    ) +
    (me.role === "alumni"
      ? '<div class="notice">Alumni profile changes return the profile to pending review until an administrator verifies the updated information.</div>'
      : "") +
    `<section class="panel"><form id="profileForm" class="form-grid">${fields.map(([label, key]) => `<div class="field"><label>${label}</label><input class="input" name="${key}" value="${esc(me[key] || "")}" ${key === "graduation_year" ? 'type="number" min="1950" max="2100"' : ""}></div>`).join("")}<div class="field full"><label>Professional biography</label><textarea class="input" name="bio" rows="4">${esc(me.bio || "")}</textarea></div><div class="field"><label for="profileVisibility">Profile visibility</label><select class="input" id="profileVisibility" name="profile_visibility"><option value="public">Alumni network</option><option value="connections">Connections only</option><option value="private">Private</option></select></div><label class="check-filter"><input type="checkbox" name="email_visibility" value="true" ${me.email_visibility?"checked":""}> Allow email to appear on my profile</label><label class="check-filter"><input type="checkbox" name="mentorship_available" value="true" ${me.mentorship_available?"checked":""}> Available as a mentor</label><div class="field full"><label>Mentorship areas</label><input class="input" name="mentorship_areas" value="${esc(me.mentorship_areas||"")}" placeholder="Skills or careers you can guide"></div><div class="field full"><button class="button">Save profile</button></div></form></section>`;
  $("#profileVisibility").value = me.profile_visibility || "public";
  $("#profileForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.email_visibility = Number(!!d.email_visibility); d.mentorship_available = Number(!!d.mentorship_available);
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
            `<article class="panel listing"><div><div class="tags"><span class="tag">${esc(x.type)}</span><span class="tag">${esc(x.location || "Location flexible")}</span></div><h3>${esc(x.title)}</h3><button class="button button-outline button-small" data-savejob="${x.id}" data-saved="${x.is_saved?1:0}">${x.is_saved?"Saved":"Save opportunity"}</button><div class="subtle">${esc(x.company)} · Posted by ${esc(x.author_name)}</div><p>${esc(x.description)}</p>${x.apply_url ? `<a target="_blank" rel="noopener" href="${esc(x.apply_url)}">Application details ↗</a>` : ""}</div>${me?.role === "admin" || me?.id === x.author_id ? `<button class="button button-danger button-small" data-jobdelete="${x.id}">Remove</button>` : ""}</article>`,
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
    `<div class="panel"><h3>Request mentorship</h3><form id="mentorForm" class="toolbar"><select class="input" name="alumni_id" required>${(await api("/alumni")).items.map((u) => `<option value="${u.id}">${esc(u.name)} · ${esc(u.job_title || u.department)}</option>`).join("")}</select><input class="input" name="message" placeholder="What would you like guidance on?" required><button class="button">Send request</button></form></div><div class="section-head"><div><h2>Your requests</h2></div></div><div class="list">${r.items.map((x) => `<div class="panel listing"><div><b>${esc(x.student_name)} → ${esc(x.alumni_name)}</b><p>${esc(x.message)}</p></div><span class="pill-status">${esc(x.status)}</span>${me.role === "alumni" && x.status === "pending" ? `<button class="button button-small" data-mentor="${x.id}" data-status="accepted">Accept</button><button class="button button-outline button-small" data-mentor="${x.id}" data-status="declined">Decline</button>` : ""}</div>`).join("") || empty("No mentorship requests yet")}</div>`;
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
          body: JSON.stringify({ status: b.dataset.status || "accepted" }),
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
  const save = e.target.closest("[data-savejob]");
  if (save) { if (!me) return authPrompt(); try { const method=save.dataset.saved==="1"?"DELETE":"POST"; await api("/jobs/"+save.dataset.savejob+"/save",{method}); toast(method==="POST"?"Opportunity saved":"Opportunity removed from saved jobs"); opportunities(); } catch(x){toast(x.message);} return; }
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
async function departments(){const r=await api("/departments").catch(async()=>{const a=await api("/alumni?limit=50");return {items:[...new Set(a.items.map(u=>u.department).filter(Boolean))].map((name,i)=>({id:encodeURIComponent(name),name,description:"Explore alumni from this department."}))};});content.innerHTML=heading("Departments","Explore alumni by academic community")+'<div class="toolbar"><input id="deptSearch" class="input" placeholder="Search departments"></div><div id="deptGrid" class="grid"></div>';const draw=()=>{$("#deptGrid").innerHTML=r.items.filter(d=>d.name.toLowerCase().includes($("#deptSearch").value.toLowerCase())).map(d=>'<a class="card" href="#department/'+d.id+'"><h2>'+esc(d.name)+'</h2><p>'+esc(d.description||"Connect with alumni from this department.")+'</p><strong>'+Number(d.alumni_count||0)+' alumni →</strong></a>').join("")||empty("No departments found")};draw();$("#deptSearch").oninput=draw;}
async function messages(){const r=await api("/conversations");content.innerHTML=heading("Messages","Conversations with your connections")+'<div class="grid">'+r.items.map(c=>'<a class="card" href="#messages/'+c.id+'"><h2>'+esc(c.other_user?.name||"Alumni")+'</h2><p>'+esc(c.last_message||"Start a conversation")+'</p></a>').join("")+'</div>'||empty("No conversations yet");}
async function community(){const r=await api("/community/posts");content.innerHTML=heading("Community","Share an update with your alumni network")+'<section class="panel"><form id="postForm"><label>Share an update</label><textarea class="input" name="body" required maxlength="4000"></textarea><button class="button">Publish</button></form></section><div class="list">'+r.items.map(p=>'<article class="panel listing"><strong>'+esc(p.author_name||"Alumni")+'</strong><p>'+esc(p.body)+'</p><button class="button button-outline" data-like="'+p.id+'">Like · '+Number(p.reaction_count||0)+'</button></article>').join("")+'</div>';$("#postForm").onsubmit=async e=>{e.preventDefault();await api("/community/posts",{method:"POST",body:JSON.stringify({body:new FormData(e.target).get("body")})});toast("Update published");community();};$$("[data-like]").forEach(b=>b.onclick=async()=>{await api("/community/posts/"+b.dataset.like+"/reaction",{method:"POST",body:JSON.stringify({reaction:"like"})});community();});}
async function settings(){const r=await api("/blocks");content.innerHTML=heading("Settings","Manage your privacy preferences")+'<section class="panel"><form id="settingsForm"><label>Profile visibility</label><select class="input" name="profile_visibility"><option value="public">Network</option><option value="connections">Connections only</option><option value="private">Private</option></select><label><input type="checkbox" name="email_visibility" value="true"> Show email</label><button class="button">Save preferences</button></form></section><h2>Blocked accounts</h2>'+r.items.map(b=>'<div class="listing">'+esc(b.name)+' <button data-unblock="'+b.id+'">Unblock</button></div>').join("");$("#settingsForm").onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.email_visibility=!!d.email_visibility;await api("/settings",{method:"PATCH",body:JSON.stringify(d)});toast("Settings saved");};$$("[data-unblock]").forEach(b=>b.onclick=async()=>{await api("/users/"+b.dataset.unblock+"/block",{method:"DELETE"});settings();});}
async function departmentDetail(id){const r=await api("/departments/"+id).catch(async()=>{const name=decodeURIComponent(id),a=await api("/alumni?department="+encodeURIComponent(name)+"&limit=50");return {department:{name,description:"Explore alumni from this department."},alumni_count:a.total,featured:a.items,years:[]};});content.innerHTML=heading(esc(r.department.name),esc(r.department.description||""))+"<p>"+Number(r.alumni_count||0)+" alumni</p><div class=\"grid\">"+r.featured.map(u=>cardPerson(u)).join("")+"</div><a class=\"button\" href=\"#directory?department="+encodeURIComponent(r.department.name)+"\">Explore department alumni</a>";}
async function directory(routeParams=new URLSearchParams()){content.innerHTML=heading(location.hash.split("?")[0]==="#alumni-network"?"Meet Our Alumni":"Alumni directory","Loading your alumni community…")+"<section class=\"panel loading-state\"><span class=\"loading-dot\"></span>Preparing alumni profiles and search filters</section>";const ds=await api("/departments").catch(async()=>{const a=await api("/alumni?limit=50");return {items:[...new Set(a.items.map(u=>u.department).filter(Boolean))].map(name=>({name,active:1}))};});const filters=[["degree","Degree"],["graduation_from","Year from"],["graduation_to","Year to"],["profession","Profession"],["company","Company"],["industry","Industry"],["city","City"],["country","Country"],["skill","Skill"]];content.innerHTML=heading(location.hash.split("?")[0]==="#alumni-network"?"Meet Our Alumni":"Alumni directory",location.hash.split("?")[0]==="#alumni-network"?"Discover the people, stories, and achievements that connect our university community.":"Find your community across departments and graduating years")+'<div class="notice">Local demo · Sample profiles are fictional.</div><section class="panel directory-filter"><div class="toolbar"><input class="input" id="fq" placeholder="Name, field, or company"><select class="input" id="fd"><option value="">All departments</option>'+ds.items.map(d=>'<option>'+esc(d.name)+'</option>').join("")+'</select>'+filters.map(x=>'<input class="input" data-f="'+x[0]+'" placeholder="'+x[1]+'" '+(x[0].startsWith("graduation")?'type="number"':'')+'>').join("")+'<label><input id="fm" type="checkbox"> Mentors</label><label><input id="fh" type="checkbox"> Hiring</label><button class="button" id="fs">Search</button><button class="button button-outline" id="fc">Clear</button></div><div id="fcount" class="subtle"></div></section><div id="fresults" class="grid"></div><button class="button button-outline" id="fmore">Show more</button>';for(const [k,v] of routeParams){if(k==="q")$("#fq").value=v;else if(k==="department")$("#fd").value=v;else if(k==="mentorship_available")$("#fm").checked=v==="true"||v==="1";else if(k==="currently_hiring")$("#fh").checked=v==="true"||v==="1";else{const e=$("[data-f=\""+k+"\"]");if(e)e.value=v;}}let page=1,total=0;const run=async more=>{if(!more)page=1;const p=new URLSearchParams();if($("#fq").value)p.set("q",$("#fq").value);if($("#fd").value)p.set("department",$("#fd").value); $$("[data-f]").forEach(e=>e.value&&p.set(e.dataset.f,e.value));if($("#fm").checked)p.set("mentorship_available","true");if($("#fh").checked)p.set("currently_hiring","true");p.set("page",page);p.set("limit","12");const share=new URLSearchParams(p);share.delete("page");share.delete("limit");history.replaceState(null,"",(location.hash.split("?")[0]==="#alumni-network"?"#alumni-network":"#directory")+(share.toString()?"?"+share.toString():""));const r=await api("/alumni?"+p);total=r.total;$("#fcount").textContent=total+" matching alumni";const cards=r.items.map(cardPerson).join("")||empty("No matching alumni","Try adjusting or clearing filters.");if(more)$("#fresults").insertAdjacentHTML("beforeend",cards);else $("#fresults").innerHTML=cards;$("#fmore").classList.toggle("hidden",page*12>=total);};$("#fs").onclick=()=>run(false);$("#fc").onclick=()=>{ $("#fq").value="";$("#fd").value="";$("#fm").checked=$("#fh").checked=false; $$("[data-f]").forEach(e=>e.value="");run(false);};$("#fmore").onclick=()=>{page++;run(true);};$("#fq").onkeydown=e=>e.key==="Enter"&&run(false);await run(false);}
const globalInput=$("#globalSearch"),globalResults=$("#globalResults");if(globalInput){let searchTimer;globalInput.oninput=()=>{clearTimeout(searchTimer);const q=globalInput.value.trim();if(q.length<2){globalResults.classList.add("hidden");return;}searchTimer=setTimeout(async()=>{try{const d=await api("/search?q="+encodeURIComponent(q));const links=[...d.alumni.map(x=>["#alumni/"+x.id,x.name+" · "+(x.department||"Alumni")]),...d.departments.map(x=>["#department/"+x.id,x.name+" · Department"]),...d.jobs.map(x=>["#opportunities",x.title+" · "+x.company]),...d.events.map(x=>["#events",x.title+" · Event"])];globalResults.innerHTML=links.map(x=>'<a href="'+x[0]+'">'+esc(x[1])+'</a>').join("")||'<div class="subtle">No results found</div>';globalResults.classList.remove("hidden");}catch(e){globalResults.innerHTML='<div class="subtle">Search unavailable</div>';globalResults.classList.remove("hidden");}},180);};document.addEventListener("click",e=>{if(!e.target.closest(".global-search")&&!e.target.closest("#globalResults"))globalResults.classList.add("hidden");});}
async function alumniProfile(id){const d=await api("/alumni/"+encodeURIComponent(id)+"/details"),u=d.user,skills=(u.skills||"").split(",").filter(Boolean);const section=(title,items,fields)=>'<section class="panel profile-section"><h2>'+title+'</h2>'+(items.length?items.map(x=>'<article class="listing"><strong>'+esc(fields.map(k=>x[k]).filter(Boolean).join(" · "))+'</strong>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>').join(""):empty("No details added yet"))+'</section>';content.innerHTML='<a class="text-link back-link" href="#directory">← Back to directory</a><section class="profile-hero"><div class="profile-intro"><div class="eyebrow">'+esc(u.department||"ALUMNI COMMUNITY")+(u.graduation_year?" · CLASS OF "+esc(u.graduation_year):"")+'</div><h1>'+esc(u.name)+'</h1><p>'+esc(u.headline||u.job_title||"Alumni member")+(u.company?" · "+esc(u.company):"")+'</p><p>'+esc([u.city,u.country].filter(Boolean).join(", "))+'</p><div class="tags"><span class="tag">'+esc(u.degree||"Alumni")+'</span>'+skills.map(s=>'<span class="tag">'+esc(s.trim())+'</span>').join("")+(u.verification_status==="verified"&&u.source_type!=="fictional_demo"?'<span class="tag verified">✓ Verified</span>':'')+'</div><div class="card-actions">'+(me.id===u.id?'<a class="button" href="#profile">Edit profile</a>':'<button class="button" data-connect="'+u.id+'">Connect</button>'+(d.can_message?'<button class="button button-outline" data-message="'+u.id+'">Message</button>':'')+(d.can_mentor?'<a class="button button-outline" href="#mentorship">Request mentorship</a>':''))+'</div></div></section><section class="panel profile-about"><h2>About</h2><p>'+esc(u.bio||"No biography added yet.")+'</p>'+(u.website_url?'<a class="text-link" href="'+esc(u.website_url)+'" rel="noopener noreferrer" target="_blank">Professional website ↗</a>':'')+(u.linkedin_url?'<a class="text-link" href="'+esc(u.linkedin_url)+'" rel="noopener noreferrer" target="_blank">LinkedIn ↗</a>':'')+'</section><div class="profile-columns">'+section("Education",d.education,["degree","field","institution"]) + section("Experience",d.experience,["title","company","location"]) + section("Projects",d.projects,["title"]) + section("Certifications",d.certifications,["name","issuer","issued_year"])+'</div>';$$("[data-message]").forEach(b=>b.onclick=async()=>{try{const r=await api("/messages/"+b.dataset.message,{method:"POST",body:JSON.stringify({body:"Hello! I’d like to connect."})});location.hash="messages/"+r.conversation_id;}catch(e){toast(e.message);}});}
async function messages(){const parts=location.hash.slice(1).split("/");if(parts[1]){const id=parts[1],r=await api("/conversations/"+id+"/messages");content.innerHTML='<a href="#messages" class="text-link">← Conversations</a><section class="panel"><h2>'+esc(r.other_user?.name||"Conversation")+'</h2><div class="message-list">'+r.items.map(m=>'<p class="message '+(Number(m.sender_id)===Number(me.id)?"mine":"")+'">'+esc(m.body)+'<small>'+esc(m.created_at)+'</small></p>').join("")+'</div><form id="sendMessage" class="message-compose"><input class="input" name="body" required maxlength="4000" placeholder="Write a message"><button class="button">Send</button></form></section>';$("#sendMessage").onsubmit=async e=>{e.preventDefault();await api("/conversations/"+id+"/messages",{method:"POST",body:JSON.stringify({body:new FormData(e.target).get("body")})});messages();};return;}const r=await api("/conversations");content.innerHTML=heading("Messages","Continue conversations with your connections")+'<div class="grid">'+r.items.map(c=>'<a class="card" href="#messages/'+c.id+'"><h2>'+esc(c.other_user?.name||"Alumni")+'</h2><p>'+esc(c.last_message||"Start a conversation")+'</p><small>'+Number(c.unread_count||0)+' unread</small></a>').join("")+'</div>'+(r.items.length?"":empty("No conversations yet","Connect with an alum before starting a private conversation."));}
var baseAdmin=admin;admin=async function(){await baseAdmin();if(me?.role!=="admin")return;const [ds,rs]=await Promise.all([api("/departments"),api("/admin/reports")]);content.insertAdjacentHTML("beforeend",'<section class="section-head"><div><h2>Manage departments</h2><p>Configure the academic departments used in directory filters.</p></div><button class="button" id="addDept">Add department</button></section><div class="list">'+ds.items.map(d=>'<article class="panel listing"><span><strong>'+esc(d.name)+'</strong><small>'+esc(d.description||"")+'</small></span><button class="button button-outline button-small" data-dept-toggle="'+d.id+'" data-active="'+(d.active?0:1)+'">'+(d.active?"Deactivate":"Reactivate")+'</button></article>').join("")+'</div><section class="section-head"><div><h2>Content reports</h2><p>Review reports submitted by community members.</p></div></section><div class="list">'+rs.items.map(r=>'<article class="panel listing"><div><strong>'+esc(r.target_type)+' #'+r.target_id+'</strong><p>'+esc(r.reason)+'</p><small>'+esc(r.reporter_name||"Member")+' · '+esc(r.status)+'</small></div><button class="button button-outline button-small" data-report-close="'+r.id+'">Mark reviewed</button></article>').join("")+(rs.items.length?"":empty("No open reports"))+'</div>');$("#addDept").onclick=()=>{const name=prompt("Department name");if(!name)return;const description=prompt("Short description")||"";api("/admin/departments",{method:"POST",body:JSON.stringify({name,description})}).then(()=>{toast("Department added");admin();}).catch(e=>toast(e.message));};$$("[data-dept-toggle]").forEach(b=>b.onclick=async()=>{try{await api("/admin/departments/"+b.dataset.deptToggle,{method:"PATCH",body:JSON.stringify({active:Number(b.dataset.active)})});admin();}catch(e){toast(e.message);}});$$("[data-report-close]").forEach(b=>b.onclick=async()=>{await api("/admin/reports/"+b.dataset.reportClose,{method:"PATCH",body:JSON.stringify({status:"reviewed"})});admin();});};
var baseHome=home;home=async function(){await baseHome();if(!me)return;try{const d=await api("/dashboard");const dashboard='<section class="panel dashboard-personal"><div class="section-head"><div><div class="eyebrow">YOUR NETWORK</div><h2>Your next chapter starts here</h2><p>Profile completeness · '+d.profile_completion+'%</p></div><a class="button button-outline button-small" href="#profile">Complete profile</a></div><div class="dashboard-columns"><div><h3>Connection requests</h3>'+((d.incoming||[]).map(x=>'<article class="listing"><span>'+esc(x.name)+' · '+esc(x.department||"Alumni")+'</span><a href="#connections">Review</a></article>').join("")||'<p class="subtle">No requests waiting for you.</p>')+'</div><div><h3>Suggested alumni</h3>'+((d.alumni||[]).slice(0,3).map(x=>'<article class="listing"><span>'+esc(x.name)+' · '+esc(x.job_title||x.department||"Alumni")+'</span><a href="#alumni/'+x.id+'">View</a></article>').join("")||'<p class="subtle">No suggestions yet.</p>')+'</div><div><h3>Mentors & opportunities</h3><p>'+d.mentors.length+' mentors · '+d.jobs.length+' opportunities</p><a href="#mentorship">Explore mentorship →</a> · <a href="#opportunities">Career board →</a></div><div><h3>Upcoming events</h3>'+((d.events||[]).map(x=>'<p>'+esc(x.title)+' · '+new Date(x.starts_at).toLocaleDateString()+'</p>').join("")||'<p class="subtle">No events scheduled.</p>')+'</div></div></section>';content.insertAdjacentHTML("afterbegin",dashboard);}catch(e){console.warn("Dashboard data unavailable",e);}};
var priorMentorship=mentorship;mentorship=async function(){await priorMentorship();if(!me)return;const r=await api("/mentors");const section='<section class="community-section"><div class="section-head"><div><div class="eyebrow">GUIDANCE FROM YOUR NETWORK</div><h2>Available mentors</h2><p>Verified alumni who have volunteered to support the next generation.</p></div></div><div class="toolbar"><input class="input" id="mentorSearch" placeholder="Filter mentors by department, role, or skill"></div><div id="mentorGrid" class="grid"></div></section>';content.insertAdjacentHTML("afterbegin",section);const draw=()=>{const q=$("#mentorSearch").value.toLowerCase();$("#mentorGrid").innerHTML=r.items.filter(u=>[u.name,u.department,u.job_title,u.industry,u.skills].some(v=>String(v||"").toLowerCase().includes(q))).map(u=>cardPerson(u,false).replace("</article>",'<button class="button button-outline" data-mentor-request="'+u.id+'">Request mentorship</button></article>')).join("")||empty("No mentors match","Try a different department, role, or skill.");$$("[data-mentor-request]").forEach(b=>b.onclick=async()=>{const message=prompt("What career guidance are you looking for?");if(!message)return;try{await api("/mentorship/requests",{method:"POST",body:JSON.stringify({alumni_id:Number(b.dataset.mentorRequest),message})});toast("Mentorship request sent");}catch(e){toast(e.message);}});};$("#mentorSearch").oninput=draw;draw();};
async function community(){const r=await api("/community/posts");content.innerHTML=heading("Community","Share an update with your alumni network")+'<section class="panel"><form id="postForm"><label for="postBody">Share an update</label><textarea id="postBody" class="input" name="body" required maxlength="4000"></textarea><button class="button">Publish update</button></form></section><div class="list">'+r.items.map(p=>'<article class="panel listing"><strong>'+esc(p.author_name||"Alumni")+'</strong><p>'+esc(p.body)+'</p><button class="button button-outline" data-like="'+p.id+'">Like · '+Number(p.reaction_count||0)+'</button> <button class="button button-outline" data-report="'+p.id+'">Report</button> <button class="button button-outline" data-copy="'+p.id+'">Copy link</button> <button class="button button-outline" data-comments="'+p.id+'">View comments</button><div class="post-comments" id="comments-'+p.id+'"></div><form data-comment="'+p.id+'" class="comment-form"><input class="input" name="body" required placeholder="Write a comment"><button class="button button-small">Comment</button></form></article>').join("")+'</div>';$("#postForm").onsubmit=async e=>{e.preventDefault();try{await api("/community/posts",{method:"POST",body:JSON.stringify({body:new FormData(e.target).get("body")})});toast("Update published");community();}catch(x){toast(x.message);}};$$("[data-like]").forEach(b=>b.onclick=async()=>{try{await api("/community/posts/"+b.dataset.like+"/reaction",{method:"POST",body:JSON.stringify({reaction:"like"})});community();}catch(e){toast(e.message);}});$$("[data-report]").forEach(b=>b.onclick=async()=>{const reason=prompt("Why should this post be reviewed?");if(!reason)return;try{await api("/reports",{method:"POST",body:JSON.stringify({target_type:"post",target_id:Number(b.dataset.report),reason})});toast("Report sent");}catch(e){toast(e.message);}});$$("[data-copy]").forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+"/#community?post="+b.dataset.copy);toast("Link copied");}catch(e){toast("Could not copy link");}});$$("[data-comments]").forEach(b=>b.onclick=async()=>{try{const c=await api("/community/posts/"+b.dataset.comments+"/comments");$("#comments-"+b.dataset.comments).innerHTML=c.items.map(x=>"<p class=\"comment\"><strong>"+esc(x.author_name)+"</strong> "+esc(x.body)+"</p>").join("")||"<p class=\"subtle\">No comments yet.</p>";}catch(e){toast(e.message);}});$$("[data-comment]").forEach(f=>f.onsubmit=async e=>{e.preventDefault();try{await api("/community/posts/"+f.dataset.comment+"/comments",{method:"POST",body:JSON.stringify({body:new FormData(f).get("body")})});toast("Comment added");community();}catch(x){toast(x.message);}});}
function cardPerson(u,btn=true){const portraits=["photo-1494790108377-be9c29b29330","photo-1500648767791-00dcc994a43e","photo-1534528741775-53994a69daeb"];const defaultPhoto="https://images.unsplash.com/"+portraits[(Number(u.id)||0)%portraits.length]+"?auto=format&fit=crop&w=240&h=240&q=85";const source=/^https?:\/\//i.test(u.profile_photo_url||"")?u.profile_photo_url:defaultPhoto;const profile="#alumni/"+encodeURIComponent(u.id);return '<article class="card alumni-card"><a class="person alumni-person" href="'+profile+'"><img class="person-photo" src="'+esc(source)+'" alt="'+esc(u.name)+' profile photo" loading="lazy" onerror="this.onerror=null;this.src=\'/assets/alumniconnect-symbol.svg\'"><div><h3>'+esc(u.name)+'</h3><p>'+esc(u.headline||u.job_title||"Alumni member")+(u.company?" · "+esc(u.company):"")+'</p></div></a><div class="tags"><span class="tag">'+esc(u.department||"Department not set")+'</span>'+(u.degree?'<span class="tag">'+esc(u.degree)+'</span>':'')+(u.graduation_year?'<span class="tag">Class of '+esc(u.graduation_year)+'</span>':'')+(u.verification_status==="verified"?'<span class="tag verified">✓ Verified</span>':'')+'</div><p class="alumni-bio">'+esc(u.bio||"Professional profile in the fictional AlumniConnect demo.")+'</p><div class="card-actions"><a class="button button-outline button-small" href="'+profile+'">View Profile</a>'+(btn&&me?.id!==u.id?'<button class="button button-outline button-small" data-connect="'+u.id+'">Connect</button>':'')+'</div></article>';}
async function alumniNetwork(params=new URLSearchParams()){return directory(params);}

async function alumniProfile(id){const d=await api("/alumni/"+encodeURIComponent(id)+"/details").catch(async()=>{const r=await api("/alumni/"+encodeURIComponent(id));return {user:r.user,education:[],experience:[],projects:[],certifications:[],can_message:false,can_mentor:false};}),u=d.user;const safe=(v)=>/^https:\/\//i.test(v||"")?esc(v):"";const portraits=["photo-1494790108377-be9c29b29330","photo-1500648767791-00dcc994a43e","photo-1534528741775-53994a69daeb"];const photo=safe(u.profile_photo_url)||"https://images.unsplash.com/"+portraits[(Number(id)||0)%portraits.length]+"?auto=format&fit=crop&w=360&h=360&q=85";const lines=(s)=>(s||"").split(",").map(x=>x.trim()).filter(Boolean);const list=(title,items,render)=>'<section class="panel profile-section"><div class="eyebrow">PROFILE</div><h2>'+title+'</h2>'+(items.length?'<div class="timeline">'+items.map(render).join("")+'</div>':empty("No details added yet"))+'</section>';const links=[["LinkedIn Profile",u.linkedin_url],["GitHub Profile",u.github_url],["Portfolio / Personal Website",u.portfolio_url||u.website_url]].filter(x=>safe(x[1]));content.innerHTML='<a class="text-link back-link" href="#alumni-network">← Back to Alumni Network</a><section class="profile-hero profile-hero-premium"><div class="profile-cover">'+(safe(u.cover_photo_url)?'<img src="'+safe(u.cover_photo_url)+'" alt="" onerror="this.remove()">':'')+'</div><img class="profile-photo" src="'+photo+'" alt="'+esc(u.name)+' profile photo" onerror="this.onerror=null;this.src=\'/assets/alumniconnect-symbol.svg\'"><div class="profile-intro"><div class="eyebrow">'+esc(u.department||"ALUMNI COMMUNITY")+(u.graduation_year?" · CLASS OF "+esc(u.graduation_year):"")+'</div><h1>'+esc(u.name)+'</h1><p class="profile-headline">'+esc(u.headline||u.job_title||"Alumni member")+(u.company?" · "+esc(u.company):"")+'</p><p class="subtle">'+esc(u.degree||"")+(u.industry?" · "+esc(u.industry):"")+(u.location||u.city||u.country?" · "+esc(u.location||[u.city,u.country].filter(Boolean).join(", ")):"")+'</p><div class="card-actions">'+(me.id===u.id?'<a class="button" href="#profile">Edit profile</a>':'<button class="button" data-connect="'+u.id+'">Connect</button>'+(d.can_message?'<button class="button button-outline" data-message="'+u.id+'">Message</button>':'')+(d.can_mentor?'<a class="button button-outline" href="#mentorship">Request mentorship</a>':''))+'</div></div></section><div class="profile-detail-grid"><section class="panel profile-about"><div class="eyebrow">ABOUT</div><h2>About '+esc(u.name.split(" ")[0])+'</h2><p>'+esc(u.bio||u.headline||"No biography added yet.")+'</p><h3>Career interests</h3><p>'+esc(u.career_interests||"Not specified")+'</p><h3>Research interests</h3><p>'+esc(u.research_interests||"Not specified")+'</p><div class="tags">'+lines(u.skills).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div>'+(u.achievements?'<h3>Achievements</h3><p>'+esc(u.achievements)+'</p>':'')+'</section><section class="panel current-role"><div class="eyebrow">CURRENT PROFESSIONAL INFORMATION</div><h2>'+esc(u.job_title||"Career details")+'</h2><p><strong>'+esc(u.company||"Organization not listed")+'</strong></p><p>'+esc(u.industry||"Industry not listed")+' · '+esc(u.location||[u.city,u.country].filter(Boolean).join(", ")||"Location not listed")+'</p><div class="profile-links">'+links.map(x=>'<a class="button button-outline button-small" href="'+safe(x[1])+'" target="_blank" rel="noopener noreferrer">'+esc(x[0])+' ↗</a>').join("")+'</div></section>'+list("Education Journey",d.education||[],x=>'<article class="timeline-item"><span class="timeline-dot"></span><div><h3>'+esc(x.degree||"Education")+(x.field?" · "+esc(x.field):"")+'</h3><strong>'+esc(x.institution)+'</strong><div class="subtle">'+esc(x.start_year||"")+" — "+esc(x.end_year||"Present")+'</div>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</div></article>')+list("Professional Experience",d.experience||[],x=>'<article class="timeline-item"><span class="timeline-dot"></span><div><h3>'+esc(x.title)+'</h3><strong>'+esc(x.company)+'</strong><div class="subtle">'+esc(x.location||"")+' · '+esc(x.start_date||"")+' — '+esc(x.is_current?"Present":x.end_date||"")+'</div>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</div></article>')+list("Projects & Achievements",d.projects||[],x=>'<article class="timeline-item"><span class="timeline-dot"></span><div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description||"")+'</p>'+(safe(x.url)?'<a class="text-link" href="'+safe(x.url)+'" target="_blank" rel="noopener noreferrer">View project ↗</a>':'')+'</div></article>')+list("Certifications",d.certifications||[],x=>'<article class="timeline-item"><span class="timeline-dot"></span><div><h3>'+esc(x.name)+'</h3><strong>'+esc(x.issuer||"")+'</strong><div class="subtle">'+esc(x.issued_year||"")+'</div></div></article>')+'</div><div class="demo-strip">Local demo · Profile histories and people shown here are fictional examples.</div>';$$("[data-message]").forEach(b=>b.onclick=async()=>{try{const r=await api("/messages/"+b.dataset.message,{method:"POST",body:JSON.stringify({body:"Hello! I’d like to connect."})});location.hash="messages/"+r.conversation_id;}catch(e){toast(e.message);}});}
window.onhashchange = render;
render();
