import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useMatches } from '../hooks/useMatches';
import {
  fetchEspnScoreboard, matchEspnStatus, matchEspnEventId, fetchEspnSummary,
} from '../api/espnScoreboard';
import { normalizeEspnSoccerSummary } from '../utils/normalizeEspnSoccerSummary';
import { computeMatchExcitement } from '../utils/matchExcitementEngine';
import FlagImg from '../components/FlagImg';

// ─── Utilities ────────────────────────────────────────────────────────────────

function makeTodayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 15)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function pct(v) { return v != null ? `${Math.round(v * 100)}%` : '—'; }

function parseMinute(clock) {
  if (!clock) return null;
  const m = clock.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// ─── Team identity briefs ─────────────────────────────────────────────────────
// Keyed by FIFA 3-letter code. style = playing identity, watchFor = what a
// casual fan should look for.

const TEAM_BRIEF = {
  ALG: { style: 'defensive block + counter-attack', watchFor: 'Algeria will sit deep in a compact shape and spring quick counters the moment they win it back' },
  ARG: { style: 'press + fast transitions', watchFor: 'how quickly Argentina move the ball forward — they eliminate pressure lines fast to find attackers in space' },
  AUS: { style: 'direct + high energy', watchFor: 'second-ball battles — the Socceroos outwork opponents and live on winning loose balls in midfield' },
  AUT: { style: 'aggressive press + vertical football', watchFor: 'how high Austria press — they close down quickly and play direct when they win it back' },
  BEL: { style: 'technical + attacking', watchFor: 'combinations in the final third — Belgium have quality at every level and create from deep positions' },
  BIH: { style: 'physical + direct', watchFor: 'set pieces and long balls — Bosnia-Herzegovina are combative and effective from dead balls near the box' },
  BRA: { style: 'possession + flair', watchFor: 'close combination play in tight spaces — Brazil recycle the ball quickly and unlock defenses with give-and-go passing' },
  CAN: { style: 'pressing + physical', watchFor: 'physical presence and aerial duels — Canada are big, fast, and dangerous from corners and free kicks' },
  CIV: { style: 'physical + attacking', watchFor: 'the forward players — Ivory Coast have real quality upfront and want to get in behind quickly on transitions' },
  COD: { style: 'athletic + direct', watchFor: 'explosive pace on the counter — DR Congo attack with speed and raw energy when they break forward' },
  COL: { style: 'technical + creative', watchFor: 'midfield craft — Colombia have brilliant playmakers who can create chances from nothing with one clever pass' },
  CPV: { style: 'disciplined + compact', watchFor: 'the defensive shape — Cape Verde are organized and make it very hard for anyone they face to find space' },
  CRO: { style: 'possession + midfield control', watchFor: 'central control — Croatia dominate through technical midfielders who slow the game down and then accelerate' },
  CUW: { style: 'energetic + physical', watchFor: 'effort and intensity — Curaçao compete with maximum energy in every duel and never give the ball up easily' },
  CZE: { style: 'tactical + organized', watchFor: 'the defensive structure — Czech Republic are hard to break down and transition quickly when they win the ball' },
  ECU: { style: 'direct + physical', watchFor: 'the striker and runners in behind — Ecuador look to get balls in behind the defense quickly' },
  EGY: { style: 'defensive + counter', watchFor: 'wide attacks and quick switches — Egypt use the flanks and transition fast when they win it' },
  ENG: { style: 'structured + powerful', watchFor: 'set pieces — England are one of the best in the world from corners and free kicks, with real aerial threat' },
  ESP: { style: 'possession + passing combinations', watchFor: 'the rondo — Spain recycle the ball patiently until a gap opens, then attack quickly and decisively through it' },
  FRA: { style: 'pace + power on transition', watchFor: 'transitions — France have explosive pace wide and thrive on turning defense into attack with speed' },
  GER: { style: 'organized pressing + structure', watchFor: 'midfield control — Germany win by dominating the center of the pitch and defending as a coordinated unit' },
  GHA: { style: 'technical + dynamic', watchFor: 'individual quality — Ghana produce creative players who can unlock defenses with one unpredictable moment' },
  HAI: { style: 'energetic + direct', watchFor: 'raw intensity — Haiti play with maximum effort and can surprise more organized teams with their work rate' },
  HTI: { style: 'energetic + direct', watchFor: 'raw intensity — Haiti play with maximum effort and can surprise more organized teams with their work rate' },
  IRN: { style: 'defensive block + counter', watchFor: 'the low block — Iran sit very deep and look for moments to spring quickly on the break against tired defenders' },
  IRQ: { style: 'technical + direct', watchFor: 'attacking transitions — Iraq look to move quickly through the thirds when they win possession in their own half' },
  JOR: { style: 'organized + physical', watchFor: 'defensive discipline — Jordan will work hard to stay compact and limit the space their opponent can exploit' },
  JPN: { style: 'compact + technical', watchFor: 'the pressing trap — Japan work incredibly hard off the ball and move it with precision when they win it' },
  KOR: { style: 'disciplined + counter', watchFor: 'the transition — Korea defend in a compact block and attack at pace with quality runners on the break' },
  KSA: { style: 'high press + counter-attack', watchFor: 'the pressing intensity — Saudi Arabia shocked Argentina in 2022 with an aggressive high line and offside trap' },
  MAR: { style: 'defensive block + counter-attack', watchFor: 'the low block — Morocco sit very deep and attack at pace, exactly as they did to reach the 2022 semifinal' },
  MEX: { style: 'high press + technical', watchFor: 'the compactness — Mexico press in coordinated packs and look to play out quickly from the back into space' },
  NED: { style: 'aggressive press + direct', watchFor: 'the pressing trap — Netherlands squeeze opponents high up the field to create turnovers and attack immediately' },
  NOR: { style: 'direct + striker-led', watchFor: "Erling Haaland's movement — Norway's entire attack is built around finding their striker in dangerous positions" },
  NZL: { style: 'compact + hard-working', watchFor: 'the team effort — New Zealand outwork opponents and defend as a tight, coordinated unit for the full 90' },
  PAN: { style: 'defensive + organized', watchFor: 'defensive discipline — Panama organize in a compact block and make it very hard to create quality chances against them' },
  PAR: { style: 'physical + tactical', watchFor: 'the defensive intensity — Paraguay are combative, well-organized, and hard to break down in every game' },
  POR: { style: 'wing-heavy attacks', watchFor: 'the flanks — Portugal build wide and look for crosses and cutbacks into the box from quality wingers' },
  QAT: { style: 'possession + technical', watchFor: 'the ball circulation — Qatar are comfortable with the ball and look to combine in midfield before committing forward' },
  RSA: { style: 'energetic + physical', watchFor: 'raw energy and athleticism — South Africa press hard and play with high intensity from first minute to last' },
  SCO: { style: 'direct + physical', watchFor: 'the early ball — Scotland like to win second balls in midfield and play direct when they have forward momentum' },
  SEN: { style: 'direct + physical', watchFor: 'pacy forwards and physical duels — Senegal are powerful, fast, and well-organized defensively across the whole team' },
  SUI: { style: 'organized + tactically flexible', watchFor: 'how Switzerland adapt their shape — they can change formation mid-game and neutralize attacking threats well' },
  SWE: { style: 'physical + direct', watchFor: 'the aerial game — Sweden win headers and use long balls effectively to get runners in behind the defensive line' },
  TUN: { style: 'organized + defensive', watchFor: 'the structure — Tunisia are disciplined and set up to make life very difficult for attacking sides' },
  TUR: { style: 'technical + unpredictable', watchFor: 'individual quality — Turkish players can produce moments of real brilliance and are difficult to read defensively' },
  URU: { style: 'physical + direct', watchFor: 'set pieces and aerial duels — Uruguay are tough, disciplined, and extremely effective from dead-ball situations' },
  USA: { style: 'physical + structured', watchFor: 'athleticism and pressing — USMNT play fast transitions and excel at winning second balls in midfield battles' },
  UZB: { style: 'organized + energetic', watchFor: 'disciplined defending and hard work — Uzbekistan are compact and make teams work for every inch of space' },
};

// ─── Sound design ─────────────────────────────────────────────────────────────
// Ambient tones per card type. Subtle — doesn't compete with screen content.

function playTone(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const configs = {
      beat:      { freqs: [440],           dur: 0.4, vol: 0.10, wave: 'sine' },
      milestone: { freqs: [330, 392],      dur: 0.55, vol: 0.07, wave: 'triangle' },
      explain:   { freqs: [392],           dur: 0.35, vol: 0.08, wave: 'sine' },
      tension:   { freqs: [523, 587],      dur: 0.6,  vol: 0.09, wave: 'sine' },
      goal:      { freqs: [659, 784, 1047], dur: 0.8, vol: 0.12, wave: 'sine' },
      post:      { freqs: [261, 329, 392], dur: 1.0,  vol: 0.10, wave: 'sine' },
    };
    const c = configs[type] || configs.milestone;
    c.freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = c.wave;
      osc.frequency.value = freq;
      const t0 = now + i * 0.12;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(c.vol / c.freqs.length, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + c.dur);
      osc.start(t0);
      osc.stop(t0 + c.dur + 0.05);
    });
  } catch { /* no-op if AudioContext unavailable */ }
}

// ─── On-demand match snapshot ─────────────────────────────────────────────────
// Called when user taps "What's happening?" — synthesizes current match state
// into plain-language paragraph.

function generateSnapshot(match, espn, summary, ex) {
  if (!espn) return 'Waiting for match data…';
  const hs   = espn.homeScore ?? 0;
  const as_  = espn.awayScore ?? 0;
  const stats = summary?.stats;
  const min   = parseMinute(espn.clock);
  const home  = match.homeTeam;
  const away  = match.awayTeam;
  const lines = [];

  // Score + clock
  if (espn.state === 'pre') {
    lines.push(`${home} vs ${away} hasn't kicked off yet.`);
  } else if (espn.state === 'post') {
    const winner = hs > as_ ? home : (as_ > hs ? away : null);
    lines.push(winner
      ? `Full time — ${winner} won ${Math.max(hs,as_)}–${Math.min(hs,as_)}.`
      : `Full time — ${home} ${hs}–${as_} ${away}. A draw.`);
  } else {
    const minStr = min != null ? ` at ${min}'` : '';
    if (hs === as_) {
      lines.push(`${home} ${hs}–${as_} ${away}${minStr} — still level.`);
    } else {
      const leader  = hs > as_ ? home : away;
      const trailer = hs > as_ ? away : home;
      lines.push(`${leader} lead ${Math.max(hs,as_)}–${Math.min(hs,as_)}${minStr}. ${trailer} are chasing.`);
    }
  }

  // Possession story
  if (stats?.homePossession > 0 || stats?.awayPossession > 0) {
    const hp = stats.homePossession || 0;
    const ap = stats.awayPossession || 0;
    const who = hp >= ap ? home : away;
    const val = Math.max(hp, ap);
    if (Math.abs(hp - ap) <= 8) {
      lines.push(`Possession is fairly even (${hp}%–${ap}%) — both teams are comfortable in the game.`);
    } else if (val >= 65) {
      const other = who === home ? away : home;
      lines.push(`${who} are dominating the ball at ${val}%. ${other} are sitting deep and defending — watch if they can stay organized or if the pressure cracks them.`);
    } else {
      const other = who === home ? away : home;
      lines.push(`${who} have ${val}% possession. ${other} are conceding the ball but staying disciplined.`);
    }
  }

  // Shots story
  if (stats) {
    const ht  = (stats.homeShots||0) + (stats.awayShots||0);
    const hot = (stats.homeShotsOnTarget||0) + (stats.awayShotsOnTarget||0);
    const totalGoals = hs + as_;
    if (ht > 0) {
      if (totalGoals === 0 && ht >= 5) {
        lines.push(`${ht} shots and nothing through yet — both keepers are working hard. The chances are there; the finishing isn't.`);
      } else if (ht > 0) {
        lines.push(`${ht} shots total, ${hot} on target.`);
      }
    }
  }

  // Excitement read
  if (ex?.score >= 75) {
    lines.push(`The pressure is at maximum — this is tense football.`);
  } else if (ex?.score >= 55) {
    lines.push(`Tension building — this game has a charged, unsettled feeling right now.`);
  } else if (ex?.score < 30 && espn.state === 'in') {
    lines.push(`Things are fairly settled at the moment — both teams keeping their shape.`);
  }

  return lines.join(' ');
}

// ─── Group stakes context ─────────────────────────────────────────────────────
// What the current scoreline means for group advancement. Appended to the
// 60/70/80-minute milestone cards to give casual fans real stakes context.

