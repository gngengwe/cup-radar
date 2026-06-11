import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

// Flags map for known TLAs
const FLAGS = {
  MEX:'🇲🇽', RSA:'🇿🇦', USA:'🇺🇸', CAN:'🇨🇦', BRA:'🇧🇷', ARG:'🇦🇷', FRA:'🇫🇷',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', ESP:'🇪🇸', GER:'🇩🇪', POR:'🇵🇹', NED:'🇳🇱', BEL:'🇧🇪', CRO:'🇭🇷',
  URU:'🇺🇾', COL:'🇨🇴', CHI:'🇨🇱', ECU:'🇪🇨', MAR:'🇲🇦', SEN:'🇸🇳', NGA:'🇳🇬',
  EGY:'🇪🇬', JPN:'🇯🇵', KOR:'🇰🇷', AUS:'🇦🇺', IRN:'🇮🇷', KSA:'🇸🇦', QAT:'🇶🇦',
  BIH:'🇧🇦', ALG:'🇩🇿', TUN:'🇹🇳', AUT:'🇦🇹', NZL:'🇳🇿', CUW:'🇨🇼', IDN:'🇮🇩',
};

export async function refreshBracket() {
  console.log('[bracket] syncing knockout results from matches.json…');

  const summary = { vertical: 'bracket', applied: [], pending: [], flags: [] };

  const matchFile   = join(DATA, 'matches.json');
  const bracketFile = join(DATA, 'bracket.json');
  const matches     = JSON.parse(readFileSync(matchFile, 'utf8')).matches;
  const bracket     = JSON.parse(readFileSync(bracketFile, 'utf8'));

  // Only knockout matches have score data to sync
  const knockout = matches.filter(m => m.stage !== 'Group Stage' && m.status === 'finished');
  if (knockout.length === 0) { console.log('[bracket] no finished knockout matches yet'); return summary; }

  let updated = 0;

  for (const match of knockout) {
    // Find corresponding bracket slot by date + city approximation
    for (const round of bracket.rounds) {
      for (const slot of round.matches) {
        if (slot.status === 'finished') continue;
        if (slot.date !== match.date) continue;

        // If the slot still has placeholder names, fill it in
        const homeKnown = !slot.home.startsWith('Winner') && !slot.home.startsWith('Runner') && slot.home !== 'TBD';
        if (!homeKnown && match.homeTeam) {
          slot.home     = match.homeTeam;
          slot.homeFlag = FLAGS[match.homeCode] || match.homeFlag || '🏳️';
          slot.away     = match.awayTeam;
          slot.awayFlag = FLAGS[match.awayCode] || match.awayFlag || '🏳️';
        }

        if (match.homeScore !== null && match.awayScore !== null) {
          slot.homeScore = match.homeScore;
          slot.awayScore = match.awayScore;
          slot.status    = 'finished';
          updated++;
          summary.applied.push(`${round.name || round.id}: ${slot.home} ${match.homeScore}–${match.awayScore} ${slot.away}`);
        }
      }
    }
  }

  if (updated > 0) {
    bracket.lastUpdated = new Date().toISOString();
    writeFileSync(bracketFile, JSON.stringify(bracket, null, 2) + '\n');
    console.log(`[bracket] updated ${updated} slots`);
  } else {
    console.log('[bracket] no bracket changes');
  }

  return summary;
}
