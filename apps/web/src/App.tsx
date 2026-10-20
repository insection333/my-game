import { lazy, Suspense, useEffect } from 'react';
import { boot, useSession } from './game/session.ts';
import { Offline, Welcome } from './pages/Welcome.tsx';
import { Ready } from './Ready.tsx';
import { replace, useLocation } from './router.ts';

const Game = lazy(() => import('./Game.tsx'));

const isWelcome = (path: string) => path === '/welcome' || path === '/welcome/sign-in';

export function App() {
  const { path, next } = useLocation();
  const { phase } = useSession();

  // Not signed in: every address leads to the welcome page, which returns there afterwards.
  // Signed in: the welcome page leads on to where the player was going.
  const redirect =
    phase === 'signedOut' && !isWelcome(path)
      ? `/welcome${path === '/' ? '' : `?next=${encodeURIComponent(location.pathname + location.search)}`}`
      : phase === 'playing' && isWelcome(path)
        ? next
        : null;
  useEffect(() => {
    if (redirect) replace(redirect);
  }, [redirect]);

  if (phase === 'loading' || redirect) return null;
  if (phase === 'offline')
    return (
      <>
        <Offline retry={() => void boot()} />
        <Ready />
      </>
    );
  if (phase === 'signedOut')
    return (
      <>
        <Welcome path={path} next={next} />
        <Ready />
      </>
    );
  return (
    <Suspense fallback={null}>
      <Game path={path} />
    </Suspense>
  );
}
