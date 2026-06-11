import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

export async function refreshUpsets() {
  console.log('[upsets] cross-referencing with match scores…');

  const summary = { vertical: 'upsets', applied: [], pending: [], flags: [] };

  const matchFile  = join(DATA, 'matches.json');
  const upsetFile  = join(DATA, 'upsets.json');
  const matches    = JSON.parse(readFileSync(matchFile, 'utf8')).matches;
  const current    = JSON.parse(readFileSync(upsetFile, 'utf8'));

  let updated = 0;

  for (const upset of current.upsets) {
    if (upset.status !== 'upcoming') continue;

    const match = matches.find(m => m.id === upset.matchId);
    if (!match || match.status !== 'finished') continue;

    const { homeScore, awayScore, homeTeam, awayTeam, homeCode, awayCode } = match;
    if (homeScore === null || awayScore === null) continue;

    // Determine which team is the underdog (second team in upset.teams is usually the underdog)
    // Convention: upset.teams[1] is the underdog who might cause the upset
    const underdogCode = upset.teams[1];
    const isHomeUnderdog = homeCode === underdogCode || homeTeam?.includes(underdogCode);
    const underdogWon = isHomeUnderdog ? homeScore > awayScore : awayScore > homeScore;
    const draw        = homeScore === awayScore;

    if (draw) {
      upset.status = 'happened';
      upset.result = `${homeTeam} ${homeScore}–${awayScore} ${awayTeam} (draw — upset partially materialised)`;
      summary.flags.push(`"${upset.title}" ended in a draw — marked as happened, but check the wording in upsets.json reads correctly.`);
    } else if (underdogWon) {
      upset.status = 'happened';
      upset.result = `${homeTeam} ${homeScore}–${awayScore} ${awayTeam}`;
      summary.applied.push(`"${upset.title}" → HAPPENED (${upset.result})`);
    } else {
      upset.status = 'didnt-happen';
      upset.result = `${homeTeam} ${homeScore}–${awayScore} ${awayTeam}`;
      summary.applied.push(`"${upset.title}" → didn't happen (${upset.result})`);
    }
    updated++;
  }

  if (updated > 0) {
    current.lastUpdated = new Date().toISOString();
    writeFileSync(upsetFile, JSON.stringify(current, null, 2) + '\n');
    console.log(`[upsets] resolved ${updated} upsets`);
  } else {
    console.log('[upsets] no finished matches to resolve');
  }

  return summary;
}
