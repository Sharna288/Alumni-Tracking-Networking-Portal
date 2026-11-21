module.exports = function migrate(db) {
  db.exec("CREATE TABLE IF NOT EXISTS universities(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,description TEXT NOT NULL DEFAULT '',website_url TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1,category TEXT NOT NULL DEFAULT '',ugc_id INTEGER,slug TEXT NOT NULL DEFAULT '',district TEXT NOT NULL DEFAULT '',division TEXT NOT NULL DEFAULT '',ugc_marker TEXT NOT NULL DEFAULT '',ugc_notices TEXT NOT NULL DEFAULT '[]',source_url TEXT NOT NULL DEFAULT '',source_retrieved_at TEXT NOT NULL DEFAULT '',directory_status TEXT NOT NULL DEFAULT 'local',operational_status_verified INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  const columns = {
    universities: [["category","TEXT NOT NULL DEFAULT ''"],["ugc_id","INTEGER"],["slug","TEXT NOT NULL DEFAULT ''"],["district","TEXT NOT NULL DEFAULT ''"],["division","TEXT NOT NULL DEFAULT ''"],["ugc_marker","TEXT NOT NULL DEFAULT ''"],["ugc_notices","TEXT NOT NULL DEFAULT '[]'"],["source_url","TEXT NOT NULL DEFAULT ''"],["source_retrieved_at","TEXT NOT NULL DEFAULT ''"],["directory_status","TEXT NOT NULL DEFAULT 'local'"],["operational_status_verified","INTEGER NOT NULL DEFAULT 0"]],
    users: [
      ["department_confirmation_status","TEXT NOT NULL DEFAULT 'unverified'"],
      ["headline", "TEXT NOT NULL DEFAULT ''"], ["city", "TEXT NOT NULL DEFAULT ''"],
      ["country", "TEXT NOT NULL DEFAULT ''"], ["industry", "TEXT NOT NULL DEFAULT ''"],
      ["profile_photo_url", "TEXT NOT NULL DEFAULT ''"], ["cover_photo_url", "TEXT NOT NULL DEFAULT ''"],
      ["mentorship_available", "INTEGER NOT NULL DEFAULT 0"], ["mentorship_areas", "TEXT NOT NULL DEFAULT ''"],
      ["career_interests", "TEXT NOT NULL DEFAULT ''"], ["currently_hiring", "INTEGER NOT NULL DEFAULT 0"],
      ["profile_visibility", "TEXT NOT NULL DEFAULT 'public'"], ["email_visibility", "INTEGER NOT NULL DEFAULT 0"],
      ["location", "TEXT NOT NULL DEFAULT ''"], ["website_url", "TEXT NOT NULL DEFAULT ''"], ["github_url", "TEXT NOT NULL DEFAULT ''"], ["portfolio_url", "TEXT NOT NULL DEFAULT ''"], ["achievements", "TEXT NOT NULL DEFAULT ''"], ["research_interests", "TEXT NOT NULL DEFAULT ''"], ["university_id", "INTEGER REFERENCES universities(id)"], ["is_featured", "INTEGER NOT NULL DEFAULT 0"]
    ],
    departments: [["description", "TEXT NOT NULL DEFAULT ''"], ["active", "INTEGER NOT NULL DEFAULT 1"], ["verification_status", "TEXT NOT NULL DEFAULT 'unverified'"], ["source_url", "TEXT NOT NULL DEFAULT ''"]],
    jobs: [["industry", "TEXT NOT NULL DEFAULT ''"], ["experience_level", "TEXT NOT NULL DEFAULT ''"], ["remote", "INTEGER NOT NULL DEFAULT 0"], ["requirements", "TEXT NOT NULL DEFAULT ''"], ["application_instructions", "TEXT NOT NULL DEFAULT ''"], ["deadline", "TEXT"], ["updated_at", "TEXT NOT NULL DEFAULT ''"]],
    events: [["mode", "TEXT NOT NULL DEFAULT 'offline'"], ["online_url", "TEXT NOT NULL DEFAULT ''"], ["organizer", "TEXT NOT NULL DEFAULT ''"], ["status", "TEXT NOT NULL DEFAULT 'published'"], ["source_url", "TEXT NOT NULL DEFAULT ''"]],
    notifications: [["entity_type", "TEXT NOT NULL DEFAULT ''"], ["entity_id", "INTEGER"], ["link_url", "TEXT NOT NULL DEFAULT ''"]]
  };
  for (const [table, additions] of Object.entries(columns)) {
    const present = new Set(db.prepare('PRAGMA table_info(' + table + ')').all().map(c => c.name));
    for (const [name, definition] of additions) if (!present.has(name)) db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + name + ' ' + definition);
  }
  db.prepare(`INSERT INTO events(title,description,location,starts_at,ends_at,mode,organizer,status,source_url)
    SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM events WHERE lower(title)=lower(?))`)
    .run(
      'MU CSE FEST 2026',
      'A four-day CSE festival at Metropolitan University, Sylhet. Visit the official website for the full program and registration details.',
      'Metropolitan University, Sylhet',
      '2026-12-03T00:00:00',
      '2026-12-06T23:59:59',
      'offline',
      'MU CSE FEST 2026',
      'published',
      'https://www.mucsefest.com/',
      'MU CSE FEST 2026',
    );
  db.exec([
    "CREATE TABLE IF NOT EXISTS education_entries(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,institution TEXT NOT NULL,degree TEXT NOT NULL DEFAULT '',field TEXT NOT NULL DEFAULT '',start_year INTEGER,end_year INTEGER,description TEXT NOT NULL DEFAULT '',university_id INTEGER REFERENCES universities(id),achievements TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS work_experience(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,company TEXT NOT NULL,title TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',start_date TEXT,end_date TEXT,is_current INTEGER NOT NULL DEFAULT 0,description TEXT NOT NULL DEFAULT '',employment_type TEXT NOT NULL DEFAULT '',achievements TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS profile_projects(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',url TEXT NOT NULL DEFAULT '',technologies TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',github_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS profile_certifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,issuer TEXT NOT NULL DEFAULT '',issued_year INTEGER,credential_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS conversations(id INTEGER PRIMARY KEY AUTOINCREMENT,user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_a,user_b),CHECK(user_a<user_b))",
    "CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,read_at TEXT)",
    "CREATE TABLE IF NOT EXISTS user_blocks(id INTEGER PRIMARY KEY AUTOINCREMENT,blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(blocker_id,blocked_id),CHECK(blocker_id!=blocked_id))",
    "CREATE TABLE IF NOT EXISTS content_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,target_type TEXT NOT NULL CHECK(target_type IN ('user','post','comment')),target_id INTEGER NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','dismissed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS university_departments(university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,PRIMARY KEY(university_id,department_id))",
    "CREATE TABLE IF NOT EXISTS saved_jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,job_id))",
    "CREATE TABLE IF NOT EXISTS community_posts(id INTEGER PRIMARY KEY AUTOINCREMENT,author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,image_url TEXT NOT NULL DEFAULT '',visibility TEXT NOT NULL DEFAULT 'community' CHECK(visibility IN ('community','connections')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS community_groups(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,description TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT 'Interest',department TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS group_memberships(group_id INTEGER NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(group_id,user_id))",
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
  const ensureColumn=(table,name,definition)=>{const present=new Set(db.prepare('PRAGMA table_info('+table+')').all().map(c=>c.name));if(!present.has(name))db.exec('ALTER TABLE '+table+' ADD COLUMN '+name+' '+definition);};
  ensureColumn('university_departments','confirmation_status',"TEXT NOT NULL DEFAULT 'unverified'");
  ensureColumn('university_departments','source_url',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('university_departments','confirmed_at','TEXT');
  ensureColumn('education_entries','university_id','INTEGER REFERENCES universities(id)');
  ensureColumn('education_entries','achievements',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('work_experience','employment_type',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('work_experience','achievements',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('profile_projects','technologies',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('profile_projects','image_url',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('profile_projects','github_url',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('community_posts','group_id','INTEGER REFERENCES community_groups(id)');
  const addCommunityGroup=db.prepare('INSERT OR IGNORE INTO community_groups(name,description,category,department) VALUES(?,?,?,?)');
  for(const group of [
    ['Technology & Product','Discuss software, product design, data, and new technologies.','Interest',''],
    ['Business & Entrepreneurship','Share business insights, startup lessons, and leadership experience.','Interest','Business Administration (BBA)'],
    ['Engineering Network','Connect across engineering disciplines and talk through real projects.','Department',''],
    ['Career & Interview Prep','Exchange CV feedback, interview practice, and job search advice.','Career',''],
    ['Research & Higher Studies','Compare research paths, graduate study, and academic opportunities.','Interest',''],
    ['Dhaka Alumni Circle','Meet alumni in Dhaka and share local events and opportunities.','Location',''],
    ['Chattogram Alumni Circle','Connect with alumni around Chattogram and nearby districts.','Location',''],
    ['Mentorship Exchange','Offer guidance, ask questions, and learn from peer experience.','Career','']
  ])addCommunityGroup.run(...group);
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_university ON users(university_id,role,graduation_year)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_education_university ON education_entries(university_id,user_id)');
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
  const demoUniversities=[
    ['Northbridge Demo University','Fictional sample institution used only in the local demo.'],
    ['Rivermark Demo Institute','Fictional sample institution used only in the local demo.'],
    ['Lakeside Demo College','Fictional sample institution used only in the local demo.']
  ];
  const addUniversity=db.prepare('INSERT OR IGNORE INTO universities(name,description,active) VALUES(?,?,1)');
  for(const u of demoUniversities)addUniversity.run(...u);
  const universityId=name=>db.prepare('SELECT id FROM universities WHERE name=?').get(name).id;
  const affiliations=[
    ['maliha.alumni@example.edu','Northbridge Demo University'],['ayesha.alumni@example.edu','Northbridge Demo University'],['samira.alumni@example.edu','Northbridge Demo University'],
    ['rafi.alumni@example.edu','Rivermark Demo Institute'],['tanjim.alumni@example.edu','Rivermark Demo Institute'],['imran.alumni@example.edu','Lakeside Demo College']
  ];
  const assignUniversity=db.prepare("UPDATE users SET university_id=? WHERE email=? AND source_type='fictional_demo' AND university_id IS NULL");
  for(const [email,name] of affiliations)assignUniversity.run(universityId(name),email);
  if(!db.prepare("SELECT 1 FROM app_settings WHERE key='demo_featured_seeded'").get() && db.prepare("SELECT COUNT(*) AS n FROM users WHERE email IN ('maliha.alumni@example.edu','ayesha.alumni@example.edu')").get().n>0){db.prepare("UPDATE users SET is_featured=1 WHERE email IN ('maliha.alumni@example.edu','ayesha.alumni@example.edu')").run();db.prepare("INSERT INTO app_settings(key,value) VALUES('demo_featured_seeded','1')").run();}
  const fixEducation=db.prepare("UPDATE education_entries SET institution=?,university_id=? WHERE user_id=(SELECT id FROM users WHERE email=?) AND (university_id IS NULL OR institution='AlumniConnect Demo University')");
  for(const [email,name] of affiliations)fixEducation.run(name,universityId(name),email);
  const universityDepartments=db.prepare('INSERT OR IGNORE INTO university_departments(university_id,department_id) SELECT ?,id FROM departments WHERE name=?');
  const departmentAssignments=[
    ['Northbridge Demo University','Computer Science & Engineering (CSE)'],['Northbridge Demo University','Business Administration (BBA)'],['Northbridge Demo University','Data Science'],['Northbridge Demo University','English'],
    ['Rivermark Demo Institute','Electrical & Electronic Engineering (EEE)'],['Rivermark Demo Institute','Software Engineering'],['Rivermark Demo Institute','Civil Engineering'],['Rivermark Demo Institute','Information Technology'],
    ['Lakeside Demo College','English'],['Lakeside Demo College','Economics'],['Lakeside Demo College','Law / LLB'],['Lakeside Demo College','Journalism & Media Studies']
  ];
  for(const [university,department] of departmentAssignments)universityDepartments.run(universityId(university),department);

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
  const demoDirectoryData = [
    ['maliha.alumni@example.edu','Product Designer building thoughtful digital experiences','Technology','Dhaka','Bangladesh','Dhaka, Bangladesh',1,'Product design, career transitions','Product design and mentorship',0],
    ['rafi.alumni@example.edu','Systems Engineer focused on connected devices','Engineering','Dhaka','Bangladesh','Dhaka, Bangladesh',1,'Embedded systems, IoT','Engineering leadership',1],
    ['ayesha.alumni@example.edu','Analytics Lead turning data into useful products','Data & Analytics','Dhaka','Bangladesh','Dhaka, Bangladesh',0,'','Responsible data products',1],
    ['imran.alumni@example.edu','Content Strategy Lead working across media and storytelling','Media & Communications','Dhaka','Bangladesh','Dhaka, Bangladesh',0,'','Editorial strategy and communications',0],
    ['tanjim.alumni@example.edu','Senior Software Engineer building cloud services','Technology','Chattogram','Bangladesh','Chattogram, Bangladesh',0,'','Cloud engineering and reliability',0]
  ];
  const enrichDemo=db.prepare("UPDATE users SET headline=?,industry=?,city=?,country=?,location=?,mentorship_available=?,mentorship_areas=?,career_interests=?,currently_hiring=? WHERE email=? AND source_type='fictional_demo' AND coalesce(headline,'')=''");
  for(const [email,headline,industry,city,country,location,mentor,areas,interests,hiring] of demoDirectoryData)enrichDemo.run(headline,industry,city,country,location,mentor,areas,interests,hiring,email);

  const demoPortraits = [
    ['maliha.alumni@example.edu','photo-1494790108377-be9c29b29330'],
    ['rafi.alumni@example.edu','photo-1500648767791-00dcc994a43e'],
    ['ayesha.alumni@example.edu','photo-1534528741775-53994a69daeb'],
    ['imran.alumni@example.edu','photo-1506794778202-cad84cf45f1d'],
    ['tanjim.alumni@example.edu','photo-1507003211169-0a1dd7228f2d']
  ];
  const setPortrait=db.prepare("UPDATE users SET profile_photo_url=? WHERE email=? AND source_type='fictional_demo' AND coalesce(profile_photo_url,'')=''");
  for(const [email,id] of demoPortraits)setPortrait.run('https://images.unsplash.com/'+id+'?auto=format&fit=crop&w=640&h=640&q=90',email);

  require("./demo-directory")(db);

  // Public alum profile added by the site administrator.
  const metUniversity=db.prepare("SELECT id FROM universities WHERE name='Metropolitan University'").get();
  if(metUniversity){
    const profileEmail='nafiul.adnan.chowdhury@alumniconnect.invalid';
    const nafiulSkills='Security Software Engineering, DSA & Algorithm Expert, Technical Interview Mentoring, Azure Cloud, Host Attestation Security, Backend Engineering, Site Reliability Engineering, Full-Stack Software Engineering';
    const nafiulBio='Security Software Engineer at Microsoft in Dublin, working on Azure Cloud host attestation security to help ensure world-class reliability and security for millions of machine connections. Passionate about mentoring engineers in technical interview preparation and helping candidates succeed in their careers.';
    const existing=db.prepare('SELECT id FROM users WHERE email=?').get(profileEmail);
    if(existing){
      db.prepare("UPDATE users SET name=?,role='alumni',department='Computer Science & Engineering (CSE)',graduation_year=NULL,degree='',skills=?,company='Microsoft',job_title='Security Software Engineer',bio=?,linkedin_url=?,verification_status='verified',source_type='admin_added',source_url=?,headline='Security Software Engineer',profile_photo_url=?,profile_visibility='public',university_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run('Nafiul Adnan Chowdhury',nafiulSkills,nafiulBio,'https://www.linkedin.com/in/nafiul-adnan','https://www.linkedin.com/in/nafiul-adnan','/uploads/alumni/nafiul-adnan-chowdhury-crop.svg',metUniversity.id,existing.id);
    }else{
      const passwordHash=require('bcryptjs').hashSync(require('crypto').randomBytes(32).toString('hex'),10);
      const inserted=db.prepare("INSERT INTO users(name,email,password_hash,role,department,graduation_year,degree,skills,company,job_title,bio,linkedin_url,verification_status,verified_at,source_url,source_type,image_source_url,image_license_or_permission,headline,profile_photo_url,profile_visibility,university_id) VALUES(?,?,?,'alumni','Computer Science & Engineering (CSE)',NULL,'',?,'Microsoft','Security Software Engineer',?,?, 'verified',CURRENT_TIMESTAMP,?,'admin_added','User-provided image','Provided for profile display by the site administrator','Security Software Engineer',?,'public',?)").run('Nafiul Adnan Chowdhury',profileEmail,passwordHash,nafiulSkills,nafiulBio,'https://www.linkedin.com/in/nafiul-adnan','https://www.linkedin.com/in/nafiul-adnan','/uploads/alumni/nafiul-adnan-chowdhury-crop.svg',metUniversity.id);
      var nafiulProfileId=inserted.lastInsertRowid;
    }
    const nafiulId=existing?.id||nafiulProfileId;
    db.prepare("INSERT INTO education_entries(user_id,institution,degree,field,start_year,end_year,description,university_id,achievements) SELECT ?, 'Metropolitan University','Graduate','Computer Science & Engineering (CSE)',NULL,NULL,'',?,'Graduate' WHERE NOT EXISTS(SELECT 1 FROM education_entries WHERE user_id=? AND university_id=? AND field='Computer Science & Engineering (CSE)')").run(nafiulId,metUniversity.id,nafiulId,metUniversity.id);
    const microsoftRole=db.prepare("SELECT id FROM work_experience WHERE user_id=? AND company='Microsoft' AND title='Security Software Engineer'").get(nafiulId);
    const microsoftDescription='Working on Azure Cloud host attestation security, ensuring world-class reliability and security for millions of machine connections.';
    if(microsoftRole)db.prepare("UPDATE work_experience SET location='Dublin, Ireland',is_current=1,description=?,employment_type='Full-time' WHERE id=?").run(microsoftDescription,microsoftRole.id);
    else db.prepare("INSERT INTO work_experience(user_id,company,title,location,start_date,end_date,is_current,description,employment_type,achievements) VALUES(?,'Microsoft','Security Software Engineer','Dublin, Ireland',NULL,NULL,1,?,'Full-time','')").run(nafiulId,microsoftDescription);
    const previousRoles=[['Enosis Solutions','Full-Stack Software Engineer'],['Google','Site Reliability Engineer'],['Workday','Backend Software Engineer']];
    const addPreviousRole=db.prepare("INSERT INTO work_experience(user_id,company,title,location,start_date,end_date,is_current,description,employment_type,achievements) SELECT ?,?,?,'',NULL,NULL,0,'','','' WHERE NOT EXISTS(SELECT 1 FROM work_experience WHERE user_id=? AND company=? AND title=?)");
    for(const [company,title] of previousRoles)addPreviousRole.run(nafiulId,company,title,nafiulId,company,title);

    const emrulEmail='emrul.chowdhury@alumniconnect.invalid';
    const emrulSkills='DSA & Algorithms, Competitive Programming, Java, Python, Kotlin, AWS, Microservices, Distributed Systems, Scalable Backend Systems';
    const emrulBio='Software Development Engineer at Amazon with 5+ years of experience building scalable backend systems. He specializes in Java, Python, Kotlin, AWS, microservices, and distributed systems. A passionate competitive programmer, he has solved 4,500+ problems and achieved 13th place in national programming contests.';
    const existingEmrul=db.prepare('SELECT id FROM users WHERE email=?').get(emrulEmail);
    if(existingEmrul){
      db.prepare("UPDATE users SET name='Emrul Chowdhury',role='alumni',department='Computer Science & Engineering (CSE)',graduation_year=NULL,degree='',skills=?,company='Amazon',job_title='Software Development Engineer',bio=?,linkedin_url='',verification_status='verified',source_type='admin_added',source_url='',headline='Software Development Engineer',profile_photo_url='/uploads/alumni/emrul-chowdhury-crop.svg',profile_visibility='public',university_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(emrulSkills,emrulBio,metUniversity.id,existingEmrul.id);
    }else{
      const emrulPasswordHash=require('bcryptjs').hashSync(require('crypto').randomBytes(32).toString('hex'),10);
      var emrulInserted=db.prepare("INSERT INTO users(name,email,password_hash,role,department,graduation_year,degree,skills,company,job_title,bio,linkedin_url,verification_status,verified_at,source_url,source_type,image_source_url,image_license_or_permission,headline,profile_photo_url,profile_visibility,university_id) VALUES(? ,? ,? ,'alumni','Computer Science & Engineering (CSE)',NULL,'',?,'Amazon','Software Development Engineer',?,'','verified',CURRENT_TIMESTAMP,'','admin_added','User-provided image','Provided for profile display by the site administrator','Software Development Engineer','/uploads/alumni/emrul-chowdhury-crop.svg','public',?)").run('Emrul Chowdhury',emrulEmail,emrulPasswordHash,emrulSkills,emrulBio,metUniversity.id);
    }
    const emrulId=existingEmrul?.id||emrulInserted.lastInsertRowid;
    db.prepare("UPDATE users SET website_url='https://emrul.ch/' WHERE id=?").run(emrulId);
    db.prepare("INSERT INTO education_entries(user_id,institution,degree,field,start_year,end_year,description,university_id,achievements) SELECT ?, 'Metropolitan University','Degree','Computer Science & Engineering (CSE)',NULL,NULL,'Degree in Computer Science & Engineering from Metropolitan University.',?,'CSE' WHERE NOT EXISTS(SELECT 1 FROM education_entries WHERE user_id=? AND university_id=? AND field='Computer Science & Engineering (CSE)')").run(emrulId,metUniversity.id,emrulId,metUniversity.id);
    const amazonRole=db.prepare("SELECT id FROM work_experience WHERE user_id=? AND company='Amazon' AND title='Software Development Engineer'").get(emrulId);
    const amazonDescription='5+ years of experience building scalable backend systems. Specializes in Java, Python, Kotlin, AWS, microservices, and distributed systems.';
    if(amazonRole)db.prepare("UPDATE work_experience SET is_current=1,description=? WHERE id=?").run(amazonDescription,amazonRole.id);
    else db.prepare("INSERT INTO work_experience(user_id,company,title,location,start_date,end_date,is_current,description,employment_type,achievements) VALUES(?,'Amazon','Software Development Engineer','',NULL,NULL,1,?,'','')").run(emrulId,amazonDescription);

    const jakariaEmail='abu.jafar.md.jakaria@alumniconnect.invalid';
    const jakariaHeadline='Senior Full-Stack Product Engineer | Founder, Progsity & BWJ Tech Ltd. | ERP · EdTech SaaS · LMS | React · Next.js · Node · TypeScript | Senior Lecturer (CSE)';
    const jakariaSkills='Full-Stack Product Engineering, React, Next.js, Node.js, TypeScript, ERP Systems, EdTech SaaS, LMS, AWS, Algorithms, Data Structures, Software Engineering, Product Development, Startup Leadership, Higher Education Teaching';
    const jakariaBio='Senior Full-Stack Product Engineer and founder of Progsity and BWJ Tech Ltd., building ERP, EdTech SaaS, and LMS products. Senior Lecturer in Computer Science & Engineering at Metropolitan University Bangladesh. Focuses on React, Next.js, Node.js, and TypeScript.';
    const existingJakaria=db.prepare('SELECT id FROM users WHERE email=?').get(jakariaEmail);
    if(existingJakaria){
      db.prepare("UPDATE users SET name='Abu Jafar Md Jakaria',role='alumni',department='Computer Science & Engineering (CSE)',graduation_year=NULL,degree='',skills=?,company='Metropolitan University Bangladesh',job_title='Senior Lecturer, Department of Computer Science & Engineering',bio=?,linkedin_url='https://www.linkedin.com/in/ajmjakaria/',verification_status='verified',source_type='admin_added',source_url='https://www.linkedin.com/in/ajmjakaria/',headline=?,profile_photo_url='/uploads/alumni/abu-jafar-md-jakaria-crop.svg',profile_visibility='public',university_id=?,city='Sylhet',country='Bangladesh',location='Sylhet, Bangladesh',industry='Software Development & Higher Education',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(jakariaSkills,jakariaBio,jakariaHeadline,metUniversity.id,existingJakaria.id);
    }else{
      const jakariaPasswordHash=require('bcryptjs').hashSync(require('crypto').randomBytes(32).toString('hex'),10);
      var jakariaInserted=db.prepare("INSERT INTO users(name,email,password_hash,role,department,graduation_year,degree,skills,company,job_title,bio,linkedin_url,verification_status,verified_at,source_url,source_type,image_source_url,image_license_or_permission,headline,profile_photo_url,profile_visibility,university_id,city,country,location,industry) VALUES(? ,? ,? ,'alumni','Computer Science & Engineering (CSE)',NULL,'',?,'Metropolitan University Bangladesh','Senior Lecturer, Department of Computer Science & Engineering',?,?,'verified',CURRENT_TIMESTAMP,?,'admin_added','User-provided image','Provided for profile display by the site administrator',?,'/uploads/alumni/abu-jafar-md-jakaria-crop.svg','public',?,'Sylhet','Bangladesh','Sylhet, Bangladesh','Software Development & Higher Education')").run('Abu Jafar Md Jakaria',jakariaEmail,jakariaPasswordHash,jakariaSkills,jakariaBio,'https://www.linkedin.com/in/ajmjakaria/','https://www.linkedin.com/in/ajmjakaria/',jakariaHeadline,metUniversity.id);
    }
    const jakariaId=existingJakaria?.id||jakariaInserted.lastInsertRowid;
    const jakariaRoles=[
      ['Metropolitan University Bangladesh','Senior Lecturer, Department of Computer Science & Engineering','2025-02',null,1,'Teaches Algorithm Design & Analysis and Software Engineering & Design Patterns; evaluates student code and projects, supervises student research, and contributes to program review and departmental planning.'],
      ['Metropolitan University Bangladesh','Lecturer','2023-02','2025-01',0,'Lecturer in Computer Science & Engineering.'],
      ['BWJ Tech Ltd','Founder','2024-01',null,1,'Founded a custom software development company delivering education-management, ERP, and software systems.'],
      ['Progsity.io','Founder & CEO','2022-12',null,1,'Leads an EdTech platform for programming education in Bangladesh, with practical courses in C, C++, and Data Structures & Algorithms. Sole engineer of the platform, building course, quiz, online judge, coding, video, and payment features.'],
      ['DesnDev Tech','Founder & Lead Software Engineer','2022-06','2023-01',0,'Built MERN-stack software solutions, including a Union Parishad service and a hotel management system deployed on AWS.'],
      ['ShohozDeal Ltd.','Co-Founder & CEO','2020-11','2022-05',0,'Led product and software development for a digital services and e-commerce startup.']
    ];
    const addJakariaRole=db.prepare("INSERT INTO work_experience(user_id,company,title,location,start_date,end_date,is_current,description,employment_type,achievements) SELECT ?,?,?,?,?,?,?,?,'','' WHERE NOT EXISTS(SELECT 1 FROM work_experience WHERE user_id=? AND company=? AND title=?)");
    const updateJakariaRole=db.prepare("UPDATE work_experience SET location=?,start_date=?,end_date=?,is_current=?,description=? WHERE user_id=? AND company=? AND title=?");
    for(const [company,title,startDate,endDate,current,description] of jakariaRoles){
      const role=db.prepare('SELECT id FROM work_experience WHERE user_id=? AND company=? AND title=?').get(jakariaId,company,title);
      if(role)updateJakariaRole.run(company==='Metropolitan University Bangladesh'?'Sylhet, Bangladesh':company==='Progsity.io'?'Remote':'',startDate,endDate,current,description,jakariaId,company,title);
      else addJakariaRole.run(jakariaId,company,title,company==='Metropolitan University Bangladesh'?'Sylhet, Bangladesh':company==='Progsity.io'?'Remote':'',startDate,endDate,current,description,jakariaId,company,title);
    }
  }
};
