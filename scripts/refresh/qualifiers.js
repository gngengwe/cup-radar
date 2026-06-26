// Resolves group-stage qualifiers into bracket.json's knockout placeholders
// ("Winner Group A", "Runner-up Group A", "3rd (B/C/D)") as soon as each
// piece of information becomes certain. Winner/runner-up resolve as soon as
// their single group finishes; the 8 best third-place teams can only be
// ranked once all 12 groups have finished (it's a cross-group comparison).
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { computeGroupStandings } from '../../src/utils/standings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

const GROUP_MATCH_COUNT = 6; // 4 teams, round robin
const PLACEHOLDER_RE = /^(Winner Group [A-L]|Runner-up Group [A-L]|3rd \([A-L](?:\/[A-L])*\))$/;

function rank(teams) {
  return [...teams].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}

export async function refreshQualifiers() {
  console.log('[qualifiers] resolving group-stage qualifiers into bracket slots…');

  const summary = { vertical: 'qualifiers', applied: [], pending: [], flags: [] };

  const matchFile   = join(DATA, 'matches.json');
  const bracketFile = join(DATA, 'bracket.json');
  const groupsFile  = join(DATA, 'groups.json');

  const matchesDoc = JSON.parse(readFileSync(matchFile, 'utf8'));
  const bracket     = JSON.parse(readFileSync(bracketFile, 'utf8'));
  const groupsData  = JSON.parse(readFileSync(groupsFile, 'utf8'));

  const standings = computeGroupStandings(groupsData, matchesDoc.matches);

  const groupInfo = {};
  for (const group of standings) {
    const playedCount = matchesDoc.matches.filter(
      m => m.group === group.id && m.stage === 'Group Stage' && m.status === 'finished'
    ).length;
    groupInfo[group.id] = { complete: playedCount === GROUP_MATCH_COUNT, ranked: rank(group.teams) };
  }

  const allComplete = Object.values(groupInfo).every(g => g.complete);
  const bestThirdByGroup = {};
  if (allComplete) {
    const thirds = Object.entries(groupInfo).map(([id, g]) => ({ groupId: id, team: g.ranked[2] }));
    thirds.sort((a, b) => b.team.points - a.team.points || b.team.gd - a.team.gd || b.team.gf - a.team.gf);
    for (const t of thirds.slice(0, 8)) bestThirdByGroup[t.groupId] = t.team;
  }

  function resolve(text) {
    const winner = text.match(/^Winner Group ([A-L])$/);
    if (winner) {
      const g = groupInfo[winner[1]];
      return { team: g?.complete ? g.ranked[0] : null, reason: null };
    }
    const runner = text.match(/^Runner-up Group ([A-L])$/);
    if (runner) {
      const g = groupInfo[runner[1]];
      return { team: g?.complete ? g.ranked[1] : null, reason: null };
    }
    const third = text.match(/^3rd \(([A-L](?:\/[A-L])*)\)$/);
    if (third) {
      if (!allComplete) return { team: null, reason: null };
      const candidates = third[1].split('/');
      const qualified = candidates.filter(g => bestThirdByGroup[g]);
      if (qualified.length === 1) return { team: bestThirdByGroup[qualified[0]], reason: null };
      if (qualified.length === 0) {
        return { team: null, reason: `none of (${third[1]})'s 3rd-place teams made the best-8 cut — bracket text may need updating` };
      }
      return { team: null, reason: `${qualified.length} of (${third[1]})'s 3rd-place teams made the best-8 cut (${qualified.join('/')}) — ambiguous, needs manual pick` };
    }
    return { team: null, reason: null };
  }

  let bracketUpdated = 0;
  for (const round of bracket.rounds) {
    for (const slot of round.matches) {
      for (const side of ['home', 'away']) {
        const text = slot[side];
        if (!PLACEHOLDER_RE.test(text)) continue;
        const { team, reason } = resolve(text);
        if (team) {
          slot[side] = team.name;
          slot[`${side}Flag`] = team.flag;
          bracketUpdated++;
          summary.applied.push(`${round.name} ${slot.id}: "${text}" → ${team.name}`);
        } else if (reason) {
          summary.flags.push(`${round.name} ${slot.id} "${text}": ${reason}`);
        }
      }
    }
  }

  if (bracketUpdated > 0) {
    bracket.lastUpdated = new Date().toISOString();
    writeFileSync(bracketFile, JSON.stringify(bracket, null, 2) + '\n');
    console.log(`[qualifiers] resolved ${bracketUpdated} bracket slot side(s)`);
  } else {
    console.log('[qualifiers] no bracket slots resolved this run');
  }

  if (!allComplete) {
    const remaining = Object.entries(groupInfo).filter(([, g]) => !g.complete).map(([id]) => id);
    // Console-only — this is expected/ongoing, not something to repost in
    // the digest every 3 hours until the group stage actually wraps up.
    console.log(`[qualifiers] groups still in progress: ${remaining.join(', ')} — 3rd-place ranking pending`);
  }

  return summary;
}
