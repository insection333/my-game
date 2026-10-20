import { useEffect } from 'react';
import { useSession } from './game/hooks.ts';
import { boot } from './game/store.ts';
import { Hearth } from './pages/Hearth.tsx';
import { Skill } from './pages/Skill.tsx';
import { Skills } from './pages/Skills.tsx';
import { Combat, Hiscores, NotFound, Storehouse } from './pages/Simple.tsx';
import { Offline, Welcome } from './pages/Welcome.tsx';
import { replace, useLocation } from './router.ts';
import { Shell } from './shell/Shell.tsx';

function Page({ path }: { path: string }) {
  if (path === '/') return <Hearth />;
  if (path === '/skills') return <Skills />;
  const skill = /^\/skills\/([a-z0-9-]+)$/.exec(path);
  if (skill) return <Skill id={skill[1]} />;
  if (path === '/combat') return <Combat />;
  if (path === '/storehouse' || path === '/storehouse/log') return <Storehouse path={path} />;
  if (path === '/hiscores') return <Hiscores />;
  return <NotFound />;
}

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

  // Usable: the first real page has drawn and the fonts are in. Verify's speed budget waits for this.
  const settled = phase !== 'loading' && !redirect;
  useEffect(() => {
    if (!settled) return;
    requestAnimationFrame(() => {
      void document.fonts.ready.then(() => (document.documentElement.dataset.ready = 'true'));
    });
  }, [settled]);

  if (phase === 'loading' || redirect) return null;
  if (phase === 'offline') return <Offline retry={() => void boot()} />;
  if (phase === 'signedOut') return <Welcome path={path} next={next} />;
  return (
    <Shell>
      <Page path={path} />
    </Shell>
  );
}
