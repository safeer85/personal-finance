import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LoginForm from './form';
export const dynamic = 'force-dynamic';
export default async function Login() {
  if ((await auth())?.user) redirect('/');
  return <main className="login-page"><section className="modal">
    <a className="brand" href="/">◈ pocket.</a>
    <h1>Your money. Your space.</h1><p>Sign in to your private finance tracker.</p>
    <LoginForm/>
  </section></main>;
}