function getStakesLine(match, hs, as_, chosenCode) {
  if (!match.group) return null;
  const home = match.homeTeam, away = match.awayTeam;
  const yours = chosenCode ? (chosenCode === match.homeCode ? home : away) : null;
  const group = `Group ${match.group}`;

  if (hs === as_) {
    const base = `Both teams take 1 point in ${group} if this stands. Draws rarely win groups — both sides need wins from here.`;
    return yours ? `${base} Your ${yours} stay in the race, but the next game is must-win.` : base;
  }

  const leader  = hs > as_ ? home : away;
  const trailer = hs > as_ ? away : home;
  const lScore  = Math.max(hs, as_), tScore = Math.min(hs, as_);

  if (!yours) {
    return `If this holds: ${leader} earn 3 points in ${group}. ${trailer} need wins from their remaining group games just to stay in contention.`;
  }
  if (yours === leader) {
    return `Your ${yours} lead ${lScore}–${tScore} — if this holds that's 3 big points in ${group}, a major step toward the knockout rounds.`;
  }
  return `Your ${yours} trail ${tScore}–${lScore} in ${group}. One goal flips the story — comebacks happen at the World Cup.`;
}

// ─── Clock milestone cards ─────────────────────────────────────────────────────
// Each body function reacts to actual match state — score, possession, shots.

const MILESTONES = {
  10: {
    icon: '🕐', title: '10 minutes in — early pulse check',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) {
        return `The opening 10 minutes are tactical — teams test the defensive shape before committing forward. Goals are rarer in this early window than any other. The team that scores first wins about 70% of World Cup matches from this point.`;
      }
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const home = match.homeTeam, away = match.awayTeam;
      const hp   = stats?.homePossession || 0;
      const ap   = stats?.awayPossession || 0;
      const totalShots = (stats?.homeShots||0) + (stats?.awayShots||0);

      if (hs === 0 && as_ === 0) {
        const pStr = hp > 0
          ? `${hp >= ap ? home : away} have had ${Math.max(hp, ap)}% of the ball so far. `
          : '';
        return `${pStr}0–0 after 10 minutes — both teams still in the feeling-out phase. The first 15 minutes are tactical: test the defensive shape before committing forward. Goals are rarer in this early window.`;
      }
      if (hs > 0 && as_ === 0) {
        return `${home} already lead ${hs}–0! An early goal is enormous at the World Cup — teams that score first win about 70% of the time. ${away} need to respond, but calmly — panicking at this stage creates more gaps.`;
      }
      if (as_ > 0 && hs === 0) {
        return `${away} lead ${as_}–0 inside 10 minutes! ${home} are already behind and need to adjust their shape. An early deficit can force teams to overcommit and leave space on the counter.`;
      }
      return `${hs}–${as_} already — this has been an open, attacking start. ${totalShots > 0 ? `${totalShots} shots in the opening spell — a high-intensity start.` : 'Both teams committing forward early.'}`;
    },
  },
  20: {
    icon: '🕑', title: '20 minutes in — patterns forming',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) {
        return `By 20 minutes the passing patterns and tactical shapes have usually emerged — who's dominating the ball, who's sitting deep, where the spaces are. The counter-attack threat often becomes visible in this window.`;
      }
      const hs  = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const home = match.homeTeam, away = match.awayTeam;
      const hp   = stats?.homePossession || 0, ap = stats?.awayPossession || 0;
      const hShots = stats?.homeShots || 0, aShots = stats?.awayShots || 0;
      const totalShots = hShots + aShots;
      const posWho  = hp > ap ? home : away;
      const shotWho = hShots > aShots ? home : (aShots > hShots ? away : null);

      if (hs === as_) {
        if (hp > 0 && Math.abs(hp - ap) >= 15 && shotWho && shotWho !== posWho) {
          return `Classic counter-attack pattern forming: ${posWho} has ${Math.max(hp, ap)}% possession but ${shotWho} has more shots. Sitting deep and conceding the ball is working — if ${shotWho} score first from fewer chances, this game is theirs.`;
        }
        if (totalShots >= 6) {
          return `${totalShots} shots and still 0–0 — both keepers have been busy. Goalkeepers save around 70% of shots on target at this level. The difference between 0-0 and 2-0 is often just one deflection.`;
        }
        return `${home} 0–0 ${away} at 20 minutes. The first team to score wins 70% of World Cup matches from this situation. Every build-up and transition matters right now.`;
      }

      const leader  = hs > as_ ? home : away;
      const trailer = hs > as_ ? away : home;
      const margin  = Math.abs(hs - as_);
      if (margin >= 2) {
        return `${leader} have opened up a ${margin}-goal lead inside 20 minutes — an enormous advantage. ${trailer} need to score without conceding again, which changes their whole defensive shape.`;
      }
      return `${leader} lead 1–0 at 20 minutes. ${trailer} still have 70 minutes — plenty of time — but they need to change something about how they're setting up, and soon.`;
    },
  },
  30: {
    icon: '🕒', title: 'Half hour mark',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) {
        return `The half-hour mark is when the shape of a match solidifies. Goals cluster in the final 10 minutes of each half as teams push for a psychological lead — the side ahead at halftime wins 81% of World Cup matches.`;
      }
      const hs  = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const home = match.homeTeam, away = match.awayTeam;
      const hp   = stats?.homePossession || 0, ap = stats?.awayPossession || 0;
      const posWho  = hp >= ap ? home : away;
      const posOther = hp >= ap ? away : home;
      const posVal   = Math.max(hp, ap);
      const posDom   = posVal >= 60 && hp > 0;

      if (hs === 0 && as_ === 0) {
        if (posDom) {
          return `${posWho} have controlled the ball at ${posVal}% possession but ${posOther} are holding firm. That's the central tactical battle — ${posWho} need better quality chances; ${posOther} are defending well but one mistake ends the 0-0.`;
        }
        return `Still goalless at the half hour — both teams well-organized. Goals cluster in the 35–45 minute window as teams push for a halftime lead. Stay alert.`;
      }

      const leader  = hs > as_ ? home : away;
      const trailer = hs > as_ ? away : home;
      const lScore  = Math.max(hs, as_);
      const tScore  = Math.min(hs, as_);

      if (lScore === tScore) {
        return `${hs}–${as_} at the half hour — both teams have scored. ${posDom ? `${posWho} have had ${posVal}% of the ball. ` : ''}The next goal wins this 75% of the time from this scoreline.`;
      }
      if (lScore - tScore >= 2) {
        return `${leader} lead ${lScore}–${tScore} with an hour still to play. Comfortable but not over — ${trailer} will restructure at halftime. Teams have come back from two down at this World Cup.`;
      }
      return `${leader} lead by one at the half hour. Teams that lead at halftime win 81% of World Cup matches. ${trailer} need something before the break to reset this psychologically.`;
    },
  },
  40: {
    icon: '⏱️', title: '5 minutes to halftime',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) {
        return `The final minutes before halftime are the most psychologically loaded window of the first half. Teams that lead at the break win 81% of World Cup matches — the trailing side risks everything to equalize before the whistle.`;
      }
      const hs  = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const home = match.homeTeam, away = match.awayTeam;
      const onTarget = (stats?.homeShotsOnTarget||0) + (stats?.awayShotsOnTarget||0);

      if (hs === as_) {
        return `${hs > 0 ? `${hs}–${as_} after 40 minutes` : 'Goalless'} — both teams weighing whether to push for a lead or protect what they have. The 43–45 minute window produces a disproportionate number of World Cup goals. ${onTarget > 0 ? `${onTarget} shots on target so far. ` : ''}Watch for a final surge before the break.`;
      }

      const leader  = hs > as_ ? home : away;
      const trailer = hs > as_ ? away : home;
      const lScore  = Math.max(hs, as_), tScore = Math.min(hs, as_);
      return `${leader} lead ${lScore}–${tScore} heading into the final minutes of the first half. Teams that lead at HT win 81% of World Cup matches. ${trailer} desperately want something before the break to keep this alive — expect them to push and leave space behind.`;
    },
  },
  60: {
    icon: '🕕', title: 'Hour mark — this is when games change',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) {
        return `The hour mark is the most dangerous window in World Cup football — more goals are scored 60–75' than in any other 15-minute block. Substitutions bring fresh legs and shift tactical shapes entirely.`;
      }
      const hs  = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const home = match.homeTeam, away = match.awayTeam;
      const corners = (stats?.homeCorners||0) + (stats?.awayCorners||0);
      const fouls   = (stats?.homeFouls||0)   + (stats?.awayFouls||0);
      const statLine = [corners > 0 ? `${corners} corners` : '', fouls > 0 ? `${fouls} fouls` : ''].filter(Boolean).join(', ');

      if (hs === as_) {
        return `${hs}–${as_} at the hour mark — the most dangerous window in World Cup football opens now. More goals are scored 60–75 than in any other 15-minute block. ${statLine ? `${statLine} so far. ` : ''}Substitutions bring fresh legs and change tactical shapes. Watch the next 15 minutes closely.`;
      }

      const leader  = hs > as_ ? home : away;
      const trailer = hs > as_ ? away : home;
      const lScore  = Math.max(hs, as_), tScore = Math.min(hs, as_);
      const margin  = lScore - tScore;

      if (margin >= 2) {
        return `${leader} lead ${lScore}–${tScore} with 30 minutes left — in control but not finished. They'll look to manage the game now. ${trailer} need two goals, which means big risk and big spaces behind. ${statLine ? `${statLine}.` : ''}`;
      }
      return `${leader} lead by one at the hour. ${trailer} will push harder now — more players forward, more risk. The 60–75 minute window is when World Cup games change most often. Expect substitutions and a shift in momentum.`;
    },
  },
  70: {
    icon: '🕖', title: '20 minutes left',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) {
        return `Twenty minutes from time — tired legs and tactical desperation combine. Teams push forward and leave space at the back. Every set piece is a potential match-winner from here.`;
      }
      const hs  = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const home = match.homeTeam, away = match.awayTeam;

      if (hs === as_) {
        return `${hs > 0 ? `${hs}–${as_}` : 'Still 0–0'} with 20 minutes to settle this. At the World Cup, teams level at 70' score at least once in the final 20 minutes about 40% of the time. Set pieces in dangerous areas are extremely dangerous. A single moment decides this.`;
      }

      const leader  = hs > as_ ? home : away;
      const trailer = hs > as_ ? away : home;
      const lScore  = Math.max(hs, as_), tScore = Math.min(hs, as_);
      const margin  = lScore - tScore;

      if (margin === 1) {
        return `${leader} lead by one — but no World Cup lead is safe with 20 minutes left. Tired legs make defensive mistakes. Set pieces steal goals. ${trailer} will throw everything forward. The most anxious 20 minutes for a leading team.`;
      }
      return `${leader} lead ${lScore}–${tScore} — comfortably in control. ${trailer} need multiple goals, which means massive gaps opening at the back. A counter-attack now would end the contest completely.`;
    },
  },
  80: {
    icon: '⏰', title: '10 minutes of normal time left',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) {
        return `Ten minutes of normal time plus injury time (usually 4–6 minutes) — the game does not end at 90. Nerves and exhausted defenders make late goals more likely than you'd think.`;
      }
      const hs  = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const home = match.homeTeam, away = match.awayTeam;
      const totalShots = (stats?.homeShots||0) + (stats?.awayShots||0);

      if (hs === as_) {
        return `${hs > 0 ? `${hs}–${as_}` : '0–0'} with 10 minutes of normal time left. The referee will add 3–6 minutes of injury time — this game does not end at 90. ${totalShots > 0 ? `${totalShots} combined shots. ` : ''}The next team to score wins. Everyone is exhausted. Every second counts.`;
      }

      const leader  = hs > as_ ? home : away;
      const trailer = hs > as_ ? away : home;
      const lScore  = Math.max(hs, as_), tScore = Math.min(hs, as_);
      const margin  = lScore - tScore;

      if (margin === 1) {
        return `${leader} holding a one-goal lead with 10 minutes left. Referees add 4–6 minutes of injury time — this isn't over. ${trailer} will press every second ball and chase every set piece. One mistake is all it takes. The most nerve-wracking 10 minutes in sport.`;
      }
      return `${leader} lead ${lScore}–${tScore} — effectively finished. ${trailer} need ${margin} goals from nothing. ${totalShots > 0 ? `${totalShots} shots across this match. ` : ''}Watch ${leader} manage the ball and run the clock down.`;
    },
  },
  95: {
    icon: '⏱', title: 'Extra time — first period',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) return `Extra time first period underway. Both teams have had 90 minutes of the physical demands of international football — tactical discipline now competes with exhaustion.`;
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      return hs === as_
        ? `Still ${hs}–${as_} going into extra time. 30 more minutes — the first team to score creates enormous psychological pressure.`
        : `${hs > as_ ? match.homeTeam : match.awayTeam} lead ${Math.max(hs, as_)}–${Math.min(hs, as_)} in extra time. Defending a lead with tired legs is one of the hardest things in soccer.`;
    },
  },
  100: {
    icon: '⏱', title: '100 minutes — fatigue starts deciding things',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) return `Around 100 minutes, the match becomes less about perfect structure and more about who can still sprint, recover, and stay switched on. One loose touch can decide it.`;
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      return hs === as_
        ? `Still level after 100 minutes. Exhaustion changes the geometry of the game — defensive lines stretch, midfield runners stop tracking, and one clean transition can end it.`
        : `${hs > as_ ? match.homeTeam : match.awayTeam} are protecting a lead with every player now carrying 100 minutes in their legs. The next transition or set piece could settle everything.`;
    },
  },
  105: {
    icon: '⏱', title: 'Extra time — second period starts',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) return `The second and final 15-minute period of extra time. If no goal is scored, this goes to penalties.`;
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      return hs === as_
        ? `Still ${hs}–${as_} — 15 more minutes before a penalty shootout. Both teams know it. The question is whether someone blinks first.`
        : `${hs > as_ ? match.homeTeam : match.awayTeam} lead in the second period of extra time. ${hs > as_ ? match.awayTeam : match.homeTeam} need one goal to force a shootout.`;
    },
  },
  110: {
    icon: '⏱', title: '110 minutes — one moment or penalties',
    body: (match, espn, stats, firingLate = false) => {
      if (firingLate) return `The final 10 minutes of extra time are survival football. Players are exhausted, spaces open up, and every set piece feels like a coin flip with a trophy-sized consequence.`;
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      return hs === as_
        ? `Still tied with 10 minutes left before penalties. The next shot, deflection, or defensive mistake may spare one team the shootout and haunt the other forever.`
        : `${hs > as_ ? match.homeTeam : match.awayTeam} are 10 minutes from surviving extra time. ${hs > as_ ? match.awayTeam : match.homeTeam} need one moment to force penalties.`;
    },
  },
  120: {
    icon: '⏱', title: 'End of extra time',
    body: () => {
      return `120 minutes played. If the score is still level after this, it goes to a penalty shootout — the most psychologically intense 15 minutes in team sports.`;
    },
  },
};

