import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const command = new URL('./check-hosting-env.mjs', import.meta.url);
const valid = {
  DATABASE_URL:'postgresql://test:test@db-pooler.example.test/pocket?sslmode=require',
  DIRECT_URL:'postgresql://test:test@db.example.test/pocket?sslmode=require',
  OWNER_USERNAME:'owner',OWNER_PASSWORD_HASH:'$2b$12$'+'x'.repeat(53),AUTH_SECRET:'x'.repeat(43),VERCEL_ENV:'production',
};
function run(overrides={}){return spawnSync(process.execPath,[fileURLToPath(command)],{env:{...process.env,...valid,...overrides},encoding:'utf8'});}
test('production configuration accepts hosted PostgreSQL and owner credentials',()=>assert.equal(run().status,0));
test('missing credentials stop deployment',()=>assert.notEqual(run({AUTH_SECRET:''}).status,0));
test('local database URLs cannot be deployed',()=>assert.notEqual(run({DIRECT_URL:'postgresql://test:test@localhost/pocket?sslmode=require'}).status,0));
test('unencrypted connections cannot be deployed',()=>assert.notEqual(run({DATABASE_URL:'postgresql://test:test@db.example.test/pocket'}).status,0));
test('preview deployments cannot use the shared owner ledger',()=>assert.notEqual(run({VERCEL_ENV:'preview'}).status,0));
