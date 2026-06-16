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

// ─── Clock milestone cards ─────────────────────────────────────────────────────
// Each body function reacts to actual match state — score, possession, shots.

const MILESTONES = {
  10: {
    icon: '🕐', title: '10 minutes in — early pulse check',
    body: (match, espn, stats) => {
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
      return `${hs}–${as_} already — this has been an open, attacking start. ${totalShots > 0 ? `${totalShots} shots in 10 minutes is a high-intensity opening.` : 'Both teams committing forward early.'}`;
    },
  },
  20: {
    icon: '🕑', title: '20 minutes in — patterns forming',
    body: (match, espn, stats) => {
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
    body: (match, espn, stats) => {
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
    body: (match, espn, stats) => {
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
    body: (match, espn, stats) => {
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
    body: (match, espn) => {
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
    body: (match, espn, stats) => {
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
};

// ─── Notification derivation ──────────────────────────────────────────────────

const BAND_COOLDOWN_MS = 3 * 60_000;

function deriveNotifs(match, espn, summary, ex, guard) {
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
    if (homeB && awayB) {
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
    const scoreCtx = hs === as_
      ? `Still ${hs}–${as_} — 45 minutes to break the deadlock.`
      : `${hs > as_ ? match.homeTeam : match.awayTeam} lead ${Math.max(hs,as_)}–${Math.min(hs,as_)}. The trailing team will now push forward and leave space at the back.`;
    out.push({
      id: `${match.id}-second-half`, type: 'beat', priority: 3, icon: '🔄',
      title: `Second half — here's the story so far`,
      subtext: `${htStat}${scoreCtx}`,
      match, firedAt: Date.now(), matchMinute: 45,
    });
  }

  if (isPost && !guard.firedPost) {
    guard.firedPost = true;
    const synthLines = [];
    const resultWho  = hs > as_ ? match.homeTeam : (as_ > hs ? match.awayTeam : null);

    // Result
    if (hs === as_) {
      synthLines.push(`${match.homeTeam} ${hs}–${as_} ${match.awayTeam} — a draw, both teams take 1 point.`);
    } else {
      synthLines.push(`${resultWho} win ${Math.max(hs,as_)}–${Math.min(hs,as_)}.`);
    }

    // Stats story
    if (stats) {
      const hp = stats.homePossession || 0, ap = stats.awayPossession || 0;
      const hShots = stats.homeShots || 0, aShots = stats.awayShots || 0;
      const totalShots = hShots + aShots;
      const posWho  = hp >= ap ? match.homeTeam : match.awayTeam;
      const posOther = hp >= ap ? match.awayTeam : match.homeTeam;
      const posVal   = Math.max(hp, ap);
      const shotWho  = hShots >= aShots ? match.homeTeam : match.awayTeam;

      if (posVal >= 55 && totalShots > 0) {
        if (posWho === shotWho) {
          synthLines.push(`${posWho} were dominant — ${posVal}% possession and the most shots.`);
        } else {
          synthLines.push(`${posWho} had ${posVal}% of the ball but ${posOther} were more efficient with their chances — quality over quantity decided this.`);
        }
      } else if (totalShots > 0) {
        synthLines.push(`${totalShots} combined shots — a contested game throughout.`);
      }

      // Counter-attack story
      if (guard.firedStatKeys.has('counter-attack')) {
        synthLines.push(`The counter-attack pattern that developed midway through proved decisive.`);
      }
    }

    // Group implications
    if (match.group) {
      if (hs !== as_) {
        synthLines.push(`${resultWho} take 3 points in Group ${match.group}. Every point counts — the top two advance.`);
      } else {
        synthLines.push(`One point each in Group ${match.group}. Useful, but neither team wins the group purely on draws.`);
      }
    }

    out.push({
      id: `${match.id}-post`, type: 'post', priority: 5, icon: '🏁',
      title: `Full time: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}`,
      subtext: synthLines.join(' '),
      match, firedAt: Date.now(), matchMinute: 90,
    });
  }

  // ── LAYER 2: CLOCK MILESTONES ─────────────────────────────────────────────

  if (isLive && currentMinute !== null) {
    for (const [target, cfg] of Object.entries(MILESTONES)) {
      const t = Number(target);
      if (currentMinute >= t && !guard.firedStatKeys.has(`milestone-${t}`)) {
        guard.firedStatKeys.add(`milestone-${t}`);
        out.push({
          id: `${match.id}-milestone-${t}`, type: 'milestone', priority: 1,
          icon: cfg.icon, title: cfg.title,
          subtext: cfg.body(match, espn, stats),
          match, firedAt: Date.now(), matchMinute: t,
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
      out.push({
        id: `${match.id}-possession-intro`, type: 'explain', priority: 2, icon: '📊',
        title: `${who} with ${val}% possession`,
        subtext: `Possession = how much of the time each team has had the ball. High possession can mean control — or ${other} is sitting deep and waiting to counter-attack. Watch the shots column to see which story this becomes.`,
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
          return `${ctx} Clock pressure, attacking patterns, and score situation are all elevated right now.`;
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

  return out;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  beat:      '#06b6d4',
  milestone: '#6366f1',
  explain:   '#a78bfa',
  tension:   '#f59e0b',
  post:      '#22c55e',
};

const TYPE_LABELS = {
  beat:      'match',
  milestone: 'check-in',
  explain:   'explain it',
  tension:   'tension',
  post:      'full time',
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
  const [selectedMatchId, setSelectedMatchId]  = useState(null);
  const [selectedCardId,  setSelectedCardId]   = useState(null);
  const [adminOpen,       setAdminOpen]        = useState(false);
  const [soundEnabled,    setSoundEnabled]     = useState(false);
  const [snapshotOpen,    setSnapshotOpen]     = useState(false);

  const guardsRef          = useRef({});
  const selectedMatchIdRef = useRef(null);
  const soundEnabledRef    = useRef(false);
  const [, tick_]          = useState(0);

  useEffect(() => { selectedMatchIdRef.current = selectedMatchId; }, [selectedMatchId]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

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
    setToastStack(prev => {
      const next = [...notifs.slice().reverse(), ...prev];
      return next.slice(0, 8);
    });
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
        setEspnMap(nextEspn);
        setLastPoll(Date.now());
        setPollCount(c => c + 1);

        const nextEx    = {};
        const newNotifs = [];

        for (const m of todayMatches) {
          const espn = nextEspn[m.id];

          if (!guardsRef.current[m.id]) {
            guardsRef.current[m.id] = {
              initialized: false, prevExScore: null,
              prevEspnState: null, prevPeriod: null,
              firedBands: {}, firedStatKeys: new Set(), firedPost: false,
            };
          }
          const guard = guardsRef.current[m.id];

          let summary = summaryMap[m.id];
          const needsSummary = espn?.state === 'in' || (espn?.state === 'post' && !guard.firedPost);
          if (needsSummary) {
            const eid = matchEspnEventId(espnEvents, m);
            if (eid) {
              try {
                const raw = await fetchEspnSummary(eid);
                if (cancelled) return;
                summary = normalizeEspnSoccerSummary(raw, m);
                setSummaryMap(prev => ({ ...prev, [m.id]: summary }));
              } catch { /* fail soft */ }
            }
          }

          const ex = computeMatchExcitement(m, espn, [], summary || {});
          nextEx[m.id] = ex;

          if (!guard.initialized) {
            guard.initialized   = true;
            guard.prevExScore   = ex.score;
            guard.prevEspnState = espn?.state ?? null;
            guard.prevPeriod    = espn?.period ?? null;
            continue;
          }

          const derived = deriveNotifs(m, espn, summary, ex, guard);
          guard.prevExScore   = ex.score;
          guard.prevEspnState = espn?.state ?? null;
          guard.prevPeriod    = espn?.period ?? null;
          if (derived.length) newNotifs.push(...derived);
        }

        setExMap(nextEx);

        if (newNotifs.length) {
          setNotifLog(prev => [...newNotifs.slice().reverse(), ...prev]);
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
      } catch { /* fail soft */ }
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

  // Timeline progress (0-100)
  const timelineProgress = isSelectedPost
    ? 100
    : isSelectedLive && currentMinute != null
      ? Math.min((currentMinute / 90) * 100, 99)
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
              <span>45&apos;</span>
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
            </div>
          )}

          {/* Card list — chronological, selectable */}
          {selectedMatchCards.length === 0 ? (
            <div className="pulse-feed-empty" style={{ margin: '0 0 0' }}>
              <p>No cards yet for this match.</p>
              <p className="pulse-feed-empty__sub">
                Cards begin on the second ESPN poll (~30s after load). Guaranteed cards:
                kick-off · possession · 10/20/30/40 min milestones · 2nd half · 60/70/80 min milestones · full time.
              </p>
            </div>
          ) : (
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
            <div key={n.id} className={`pulse-toast pulse-toast--${n.type}`}>
              <span className="pulse-toast__icon">{n.icon}</span>
              <div className="pulse-toast__body">
                <div className="pulse-toast__title">{n.title}</div>
                <div className="pulse-toast__sub">{n.subtext}</div>
                <div className="pulse-toast__meta">
                  <span className="pulse-notif__type" style={{ background: TYPE_COLORS[n.type] ?? '#888' }}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  <span className="pulse-toast__time">{relTime(n.firedAt)}</span>
                </div>
              </div>
              <button className="pulse-toast__dismiss" aria-label="Dismiss" onClick={() => dismissToast(n.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
