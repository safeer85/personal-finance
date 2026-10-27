import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import bcrypt from 'bcryptjs';

// Credentials stay in an ignored file and are never printed or put in CLI args.
let muted = false;
const output = new Writable({write(chunk,encoding,callback){if(!muted)process.stdout.write(chunk,encoding);callback();}});
const prompt = createInterface({input:process.stdin,output,terminal:true});
try {
  const generated = process.argv.includes('--generate');
  const username = generated ? 'owner' : (await prompt.question('Owner username [owner]: ')).trim() || 'owner';
  process.stdout.write('Choose a login password (12–72 characters, hidden): ');
  muted=true;
  const password=generated ? randomBytes(24).toString('base64url') : await prompt.question('');
  muted=false;
  process.stdout.write('\nConfirm password (hidden): ');
  muted=true;
  const confirmation=generated ? password : await prompt.question('');
  muted=false;
  process.stdout.write('\n');
  if(password!==confirmation)throw Error('Passwords do not match.');
  if(username.length>100 || password.length<12 || Buffer.byteLength(password)>72)throw Error('Use a username under 100 characters and a password of 12–72 bytes.');
  let env='';
  try{env=await readFile(new URL('../.env.local',import.meta.url),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
  const values={OWNER_USERNAME:username,OWNER_PASSWORD_HASH:await bcrypt.hash(password,12),AUTH_SECRET:randomBytes(32).toString('base64url'),AUTH_TRUST_HOST:'true'};
  if(generated && /^OWNER_PASSWORD_HASH=/m.test(env))throw Error('Owner already configured. Run without --generate to change credentials.');
  // Escape $ because Next's dotenv loader expands variable references.
  for(const [key,value] of Object.entries(values)){
    if(/[\r\n']/.test(value))throw Error('Unsupported character in username.');
    const line=`${key}='${value.replaceAll('$','\\$')}'`;
    const pattern=new RegExp(`^${key}=.*$`,'m');
    env=pattern.test(env)?env.replace(pattern,()=>line):`${env.trimEnd()}\n${line}\n`;
  }
  await writeFile(new URL('../.env.local',import.meta.url),env,{mode:0o600});
  if(generated){
    await mkdir(new URL('../.local/',import.meta.url),{recursive:true});
    await writeFile(new URL('../.local/owner-login.txt',import.meta.url),`Pocket owner login\nUsername: ${username}\nPassword: ${password}\n\nKeep this file private. Change the password with npm run auth:setup.\n`,{mode:0o600,flag:'wx'});
    console.log('Generated login saved privately to .local/owner-login.txt (excluded from Git and deployments).');
  }
  console.log('Owner login configured in .env.local. Restart the app. For Vercel, copy OWNER_USERNAME, OWNER_PASSWORD_HASH and AUTH_SECRET as environment variables; remove wrapping quotes and backslash escapes in the dashboard.');
} catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
finally{prompt.close();}
