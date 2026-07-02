import matchesData from '../data/matches.json';

const matches = matchesData.matches;

export function parseMinute(minute) {
  if (minute === null || minute === undefined) return 0;
  const s = String(minute);
  if (s.includes('+')) {
    const [base, added] = s.split('+');
    return parseInt(base, 10) + parseInt(added, 10) * 0.01;
  }
  return parseInt(s, 10);
}

export function isLateGoal(minute) {
  return parseMinute(minute) >= 80;
}

export function isExtraTime(minute) {
  return parseMinute(minute) > 90;
}

export function isStoppageTime(minute) {
  return String(minute).includes('+');
}

export function computeTournamentStats() {
  const finished = matches.filter(m => m.status === 'finished');
  let totalGoals = 0;
  let firstHalfGoals = 0;
  let secondHalfGoals = 0;
  let lateGoals = 0;
  let stoppageGoals = 0;
  let extraTimeGoals = 0;
  let ownGoals = 0;
  let penGoals = 0;
  let cleanSheets = 0;
  let comebackWins = 0;
  let comebackDraws = 0;
  let highScoringMatches = 0;

  for (const m of finished) {
    const goals = m.goals || [];
    const total = (m.homeScore || 0) + (m.awayScore || 0);
    totalGoals += total;
    if (total >= 4) highScoringMatches++;
    if ((m.homeScore || 0) === 0) cleanSheets++;
    if ((m.awayScore || 0) === 0) cleanSheets++;

    for (const g of goals) {
      const eff = parseMinute(g.minute);
      if (eff <= 45.99) firstHalfGoals++;
      else secondHalfGoals++;
      if (isLateGoal(g.minute)) lateGoals++;
      if (isStoppageTime(g.minute)) stoppageGoals++;
      if (isExtraTime(g.minute)) extraTimeGoals++;
      if (g.note === 'og') ownGoals++;
      if (g.note === 'pen') penGoals++;
    }

    const cb = detectComeback(m);
    if (cb) {
      if (cb.type === 'win') comebackWins++;
      else comebackDraws++;
    }
  }

  const matchesPlayed = finished.length;
  const goalsPerMatch = matchesPlayed > 0 ? (totalGoals / matchesPlayed) : 0;

  return {
    matchesPlayed,
    totalGoals,
    goalsPerMatch,
    firstHalfGoals,
    secondHalfGoals,
    lateGoals,
    stoppageGoals,
    extraTimeGoals,
    ownGoals,
    penGoals,
    cleanSheets,
    comebackWins,
    comebackDraws,
    highScoringMatches,
  };
}

export function computeGoalMinuteBands() {
  const bands = [
    { band: '0–15', min: 0, max: 15.99 },
    { band: '16–30', min: 16, max: 30.99 },
    { band: '31–45+', min: 31, max: 45.99 },
    { band: '46–60', min: 46, max: 60.99 },
    { band: '61–75', min: 61, max: 75.99 },
    { band: '76–90+', min: 76, max: 90.99 },
    { band: 'Extra Time', min: 91, max: Infinity },
  ];
  const counts = bands.map(b => ({ ...b, count: 0 }));

  for (const m of matches) {
    if (m.status !== 'finished') continue;
    for (const g of m.goals || []) {
      const eff = parseMinute(g.minute);
      for (const b of counts) {
        if (eff >= b.min && eff <= b.max) {
          b.count++;
          break;
        }
      }
    }
  }

  return counts.map(({ band, count }) => ({ band, count }));
}

function detectComeback(m) {
  if (m.status !== 'finished') return null;
  const goals = [...(m.goals || [])].sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
  if (goals.length === 0) return null;

  let homeGoals = 0;
  let awayGoals = 0;
  let homeWasBehind = false;
  let awayWasBehind = false;

  for (const g of goals) {
    if (g.note === 'og') {
      if (g.team === 'home') awayGoals++;
      else homeGoals++;
    } else {
      if (g.team === 'home') homeGoals++;
      else awayGoals++;
    }
    if (homeGoals < awayGoals) homeWasBehind = true;
    if (awayGoals < homeGoals) awayWasBehind = true;
  }

  const finalHome = m.homeScore || 0;
  const finalAway = m.awayScore || 0;

  if (homeWasBehind && finalHome >= finalAway) {
    return { type: finalHome > finalAway ? 'win' : 'draw' };
  }
  if (awayWasBehind && finalAway >= finalHome) {
    return { type: finalAway > finalHome ? 'win' : 'draw' };
  }
  return null;
}

