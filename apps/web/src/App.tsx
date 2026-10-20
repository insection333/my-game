import { useLocation } from './router.ts';
import { Hearth } from './pages/Hearth.tsx';
import { Skill } from './pages/Skill.tsx';
import { Skills } from './pages/Skills.tsx';
import { Combat, Hiscores, NotFound, Storehouse } from './pages/Simple.tsx';
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

export function App() {
  const { path } = useLocation();
  return (
    <Shell>
      <Page path={path} />
    </Shell>
  );
}