// ─── Retroactive milestone bodies ─────────────────────────────────────────────
// Used in reconstruction — reference the final result rather than in-progress
// score so the copy stays honest (we don't know the scoreline at each minute).

const RETRO_MILESTONE_BODIES = {
  10: (match, hs, as_) =>
    `This match ended ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. In the 10th minute, teams were in the feeling-out phase — testing defensive shape before committing forward. The first goal, whenever it came, was critical.`,
  20: (match, hs, as_) =>
    `Final: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. By 20 minutes the patterns had emerged. Teams that score first win 70% of World Cup matches — so how the opening goal arrived (or didn't) shaped everything that followed.`,
  30: (match, hs, as_) =>
    `Final: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. The half-hour mark is when the shape of a match becomes clear. Goals cluster in the 35–45' window, so neither side could afford to be passive approaching the break.`,
  40: (match, hs, as_) =>
    `Final: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. Five minutes to halftime — the most psychologically significant window of the first half. A goal before the break changes everything: teams that lead at HT win 81% of World Cup matches.`,
  60: (match, hs, as_) =>
    `Final: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. The hour mark is the most dangerous window in World Cup football — more goals score 60–75' than any other 15-minute block. Substitutions bring fresh legs and shift tactical shapes.`,
  70: (match, hs, as_) =>
    `Final: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. Twenty minutes left in a World Cup game means maximum pressure. Every set piece and transition is a potential match-winner. Tired defenders make mistakes.`,
  80: (match, hs, as_) =>
    `Final: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. Ten minutes of normal time plus 4–6 minutes of injury time — this game does not end at 90. In World Cup football, the final stretch is where nerves and tired legs write the story.`,
};

// ─── Post-game story reconstruction ──────────────────────────────────────────
// Called when a completed match is loaded without having been watched live.
// Generates a timeline of cards from final stats, spread at plausible minutes.

function buildPostGameStory(match, espn, summary, guard) {
  const out  = [];
  const hs   = espn?.homeScore ?? 0;
  const as_  = espn?.awayScore ?? 0;
  const stats = summary?.stats;
  const home = match.homeTeam;
  const away = match.awayTeam;

  // Card 1: Who were these teams? (minute 1)
  // Only add if the live kickoff card didn't already fire.
  if (!guard.firedStatKeys.has('kickoff')) {
    const homeB = TEAM_BRIEF[match.homeCode] ?? null;
    const awayB = TEAM_BRIEF[match.awayCode] ?? null;
    const stageCtx = match.group ? `Group ${match.group}` : match.stage || 'Knockout';
    let introBlurb = '';
    if (homeB && awayB) {
      introBlurb = ` ${home} play ${homeB.style}. ${away} bring ${awayB.style}.`;
    }
    out.push({
      id: `${match.id}-story-intro`, type: 'beat', priority: 0, icon: '📖',
      title: `Match story: ${home} vs ${away}`,
      subtext: `${stageCtx} · Final: ${home} ${hs}–${as_} ${away}.${introBlurb} Cards below reconstruct how it played out.`,
      match, firedAt: Date.now(), matchMinute: 1,
    });
  }

  if (!stats) return out;

  const hp   = stats.homePossession || 0;
  const ap   = stats.awayPossession || 0;
  const hSh  = stats.homeShots || 0;
  const aSh  = stats.awayShots || 0;
  const hOT  = stats.homeShotsOnTarget || 0;
  const aOT  = stats.awayShotsOnTarget || 0;
  const totalCorners = (stats.homeCorners || 0) + (stats.awayCorners || 0);
  const totalYellows = (stats.homeYellow  || 0) + (stats.awayYellow  || 0);
  const totalFouls   = (stats.homeFouls   || 0) + (stats.awayFouls   || 0);
  const totalShots   = hSh + aSh;
  const totalGoals   = hs + as_;
  const winner = hs > as_ ? home : (as_ > hs ? away : null);

  // Cards 2-5 below are timeline-only — they don't toast (too many at once for a finished game)

  // Card 2: Possession story (minute 22)
  if (hp > 0 || ap > 0) {
    const posWho  = hp >= ap ? home : away;
    const posOther = hp >= ap ? away : home;
    const posVal  = Math.max(hp, ap);
    const shotWho = hSh >= aSh ? home : away;
    const even    = Math.abs(hp - ap) <= 8;
    let possBody;
    if (even) {
      possBody = `Possession was split evenly — ${home} ${hp}%, ${away} ${ap}%. Neither side could impose territorial control for long. This was a match decided by moments, not dominance.`;
    } else if (posWho === shotWho) {
      const resultLine = winner === posWho
        ? 'and converted that control into the result.'
        : 'but couldn\'t turn it into goals — the result went against the run of play.';
      possBody = `${posWho} dominated with ${posVal}% possession and the more shots — ${resultLine}`;
    } else {
      const counterWho = posWho === home ? away : home;
      possBody = `${posWho} had ${posVal}% of the ball — but ${counterWho} had equal or more shots. A textbook possession-vs-efficiency split. ${winner === counterWho ? `${counterWho} made less count for more.` : winner === posWho ? `${posWho} eventually converted the territorial advantage.` : 'Neither side found a winner.'}`;
    }
    out.push({
      id: `${match.id}-story-possession`, type: 'explain', priority: 0, icon: '📊', silent: true,
      title: `Possession: ${home} ${hp}% — ${away} ${ap}%`,
      subtext: possBody,
      match, firedAt: Date.now(), matchMinute: 22,
    });
  }

  // Card 3: Shot story (minute 46 — just past the HT line)
  if (totalShots > 0) {
    const winnerSh = winner === home ? hSh : (winner === away ? aSh : null);
    const loserSh  = winner === home ? aSh : (winner === away ? hSh : null);
    let shotBody;
    if (totalGoals === 0) {
      shotBody = `${totalShots} shots — ${hSh} from ${home} (${hOT} on target), ${aSh} from ${away} (${aOT} on target). Zero goals. Both keepers had strong games, or the finishing was off. The scoreline doesn't reflect the chances created.`;
    } else if (winner && winnerSh !== null && winnerSh < loserSh) {
      shotBody = `${winner} won despite having fewer shots (${winnerSh} vs ${loserSh}). Clinical finishing beats volume. The other side created more but couldn't convert — that's the lottery of World Cup football.`;
    } else {
      const tempo = totalShots >= 22 ? 'A high-tempo, open match.' : totalShots <= 10 ? 'A tight, chance-starved game — both defenses held firm.' : 'A reasonably open, contested match.';
      shotBody = `${home} had ${hSh} shots (${hOT} on target, ${hs} goals). ${away} had ${aSh} shots (${aOT} on target, ${as_} goals). ${tempo}`;
    }
    out.push({
      id: `${match.id}-story-shots`, type: 'explain', priority: 0, icon: '🎯', silent: true,
      title: `Shots: ${home} ${hSh} — ${away} ${aSh}`,
      subtext: shotBody,
      match, firedAt: Date.now(), matchMinute: 46,
    });
  }

  // Card 4: Physical battle (minute 62) — only if noteworthy
  if (totalFouls >= 8 || totalYellows >= 2) {
    let physBody;
    if (totalYellows >= 4) {
      physBody = `${totalYellows} yellow cards and ${totalFouls} fouls — a physical, tense match. Multiple players were one foul from a red card in the second half. That kind of disciplinary pressure shapes how teams defend late on.`;
    } else if (totalFouls >= 22) {
      physBody = `${totalFouls} fouls across 90 minutes — this was a combative encounter.${totalYellows > 0 ? ` ${totalYellows} yellow card${totalYellows > 1 ? 's' : ''} issued.` : ''} At this level, foul counts that high usually signal a team disrupting the other's rhythm deliberately.`;
    } else {
      physBody = `${totalFouls} fouls, ${totalYellows} yellow${totalYellows !== 1 ? 's' : ''} — physical but within normal range for a competitive World Cup match.`;
    }
    out.push({
      id: `${match.id}-story-physical`, type: 'explain', priority: 0, icon: '💪', silent: true,
      title: `${totalFouls} fouls · ${totalYellows} yellow cards`,
      subtext: physBody,
      match, firedAt: Date.now(), matchMinute: 62,
    });
  }

  // Card 5: Set pieces (minute 75) — only if corners were a major factor
  if (totalCorners >= 6) {
    const hC = stats.homeCorners || 0;
    const aC = stats.awayCorners || 0;
    const cornerWho = hC >= aC ? home : away;
    out.push({
      id: `${match.id}-story-setpieces`, type: 'explain', priority: 0, icon: '🚩', silent: true,
      title: `${totalCorners} corners — ${cornerWho} pressed from wide`,
      subtext: `${totalCorners} corners is a significant number — ${cornerWho} (${Math.max(hC, aC)}) was consistently dangerous from wide positions and set pieces. At World Cup level roughly 1 in 10 goals comes from a corner or direct free kick.`,
      match, firedAt: Date.now(), matchMinute: 75,
    });
  }

  // Clock check-ins — retroactive milestones at each key interval.
  // Use final score for context but honest that these are looking back.
  for (const [t, cfg] of Object.entries(MILESTONES)) {
    const min = Number(t);
    const bodyFn = RETRO_MILESTONE_BODIES[min];
    if (!bodyFn) continue;
    out.push({
      id: `${match.id}-retro-milestone-${min}`,
      type: 'milestone', priority: 0, icon: cfg.icon, silent: true,
      title: cfg.title,
      subtext: bodyFn(match, hs, as_),
      match, firedAt: Date.now(), matchMinute: min,
    });
  }

  return out;
}

// ─── Goal explainer card ──────────────────────────────────────────────────────