export function computeTeamStats() {
  const teamMap = {};

  function ensureTeam(team, code, flag, group) {
    if (!team || team === 'TBD' || !code || code === 'TBD') return;
    if (!teamMap[code]) {
      teamMap[code] = {
        team, code, flag, group,
        matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
        stageReached: 'Group Stage',
        comebackWins: 0, lateGoals: 0, extraTimeGoals: 0,
      };
    }
  }

  const stageOrder = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];

  for (const m of matches) {
    ensureTeam(m.homeTeam, m.homeCode, m.homeFlag, m.group);
    ensureTeam(m.awayTeam, m.awayCode, m.awayFlag, m.group);

    const homeEntry = teamMap[m.homeCode];
    const awayEntry = teamMap[m.awayCode];
    if (!homeEntry || !awayEntry) continue;

    const homeIdx = stageOrder.indexOf(m.stage);
    if (homeIdx > stageOrder.indexOf(homeEntry.stageReached)) homeEntry.stageReached = m.stage;
    if (homeIdx > stageOrder.indexOf(awayEntry.stageReached)) awayEntry.stageReached = m.stage;

    if (m.status !== 'finished') continue;

    const hg = m.homeScore || 0;
    const ag = m.awayScore || 0;

    homeEntry.matchesPlayed++;
    awayEntry.matchesPlayed++;
    homeEntry.goalsFor += hg;
    homeEntry.goalsAgainst += ag;
    awayEntry.goalsFor += ag;
    awayEntry.goalsAgainst += hg;

    if (hg > ag) {
      homeEntry.wins++; homeEntry.points += 3;
      awayEntry.losses++;
    } else if (hg === ag) {
      homeEntry.draws++; homeEntry.points += 1;
      awayEntry.draws++; awayEntry.points += 1;
    } else {
      awayEntry.wins++; awayEntry.points += 3;
      homeEntry.losses++;
    }

    for (const g of m.goals || []) {
      if (isLateGoal(g.minute)) {
        const scoringCode = g.note === 'og'
          ? (g.team === 'home' ? m.awayCode : m.homeCode)
          : (g.team === 'home' ? m.homeCode : m.awayCode);
        if (teamMap[scoringCode]) teamMap[scoringCode].lateGoals++;
      }
      if (isExtraTime(g.minute)) {
        const scoringCode = g.note === 'og'
          ? (g.team === 'home' ? m.awayCode : m.homeCode)
          : (g.team === 'home' ? m.homeCode : m.awayCode);
        if (teamMap[scoringCode]) teamMap[scoringCode].extraTimeGoals++;
      }
    }

    const cb = detectComeback(m);
    if (cb && cb.type === 'win') {
      const hFinal = m.homeScore || 0;
      const aFinal = m.awayScore || 0;
      const goals = [...(m.goals || [])].sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
      let hg2 = 0, ag2 = 0;
      let homeWasBehind = false, awayWasBehind = false;
      for (const g of goals) {
        if (g.note === 'og') {
          if (g.team === 'home') ag2++;
          else hg2++;
        } else {
          if (g.team === 'home') hg2++;
          else ag2++;
        }
        if (hg2 < ag2) homeWasBehind = true;
        if (ag2 < hg2) awayWasBehind = true;
      }
      if (homeWasBehind && hFinal > aFinal) homeEntry.comebackWins++;
      if (awayWasBehind && aFinal > hFinal) awayEntry.comebackWins++;
    }
  }

  return Object.values(teamMap)
    .map(t => ({ ...t, goalDiff: t.goalsFor - t.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
}

export function computeComebacks() {
  const result = [];

  for (const m of matches) {
    if (m.status !== 'finished') continue;
    const goals = [...(m.goals || [])].sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
    if (goals.length === 0) continue;

    let hg = 0, ag = 0;
    let homeWasBehind = false, awayWasBehind = false;
    let homeMaxDeficit = 0, awayMaxDeficit = 0;
    let firstScoringTeam = null;
    let minuteFirstGoal = null;
    let minuteEqualizer = null;
    let minuteWinner = null;

    for (const g of goals) {
      if (firstScoringTeam === null) {
        firstScoringTeam = g.note === 'og'
          ? (g.team === 'home' ? 'away' : 'home')
          : g.team;
        minuteFirstGoal = g.minute;
      }

      if (g.note === 'og') {
        if (g.team === 'home') ag++;
        else hg++;
      } else {
        if (g.team === 'home') hg++;
        else ag++;
      }

      if (hg < ag) {
        homeWasBehind = true;
        homeMaxDeficit = Math.max(homeMaxDeficit, ag - hg);
      }
      if (ag < hg) {
        awayWasBehind = true;
        awayMaxDeficit = Math.max(awayMaxDeficit, hg - ag);
      }
      if (hg === ag && minuteEqualizer === null && (homeWasBehind || awayWasBehind)) {
        minuteEqualizer = g.minute;
      }
      if (hg !== ag && minuteEqualizer !== null) {
        minuteWinner = g.minute;
      }
    }

    const finalHome = m.homeScore || 0;
    const finalAway = m.awayScore || 0;
    let comebackTeam = null;
    let type = null;

    if (homeWasBehind && finalHome >= finalAway) {
      comebackTeam = 'home';
      type = finalHome > finalAway ? 'win' : 'draw';
    } else if (awayWasBehind && finalAway >= finalHome) {
      comebackTeam = 'away';
      type = finalAway > finalHome ? 'win' : 'draw';
    }

    if (!comebackTeam) continue;

    const multiGoal = comebackTeam === 'home' ? homeMaxDeficit >= 2 : awayMaxDeficit >= 2;

    result.push({
      matchId: m.id,
      date: m.date,
      stage: m.stage,
      homeTeam: m.homeTeam, homeCode: m.homeCode, homeFlag: m.homeFlag,
      awayTeam: m.awayTeam, awayCode: m.awayCode, awayFlag: m.awayFlag,
      homeScore: finalHome, awayScore: finalAway,
      firstScoringTeam,
      comebackTeam,
      type,
      minuteFirstGoal,
      minuteEqualizer,
      minuteWinner,
      multiGoal,
    });
  }

  return result;
}

export function computeLateGoals() {
  const result = [];

  for (const m of matches) {
    if (m.status !== 'finished') continue;
    const goals = [...(m.goals || [])].sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));

    let hg = 0, ag = 0;

    for (const g of goals) {
      const isOG = g.note === 'og';
      const scoringTeam = isOG
        ? (g.team === 'home' ? 'away' : 'home')
        : g.team;

      const homeBefore = hg;
      const awayBefore = ag;

      if (isOG) {
        if (g.team === 'home') ag++;
        else hg++;
      } else {
        if (g.team === 'home') hg++;
        else ag++;
      }

      if (!isLateGoal(g.minute)) continue;

      const scoringCode = scoringTeam === 'home' ? m.homeCode : m.awayCode;
      const scoringFlag = scoringTeam === 'home' ? m.homeFlag : m.awayFlag;
      const opponentCode = scoringTeam === 'home' ? m.awayCode : m.homeCode;

      let impact;
      const homeWinsBefore = homeBefore > awayBefore;
      const awayWinsBefore = awayBefore > homeBefore;
      const tiedBefore = homeBefore === awayBefore;
      const homeWinsAfter = hg > ag;
      const awayWinsAfter = ag > hg;

      if (scoringTeam === 'home') {
        if (homeWinsAfter && (tiedBefore || awayWinsBefore)) impact = 'winner';
        else if (hg === ag && awayWinsBefore) impact = 'equalizer';
        else if (homeWinsBefore && homeWinsAfter) impact = 'insurance';
        else impact = 'consolation';
      } else {
        if (awayWinsAfter && (tiedBefore || homeWinsBefore)) impact = 'winner';
        else if (hg === ag && homeWinsBefore) impact = 'equalizer';
        else if (awayWinsBefore && awayWinsAfter) impact = 'insurance';
        else impact = 'consolation';
      }

      result.push({
        matchId: m.id,
        date: m.date,
        stage: m.stage,
        player: g.player,
        team: scoringTeam === 'home' ? m.homeTeam : m.awayTeam,
        teamCode: scoringCode,
        flag: scoringFlag,
        opponent: scoringTeam === 'home' ? m.awayTeam : m.homeTeam,
        opponentCode,
        minute: g.minute,
        scoreBefore: `${homeBefore}-${awayBefore}`,
        scoreAfter: `${hg}-${ag}`,
        impact,
      });
    }
  }

  return result.sort((a, b) => parseMinute(b.minute) - parseMinute(a.minute));
}

export function computeTopScorers(n = 10) {
  const map = {};

  for (const m of matches) {
    if (m.status !== 'finished') continue;
    for (const g of m.goals || []) {
      if (g.note === 'og') continue;
      const team = g.team === 'home' ? m.homeTeam : m.awayTeam;
      const code = g.team === 'home' ? m.homeCode : m.awayCode;
      const flag = g.team === 'home' ? m.homeFlag : m.awayFlag;
      const key = `${g.player}||${code}`;
      if (!map[key]) map[key] = { player: g.player, team, flag, code, count: 0 };
      map[key].count++;
    }
  }

  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
