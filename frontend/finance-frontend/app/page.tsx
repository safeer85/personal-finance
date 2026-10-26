import Dashboard from './dashboard';

// Share one date between server rendering and the first browser render.
export const dynamic = 'force-dynamic';

export default function Home() {
  return <Dashboard initialDate={new Date().toISOString().slice(0, 10)} />;
}
