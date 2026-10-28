const departmentAliases={
  cse:['Computer Science & Engineering (CSE)','Computer Science','Computer Science and Engineering','CSE'],
  eee:['Electrical & Electronic Engineering (EEE)','Electrical Engineering','Electrical and Electronic Engineering','EEE'],
  bba:['Business Administration (BBA)','Business Administration','BBA'],
  llb:['Law / LLB','Law','LLB']
};
const searchable=['name','department','degree','skills','company','job_title','industry','city','country','location','headline','bio'];
const contains=(value,needle)=>String(value||'').toLocaleLowerCase().includes(String(needle||'').toLocaleLowerCase());
function matches(u,query={}){
  const department=String(query.department||'');
  const alias=departmentAliases[department.toLowerCase()];
  if(department && !(alias?alias.some(x=>contains(u.department,x)):contains(u.department,department)))return false;
  const exactYear=query.graduation_year;
  if(exactYear&&String(u.graduation_year)!==String(exactYear))return false;
  const from=query.graduation_from||query.year_from, to=query.graduation_to||query.year_to;
  if(from&&Number(u.graduation_year)<Number(from))return false;
  if(to&&Number(u.graduation_year)>Number(to))return false;
  for(const [key,column] of [['degree','degree'],['company','company'],['skill','skills'],['skills','skills'],['industry','industry'],['city','city'],['country','country'],['profession','job_title'],['job_title','job_title']])if(query[key]&&!contains(u[column],query[key]))return false;
  if(query.mentorship_available==='1'||query.mentorship_available==='true')if(!u.mentorship_available)return false;
  if(query.currently_hiring==='1'||query.currently_hiring==='true')if(!u.currently_hiring)return false;
  if(query.verified==='1'||query.verified==='true')if(u.verification_status!=='verified')return false;
  if(query.q&&!searchable.some(k=>contains(u[k],query.q)))return false;
  return true;
}
const strategies={department:(u,v)=>matches(u,{department:v}),graduation_year:(u,v)=>String(u.graduation_year)===String(v),company:(u,v)=>contains(u.company,v),skill:(u,v)=>contains(u.skills,v),q:(u,v)=>searchable.some(k=>contains(u[k],v))};
function searchAlumni(db,query={}){
  const all=db.prepare("SELECT * FROM users WHERE role='alumni' AND verification_status='verified' AND suspended=0 ORDER BY name").all();
  return all.filter(u=>matches(u,query));
}
function whereFor(query={}){
  const where=["role='alumni'","verification_status='verified'","suspended=0"];
  const params=[];
  if(Number(query.viewer_id)>0){where.push("(profile_visibility='public' OR (profile_visibility='connections' AND EXISTS(SELECT 1 FROM connections c WHERE c.status='accepted' AND min(c.requester_id,c.recipient_id)=min(users.id,?) AND max(c.requester_id,c.recipient_id)=max(users.id,?))))");params.push(Number(query.viewer_id),Number(query.viewer_id));}else{where.push("profile_visibility='public'");}
  const text=(column,value)=>{if(value!==undefined&&value!==null&&String(value).trim()){where.push("instr(lower(coalesce("+column+",'')),lower(?))>0");params.push(String(value).trim());}};
  if(query.department){const alias=departmentAliases[String(query.department).toLowerCase()];if(alias){where.push('('+alias.map(()=>"instr(lower(coalesce(department,'')),lower(?))>0").join(' OR ')+')');params.push(...alias);}else text('department',query.department);}
  for(const [key,column] of [['degree','degree'],['company','company'],['skill','skills'],['skills','skills'],['industry','industry'],['city','city'],['country','country'],['profession','job_title'],['job_title','job_title']])text(column,query[key]);
  if(query.graduation_year){where.push('graduation_year=?');params.push(Number(query.graduation_year));}
  const from=query.graduation_from||query.year_from,to=query.graduation_to||query.year_to;
  if(from){where.push('graduation_year>=?');params.push(Number(from));}
  if(to){where.push('graduation_year<=?');params.push(Number(to));}
  if(query.mentorship_available==='1'||query.mentorship_available==='true')where.push('mentorship_available=1');
  if(query.currently_hiring==='1'||query.currently_hiring==='true')where.push('currently_hiring=1');
  if(query.verified==='1'||query.verified==='true')where.push("verification_status='verified'");
  if(query.q){const cols=['name','department','degree','skills','company','job_title','industry','city','country','headline','bio'];where.push('('+cols.map(c=>"instr(lower(coalesce("+c+",'')),lower(?))>0").join(' OR ')+')');params.push(...cols.map(()=>String(query.q).trim()));}
  return {sql:where.join(' AND '),params};
}
function searchAlumniPage(db,query={}){
  const page=Math.max(1,Math.floor(Number(query.page)||1)),limit=Math.min(50,Math.max(1,Math.floor(Number(query.limit)||12)));
  const {sql,params}=whereFor(query);
  const total=db.prepare('SELECT COUNT(*) AS n FROM users WHERE '+sql).get(...params).n;
  const items=db.prepare('SELECT * FROM users WHERE '+sql+' ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?').all(...params,limit,(page-1)*limit);
  return {items,total,page,limit};
}
module.exports={searchAlumni,searchAlumniPage,strategies,departmentAliases};
