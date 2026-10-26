'use client';
import { useActionState } from 'react';
import { login } from './actions';
export default function LoginForm() {
  const [error,action,pending]=useActionState(login,undefined);
  return <form action={action}>
    <label>Username<input name="username" autoComplete="username" required maxLength={100}/></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={72}/></label>
    {error&&<div role="alert" className="error">{error}</div>}
    <button className="primary" disabled={pending}>{pending?'Signing in…':'Sign in'}</button>
  </form>;
}
