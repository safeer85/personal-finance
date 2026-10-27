const required=['DATABASE_URL','DIRECT_URL','AUTH_SECRET','OWNER_USERNAME','OWNER_PASSWORD_HASH'];
const missing=required.filter(key=>!process.env[key]);
if(missing.length)throw Error(`Set these hosting environment variables before deploying: ${missing.join(', ')}`);
if(process.env.AUTH_SECRET.length<32)throw Error('AUTH_SECRET must contain at least 32 characters.');
if(!/^\$2[aby]\$\d\d\$/.test(process.env.OWNER_PASSWORD_HASH))throw Error('OWNER_PASSWORD_HASH must be a bcrypt hash, not a plain password.');
for(const key of ['DATABASE_URL','DIRECT_URL']){
  const url=new URL(process.env[key]);
  if(!['postgres:','postgresql:'].includes(url.protocol))throw Error(`${key} must be a PostgreSQL URL.`);
  if(['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname))throw Error(`${key} must point to a hosted database, not this computer.`);
  if(url.searchParams.get('sslmode')!=='require')throw Error(`${key} must include sslmode=require.`);
}
if(process.env.VERCEL_ENV==='preview')throw Error('Preview deployments are disabled to protect your production finance database. Use a separate database and owner credentials before enabling previews.');
console.log('Hosting configuration validated.');
