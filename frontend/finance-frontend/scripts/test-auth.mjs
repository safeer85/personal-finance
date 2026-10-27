import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:3010';
const saved=await readFile(new URL('../.local/owner-login.txt',import.meta.url),'utf8');
const username=saved.match(/^Username: (.+)$/m)?.[1];
const password=saved.match(/^Password: (.+)$/m)?.[1];
assert(username&&password,'Generate a local test owner before running this check.');
let cookie='';
async function request(path,options={}){
  const response=await fetch(base+path,{redirect:'manual',...options,headers:{cookie,...options.headers}});
  for(const header of response.headers.getSetCookie()){
    const pair=header.split(';')[0], name=pair.split('=')[0];
    cookie=cookie.split('; ').filter(v=>v&&!v.startsWith(name+'=')).concat(pair).join('; ');
  }
  return response;
}
async function login(secret){
  const {csrfToken}=await(await request('/api/auth/csrf')).json();
  return request('/api/auth/callback/credentials',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',origin:base},body:new URLSearchParams({username,password:secret,csrfToken,callbackUrl:base})});
}
const page=await request('/');
assert.equal(page.status,307);
assert(page.headers.get('location').includes('/login'));
for(const method of ['GET','POST','DELETE']) assert.equal((await request('/api/records',{method})).status,401);
await login('incorrect-test-password');
assert.equal((await request('/api/records')).status,401);
await login(password);
assert.equal((await request('/api/records')).status,200);
const denied=await request('/api/records',{method:'POST',headers:{origin:'https://another.example','content-type':'application/json'},body:'{}'});
assert.equal(denied.status,403);
let created;
try{
  const response=await request('/api/records',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({kind:'income',name:'Temporary authenticated smoke test',category:'Verification',amount:12.34,date:new Date().toISOString().slice(0,10)})});
  assert.equal(response.status,201);
  created=await response.json();
  assert.equal(created.amount,1234);
  const list=await(await request('/api/records')).json();
  assert(list.some(record=>record.id===created.id));
}finally{
  if(created)assert.equal((await request('/api/records?id='+created.id,{method:'DELETE',headers:{origin:base}})).status,200);
}
const {csrfToken}=await(await request('/api/auth/csrf')).json();
await request('/api/auth/signout',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',origin:base},body:new URLSearchParams({csrfToken,callbackUrl:base+'/login'})});
assert.equal((await request('/api/records')).status,401);
console.log('PASS: access protection, invalid/valid login, cross-origin protection, authenticated record persistence, cleanup, and logout.');