function buildGoalCard(match, espn, summary, guard, chosenCode, currentMinute) {
  const hs   = espn?.homeScore ?? 0;
  const as_  = espn?.awayScore ?? 0;
  const home = match.homeTeam;
  const away = match.awayTeam;
  const events = summary?.events ?? [];

  const prevHs  = guard.prevHomeScore ?? 0;
  const prevAs_ = guard.prevAwayScore ?? 0;
  const homeDiff = hs - prevHs;
  const scoringTeam = homeDiff > 0 ? 'home' : 'away';

  // Find the most recent goal event not yet attributed
  const goalFamilies = ['goal', 'penalty', 'own-goal'];
  const unattributed = events.filter(ev =>
    goalFamilies.includes(ev.family) &&
    (ev.minute ?? 0) <= (currentMinute ?? 90) + 2 &&
    !guard.firedStatKeys.has(`goal-ev-${ev.id}`)
  );
  const goalEvent = unattributed[unattributed.length - 1] ?? null;
  if (goalEvent) guard.firedStatKeys.add(`goal-ev-${goalEvent.id}`);

  // Determine goal type
  let goalType = 'open play';
  let isOwnGoal = false;

  if (goalEvent) {
    if (goalEvent.family === 'penalty') {
      goalType = 'penalty';
    } else if (goalEvent.family === 'own-goal' || goalEvent.isOwnGoal) {
      goalType = 'own goal';
      isOwnGoal = true;
    } else {
      const goalMin = goalEvent.minute ?? currentMinute ?? 0;
      const recent  = events.filter(ev => ev.minute >= goalMin - 3 && ev.minute < goalMin);
      if (recent.some(ev => ev.family === 'corner'))     goalType = 'corner';
      else if (recent.some(ev => ev.family === 'foul'))  goalType = 'free kick';
    }
  }

  // The team that benefits from the goal
  const benefitTeam = isOwnGoal
    ? (scoringTeam === 'home' ? away : home)
    : (scoringTeam === 'home' ? home : away);

  const scorer    = goalEvent?.scorer ?? null;
  const scorerStr = scorer ? ` (${scorer})` : '';
  const scoreline = `${hs}–${as_}`;

  let typeLabel, titleText, subtext;

  if (goalType === 'penalty') {
    typeLabel = 'Penalty';
    titleText = `Penalty goal${scorerStr} — ${benefitTeam}. Now ${scoreline}.`;
    subtext   = `A penalty is awarded for a foul inside the 18-yard box. The taker shoots from 12 yards with only the goalkeeper to beat — but the keeper must pick a side to dive before the ball is struck. World Cup conversion rate is around 75%. It's a straight psychological duel: technique meets nerve.`;
  } else if (goalType === 'own goal') {
    typeLabel = 'Own goal';
    titleText = `Own goal — ${benefitTeam} benefit. Now ${scoreline}.`;
    subtext   = `An own goal occurs when a defender puts the ball into their own net — most often from a cross, shot, or clearance under pressure. They account for roughly 5% of World Cup goals. At this level, forwards deliver balls at pace with intelligent runs; defenders must intercept or deflect, and sometimes the geometry just doesn't work out.`;
  } else if (goalType === 'corner') {
    typeLabel = 'Set piece';
    titleText = `Set piece goal${scorerStr} — ${benefitTeam}. Now ${scoreline}.`;
    subtext   = `A goal from a corner kick situation — the ball delivered from the corner flag into the penalty area. Around 25–30% of World Cup goals originate from set pieces. Teams rehearse these routines intensively: blockers, movers, target players, second-ball runners. The defending team knows it's coming and still can't always stop it.`;
  } else if (goalType === 'free kick') {
    typeLabel = 'Free kick';
    titleText = `Free kick goal${scorerStr} — ${benefitTeam}. Now ${scoreline}.`;
    subtext   = `A goal from a free kick situation near the box. A defensive wall blocks the direct path, but a curled or dipped shot over it is nearly unstoppable when executed well. Direct free kick conversion rates are below 10% at this level — but when they go in, they tend to be spectacular. The threat alone disrupts defensive shape.`;
  } else if (goalType === 'counter') {
    const hp = summary?.stats?.homePossession ?? 50;
    const ap = summary?.stats?.awayPossession ?? 50;
    const defPoss = scoringTeam === 'home' ? ap : hp;
    typeLabel = 'Counter';
    titleText = `Counter-attack goal${scorerStr} — ${benefitTeam}. Now ${scoreline}.`;
    subtext   = `A counter-attack goal — ${benefitTeam} absorbed ${defPoss}% possession and punished the opponent in space. Counter-attacks are most dangerous when the opposition commits players forward: the defensive line is stretched, wide channels are open, and one or two passes can create a clean chance. Speed + composure = the counter-attack goal.`;
  } else {
    typeLabel = 'Open play';
    titleText = `Goal${scorerStr} — ${benefitTeam}. Now ${scoreline}.`;
    subtext   = `An open-play goal built through passing, movement, and timing. This type of goal requires multiple players to read the same moment simultaneously — the run, the pass weight, the finish. Defenders must track the ball or the runner, rarely both at once. This is what winning the tactical battle looks like in real time.`;
  }

  // Perspective note
  if (chosenCode) {
    const yourTeam  = chosenCode === match.homeCode ? home : away;
    const yourScore = chosenCode === match.homeCode ? hs : as_;
    const theirScore = chosenCode === match.homeCode ? as_ : hs;
    const youScored = benefitTeam === yourTeam;
    if (youScored && yourScore > theirScore)      subtext += ` Your ${yourTeam} lead now.`;
    else if (youScored && yourScore === theirScore) subtext += ` Your ${yourTeam} have levelled it.`;
    else if (!youScored && theirScore > yourScore)  subtext += ` Your ${yourTeam} are now trailing — a response is needed.`;
    else if (!youScored && theirScore === yourScore) subtext += ` They've pegged ${yourTeam} back — level again.`;
  }

  return {
    id:            `${match.id}-goal-${hs}-${as_}`,
    type:          'goal',
    priority:      4,
    icon:          '⚽',
    title:         titleText,
    subtext,
    match,
    firedAt:       Date.now(),
    matchMinute:   currentMinute ?? null,
    goalTypeLabel: typeLabel,
    ...(!goalEvent ? {
      pending: true,
      pendingScoreline: { hs, as_ },
    } : {}),
  };
}

// ─── FT card builder ─────────────────────────────────────────────────────────
// Shared by deriveNotifs (live → post) and buildReplayDeck (cold load).

function buildFTCard(match, espn, summary, guard, chosenCode) {
  const hs   = espn?.homeScore ?? 0;
  const as_  = espn?.awayScore ?? 0;
  const stats = summary?.stats;
  const resultWho = hs > as_ ? match.homeTeam : (as_ > hs ? match.awayTeam : null);
  const synthLines = [];

  // Result
  if (chosenCode) {
    const yourTeam   = chosenCode === match.homeCode ? match.homeTeam : match.awayTeam;
    const yourScore  = chosenCode === match.homeCode ? hs : as_;
    const theirScore = chosenCode === match.homeCode ? as_ : hs;
    if (yourScore > theirScore)      synthLines.push(`Your ${yourTeam} win ${yourScore}–${theirScore}. A brilliant result.`);
    else if (yourScore < theirScore) synthLines.push(`Your ${yourTeam} lose ${yourScore}–${theirScore}. A tough night.`);
    else                             synthLines.push(`Your ${yourTeam} draw ${yourScore}–${theirScore} — one point each.`);
  } else if (hs === as_) {
    synthLines.push(`${match.homeTeam} ${hs}–${as_} ${match.awayTeam} — a draw, both teams take 1 point.`);
  } else {
    synthLines.push(`${resultWho} win ${Math.max(hs,as_)}–${Math.min(hs,as_)}.`);
  }

  // Stats story
  if (stats) {
    const hp = stats.homePossession || 0, ap = stats.awayPossession || 0;
    const hShots = stats.homeShots || 0, aShots = stats.awayShots || 0;
    const totalShots = hShots + aShots;
    const posWho   = hp >= ap ? match.homeTeam : match.awayTeam;
    const posOther = hp >= ap ? match.awayTeam : match.homeTeam;
    const posVal   = Math.max(hp, ap);
    const shotWho  = hShots >= aShots ? match.homeTeam : match.awayTeam;
    if (posVal >= 55 && totalShots > 0) {
      synthLines.push(posWho === shotWho
        ? `${posWho} were dominant — ${posVal}% possession and the most shots.`
        : `${posWho} had ${posVal}% of the ball but ${posOther} were more efficient — quality over quantity decided this.`);
    } else if (totalShots > 0) {
      synthLines.push(`${totalShots} combined shots — a contested game throughout.`);
    }
    if (guard.firedStatKeys.has('counter-attack')) {
      synthLines.push(`The counter-attack pattern that developed midway through proved decisive.`);
    }
  }

  // Group implications
  if (match.group) {
    synthLines.push(hs !== as_
      ? `${resultWho} take 3 points in Group ${match.group}. Every point counts — the top two advance.`
      : `One point each in Group ${match.group}. Useful, but neither team wins the group purely on draws.`);
  }

  const ftTitle = (() => {
    if (!chosenCode) return `Full time: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}`;
    const yourTeam   = chosenCode === match.homeCode ? match.homeTeam : match.awayTeam;
    const yourScore  = chosenCode === match.homeCode ? hs : as_;
    const theirScore = chosenCode === match.homeCode ? as_ : hs;
    const score      = `${match.homeTeam} ${hs}–${as_} ${match.awayTeam}`;
    if (yourScore > theirScore) return `Your ${yourTeam} win! ${score}`;
    if (yourScore < theirScore) return `${yourTeam} lose — ${score}`;
    return `${yourTeam} draw — ${score}`;
  })();

  return {
    id: `${match.id}-post`, type: 'post', priority: 5, icon: '🏁',
    title: ftTitle, subtext: synthLines.join(' '),
    match, firedAt: Date.now(), matchMinute: 90,
  };
}

// ─── Replay deck builder ──────────────────────────────────────────────────────
// Called when a completed match is loaded cold (not watched live). Cards fire
// only through the playback mechanism, not directly into the notification log.

function buildReplayDeck(match, espn, summary, guard, chosenCode) {
  const storyCards = buildPostGameStory(match, espn, summary, guard);
  const ftCard     = buildFTCard(match, espn, summary, guard, chosenCode);
  const goalCards  = [];
  let prevHs = 0;
  let prevAs_ = 0;

  for (const entry of summary?.scoreTimeline ?? []) {
    const syntheticGuard = {
      ...guard,
      prevHomeScore: prevHs,
      prevAwayScore: prevAs_,
      firedStatKeys: new Set(guard.firedStatKeys),
    };
    const syntheticEspn = {
      ...espn,
      homeScore: entry.homeScore,
      awayScore: entry.awayScore,
    };
    goalCards.push(buildGoalCard(match, syntheticEspn, summary, syntheticGuard, chosenCode, entry.minute));
    prevHs = entry.homeScore;
    prevAs_ = entry.awayScore;
  }

  return [...storyCards, ...goalCards, ftCard].sort((a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0));
}

// ─── Notification derivation ──────────────────────────────────────────────────

const BAND_COOLDOWN_MS = 3 * 60_000;

