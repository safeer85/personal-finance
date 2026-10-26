import Dashboard from './dashboard';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { logout } from './login/actions';

// Share one date between server rendering and the first browser render.
export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!(await auth())?.user) redirect('/login');
  return <><form action={logout} className="logout-form"><button>Sign out</button></form><Dashboard initialDate={new Date().toISOString().slice(0, 10)} /></>;
}
