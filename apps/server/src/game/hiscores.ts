// Hiscores: each player's level and XP in every skill and in total, kept as their save changes, and
// the ladders read from them: rank by level, then XP (the total level leads Total), ties to whoever
// got there first; banned players left out.
import { levelFor } from '@idle-clash/content';
import { allSkills, goalsOf, totalLevel } from '@idle-clash/features';
import type { HiscoreRow, Ladder } from '@idle-clash/contracts';
import { xpOf, type State } from '@idle-clash/kernel';
import { and, asc, desc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { hiscores, players } from '../db/schema.ts';

export const TOTAL = 'total';
export const LADDER_ROWS = 25;

export class Hiscores {
  private db: BetterSQLite3Database;
  constructor(db: BetterSQLite3Database) {
    this.db = db;
  }

  /** Records a save's levels: each skill, and the total (total level, all XP, milestones claimed). */
  update(playerId: string, state: State, at: number): void {
    const skills = allSkills();
    const entries = [
      ...skills.map((s) => ({
        skill: s,
        xp: Math.floor(xpOf(state, s)),
        level: levelFor(xpOf(state, s)),
        milestones: 0,
      })),
      {
        skill: TOTAL,
        xp: skills.reduce((n, s) => n + Math.floor(xpOf(state, s)), 0),
        level: totalLevel(state),
        milestones: goalsOf(state).milestones.length,
      },
    ];
    const had = new Map(
      this.db
        .select()
        .from(hiscores)
        .where(eq(hiscores.playerId, playerId))
        .all()
        .map((r) => [r.skill, r]),
    );
    for (const e of entries) {
      const old = had.get(e.skill);
      if (old && old.xp === e.xp && old.milestones === e.milestones) continue;
      if (!old && e.xp === 0) continue;
      this.db
        .insert(hiscores)
        .values({ playerId, ...e, reachedAt: at })
        .onConflictDoUpdate({
          target: [hiscores.playerId, hiscores.skill],
          set: { level: e.level, xp: e.xp, milestones: e.milestones, reachedAt: old?.xp === e.xp ? old.reachedAt : at },
        })
        .run();
    }
  }

  /** A ladder's entries (one player's, with `only`): XP above nothing, banned players left out. */
  private entries(skill: string, only?: string) {
    return this.db
      .select({
        name: players.name,
        level: hiscores.level,
        xp: hiscores.xp,
        milestones: hiscores.milestones,
        reachedAt: hiscores.reachedAt,
      })
      .from(hiscores)
      .innerJoin(players, eq(players.id, hiscores.playerId))
      .where(
        and(
          eq(hiscores.skill, skill),
          gt(hiscores.xp, 0),
          isNull(players.bannedAt),
          only ? eq(hiscores.playerId, only) : undefined,
        ),
      );
  }

  ladder(skill: string, playerId: string): Ladder {
    const top = this.entries(skill)
      .orderBy(desc(hiscores.level), desc(hiscores.xp), asc(hiscores.reachedAt))
      .limit(LADDER_ROWS)
      .all();
    const rows = top.map((r, i) => ({ rank: i + 1, name: r.name, level: r.level, xp: r.xp, milestones: r.milestones }));
    const mine = this.entries(skill, playerId).get();
    let you: HiscoreRow | null = null;
    if (mine) {
      const ahead = this.db
        .select({ n: sql<number>`count(*)` })
        .from(hiscores)
        .innerJoin(players, eq(players.id, hiscores.playerId))
        .where(
          and(
            eq(hiscores.skill, skill),
            isNull(players.bannedAt),
            or(
              gt(hiscores.level, mine.level),
              and(eq(hiscores.level, mine.level), gt(hiscores.xp, mine.xp)),
              and(
                eq(hiscores.level, mine.level),
                eq(hiscores.xp, mine.xp),
                sql`${hiscores.reachedAt} < ${mine.reachedAt}`,
              ),
            ),
          ),
        )
        .get();
      you = { rank: (ahead?.n ?? 0) + 1, name: mine.name, level: mine.level, xp: mine.xp, milestones: mine.milestones };
    }
    return { skill, rows, you };
  }

  remove(playerId: string): void {
    this.db.delete(hiscores).where(eq(hiscores.playerId, playerId)).run();
  }
}