function deriveNotifs(match, espn, summary, ex, guard, chosenCode = null) {
  const out    = [];
  const isLive = espn?.state === 'in';
  const isPost = espn?.state === 'post';
  const stats  = summary?.stats;
  const hs     = espn?.homeScore ?? 0;
  const as_    = espn?.awayScore ?? 0;
  const period = espn?.period ?? 0;
  const currentMinute = parseMinute(espn?.clock) ?? null;

  // ── LAYER 1: BEAT CARDS ──────────────────────────────────────────────────

  if (isLive && guard.prevEspnState !== 'in' && !guard.firedStatKeys.has('kickoff')) {
    guard.firedStatKeys.add('kickoff');
    const stageCtx = match.group
      ? `Group ${match.group} — 3 points for a win, 1 for a draw, 0 for a loss`
      : match.stage || 'Knockout round';

    const homeB = TEAM_BRIEF[match.homeCode] ?? null;
    const awayB = TEAM_BRIEF[match.awayCode] ?? null;
    let styleBlurb;
    if (chosenCode) {
      const yourCode  = chosenCode;
      const theirCode = chosenCode === match.homeCode ? match.awayCode : match.homeCode;
      const yourTeam  = chosenCode === match.homeCode ? match.homeTeam : match.awayTeam;
      const theirTeam = chosenCode === match.homeCode ? match.awayTeam : match.homeTeam;
      const yourB  = TEAM_BRIEF[yourCode]  ?? null;
      const theirB = TEAM_BRIEF[theirCode] ?? null;
      if (yourB && theirB) {
        styleBlurb = `Your ${yourTeam} play ${yourB.style}. Key thing to watch: ${yourB.watchFor}. The challenge from ${theirTeam}: ${theirB.watchFor}.`;
      } else if (yourB) {
        styleBlurb = `Your ${yourTeam} play ${yourB.style}. Watch for: ${yourB.watchFor}.`;
      } else {
        styleBlurb = `Watch who controls the ball in the first 10 minutes — the team that sets the tempo early often dictates the whole match.`;
      }
    } else if (homeB && awayB) {
      styleBlurb = `${match.homeTeam} play ${homeB.style}. ${match.awayTeam} lean ${awayB.style}. First thing to watch: ${homeB.watchFor}. And from ${match.awayTeam}: ${awayB.watchFor}.`;
    } else if (homeB) {
      styleBlurb = `${match.homeTeam} play ${homeB.style}. Watch for: ${homeB.watchFor}.`;
    } else if (awayB) {
      styleBlurb = `${match.awayTeam} play ${awayB.style}. Watch for: ${awayB.watchFor}.`;
    } else {
      styleBlurb = `Watch who controls the ball in the first 10 minutes — the team that sets the tempo early often dictates the whole match.`;
    }

    out.push({
      id: `${match.id}-kickoff`, type: 'beat', priority: 3, icon: '⚽',
      title: `Underway: ${match.homeTeam} vs ${match.awayTeam}`,
      subtext: `${stageCtx}. ${styleBlurb}`,
      match, firedAt: Date.now(), matchMinute: 0,
    });
  }

  if (isLive && period >= 2 && (guard.prevPeriod ?? 0) < 2 && !guard.firedStatKeys.has('second-half')) {
    guard.firedStatKeys.add('second-half');
    let htStat = '';
    if (stats) {
      const totalShots = (stats.homeShots||0) + (stats.awayShots||0);
      const hp = stats.homePossession || 0, ap = stats.awayPossession || 0;
      const who = hp >= ap ? match.homeTeam : match.awayTeam;
      const val = Math.max(hp, ap);
      htStat = val > 0
        ? `${who} had ${val}% possession and there were ${totalShots} shots. `
        : `${totalShots} shots in the first half. `;
    }
    let scoreCtx;
    if (chosenCode) {
      const yourTeam  = chosenCode === match.homeCode ? match.homeTeam : match.awayTeam;
      const yourScore = chosenCode === match.homeCode ? hs : as_;
      const theirScore = chosenCode === match.homeCode ? as_ : hs;
      if (yourScore > theirScore) {
        scoreCtx = `Your ${yourTeam} lead ${yourScore}–${theirScore}. 45 minutes to protect it — second-half leads get tested hard. Stay organized.`;
      } else if (yourScore < theirScore) {
        scoreCtx = `Your ${yourTeam} trail ${yourScore}–${theirScore}. 45 minutes to turn it around. Comebacks at the World Cup are rare but they happen — and they start with the next goal.`;
      } else {
        scoreCtx = `Still ${hs}–${as_} — your ${yourTeam} have 45 minutes to make the difference.`;
      }
    } else {
      scoreCtx = hs === as_
        ? `Still ${hs}–${as_} — 45 minutes to break the deadlock.`
        : `${hs > as_ ? match.homeTeam : match.awayTeam} lead ${Math.max(hs,as_)}–${Math.min(hs,as_)}. The trailing team will now push forward and leave space at the back.`;
    }
    out.push({
      id: `${match.id}-second-half`, type: 'beat', priority: 3, icon: '🔄',
      title: `Second half — here's the story so far`,
      subtext: `${htStat}${scoreCtx}`,
      match, firedAt: Date.now(), matchMinute: 45,
    });
  }

  if (isLive && period >= 3 && (guard.prevPeriod ?? 0) < 3 && !guard.firedStatKeys.has('extra-time')) {
    guard.firedStatKeys.add('extra-time');
    out.push({
      id: `${match.id}-extra-time`, type: 'beat', priority: 3, icon: '⏱',
      title: `Extra time — 30 more minutes to decide this`,
      subtext: `Neither team could separate themselves in 90 minutes. Extra time is two 15-minute halves — first to score doesn't win automatically (unlike Golden Goal rules of the past). If it's still level after 120 minutes, it goes to a penalty shootout. Fatigue is now a tactical weapon: tired legs, fresh substitutes, and psychological pressure at maximum.`,
      match, firedAt: Date.now(), matchMinute: 90,
    });
  }

  if (isLive && period >= 5 && (guard.prevPeriod ?? 0) < 5 && !guard.firedStatKeys.has('penalties')) {
    guard.firedStatKeys.add('penalties');
    out.push({
      id: `${match.id}-penalties`, type: 'beat', priority: 3, icon: '🥅',
      title: `Penalty shootout — sudden death`,
      subtext: `After 120 minutes of soccer, the result comes down to five kicks per side from 12 yards. Each player walks up alone. The goalkeeper has no data on where the ball is going — they pick a side and dive. World Cup shootout conversion rate: ~73%. The team that scores all five and whose goalkeeper saves one wins. Some of the most dramatic moments in sports history happen in the next few minutes.`,
      match, firedAt: Date.now(), matchMinute: 120,
    });
  }

  // ── GOAL CATCH-UP ────────────────────────────────────────────────────────
  // prevHomeScore was set to the existing score on guard init, so the normal
  // poll-to-poll delta is 0 for any goal scored before the page loaded. This
  // block fires once on the first processing tick to surface those goals.
  if (isLive && !guard.catchupChecked) {
    guard.catchupChecked = true;
    if (hs + as_ > 0) {
      if (summary?.scoreTimeline?.length) {
        let prevHs = 0, prevAs = 0;
        for (const entry of summary.scoreTimeline) {
          const goalKey = `goal-${entry.homeScore}-${entry.awayScore}`;
          if (!guard.firedStatKeys.has(goalKey)) {
            guard.firedStatKeys.add(goalKey);
            const synEspn  = { ...espn, homeScore: entry.homeScore, awayScore: entry.awayScore };
            const synGuard = { ...guard, prevHomeScore: prevHs, prevAwayScore: prevAs };
            out.push(buildGoalCard(match, synEspn, summary, synGuard, chosenCode, entry.minute));
          }
          prevHs = entry.homeScore;
          prevAs = entry.awayScore;
        }
      } else {
        // Summary not yet available — fire one card for the current scoreline
        const goalKey = `goal-${hs}-${as_}`;
        if (!guard.firedStatKeys.has(goalKey)) {
          guard.firedStatKeys.add(goalKey);
          const synGuard = { ...guard, prevHomeScore: 0, prevAwayScore: 0 };
          out.push(buildGoalCard(match, espn, summary, synGuard, chosenCode, currentMinute));
        }
      }
    }
  }

  // ── GOAL DETECTION ────────────────────────────────────────────────────────
  if (isLive && guard.prevHomeScore !== null && guard.prevAwayScore !== null) {
    const prevTotal = guard.prevHomeScore + guard.prevAwayScore;
    const currTotal = hs + as_;
    const totalNewGoals = currTotal - prevTotal;
    if (totalNewGoals >= 2 && summary?.scoreTimeline?.length) {
      const newEntries = summary.scoreTimeline.filter(entry =>
        (entry.homeScore + entry.awayScore) > prevTotal
        && (entry.homeScore + entry.awayScore) <= currTotal
      );
      let iterPrevHs = guard.prevHomeScore;
      let iterPrevAs = guard.prevAwayScore;
      for (const entry of newEntries) {
        const entryKey = `goal-${entry.homeScore}-${entry.awayScore}`;
        if (!guard.firedStatKeys.has(entryKey)) {
          guard.firedStatKeys.add(entryKey);
          const syntheticEspn = {
            ...espn,
            homeScore: entry.homeScore,
            awayScore: entry.awayScore,
          };
          const syntheticGuard = {
            ...guard,
            prevHomeScore: iterPrevHs,
            prevAwayScore: iterPrevAs,
          };
          out.push(buildGoalCard(match, syntheticEspn, summary, syntheticGuard, chosenCode, entry.minute));
        }
        iterPrevHs = entry.homeScore;
        iterPrevAs = entry.awayScore;
      }
    } else if (totalNewGoals >= 2) {
      const goalKey = `goal-${hs}-${as_}`;
      if (!guard.firedStatKeys.has(goalKey)) {
        guard.firedStatKeys.add(goalKey);
        out.push({
          id: `${match.id}-goal-${hs}-${as_}`,
          type: 'goal',
          priority: 4,
          icon: '⚽',
          title: `Multiple goals landed in quick succession — now ${hs}–${as_}`,
          subtext: `The scoreboard jumped by ${totalNewGoals} goals between polls, which usually means a fast exchange of chances or a delayed broadcast update. The current score is reliable even if the intermediate goal sequence hasn't reached the summary feed yet.`,
          match,
          firedAt: Date.now(),
          matchMinute: currentMinute ?? null,
          goalTypeLabel: 'Multiple goals',
        });
      }
    } else if (totalNewGoals === 1) {
      const goalKey = `goal-${hs}-${as_}`;
      if (!guard.firedStatKeys.has(goalKey)) {
        guard.firedStatKeys.add(goalKey);
        out.push(buildGoalCard(match, espn, summary, guard, chosenCode, currentMinute));
      }
    }
  }

  if (isPost && !guard.firedPost) {
    guard.firedPost = true;
    out.push(buildFTCard(match, espn, summary, guard, chosenCode));
  }

  // ── LAYER 2: CLOCK MILESTONES ─────────────────────────────────────────────

  if (isLive && currentMinute !== null) {
    for (const [target, cfg] of Object.entries(MILESTONES)) {
      const t = Number(target);
      if (currentMinute >= t && !guard.firedStatKeys.has(`milestone-${t}`)) {
        guard.firedStatKeys.add(`milestone-${t}`);
        const firingLate = currentMinute > t + 5;
        const baseBody   = cfg.body(match, espn, stats, firingLate);
        const stakesLine = (t >= 60) ? getStakesLine(match, hs, as_, chosenCode) : null;
        out.push({
          id: `${match.id}-milestone-${t}`, type: 'milestone', priority: 1,
          icon: cfg.icon, title: cfg.title,
          subtext: stakesLine ? `${baseBody} ${stakesLine}` : baseBody,
          match, firedAt: Date.now(), matchMinute: t,
        });
      }
    }
  }

  // ── LAYER 2.5: SUBSTITUTION AND DISCIPLINE EVENTS ────────────────────────

  if (isLive && summary?.events) {
    const subEvents = summary.events.filter(ev => ev.family === 'substitution');
    let subCardsFired = [...guard.firedStatKeys].filter(k => k.startsWith('sub-ev-')).length;
    for (const ev of subEvents) {
      if (subCardsFired >= 2) break;
      const subKey = `sub-ev-${ev.id}`;
      if (!guard.firedStatKeys.has(subKey)) {
        guard.firedStatKeys.add(subKey);
        subCardsFired++;
        out.push({
          id: `${match.id}-sub-${ev.id}`,
          type: 'explain', priority: 2, icon: '🔄',
          title: `Substitution — ${ev.teamName ?? 'change made'}`,
          subtext: `A substitution signals a tactical shift or injury response. Teams get 5 substitutions per game. Bringing on a fresh player at this stage means the manager wants to change shape, add pace, or protect a result. Watch for what changes in the next 5 minutes — the new player's movement reveals the intent.`,
          match, firedAt: Date.now(), matchMinute: ev.minute ?? currentMinute,
        });
      }
    }

    const redEvents = summary.events.filter(ev => ev.family === 'red-card');
    for (const ev of redEvents) {
      const redKey = `red-ev-${ev.id}`;
      if (!guard.firedStatKeys.has(redKey)) {
        guard.firedStatKeys.add(redKey);
        const teamStr = ev.teamName ? `${ev.teamName} are` : 'One team is';
        out.push({
          id: `${match.id}-red-${ev.id}`,
          type: 'tension', priority: 4, icon: '🟥',
          title: `Red card — ${ev.teamName ?? 'dismissal'}`,
          subtext: `${teamStr} now down to 10 men for the remainder of the match. Statistically, teams with 10 men concede 40% more goals in the following 20 minutes as the defensive shape is stretched. The tactical response is to compress into a deep block and protect the center. With 10 vs 11, every set piece becomes critical — one goal here could decide everything.`,
          match, firedAt: Date.now(), matchMinute: ev.minute ?? currentMinute,
        });
      }
    }
  }

  // ── LAYER 3: EXPLAIN IT CARDS ─────────────────────────────────────────────

  if (isLive && stats) {
    const homeShots    = stats.homeShots    || 0;
    const awayShots    = stats.awayShots    || 0;
    const totalShots   = homeShots + awayShots;
    const totalGoals   = hs + as_;
    const totalYellow  = (stats.homeYellow  || 0) + (stats.awayYellow  || 0);
    const totalFouls   = (stats.homeFouls   || 0) + (stats.awayFouls   || 0);
    const totalCorners = (stats.homeCorners || 0) + (stats.awayCorners || 0);
    const homePoss     = stats.homePossession || 0;
    const awayPoss     = stats.awayPossession || 0;

    if ((homePoss > 0 || awayPoss > 0) && !guard.firedStatKeys.has('possession-intro')) {
      guard.firedStatKeys.add('possession-intro');
      const who   = homePoss >= awayPoss ? match.homeTeam : match.awayTeam;
      const other = homePoss >= awayPoss ? match.awayTeam : match.homeTeam;
      const val   = Math.max(homePoss, awayPoss);
      let possSubtext;
      if (chosenCode) {
        const yourTeam  = chosenCode === match.homeCode ? match.homeTeam : match.awayTeam;
        const yourPoss  = chosenCode === match.homeCode ? homePoss : awayPoss;
        const theirPoss = chosenCode === match.homeCode ? awayPoss : homePoss;
        const otherTeam = chosenCode === match.homeCode ? match.awayTeam : match.homeTeam;
        if (yourPoss > theirPoss) {
          possSubtext = `Your ${yourTeam} have ${yourPoss}% possession — dictating the tempo. High possession means finding space to play through; watch if it translates into shots on goal.`;
        } else {
          possSubtext = `Your ${yourTeam} have ${yourPoss}% — ${otherTeam} are controlling the ball at ${theirPoss}%. Your team is sitting deeper. This is either tactical (waiting to counter) or a sign of pressure. The shot count will tell you which.`;
        }
      } else {
        possSubtext = `Possession = how much of the time each team has had the ball. High possession can mean control — or ${other} is sitting deep and waiting to counter-attack. Watch the shots column to see which story this becomes.`;
      }
      out.push({
        id: `${match.id}-possession-intro`, type: 'explain', priority: 2, icon: '📊',
        title: `${who} with ${val}% possession`,
        subtext: possSubtext,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalCorners >= 1 && !guard.firedStatKeys.has('corner-intro')) {
      guard.firedStatKeys.add('corner-intro');
      out.push({
        id: `${match.id}-corner-intro`, type: 'explain', priority: 2, icon: '🚩',
        title: `First corner kick of the match`,
        subtext: `A corner happens when a defender puts the ball over their own goal line. The attacking team gets a free kick from the corner flag — a prime chance for a headed goal. About 1 in 10 World Cup goals comes from a corner situation.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalYellow >= 1 && !guard.firedStatKeys.has('yellow-intro')) {
      guard.firedStatKeys.add('yellow-intro');
      out.push({
        id: `${match.id}-yellow-intro`, type: 'explain', priority: 2, icon: '🟨',
        title: `First yellow card`,
        subtext: `A yellow card is a formal warning from the referee. Two yellows in one game = sent off (that team plays with 10 vs 11 for the rest). Two yellows across different matches = suspended next game — teams in the knockouts protect key players very carefully.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalShots >= 5 && totalGoals === 0 && !guard.firedStatKeys.has('shot-drought')) {
      guard.firedStatKeys.add('shot-drought');
      out.push({
        id: `${match.id}-shot-drought`, type: 'explain', priority: 2, icon: '🧤',
        title: `${totalShots} shots — both keepers holding firm`,
        subtext: `Most shots in soccer don't score. A goalkeeper saves around 70% of shots on target at World Cup level, and many shots miss entirely. The World Cup average is 2–3 goals per 90 minutes — patience is a weapon and one mistake changes everything.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (!guard.firedStatKeys.has('counter-attack')) {
      const homeCountering = awayPoss >= 60 && homeShots >= awayShots && totalShots >= 4;
      const awayCountering = homePoss >= 60 && awayShots >= homeShots && totalShots >= 4;
      if (homeCountering || awayCountering) {
        guard.firedStatKeys.add('counter-attack');
        const counter  = homeCountering ? match.homeTeam : match.awayTeam;
        const dominant = homeCountering ? match.awayTeam : match.homeTeam;
        const domPoss  = homeCountering ? awayPoss : homePoss;
        out.push({
          id: `${match.id}-counter-attack`, type: 'explain', priority: 2, icon: '⚡',
          title: `${counter} counter-attacking with less of the ball`,
          subtext: `${dominant} has ${domPoss}% possession but ${counter} has equal or more shots. Classic counter-attack: sit deep, defend in numbers, then explode forward the moment you win the ball back. It's a legitimate tactical choice — and it works.`,
          match, firedAt: Date.now(), matchMinute: currentMinute,
        });
      }
    }

    if (totalFouls >= 8 && !guard.firedStatKeys.has('physical')) {
      guard.firedStatKeys.add('physical');
      out.push({
        id: `${match.id}-physical`, type: 'explain', priority: 2, icon: '💪',
        title: `${totalFouls} fouls — this one's getting physical`,
        subtext: `A foul stops play and gives the other team a free kick. Near the penalty box, that's nearly as dangerous as a corner. When fouls pile up, one team is winning the physical battle — or getting desperate. Watch for yellow cards to follow.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalYellow >= 4 && !guard.firedStatKeys.has('yellow-wave')) {
      guard.firedStatKeys.add('yellow-wave');
      out.push({
        id: `${match.id}-yellow-wave`, type: 'explain', priority: 2, icon: '🟨',
        title: `${totalYellow} yellow cards — players on the edge`,
        subtext: `With this many yellows, some players are one foul from a red card (sent off). Teams often substitute booked players to protect their numerical advantage. A red card with 30+ minutes left changes the entire tactical shape of a match.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }
  }

  // ── LAYER 4: TENSION BAND CROSSINGS ──────────────────────────────────────

  if (isLive && guard.prevExScore !== null) {
    const CROSSINGS = [
      {
        key: 'tense', min: 60, icon: '🔥', title: 'The match is getting tense',
        sub: () => {
          const ctx = hs === as_
            ? `Level at ${hs}–${as_} — a goal now changes everything.`
            : `${hs > as_ ? match.homeTeam : match.awayTeam} lead, but no lead is safe in soccer.`;
          const counterRef = guard.firedStatKeys.has('counter-attack')
            ? ` The counter-attack pattern we identified is now under maximum pressure.`
            : '';
          const perspRef = chosenCode
            ? ` ${(() => { const yours = chosenCode === match.homeCode ? hs : as_; const theirs = chosenCode === match.homeCode ? as_ : hs; const team = chosenCode === match.homeCode ? match.homeTeam : match.awayTeam; return yours >= theirs ? `Hold strong, ${team}.` : `Push now, ${team}.`; })()}`
            : '';
          return `${ctx}${counterRef} Clock pressure, attacking patterns, and score situation are all elevated.${perspRef}`;
        },
      },
      {
        key: 'high_alert', min: 75, icon: '⚡', title: 'Final stretch — maximum pressure',
        sub: () => `This is when World Cup games are decided. Tired legs, tactical changes, set pieces in dangerous areas — everything that's been building is coming to a head.`,
      },
    ];
    for (const c of CROSSINGS) {
      if (guard.prevExScore < c.min && ex.score >= c.min) {
        const lastFired = guard.firedBands[c.key] ?? 0;
        if (Date.now() - lastFired > BAND_COOLDOWN_MS) {
          guard.firedBands[c.key] = Date.now();
          out.push({
            id: `${match.id}-${c.key}-${Date.now()}`, type: 'tension', priority: 4,
            icon: c.icon, title: c.title, subtext: c.sub(),
            match, firedAt: Date.now(), matchMinute: currentMinute,
          });
        }
      }
    }
  }

  // ── LAYER 4.5: NARRATIVE THREAD — DANGER ZONE ────────────────────────────
  if (
    isLive &&
    currentMinute != null && currentMinute >= 70 &&
    hs === as_ &&
    guard.firedStatKeys.has('counter-attack') &&
    !guard.firedStatKeys.has('danger-zone')
  ) {
    guard.firedStatKeys.add('danger-zone');
    const hp = stats?.homePossession || 0;
    const ap = stats?.awayPossession || 0;
    const dominant = hp >= ap ? match.homeTeam : match.awayTeam;
    const counter = hp >= ap ? match.awayTeam : match.homeTeam;
    const domPoss = Math.max(hp, ap);
    out.push({
      id: `${match.id}-danger-zone`, type: 'tension', priority: 4, icon: '⚡',
      title: `Level at ${currentMinute}' — the counter-attack tension is now critical`,
      subtext: `Earlier we flagged the counter-attack pattern: ${dominant} with ${domPoss}% possession, ${counter} creating chances from fewer touches. That dynamic is now at maximum pressure. A single counter-attack goal in this window could be the decisive moment of the match. One mistake in transition ends this game.`,
      match, firedAt: Date.now(), matchMinute: currentMinute,
    });
  }

  return out;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  beat:      '#06b6d4',
  milestone: '#6366f1',
  explain:   '#a78bfa',
  tension:   '#f59e0b',
  post:      '#22c55e',
  goal:      '#f97316',
};

const TYPE_LABELS = {
  beat:      'match',
  milestone: 'check-in',
  explain:   'explain it',
  tension:   'tension',
  post:      'full time',
  goal:      'goal',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LivePulse() {
  const { matches }  = useMatches();
  const today        = useMemo(makeTodayStr, []);
  const todayMatches = useMemo(() => matches.filter(m => m.date === today), [matches, today]);

  const [espnMap,         setEspnMap]         = useState({});
  const [summaryMap,      setSummaryMap]       = useState({});
  const [exMap,           setExMap]           = useState({});
  const [notifLog,        setNotifLog]         = useState([]);
  const [toastStack,      setToastStack]       = useState([]);
  const [lastPoll,        setLastPoll]         = useState(null);
  const [pollCount,       setPollCount]        = useState(0);
  const [feedError,       setFeedError]        = useState(false);
  const [selectedMatchId, setSelectedMatchId]  = useState(null);
  const [selectedCardId,  setSelectedCardId]   = useState(null);
  const [adminOpen,       setAdminOpen]        = useState(false);
  const [soundEnabled,    setSoundEnabled]     = useState(false);
  const [snapshotOpen,    setSnapshotOpen]     = useState(false);

  const [chosenTeams,    setChosenTeams]    = useState({});
  const [replayStateMap, setReplayStateMap] = useState({});
  const [replayCardsMap, setReplayCardsMap] = useState({});
  const [replayLoadStartMap, setReplayLoadStartMap] = useState({});

  const guardsRef          = useRef({});
  const summaryMapRef      = useRef({});
  const selectedMatchIdRef = useRef(null);
  const soundEnabledRef    = useRef(false);
  const chosenTeamsRef     = useRef({});
  const replayIntervalsRef = useRef({});
  const [, tick_]          = useState(0);

  useEffect(() => { selectedMatchIdRef.current = selectedMatchId; }, [selectedMatchId]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { chosenTeamsRef.current = chosenTeams; }, [chosenTeams]);
  useEffect(() => { summaryMapRef.current = summaryMap; }, [summaryMap]);

  // Relative-time refresh
  useEffect(() => {
    const id = setInterval(() => tick_(n => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Auto-select live match
  useEffect(() => {
    const live = todayMatches.find(m => espnMap[m.id]?.state === 'in');
    if (live) {
      setSelectedMatchId(live.id);
    } else if (!selectedMatchIdRef.current && todayMatches.length > 0) {
      setSelectedMatchId(todayMatches[0].id);
    }
  }, [espnMap, todayMatches]);

  // Persistent toast stack
  const dismissToast = useCallback((id) => {
    setToastStack(prev => prev.filter(t => t.id !== id));
  }, []);

  function pushToasts(notifs) {
    const toastable = notifs.filter(n => !n.silent);
    if (!toastable.length) return;
    setToastStack(prev => {
      const next = [...toastable.slice().reverse(), ...prev];
      return next.slice(0, 8);
    });
  }

  // Cleanup any in-progress replay intervals on unmount
  useEffect(() => () => {
    Object.values(replayIntervalsRef.current).forEach(clearInterval);
  }, []);

  function startPlayback(matchId) {
    if (replayStateMap[matchId] === 'playing') return;
    if (replayIntervalsRef.current[matchId]) {
      clearInterval(replayIntervalsRef.current[matchId]);
      delete replayIntervalsRef.current[matchId];
    }
    const cards = replayCardsMap[matchId];
    if (!cards?.length) return;
    setReplayStateMap(prev => ({ ...prev, [matchId]: 'playing' }));
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= cards.length) {
        clearInterval(interval);
        delete replayIntervalsRef.current[matchId];
        setReplayStateMap(prev => ({ ...prev, [matchId]: 'done' }));
        return;
      }
      const card = { ...cards[idx], silent: true };
      setNotifLog(prev => {
        if (prev.some(n => n.id === card.id)) { idx++; return prev; }
        return [...prev, card].sort((a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0));
      });
      setSelectedCardId(card.id);
      idx++;
    }, 2000);
    replayIntervalsRef.current[matchId] = interval;
  }

  // ── ESPN polling loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!todayMatches.length) return;
    let cancelled = false;

    const runTick = async () => {
      try {
        const espnEvents = await fetchEspnScoreboard(today);
        if (cancelled) return;

        const nextEspn = {};
        for (const m of todayMatches) nextEspn[m.id] = matchEspnStatus(espnEvents, m);
        setFeedError(false);
        setEspnMap(nextEspn);
        setLastPoll(Date.now());
        setPollCount(c => c + 1);

        const matchPass = todayMatches.map(m => {
          const espn = nextEspn[m.id];
          if (!guardsRef.current[m.id]) {
            const saved = (() => {
              try {
                const raw = sessionStorage.getItem(`lp-guard-${m.id}`);
                return raw ? JSON.parse(raw) : null;
              } catch {
                return null;
              }
            })();

            guardsRef.current[m.id] = saved ? {
              ...saved,
              firedStatKeys: new Set(saved.firedStatKeys ?? []),
            } : {
              initialized: false, prevExScore: null,
              prevEspnState: null, prevPeriod: null,
              prevHomeScore: null, prevAwayScore: null,
              catchupChecked: false,
              firedBands: {}, firedStatKeys: new Set(), firedPost: false,
            };
          }
          const guard = guardsRef.current[m.id];
          const eventId = matchEspnEventId(espnEvents, m);
          const needsSummary = (espn?.state === 'in' || (espn?.state === 'post' && !guard.firedPost)) && !!eventId;
          return { match: m, espn, guard, eventId, needsSummary };
        });

        const summaryJobs = matchPass
          .filter(({ needsSummary, eventId }) => needsSummary && eventId)
          .map(({ match, eventId }) =>
            fetchEspnSummary(eventId)
              .then(raw => ({
                matchId: match.id,
                summary: normalizeEspnSoccerSummary(raw, match),
              }))
              .catch(() => null)
          );

        const summaryFetches = await Promise.all(summaryJobs);
        if (cancelled) return;

        const summaryResults = {};
        for (const result of summaryFetches) {
          if (result) summaryResults[result.matchId] = result.summary;
        }
        const mergedSummaryMap = { ...summaryMapRef.current, ...summaryResults };

        const nextEx    = {};
        const newNotifs = [];

        for (const { match: m, espn, guard } of matchPass) {
          const summary = mergedSummaryMap[m.id];

          const ex = computeMatchExcitement(m, espn, [], summary || {});
          nextEx[m.id] = ex;

          const watchedLive = guard.firedStatKeys.has('kickoff');
          const isPostGame  = espn?.state === 'post';

          if (!guard.initialized) {
            guard.initialized   = true;
            guard.prevExScore   = ex.score;
            guard.prevEspnState = espn?.state ?? null;
            guard.prevPeriod    = espn?.period ?? null;
            guard.prevHomeScore = espn?.homeScore ?? 0;
            guard.prevAwayScore = espn?.awayScore ?? 0;
            // Show loading state immediately on first detection of a cold post game
            if (isPostGame && !watchedLive) {
              setReplayStateMap(prev => ({ ...prev, [m.id]: 'loading' }));
              setReplayLoadStartMap(prev => ({ ...prev, [m.id]: Date.now() }));
            }
            try {
              sessionStorage.setItem(`lp-guard-${m.id}`, JSON.stringify({
                initialized: true,
                prevExScore: guard.prevExScore,
                prevEspnState: guard.prevEspnState,
                prevPeriod: guard.prevPeriod,
                prevHomeScore: guard.prevHomeScore,
                prevAwayScore: guard.prevAwayScore,
                firedStatKeys: [...guard.firedStatKeys],
                firedBands: guard.firedBands,
                firedPost: guard.firedPost,
              }));
            } catch {
              // storage full or private mode - fail soft
            }
            continue;
          }

          const chosenCode = chosenTeamsRef.current[m.id] ?? null;

          if (isPostGame && !watchedLive) {
            // ── REPLAY PATH — cold post-game load ─────────────────────────────
            // Cards surface only through the playback mechanism, not immediately.
            if (summary && !guard.firedPost) {
              guard.firedPost = true;
              const deck = buildReplayDeck(m, espn, summary, guard, chosenCode);
              setReplayCardsMap(prev => ({ ...prev, [m.id]: deck }));
              setReplayStateMap(prev => ({ ...prev, [m.id]: 'ready' }));
            }
          } else {
            // ── LIVE / WATCHED-LIVE PATH ───────────────────────────────────────
            const derived = deriveNotifs(m, espn, summary, ex, guard, chosenCode);
            if (derived.length) newNotifs.push(...derived);
          }

          guard.prevExScore   = ex.score;
          guard.prevEspnState = espn?.state ?? null;
          guard.prevPeriod    = espn?.period ?? null;
          guard.prevHomeScore = espn?.homeScore ?? 0;
          guard.prevAwayScore = espn?.awayScore ?? 0;
          try {
            sessionStorage.setItem(`lp-guard-${m.id}`, JSON.stringify({
              initialized: true,
              prevExScore: guard.prevExScore,
              prevEspnState: guard.prevEspnState,
              prevPeriod: guard.prevPeriod,
              prevHomeScore: guard.prevHomeScore,
              prevAwayScore: guard.prevAwayScore,
              firedStatKeys: [...guard.firedStatKeys],
              firedBands: guard.firedBands,
              firedPost: guard.firedPost,
            }));
          } catch {
            // storage full or private mode - fail soft
          }
        }

        if (Object.keys(summaryResults).length) {
          setSummaryMap(prev => ({ ...prev, ...summaryResults }));
        }
        setExMap(nextEx);

        if (newNotifs.length || Object.keys(summaryResults).length) {
          setNotifLog(prev => {
            let next = prev;
            let changed = false;

            next = next.map(card => {
              if (!card.pending || Date.now() - card.firedAt >= 120_000) return card;

              const summary = mergedSummaryMap[card.match.id];
              const guard = guardsRef.current[card.match.id];
              const pendingScoreline = card.pendingScoreline;
              if (!summary?.events?.length || !guard || !pendingScoreline || card.matchMinute == null) return card;

              const matchedEvent = summary.events
                .filter(ev => ['goal', 'penalty', 'own-goal'].includes(ev.family))
                .filter(ev => ev.minute != null && Math.abs(ev.minute - card.matchMinute) <= 3)
                .filter(ev => !guard.firedStatKeys.has(`goal-ev-${ev.id}`))
                .sort((a, b) => Math.abs((a.minute ?? 0) - card.matchMinute) - Math.abs((b.minute ?? 0) - card.matchMinute))[0] ?? null;
              if (!matchedEvent) return card;

              const { hs, as_ } = pendingScoreline;
              let prevHs = hs;
              let prevAs_ = as_;
              if (matchedEvent.teamName === card.match.homeTeam && hs > 0) {
                prevHs = hs - 1;
              } else if (matchedEvent.teamName === card.match.awayTeam && as_ > 0) {
                prevAs_ = as_ - 1;
              } else {
                return card;
              }

              const syntheticGuard = {
                ...guard,
                prevHomeScore: prevHs,
                prevAwayScore: prevAs_,
                firedStatKeys: new Set(guard.firedStatKeys),
              };
              const enrichedCard = buildGoalCard(
                card.match,
                { homeScore: hs, awayScore: as_ },
                {
                  ...summary,
                  events: summary.events.filter(ev => (ev.minute ?? Infinity) <= (matchedEvent.minute ?? card.matchMinute)),
                },
                syntheticGuard,
                chosenTeamsRef.current[card.match.id] ?? null,
                card.matchMinute,
              );

              guard.firedStatKeys.add(`goal-ev-${matchedEvent.id}`);
              changed = true;
              return { ...enrichedCard, silent: card.silent };
            });

            if (!changed && !newNotifs.length) return prev;
            return newNotifs.length ? [...newNotifs.slice().reverse(), ...next] : next;
          });
          pushToasts(newNotifs);

          // Sound — highest-priority card type
          if (soundEnabledRef.current) {
            const topCard = [...newNotifs].sort((a, b) => b.priority - a.priority)[0];
            playTone(topCard.type);
          }

          // Auto-select the newest high-priority card for the currently viewed match
          const forSelected = newNotifs.filter(n => n.match.id === selectedMatchIdRef.current);
          if (forSelected.length) {
            const top = [...forSelected].sort((a, b) => b.priority - a.priority)[0];
            setSelectedCardId(top.id);
          }
        }
      } catch {
        setFeedError(true);
      }
    };

    runTick();
    const id = setInterval(runTick, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, todayMatches]);

  // ── Derived values for selected match ─────────────────────────────────────
  const selectedMatch   = todayMatches.find(m => m.id === selectedMatchId) ?? null;
  const selectedEspn    = selectedMatch ? espnMap[selectedMatch.id]    : null;
  const selectedSummary = selectedMatch ? summaryMap[selectedMatch.id] : null;
  const selectedEx      = selectedMatch ? exMap[selectedMatch.id]      : null;
  const isSelectedLive  = selectedEspn?.state === 'in';
  const isSelectedPost  = selectedEspn?.state === 'post';
  const currentMinute   = parseMinute(selectedEspn?.clock) ?? null;

  // On-demand snapshot text for selected match
  const snapshotText = useMemo(() => {
    if (!selectedMatch || !snapshotOpen) return '';
    return generateSnapshot(selectedMatch, selectedEspn, selectedSummary, selectedEx);
  }, [selectedMatch, selectedEspn, selectedSummary, selectedEx, snapshotOpen]);

  // Cards for selected match, sorted chronologically
  const selectedMatchCards = useMemo(
    () => notifLog
      .filter(n => n.match.id === selectedMatchId)
      .slice()
      .sort((a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0)),
    [notifLog, selectedMatchId],
  );

  const selectedCard = selectedMatchCards.find(c => c.id === selectedCardId) ?? null;
  const feedStale = lastPoll !== null && Date.now() - lastPoll > 65_000;

  // Timeline progress (0-100)
  const timelineProgress = isSelectedPost
    ? 100
    : isSelectedLive && currentMinute != null
      ? currentMinute <= 90
        ? Math.min((currentMinute / 90) * 100, 99)
        : Math.min(((currentMinute - 90) / 30) * 100, 99)
      : 0;

  const toggleCard = useCallback((id) => {
    setSelectedCardId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="pulse-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pulse-header">
        <Link to="/" className="pulse-back">← Cup Radar</Link>
        <div style={{ flex: 1 }}>
          <h1 className="pulse-title">Live Pulse <span className="pulse-test-badge">TEST</span></h1>
          <p className="pulse-desc">
            Game-teaching notifications · ESPN polls every 30s
            {lastPoll && <span className="pulse-last-poll"> · {relTime(lastPoll)} (#{pollCount})</span>}
            {(feedError || feedStale) && (
              <span className="pulse-feed-error">⚠ Live feed delayed — retrying</span>
            )}
          </p>
        </div>
        <button
          className={`pulse-sound-btn${soundEnabled ? ' on' : ''}`}
          onClick={() => setSoundEnabled(v => !v)}
          title={soundEnabled ? 'Sound on — click to mute' : 'Sound off — click to enable ambient tones'}
        >
          {soundEnabled ? '🔔' : '🔕'}
          <span className="pulse-sound-btn__label">{soundEnabled ? 'Sound on' : 'Sound off'}</span>
        </button>
      </div>

      {/* ── Match tabs ─────────────────────────────────────────────────────── */}
      {todayMatches.length > 0 && (
        <div className="pulse-tabs">
          {todayMatches.map(m => {
            const espn    = espnMap[m.id];
            const isLive  = espn?.state === 'in';
            const isPost  = espn?.state === 'post' || m.status === 'finished';
            const cardCount = notifLog.filter(n => n.match.id === m.id).length;
            return (
              <button
                key={m.id}
                className={`pulse-tab${selectedMatchId === m.id ? ' active' : ''}${isLive ? ' live' : ''}`}
                onClick={() => { setSelectedMatchId(m.id); setSnapshotOpen(false); }}
              >
                <span className="pulse-tab__teams">
                  {isLive && <span className="pulse-tab__dot" />}
                  {m.homeTeam} vs {m.awayTeam}
                </span>
                <span className="pulse-tab__sub">
                  {isLive ? espn.clock
                    : isPost ? 'FT'
                    : `${m.time} ${m.timezone}`}
                  {cardCount > 0 && <span className="pulse-tab__count">{cardCount}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Selected match view ─────────────────────────────────────────────── */}
      {selectedMatch && (
        <div className="pulse-match-view">

          {/* Score bar */}
          <div className="pulse-score-bar">
            <div className="pulse-score-bar__team">
              <FlagImg emoji={selectedMatch.homeFlag} size={22} />
              <span>{selectedMatch.homeTeam}</span>
            </div>
            <div className="pulse-score-bar__center">
              <span className="pulse-score-bar__score">
                {isSelectedLive || isSelectedPost
                  ? `${selectedEspn?.homeScore ?? '–'} – ${selectedEspn?.awayScore ?? '–'}`
                  : 'vs'}
              </span>
              <span className="pulse-score-bar__status">
                {isSelectedLive
                  ? <><span className="pulse-score-bar__live-dot" />{selectedEspn.clock}</>
                  : isSelectedPost ? 'Full Time'
                  : `${selectedMatch.time} ${selectedMatch.timezone}`}
              </span>
              {(isSelectedLive || isSelectedPost) && (
                <button
                  className={`pulse-snapshot-btn${snapshotOpen ? ' active' : ''}`}
                  onClick={() => setSnapshotOpen(v => !v)}
                >
                  {snapshotOpen ? '▾ What\'s happening?' : '▸ What\'s happening?'}
                </button>
              )}
            </div>
            <div className="pulse-score-bar__team pulse-score-bar__team--away">
              <span>{selectedMatch.awayTeam}</span>
              <FlagImg emoji={selectedMatch.awayFlag} size={22} />
            </div>
          </div>

          {/* Team picker — pick a side or stay neutral */}
          {selectedMatch && (
            <div className="pulse-team-picker">
              <span className="pulse-team-picker__label">View as</span>
              <button
                className={`pulse-team-picker__btn${!chosenTeams[selectedMatchId] ? ' active' : ''}`}
                onClick={() => setChosenTeams(prev => ({ ...prev, [selectedMatchId]: null }))}
              >
                ⚖️ Neutral
              </button>
              {[
                { code: selectedMatch.homeCode, name: selectedMatch.homeTeam, flag: selectedMatch.homeFlag },
                { code: selectedMatch.awayCode, name: selectedMatch.awayTeam, flag: selectedMatch.awayFlag },
              ].map(t => (
                <button
                  key={t.code}
                  className={`pulse-team-picker__btn${chosenTeams[selectedMatchId] === t.code ? ' active' : ''}`}
                  onClick={() => setChosenTeams(prev => ({ ...prev, [selectedMatchId]: t.code }))}
                >
                  <FlagImg emoji={t.flag} size={14} />
                  {t.name}
                </button>
              ))}
              {(!selectedEspn || selectedEspn.state === 'pre') && (
                <span className="pulse-team-picker__note">Pick your team before kickoff for a personalized feed</span>
              )}
            </div>
          )}

          {/* Replay panel — shows for cold-loaded finished games */}
          {isSelectedPost && replayStateMap[selectedMatchId] && (
            <div className={`pulse-replay-panel pulse-replay-panel--${replayStateMap[selectedMatchId]}`}>
              {replayStateMap[selectedMatchId] === 'loading' && (
                (() => {
                  const loadStart = replayLoadStartMap[selectedMatchId];
                  const timedOut = loadStart && Date.now() - loadStart > 15_000;
                  return timedOut
                    ? <span className="pulse-replay-panel__text">Couldn't load match data - try refreshing.</span>
                    : (
                      <>
                        <span className="pulse-replay-panel__spinner">⟳</span>
                        <span className="pulse-replay-panel__text">Gathering match data…</span>
                      </>
                    );
                })()
              )}
              {replayStateMap[selectedMatchId] === 'ready' && (
                <>
                  <div className="pulse-replay-panel__content">
                    <span className="pulse-replay-panel__title">Match story ready</span>
                    <span className="pulse-replay-panel__sub">
                      {replayCardsMap[selectedMatchId]?.length ?? 0} cards — watch it unfold
                    </span>
                  </div>
                  <button
                    className="pulse-replay-panel__btn"
                    onClick={() => startPlayback(selectedMatchId)}
                  >
                    ▶ Play
                  </button>
                </>
              )}
              {replayStateMap[selectedMatchId] === 'playing' && (
                <span className="pulse-replay-panel__text pulse-replay-panel__text--playing">
                  ▶ Playing match story…
                </span>
              )}
              {replayStateMap[selectedMatchId] === 'done' && (
                <span className="pulse-replay-panel__text">✓ Playback complete</span>
              )}
            </div>
          )}

          {/* On-demand snapshot panel */}
          {snapshotOpen && snapshotText && (
            <div className="pulse-snapshot">
              <span className="pulse-snapshot__icon">🔍</span>
              <p className="pulse-snapshot__text">{snapshotText}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="pulse-timeline">
            <div className="pulse-timeline__track">
              <div className="pulse-timeline__fill" style={{ width: `${timelineProgress}%` }} />

              <div className="pulse-timeline__ht" style={{ left: '50%' }}>
                <span className="pulse-timeline__ht-label">HT</span>
              </div>

              {isSelectedLive && currentMinute != null && (
                <div className="pulse-timeline__cursor" style={{ left: `${timelineProgress}%` }}>
                  <span className="pulse-timeline__cursor-label">{currentMinute}&apos;</span>
                </div>
              )}

              {selectedMatchCards.map((card, idx) => {
                const min = card.matchMinute ?? 0;
                const pos = Math.max(0.5, Math.min((min / 90) * 100, 98.5));
                const nearbyCount = selectedMatchCards
                  .slice(0, idx)
                  .filter(c => Math.abs((c.matchMinute ?? 0) - min) < 4).length;
                const topOffset = nearbyCount % 2 === 0 ? -18 : 8;
                return (
                  <button
                    key={card.id}
                    className={`pulse-timeline__dot${selectedCardId === card.id ? ' selected' : ''}`}
                    style={{
                      left: `${pos}%`,
                      top: `calc(50% + ${topOffset}px)`,
                      background: TYPE_COLORS[card.type] ?? '#888',
                    }}
                    onClick={() => toggleCard(card.id)}
                    title={`${min}' — ${card.title}`}
                    aria-pressed={selectedCardId === card.id}
                  >
                    {card.icon}
                  </button>
                );
              })}
            </div>

            <div className="pulse-timeline__labels">
              <span>0&apos;</span>
              <span>90&apos;</span>
            </div>
          </div>

          {/* Selected card detail */}
          {selectedCard && (
            <div className={`pulse-detail pulse-detail--${selectedCard.type}`}>
              <span className="pulse-detail__icon">{selectedCard.icon}</span>
              <div className="pulse-detail__body">
                <div className="pulse-detail__meta-top">
                  {selectedCard.matchMinute != null && (
                    <span className="pulse-detail__min">{selectedCard.matchMinute}&apos;</span>
                  )}
                  <span
                    className="pulse-notif__type"
                    style={{ background: TYPE_COLORS[selectedCard.type] ?? '#888' }}
                  >{TYPE_LABELS[selectedCard.type] ?? selectedCard.type}</span>
                </div>
                <div className="pulse-detail__title">{selectedCard.title}</div>
                <div className="pulse-detail__sub">{selectedCard.subtext}</div>
              </div>
              <button
                className="pulse-detail__close"
                aria-label="Close card"
                onClick={() => setSelectedCardId(null)}
              >×</button>
              <button
                className="pulse-detail__share"
                title="Copy card text"
                onClick={() => {
                  const text = `${selectedCard.icon} ${selectedCard.title}\n\n${selectedCard.subtext}\n\n\u2014 Live Pulse \u00b7 wc.ngengwe.com/live-pulse`;
                  navigator.clipboard?.writeText(text)?.catch(() => {});
                }}
              >
                📋
              </button>
            </div>
          )}

          {/* Card list — chronological, selectable */}
          {selectedMatchCards.length === 0 ? (
            <div className="pulse-feed-empty" style={{ margin: '0 0 0' }}>
              {replayStateMap[selectedMatchId] === 'loading' ? (
                <p>Gathering match data for playback…</p>
              ) : replayStateMap[selectedMatchId] === 'ready' ? (
                <p>Press <strong>▶ Play</strong> above to watch the match story unfold card by card.</p>
              ) : (
                <>
                  <p>No cards yet for this match.</p>
                  <p className="pulse-feed-empty__sub">
                    Cards begin on the second ESPN poll (~30s after load). Guaranteed cards:
                    kick-off · possession · 10/20/30/40 min milestones · 2nd half · 60/70/80 min milestones · full time.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="pulse-card-list">
                {selectedMatchCards.map(card => (
                  <button
                    key={card.id}
                    className={`pulse-card-item${selectedCardId === card.id ? ' selected' : ''}`}
                    onClick={() => toggleCard(card.id)}
                  >
                    <span className="pulse-card-item__min">
                      {card.matchMinute != null ? `${card.matchMinute}'` : '–'}
                    </span>
                    <span className="pulse-card-item__icon">{card.icon}</span>
                    <div className="pulse-card-item__text">
                      <span className="pulse-card-item__title">{card.title}</span>
                      {selectedCardId === card.id && (
                        <span className="pulse-card-item__sub">{card.subtext}</span>
                      )}
                    </div>
                    <span
                      className="pulse-card-item__badge"
                      style={{ background: TYPE_COLORS[card.type] ?? '#888' }}
                    >{TYPE_LABELS[card.type] ?? card.type}</span>
                  </button>
                ))}
              </div>
              {selectedMatchCards.length > 4 && (
                <button
                  className="pulse-jump-latest"
                  onClick={() => {
                    const latest = selectedMatchCards[selectedMatchCards.length - 1];
                    setSelectedCardId(latest.id);
                    document.querySelector('.pulse-card-list')?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                >
                  &darr; Latest
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Admin panel — live match only ────────────────────────────────────── */}
      <div className="pulse-admin" style={{ maxWidth: 1100, margin: '16px auto 0', padding: '0 24px' }}>
        <button className="pulse-admin__toggle" onClick={() => setAdminOpen(o => !o)}>
          {adminOpen ? '▾' : '▸'} Admin — raw data for current game
        </button>

        {adminOpen && (() => {
          const live = todayMatches.find(m => espnMap[m.id]?.state === 'in')
            ?? todayMatches.find(m => espnMap[m.id]?.state === 'post')
            ?? todayMatches[0];
          if (!live) return <p className="pulse-admin__null">No match data yet.</p>;
          const espn  = espnMap[live.id];
          const stats = summaryMap[live.id]?.stats;
          const ex    = exMap[live.id];
          const guard = guardsRef.current[live.id];
          return (
            <div className="pulse-admin__grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">{live.homeTeam} vs {live.awayTeam}</div>
                <div className="pulse-admin__section">ESPN</div>
                {espn
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ state: espn.state, clock: espn.clock, period: espn.period, score: `${espn.homeScore}–${espn.awayScore}` }, null, 2)}</pre>
                  : <p className="pulse-admin__null">no data</p>}
              </div>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Excitement</div>
                {ex
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ score: ex.score, band: ex.label, scorePressure: pct(ex.components?.scorePressure), clockLeverage: pct(ex.components?.clockLeverage), attackPressure: pct(ex.components?.attackPressure), chaosBonus: pct(ex.components?.chaosBonus), finishBonus: pct(ex.components?.finishBonus) }, null, 2)}</pre>
                  : <p className="pulse-admin__null">not computed</p>}
              </div>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Stats</div>
                {stats
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ shots: `${stats.homeShots||0}–${stats.awayShots||0}`, onTarget: `${stats.homeShotsOnTarget||0}–${stats.awayShotsOnTarget||0}`, possession: `${stats.homePossession||0}%–${stats.awayPossession||0}%`, corners: `${stats.homeCorners||0}–${stats.awayCorners||0}`, yellows: `${stats.homeYellow||0}–${stats.awayYellow||0}`, fouls: `${stats.homeFouls||0}–${stats.awayFouls||0}` }, null, 2)}</pre>
                  : <p className="pulse-admin__null">no summary</p>}
              </div>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Guard state</div>
                {guard
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ initialized: guard.initialized, prevExScore: guard.prevExScore, prevState: guard.prevEspnState, firedPost: guard.firedPost, firedBands: Object.keys(guard.firedBands), firedStatKeys: [...guard.firedStatKeys] }, null, 2)}</pre>
                  : <p className="pulse-admin__null">not initialized</p>}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Persistent toast stack ───────────────────────────────────────────── */}
      {toastStack.length > 0 && (
        <div className="pulse-toast-stack" role="log" aria-live="polite">
          {toastStack.map(n => (
            <div
              key={n.id}
              className={`pulse-toast pulse-toast--${n.type}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedMatchId(n.match.id);
                setSelectedCardId(n.id);
                setSnapshotOpen(false);
                dismissToast(n.id);
              }}
            >
              <span className="pulse-toast__icon">{n.icon}</span>
              <div className="pulse-toast__body">
                <div className="pulse-toast__match">
                  <FlagImg emoji={n.match.homeFlag} size={10} />
                  <span>{n.match.homeTeam} vs {n.match.awayTeam}</span>
                </div>
                <div className="pulse-toast__title">{n.title}</div>
                <div className="pulse-toast__sub">{n.subtext}</div>
                <div className="pulse-toast__meta">
                  <span className="pulse-notif__type" style={{ background: TYPE_COLORS[n.type] ?? '#888' }}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  <span className="pulse-toast__time">{relTime(n.firedAt)}</span>
                </div>
              </div>
              <button className="pulse-toast__dismiss" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); dismissToast(n.id); }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
