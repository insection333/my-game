import { lazy, Suspense, useEffect } from 'react';
import { boot, useSession } from './game/session.ts';
import { Legal, legalPage } from './pages/Legal.tsx';
import { Offline, Welcome } from './pages/Welcome.tsx';
import { Ready } from './Ready.tsx';
import { replace, useLocation } from './router.ts';
import { playedHere, welcomeFor } from './welcome-path.ts';

const Game = lazy(() => import('./Game.tsx'));

const isWelcome = (path: string) => path === '/welcome' || path === '/welcome/sign-in';

export function App() {
  const { path, next } = useLocation();
  const { phase } = useSession();

  // Not signed in: every address leads to the welcome page, which returns there afterwards.
  // Signed in: the welcome page leads on to where the player was going.
  const redirect =
    phase === 'signedOut' && !isWelcome(path) && !legalPage(path)
      ? welcomeFor(location.pathname, location.search, playedHere())
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
  const legal = legalPage(path);
  if (phase === 'signedOut' && legal)
    return (
      <>
        <Legal page={legal} back="/welcome" standalone />
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
