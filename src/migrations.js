module.exports = function migrate(db) {
  const columns = {
    users: [
      ["headline", "TEXT NOT NULL DEFAULT ''"], ["city", "TEXT NOT NULL DEFAULT ''"],
      ["country", "TEXT NOT NULL DEFAULT ''"], ["industry", "TEXT NOT NULL DEFAULT ''"],
      ["profile_photo_url", "TEXT NOT NULL DEFAULT ''"], ["cover_photo_url", "TEXT NOT NULL DEFAULT ''"],
      ["mentorship_available", "INTEGER NOT NULL DEFAULT 0"], ["mentorship_areas", "TEXT NOT NULL DEFAULT ''"],
      ["career_interests", "TEXT NOT NULL DEFAULT ''"], ["currently_hiring", "INTEGER NOT NULL DEFAULT 0"],
      ["profile_visibility", "TEXT NOT NULL DEFAULT 'public'"], ["email_visibility", "INTEGER NOT NULL DEFAULT 0"],
      ["location", "TEXT NOT NULL DEFAULT ''"], ["website_url", "TEXT NOT NULL DEFAULT ''"], ["github_url", "TEXT NOT NULL DEFAULT ''"], ["portfolio_url", "TEXT NOT NULL DEFAULT ''"], ["achievements", "TEXT NOT NULL DEFAULT ''"], ["research_interests", "TEXT NOT NULL DEFAULT ''"]
    ],
    departments: [["description", "TEXT NOT NULL DEFAULT ''"], ["active", "INTEGER NOT NULL DEFAULT 1"]],
    jobs: [["industry", "TEXT NOT NULL DEFAULT ''"], ["experience_level", "TEXT NOT NULL DEFAULT ''"], ["remote", "INTEGER NOT NULL DEFAULT 0"], ["requirements", "TEXT NOT NULL DEFAULT ''"], ["application_instructions", "TEXT NOT NULL DEFAULT ''"], ["deadline", "TEXT"], ["updated_at", "TEXT NOT NULL DEFAULT ''"]],
    events: [["mode", "TEXT NOT NULL DEFAULT 'offline'"], ["online_url", "TEXT NOT NULL DEFAULT ''"], ["organizer", "TEXT NOT NULL DEFAULT ''"], ["status", "TEXT NOT NULL DEFAULT 'published'"]],
    notifications: [["entity_type", "TEXT NOT NULL DEFAULT ''"], ["entity_id", "INTEGER"], ["link_url", "TEXT NOT NULL DEFAULT ''"]]
  };
  for (const [table, additions] of Object.entries(columns)) {
    const present = new Set(db.prepare('PRAGMA table_info(' + table + ')').all().map(c => c.name));
    for (const [name, definition] of additions) if (!present.has(name)) db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + name + ' ' + definition);
  }
  db.exec([
    "CREATE TABLE IF NOT EXISTS education_entries(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,institution TEXT NOT NULL,degree TEXT NOT NULL DEFAULT '',field TEXT NOT NULL DEFAULT '',start_year INTEGER,end_year INTEGER,description TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS work_experience(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,company TEXT NOT NULL,title TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',start_date TEXT,end_date TEXT,is_current INTEGER NOT NULL DEFAULT 0,description TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS profile_projects(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS profile_certifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,issuer TEXT NOT NULL DEFAULT '',issued_year INTEGER,credential_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS conversations(id INTEGER PRIMARY KEY AUTOINCREMENT,user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_a,user_b),CHECK(user_a<user_b))",
    "CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,read_at TEXT)",
    "CREATE TABLE IF NOT EXISTS user_blocks(id INTEGER PRIMARY KEY AUTOINCREMENT,blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(blocker_id,blocked_id),CHECK(blocker_id!=blocked_id))",
    "CREATE TABLE IF NOT EXISTS content_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,target_type TEXT NOT NULL CHECK(target_type IN ('user','post','comment')),target_id INTEGER NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','dismissed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS saved_jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,job_id))",
    "CREATE TABLE IF NOT EXISTS community_posts(id INTEGER PRIMARY KEY AUTOINCREMENT,author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,image_url TEXT NOT NULL DEFAULT '',visibility TEXT NOT NULL DEFAULT 'community' CHECK(visibility IN ('community','connections')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS post_comments(id INTEGER PRIMARY KEY AUTOINCREMENT,post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS post_reactions(id INTEGER PRIMARY KEY AUTOINCREMENT,post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,reaction TEXT NOT NULL DEFAULT 'like',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(post_id,user_id))",
    "CREATE INDEX IF NOT EXISTS idx_department_active ON departments(active,name)",
    "CREATE INDEX IF NOT EXISTS idx_education_user ON education_entries(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_experience_user ON work_experience(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs(status,type,industry,location,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_events_start ON events(status,starts_at)",
    "CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status,created_at)"
  ].join(';'));
  const departments = [
    ["Computer Science & Engineering (CSE)", "Computing, software systems, and engineering."],
    ["Electrical & Electronic Engineering (EEE)", "Electrical, electronics, and communications engineering."],
    ["Business Administration (BBA)", "Business leadership and administration."],
    ["Data Science", "Data analytics, statistics, and machine learning."], ["English", "English language, literature, and communication."],
    ["Economics", "Economic theory, policy, and analysis."], ["Law / LLB", "Legal studies and professional law."],
    ["Civil Engineering", "Civil infrastructure and structural engineering."], ["Software Engineering", "Software design, development, and delivery."],
    ["Information Technology", "Information systems and applied computing."], ["Mathematics", "Pure and applied mathematics."],
    ["Statistics", "Statistical science and quantitative methods."], ["Physics", "Physical sciences and research."],
    ["Chemistry", "Chemical sciences and laboratory research."], ["Pharmacy", "Pharmaceutical science and practice."],
    ["Public Health", "Public health practice, policy, and research."], ["Biotechnology", "Biological science and biotechnology."],
    ["Architecture", "Architecture, urban design, and the built environment."],
    ["Civil and Environmental Engineering", "Civil systems, environment, and sustainability."],
    ["Finance & Banking", "Finance, banking, and financial services."], ["Accounting", "Accounting, audit, and financial reporting."],
    ["Marketing", "Marketing, communications, and customer insight."], ["Management", "Organizations, operations, and leadership."],
    ["Human Resource Management", "People operations and human resource practice."], ["Sociology", "Society, communities, and social research."],
    ["Political Science", "Political systems, governance, and policy."], ["International Relations", "Global affairs, diplomacy, and international policy."],
    ["Journalism & Media Studies", "Journalism, media, and communications."], ["Other / Additional Departments", "Other programs configured by the university administrator."]
  ];
  db.prepare("UPDATE jobs SET updated_at=created_at WHERE updated_at=''").run();
  const insert = db.prepare('INSERT OR IGNORE INTO departments(name,description,active) VALUES(?,?,1)');
  for (const department of departments) insert.run(...department);
  db.prepare("UPDATE users SET department='Computer Science & Engineering (CSE)' WHERE lower(trim(department)) IN ('computer science','cse','computer science and engineering')").run();
  db.prepare("UPDATE users SET department='Business Administration (BBA)' WHERE lower(trim(department)) IN ('business administration','bba')").run();
  db.prepare("UPDATE users SET department='Electrical & Electronic Engineering (EEE)' WHERE lower(trim(department)) IN ('electrical engineering','eee','electrical and electronic engineering')").run();
  const demoProfiles = [
    {email:'maliha.alumni@example.edu',institution:'AlumniConnect Demo University',degree:'BSc',field:'Computer Science & Engineering',start:2014,end:2018,company:'Northstar Labs',title:'Product Designer',industry:'Technology',project:'Accessible Campus Planner',cert:'Human-Centered Product Design'},
    {email:'rafi.alumni@example.edu',institution:'AlumniConnect Demo University',degree:'BSc',field:'Electrical & Electronic Engineering',start:2012,end:2016,company:'Delta Devices',title:'Systems Engineer',industry:'Engineering',project:'Connected Sensor Prototype',cert:'Embedded Systems Foundations'},
    {email:'samira.alumni@example.edu',institution:'AlumniConnect Demo University',degree:'MBA',field:'Business Administration',start:2018,end:2020,company:'Harbor Analytics',title:'Business Analyst',industry:'Analytics',project:'Market Insights Study',cert:'Business Analytics Essentials'},
    {email:'ayesha.alumni@example.edu',institution:'AlumniConnect Demo University',degree:'MSc',field:'Data Science',start:2019,end:2021,company:'Atlas Insights',title:'Analytics Lead',industry:'Data & Analytics',project:'Responsible Insights Dashboard',cert:'Applied Data Science'},
    {email:'imran.alumni@example.edu',institution:'AlumniConnect Demo University',degree:'BA',field:'English',start:2011,end:2015,company:'Lantern Media',title:'Content Strategy Lead',industry:'Media',project:'Digital Storytelling Collection',cert:'Editorial Strategy'},
    {email:'tanjim.alumni@example.edu',institution:'AlumniConnect Demo University',degree:'BSc',field:'Software Engineering',start:2015,end:2019,company:'Meridian Systems',title:'Senior Software Engineer',industry:'Technology',project:'Cloud Reliability Toolkit',cert:'Cloud Engineering Foundations'}
  ];
  const addEducation=db.prepare("INSERT INTO education_entries(user_id,institution,degree,field,start_year,end_year,description) SELECT id,?,?,?,?,?,? FROM users WHERE email=? AND NOT EXISTS(SELECT 1 FROM education_entries e WHERE e.user_id=users.id)");
  const addExperience=db.prepare("INSERT INTO work_experience(user_id,company,title,location,start_date,is_current,description) SELECT id,?,?,?,?,1,? FROM users WHERE email=? AND NOT EXISTS(SELECT 1 FROM work_experience w WHERE w.user_id=users.id)");
  const addProject=db.prepare("INSERT INTO profile_projects(user_id,title,description) SELECT id,?,? FROM users WHERE email=? AND NOT EXISTS(SELECT 1 FROM profile_projects p WHERE p.user_id=users.id)");
  const addCert=db.prepare("INSERT INTO profile_certifications(user_id,name,issuer,issued_year) SELECT id,?,?,? FROM users WHERE email=? AND NOT EXISTS(SELECT 1 FROM profile_certifications c WHERE c.user_id=users.id)");
  for(const p of demoProfiles){addEducation.run(p.institution,p.degree,p.field,p.start,p.end,'Fictional education record for the local demo.',p.email);addExperience.run(p.company,p.title,'Dhaka, Bangladesh',String(p.end+1)+'-01-01','Fictional career record for the local demo.',p.email);addProject.run(p.project,'Fictional portfolio example included for demonstration.',p.email);addCert.run(p.cert,'AlumniConnect demo program',p.end+1,p.email);}
};
