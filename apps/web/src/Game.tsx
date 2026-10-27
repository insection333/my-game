// The game's part of the page: the shell and its pages. Loaded as its own file once a player is
// signed in, so the welcome page stays small.
import { Ready } from './Ready.tsx';
import { Hearth } from './pages/Hearth.tsx';
import { Skill } from './pages/Skill.tsx';
import { Skills } from './pages/Skills.tsx';
import { Combat } from './pages/Combat.tsx';
import { Expeditions, EXPEDITIONS_PATH } from './pages/Expeditions.tsx';
import { Admin } from './pages/Admin.tsx';
import { Hiscores } from './pages/Hiscores.tsx';
import { Deeds, DEEDS_PATH } from './pages/Deeds.tsx';
import { Legal, legalPage } from './pages/Legal.tsx';
import { NotFound, Storehouse } from './pages/Simple.tsx';
import { Shell } from './shell/Shell.tsx';

function Page({ path }: { path: string }) {
  if (path === '/') return <Hearth />;
  if (path === '/skills') return <Skills />;
  const skill = /^\/skills\/([a-z0-9-]+)$/.exec(path);
  if (skill) return <Skill id={skill[1]} />;
  if (path === '/combat') return <Combat />;
  if (path === EXPEDITIONS_PATH) return <Expeditions />;
  if (path === '/storehouse' || path === '/storehouse/log') return <Storehouse path={path} />;
  if (path === '/hiscores') return <Hiscores />;
  if (path === DEEDS_PATH) return <Deeds />;
  const legal = legalPage(path);
  if (legal) return <Legal page={legal} />;
  if (path === '/admin') return <Admin />;
  return <NotFound />;
}

export default function Game({ path }: { path: string }) {
  return (
    <Shell>
      <Page path={path} />
      <Ready />
    </Shell>
  );
}
