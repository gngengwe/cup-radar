# Live Pulse — Codex Task Brief

## How to Use This File

This file is the complete specification for improving the Live Pulse feature of the Cup Radar app (`wc.ngengwe.com`). It is written for an autonomous coding agent.

**Work rules:**
1. Read this entire file before writing a single line of code.
2. Read every source file referenced in the File Inventory section before editing it.
3. Run `npm run build` after each logical batch of changes and fix any compiler errors before continuing.
4. Do not implement items not listed here. Do not add abstraction layers, helpers, or features beyond what is specified.
5. Do not amend commits — create a new commit per logical batch (Backend, UX, New Functionality).
6. If a section says "simpler approach" or gives two options, implement the one labeled simpler.
7. When in doubt about a behavior, read the existing code — it is the ground truth, not this document.
8. Never skip the Key Invariants section. Violating those invariants will silently break the notification system.

**Working directory:** `c:\becomiNG\HK_Clearway\wc_radar`
**Deploy:** push to `master` → Cloudflare Pages auto-deploys to `wc.ngengwe.com`
**Build command:** `npm run build`
**Dev server:** `npm run dev`

---

## What Live Pulse Is

Live Pulse is a real-time, game-teaching notification feed for World Cup 2026 matches. Route: `/live-pulse`. It polls ESPN's unofficial CORS-open scoreboard API every 30 seconds and converts raw match data into a chronological card deck that explains what is happening and why it matters to a casual soccer fan. Every card teaches. There is no backend — all live data comes from ESPN, fetched directly from the browser.

---

## File Inventory — Read These Before Editing

| File | Role |
|---|---|
| `src/pages/LivePulse.jsx` | ~1620 lines. The entire feature lives here. |
| `src/api/espnScoreboard.js` | `fetchEspnScoreboard`, `matchEspnStatus`, `matchEspnEventId`, `fetchEspnSummary` |
| `src/utils/normalizeEspnSoccerSummary.js` | Normalizes ESPN summary response into `{ events, scoreTimeline, stats }` |
| `src/utils/matchExcitementEngine.js` | Pure scoring functions + `computeMatchExcitement` (0–100 excitement score) |
| `src/config/matchExcitementWeights.js` | Weights, curve exponent, EXCITEMENT_LABELS thresholds |
| `src/data/team-strength.json` | FIFA ranking data per 3-letter code — used by `computeUpsetPressure` |
| `src/index.css` | All `.pulse-*` styles live here |
| `src/hooks/useMatches.js` | Loads `matches.json`, provides `{ matches }` |

---

## Architecture — Read This Completely

### Data flow

```
matches.json → useMatches() → todayMatches[]
    ↓ every 30s (setInterval in useEffect)
fetchEspnScoreboard(today)            → raw ESPN events[]
    └─ matchEspnStatus(events, m)     → { state, clock, period, homeScore, awayScore }
    └─ matchEspnEventId(events, m)    → ESPN event ID string
         ↓ when live or post (needsSummary = true)
    fetchEspnSummary(eventId)
         ↓
    normalizeEspnSoccerSummary(raw, m)
         → { events: SoccerMatchEvent[], scoreTimeline: [{minute,homeScore,awayScore}], stats: {} }
         ↓
    computeMatchExcitement(m, espn, [], summary)   → { score: 0–100, components, label, phase }
         ↓
    deriveNotifs(m, espn, summary, ex, guard, chosenCode)  → Card[]
         ↓
    setNotifLog / pushToasts / playTone / setSelectedCardId
```

### Guard object (per match, lives in `guardsRef.current[matchId]`)

```js
{
  initialized:    boolean,       // true after first poll — no cards fire until poll 2
  prevExScore:    number|null,   // excitement score last poll — detects band crossings
  prevEspnState:  string|null,   // 'pre'|'in'|'post' — detects kickoff, FT transitions
  prevPeriod:     number|null,   // detects second-half start
  prevHomeScore:  number|null,   // detects goals scored (home)
  prevAwayScore:  number|null,   // detects goals scored (away)
  firedBands:     {},            // timestamp keyed by band key — 3-min cooldown
  firedStatKeys:  Set<string>,   // one-shot event keys (see Card ID Scheme below)
  firedPost:      boolean,       // true once FT card has fired
}
```

Guards live only in memory. A page refresh resets all guards — every finished game cold-loads into the replay path.

### Card types (6)

| Type | Color | Trigger | Priority |
|---|---|---|---|
| `beat` | `#06b6d4` cyan | Kickoff, second half | 3 |
| `milestone` | `#6366f1` indigo | 10/20/30/40/60/70/80' clock | 1 |
| `explain` | `#a78bfa` purple | First occurrence: possession, corner, yellow, shot drought, counter-attack, physicality | 2 |
| `tension` | `#f59e0b` amber | Excitement score crosses 60 or 75 | 4 |
| `goal` | `#f97316` orange | Score change detected poll-to-poll | 4 |
| `post` | `#22c55e` green | State transitions to 'post' | 5 |

### Card ID scheme (uniqueness prevents re-fires via firedStatKeys)

```
{matchId}-kickoff
{matchId}-second-half
{matchId}-milestone-{10|20|30|40|60|70|80}
{matchId}-possession-intro
{matchId}-corner-intro
{matchId}-yellow-intro
{matchId}-shot-drought
{matchId}-counter-attack
{matchId}-physical
{matchId}-yellow-wave
{matchId}-{tense|high_alert}-{timestamp}      ← tension cards can re-fire after 3-min cooldown
{matchId}-goal-{homeScore}-{awayScore}
{matchId}-post
```

### Live path vs replay path

**Live path** (`espn.state === 'in'`, or `watchedLive === true`): `deriveNotifs()` runs every poll. Cards push immediately to `notifLog` and `toastStack`. Sound plays for the highest-priority card.

**Replay path** (`isPostGame && !watchedLive`): Triggered when the page loads and a match is already finished (user didn't watch it live). `buildReplayDeck()` builds all cards at once when summary arrives. `startPlayback()` reveals cards 1-per-2s via `setInterval`. Cards have `silent: true` — no toast, no sound.

`watchedLive = guard.firedStatKeys.has('kickoff')` — this boolean is the single source of truth for which path a match takes.

### Excitement engine components

`computeMatchExcitement` in `matchExcitementEngine.js` combines 8 weighted sub-scores into a 0–100 output:
- `scorePressure` — tied=1.0, margin-1=0.65, margin-2=0.50, margin-3+=0.30
- `clockLeverage` — ramps through second half; ET/penalties=1.0
- `stageAndScenario` — Group Stage 0.3–0.5, knockouts 0.55–1.0, Final=1.0
- `upsetPressure` — FIFA rank gap when underdog is level or ahead
- `attackPressure` — recent 10-min shots+corners from events; falls back to aggregate stats
- `leadSwingDrama` — how many times the lead changed in scoreTimeline
- `chaosBonus` — red card=1.0, penalty event=0.6, yellow pile-up=0.15–0.40
- `finishBonus` — ≥80' or ET with close score

---

## KEY INVARIANTS — DO NOT VIOLATE THESE

**INV-1: Guard mutation is intentional.**
Guards in `guardsRef.current` are mutated in place — they are refs, not React state. Do not convert them to React state. Do not wrap mutations in `setState`. Do not add immutability. The `firedStatKeys` Set must be mutated directly (`guard.firedStatKeys.add(...)`). Wrapping this in state would cause stale closures and re-render loops.

**INV-2: `watchedLive` is derived from `firedStatKeys`, never set directly.**
`watchedLive = guard.firedStatKeys.has('kickoff')`. The kickoff key is only added in `deriveNotifs` when `isLive && guard.prevEspnState !== 'in'`. Never add `'kickoff'` to `firedStatKeys` from the replay path or from any initialization code.

**INV-3: `firedPost` gates both paths.**
`guard.firedPost = true` is set by the live path (inside `deriveNotifs`) AND by the replay path (in the polling loop). Once set, `needsSummary` becomes false, stopping further summary fetches. Never clear `firedPost` without understanding this dependency.

**INV-4: Card IDs must be stable and unique.**
Card list and timeline use IDs as React key props and for selection state. Duplicate IDs cause silent deduplication in the UI. Timestamp-based IDs (tension cards) are intentionally unique per firing.

**INV-5: `silent: true` suppresses toasts and sound.**
Replay playback cards carry `silent: true`. The `pushToasts` function filters these out. Any new code path that pushes cards into `notifLog` must set `silent: true` when it should not trigger toasts.

**INV-6: `chosenTeamsRef` is the ref; `chosenTeams` is the state.**
Always update state with `setChosenTeams`. The ref is synced automatically via a `useEffect`. Never write directly to `chosenTeamsRef.current` — the ref is read-only from outside the sync effect.

**INV-7: The polling loop is a single async function (`runTick`) inside a `useEffect`.**
The `cancelled` flag prevents state updates after unmount. Any new async operations added to `runTick` must check `if (cancelled) return` after every `await`.

---

## Stress Test Findings (context for fixes — not a separate task list)

These are the bugs and gaps the improvements below address. Read them to understand *why* the fixes exist.

**ST-1** — ESPN scoreboard fetch failure is swallowed silently. No UI error state. User has no way to know the feed is broken. (`catch {}` at top of `runTick`) — addressed by BACKEND-7.

**ST-3** — Summary fetches are serial inside `for (m of todayMatches)`. With 3+ live matches, each summary takes ~1s, so the poll loop takes 3+ seconds. Under tournament load this blocks polls. — addressed by BACKEND-1.

**ST-4** — ESPN team abbreviations don't always match FIFA codes in `matches.json`. Silent failure: match not found → `espn = null` → no cards fire. — addressed by BACKEND-3.

**ST-5** — When a goal fires, `summary.events` may not yet include the goal event (ESPN summary lags scoreboard by 30–60s). Goal card defaults to 'open play' and is never enriched because `firedStatKeys` has already recorded the scoreline. — addressed by BACKEND-5.

**ST-6** — If score jumps 2 goals in one poll (broadcast latency), only one goal card fires for the final scoreline. Intermediate goal is missed. — addressed by BACKEND-6.

**ST-7** — Extra time and penalty shootouts produce no educational cards. Timeline clamps to 99% from 90' onward. No beat card for "we're into extra time." — addressed by NEW-1.

**ST-13** — `startPlayback` called twice (double-tap) creates two `setInterval` timers on the same match. First is leaked because `replayIntervalsRef.current[matchId]` is overwritten. Cards appear at double speed. — addressed by UX-7.

**ST-14** — Toasts show no match context. User sees "Goal — France. Now 1–0" with no indication which game. — addressed by UX-1.

**ST-15** — `playTone('goal')` falls through to the milestone sound config. Goal is the most important event type and has no distinct tone. — addressed by BACKEND-4.

**ST-16** — Replay deck (`buildReplayDeck`) contains no goal cards. A user who cold-loads a 3–2 match watches playback and sees only milestone and FT cards. — addressed by BACKEND-2.

---

## Implementation Instructions

Implement in this order. Run `npm run build` and verify zero errors after completing each numbered batch before starting the next.

---

### Batch 1 — Backend Correctness

**BACKEND-1: Parallelize summary fetches**

File: `src/pages/LivePulse.jsx` — inside `runTick` in the polling `useEffect`.

Current behavior: `fetchEspnSummary` is awaited inside `for (const m of todayMatches)`, making all summary fetches serial.

Target: Split the loop into two phases.

Phase 1 (sync): Iterate `todayMatches`, build per-match state (guard init, `needsSummary` flag, eventId). Do not `await` anything.

Phase 2 (parallel): Build an array of fetch jobs for all matches where `needsSummary === true` and an eventId exists. Run `await Promise.all(jobs)` where each job is `fetchEspnSummary(eid).then(raw => normalizeEspnSoccerSummary(raw, m))`. Store results in a local `summaryResults` map keyed by matchId.

Phase 3 (sync): Iterate matches again to compute excitement, derive notifs, update guards, using the summary from `summaryResults[m.id] ?? summaryMap[m.id]`.

After Phase 3, call `setSummaryMap` once with a single merged update (not per-match inside the loop).

Each job in `Promise.all` must swallow its own errors with `.catch(() => null)` so one failed fetch doesn't abort the others.

After every `await` in `runTick`, check `if (cancelled) return`.

---

**BACKEND-2: Reconstruct goal cards in replay deck from `scoreTimeline`**

File: `src/pages/LivePulse.jsx` — function `buildReplayDeck`.

Current behavior: `buildReplayDeck` returns `[...storyCards, ftCard]` where `storyCards` contains only milestone cards. No goal cards.

Target: After building `storyCards`, iterate `summary.scoreTimeline` (which is `[{minute, homeScore, awayScore}]` sorted chronologically). For each entry, create a synthetic goal card.

To create the synthetic card, you need `prevHomeScore`/`prevAwayScore` (the score before this goal). Derive them by tracking the previous entry in the `scoreTimeline` loop (or using `{homeScore:0, awayScore:0}` for the first goal).

To call `buildGoalCard`, you need a synthetic guard whose `prevHomeScore`/`prevAwayScore` reflect the state just before the goal. Create a temporary guard snapshot per iteration:

```js
const syntheticGuard = {
  ...guard,
  prevHomeScore: prevHs,
  prevAwayScore: prevAs_,
  firedStatKeys: new Set(guard.firedStatKeys), // copy so we don't mutate the real guard
};
```

Also create a synthetic `espn` object with the goal's `homeScore`/`awayScore` for that moment.

Pass `entry.minute` as `currentMinute` to `buildGoalCard`.

After building all goal cards, merge them into the deck before sorting: `[...storyCards, ...goalCards, ftCard].sort((a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0))`.

---

**BACKEND-3: ESPN team code alias map**

File: `src/api/espnScoreboard.js`

Add a constant at the top of the file:

```js
const ESPN_CODE_ALIAS = {
  BOS: 'BIH',  // Bosnia-Herzegovina: ESPN uses BOS, FIFA uses BIH
  HON: 'HND',  // Honduras
  GRE: 'GRE',  // Greece — verify if needed
};
function normalizeEspnCode(code) {
  return ESPN_CODE_ALIAS[code] ?? code;
}
```

In `matchEspnStatus` and `matchEspnEventId`, before the comparison `home?.team?.abbreviation !== match.homeCode`, apply `normalizeEspnCode` to the ESPN abbreviation:

```js
if (normalizeEspnCode(home?.team?.abbreviation) !== match.homeCode ||
    normalizeEspnCode(away?.team?.abbreviation) !== match.awayCode) continue;
```

---

**BACKEND-4: Add distinct `goal` sound**

File: `src/pages/LivePulse.jsx` — function `playTone`, `configs` object.

Add:
```js
goal: { freqs: [659, 784, 1047], dur: 0.8, vol: 0.12, wave: 'sine' },
```

These three frequencies (E5, G5, C6) create an ascending celebratory sound. The vol is slightly higher than other types because goal is the highest-significance event.

---

**BACKEND-5: Deferred goal card enrichment**

File: `src/pages/LivePulse.jsx`

When `buildGoalCard` is called and `goalEvent` is null (the ESPN events array doesn't yet include the scoring event), the card is created with `goalType = 'open play'` as a default. This is correct short-term behavior. Add a `pending: true` flag and `pendingScoreline: { hs, as_ }` to the card object when `goalEvent` is null.

In the polling loop, after deriving new notifs, scan `notifLog` for any cards with `pending: true`. For each pending card, check whether `summary.events` now contains an unattributed goal event (family in `['goal','penalty','own-goal']`) at approximately the card's `matchMinute` (within ±3 minutes). If found, build an enriched replacement card using the new event data and call:

```js
setNotifLog(prev => prev.map(n =>
  n.id === pendingCard.id
    ? { ...enrichedCard, silent: n.silent }
    : n
));
```

This replaces the card in place without changing its position in the list. Mark the event as attributed via `guard.firedStatKeys.add('goal-ev-' + ev.id)` to prevent double-attribution.

Limit this enrichment check to cards where `Date.now() - card.firedAt < 120_000` (2 minutes) — after that, the event either never arrived or the card is already stale.

---

**BACKEND-6: Handle multi-goal poll gaps**

File: `src/pages/LivePulse.jsx` — inside `deriveNotifs`, the `GOAL DETECTION` block.

Current behavior: When `currTotal > prevTotal`, one goal card fires for the current scoreline regardless of how many goals were scored.

Target: Calculate `totalNewGoals = currTotal - prevTotal`. If `totalNewGoals === 1`, existing behavior is correct. If `totalNewGoals >= 2`, attempt to reconstruct intermediate scorelines from `summary.scoreTimeline`.

```js
const totalNewGoals = (hs + as_) - (guard.prevHomeScore + guard.prevAwayScore);
if (totalNewGoals >= 2 && summary?.scoreTimeline?.length) {
  // Find timeline entries that fall between prev score total and current
  const prevTotal = guard.prevHomeScore + guard.prevAwayScore;
  const newEntries = summary.scoreTimeline.filter(e =>
    (e.homeScore + e.awayScore) > prevTotal &&
    (e.homeScore + e.awayScore) <= (hs + as_)
  );
  // Build a card per new entry using its scoreline
  let iterPrevHs = guard.prevHomeScore;
  let iterPrevAs = guard.prevAwayScore;
  for (const entry of newEntries) {
    const entryKey = `goal-${entry.homeScore}-${entry.awayScore}`;
    if (!guard.firedStatKeys.has(entryKey)) {
      guard.firedStatKeys.add(entryKey);
      const syntheticEspn = { ...espn, homeScore: entry.homeScore, awayScore: entry.awayScore };
      const syntheticGuard = { ...guard, prevHomeScore: iterPrevHs, prevAwayScore: iterPrevAs };
      out.push(buildGoalCard(match, syntheticEspn, summary, syntheticGuard, chosenCode, entry.minute));
    }
    iterPrevHs = entry.homeScore;
    iterPrevAs = entry.awayScore;
  }
} else if (totalNewGoals === 1) {
  // existing single-goal path
  const goalKey = `goal-${hs}-${as_}`;
  if (!guard.firedStatKeys.has(goalKey)) {
    guard.firedStatKeys.add(goalKey);
    out.push(buildGoalCard(match, espn, summary, guard, chosenCode, currentMinute));
  }
}
```

If `scoreTimeline` is empty and `totalNewGoals >= 2`, fire one consolidated card with title reflecting the full current score and subtext noting multiple goals were scored in a short window.

---

**BACKEND-7: Stale feed indicator**

File: `src/pages/LivePulse.jsx`

Add state: `const [feedError, setFeedError] = useState(false);`

In `runTick`'s outer `catch` block (where it currently does nothing), add `setFeedError(true)`.

At the top of `runTick`, before setting `espnMap`, add `setFeedError(false)`.

In the header JSX, below the poll count display, add:

```jsx
{feedError && (
  <span className="pulse-feed-error">⚠ Live feed delayed — retrying</span>
)}
```

Add to `index.css`:
```css
.pulse-feed-error {
  font-size: 0.72rem;
  color: #f87171;
  margin-left: 0.5rem;
  animation: pulse-fade 1.5s ease-in-out infinite alternate;
}
@keyframes pulse-fade {
  from { opacity: 1; }
  to   { opacity: 0.4; }
}
```

Also show the banner when `lastPoll !== null && Date.now() - lastPoll > 65_000` — this catches cases where the poll silently stalls without throwing. Add this derived value:

```js
const feedStale = lastPoll !== null && Date.now() - lastPoll > 65_000;
```

Show the banner when `feedError || feedStale`.

---

### Batch 2 — UX Improvements

**UX-1: Toast includes match context**

File: `src/pages/LivePulse.jsx` — in the toast render section (`.pulse-toast` items).

Above the toast title line, add a match label:

```jsx
<div className="pulse-toast__match">
  <FlagImg emoji={n.match.homeFlag} size={10} />
  <span>{n.match.homeTeam} vs {n.match.awayTeam}</span>
</div>
```

Add to `index.css`:
```css
.pulse-toast__match {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: var(--text-secondary);
  margin-bottom: 0.2rem;
}
```

---

**UX-2: Clicking a toast navigates to that match and selects that card**

File: `src/pages/LivePulse.jsx` — in the toast render, find where each toast item is rendered.

Add an `onClick` to the toast container div (not the dismiss button — that already has its own handler):

```jsx
onClick={() => {
  setSelectedMatchId(n.match.id);
  setSelectedCardId(n.id);
  setSnapshotOpen(false);
  dismissToast(n.id);
}}
```

Make the toast container `cursor: pointer` in CSS. Add `role="button"` and `tabIndex={0}` for accessibility. The dismiss button's `onClick` must call `e.stopPropagation()` to prevent the parent click from also firing.

---

**UX-3: "Latest card" jump button**

File: `src/pages/LivePulse.jsx` — in the card list section, after the `.pulse-card-list` div.

Add conditionally when `selectedMatchCards.length > 4`:

```jsx
{selectedMatchCards.length > 4 && (
  <button
    className="pulse-jump-latest"
    onClick={() => {
      const latest = selectedMatchCards[selectedMatchCards.length - 1];
      setSelectedCardId(latest.id);
      document.querySelector('.pulse-card-list')?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }}
  >
    ↓ Latest
  </button>
)}
```

Add to `index.css`:
```css
.pulse-jump-latest {
  display: block;
  margin: 0.4rem auto 0;
  padding: 0.3rem 1.1rem;
  font-size: 0.78rem;
  background: var(--surface);
  border: 1px solid #334155;
  border-radius: 999px;
  color: var(--text-secondary);
  cursor: pointer;
}
.pulse-jump-latest:hover { border-color: #64748b; color: var(--text-primary); }
```

---

**UX-4: Team picker available pre-match**

File: `src/pages/LivePulse.jsx`

Find the condition wrapping the team picker: `{(isSelectedLive || isSelectedPost) && (`. Change it to show for pre-match too:

```jsx
{selectedMatch && (
```

This shows the picker as soon as a match is selected, regardless of ESPN state. The picker buttons still work — `chosenTeams[matchId]` is set and `chosenTeamsRef` syncs. The kickoff card will fire with the correct `chosenCode` because it reads from `chosenTeamsRef.current` at fire time.

Add a small note below the picker buttons visible only when `espn?.state === 'pre' || !espn`:

```jsx
{(!selectedEspn || selectedEspn.state === 'pre') && (
  <span className="pulse-team-picker__note">Pick your team before kickoff for a personalized feed</span>
)}
```

---

**UX-5: Guard double-tap on Play button**

File: `src/pages/LivePulse.jsx` — function `startPlayback`.

At the very top of the function, before any other logic:

```js
function startPlayback(matchId) {
  if (replayStateMap[matchId] === 'playing') return;
  if (replayIntervalsRef.current[matchId]) {
    clearInterval(replayIntervalsRef.current[matchId]);
    delete replayIntervalsRef.current[matchId];
  }
  // ... rest of function unchanged
}
```

---

**UX-6: Replay loading timeout**

File: `src/pages/LivePulse.jsx`

Add state: `const [replayLoadStartMap, setReplayLoadStartMap] = useState({});`

When `replayStateMap` is set to `'loading'`, also record the start time:
```js
setReplayStateMap(prev => ({ ...prev, [m.id]: 'loading' }));
setReplayLoadStartMap(prev => ({ ...prev, [m.id]: Date.now() }));
```

In the replay panel JSX, when rendering the `'loading'` state, derive whether it has timed out:
```jsx
{(() => {
  const loadStart = replayLoadStartMap[selectedMatchId];
  const timedOut = loadStart && Date.now() - loadStart > 15_000;
  return timedOut
    ? <span className="pulse-replay-panel__text">Couldn't load match data — try refreshing.</span>
    : (
      <>
        <span className="pulse-replay-panel__spinner">⟳</span>
        <span className="pulse-replay-panel__text">Gathering match data…</span>
      </>
    );
})()}
```

Note: the `tick_` state that refreshes every 15s (already in the component) will cause this timeout UI to appear without needing a separate timer.

---

**UX-7: Guard persistence across page refresh (sessionStorage)**

File: `src/pages/LivePulse.jsx`

After updating guard fields at the end of the polling loop (where `guard.prevExScore = ex.score` etc. is set), serialize the guard to `sessionStorage`:

```js
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
} catch { /* storage full or private mode — fail soft */ }
```

When creating a new guard (inside `if (!guardsRef.current[m.id])`), check sessionStorage first:

```js
if (!guardsRef.current[m.id]) {
  const saved = (() => {
    try {
      const raw = sessionStorage.getItem(`lp-guard-${m.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  guardsRef.current[m.id] = saved ? {
    ...saved,
    firedStatKeys: new Set(saved.firedStatKeys ?? []),
  } : {
    initialized: false, prevExScore: null,
    prevEspnState: null, prevPeriod: null,
    prevHomeScore: null, prevAwayScore: null,
    firedBands: {}, firedStatKeys: new Set(), firedPost: false,
  };
}
```

If a saved guard exists, `guard.initialized` is already `true`, so the first poll will skip the init branch and go directly to `deriveNotifs`. Since `firedStatKeys` is rehydrated, no cards re-fire. Since `prevHomeScore`/`prevAwayScore` are rehydrated, goals during the gap between last poll and refresh could still be missed (acceptable).

---

### Batch 3 — New Functionality

**NEW-1: Extra time and penalty shootout support**

File: `src/pages/LivePulse.jsx`

**Beat card for extra time start:**
In `deriveNotifs`, after the second-half beat card block, add:

```js
if (isLive && period >= 3 && (guard.prevPeriod ?? 0) < 3 && !guard.firedStatKeys.has('extra-time')) {
  guard.firedStatKeys.add('extra-time');
  out.push({
    id: `${match.id}-extra-time`, type: 'beat', priority: 3, icon: '⏱',
    title: `Extra time — 30 more minutes to decide this`,
    subtext: `Neither team could separate themselves in 90 minutes. Extra time is two 15-minute halves — first to score doesn't win automatically (unlike Golden Goal rules of the past). If it's still level after 120 minutes, it goes to a penalty shootout. Fatigue is now a tactical weapon: tired legs, fresh substitutes, and psychological pressure at maximum.`,
    match, firedAt: Date.now(), matchMinute: 90,
  });
}
```

**Beat card for penalty shootout:**
```js
if (isLive && period >= 5 && (guard.prevPeriod ?? 0) < 5 && !guard.firedStatKeys.has('penalties')) {
  guard.firedStatKeys.add('penalties');
  out.push({
    id: `${match.id}-penalties`, type: 'beat', priority: 3, icon: '🥅',
    title: `Penalty shootout — sudden death`,
    subtext: `After 120 minutes of soccer, the result comes down to five kicks per side from 12 yards. Each player walks up alone. The goalkeeper has no data on where the ball is going — they pick a side and dive. World Cup shootout conversion rate: ~73%. The team that scores all five and whose goalkeeper saves one wins. Some of the most dramatic moments in sports history happen in the next few minutes.`,
    match, firedAt: Date.now(), matchMinute: 120,
  });
}
```

**Milestone cards for extra time minutes:**
Add entries to `MILESTONES` for minutes 95, 100, 105, 110, 120. Keep them educational and time-sensitive:

```js
95: {
  icon: '⏱', title: 'Extra time — first period',
  body: (match, espn, stats, firingLate = false) => {
    if (firingLate) return `Extra time first period underway. Both teams have had 90 minutes of the physical demands of international football — tactical discipline now competes with exhaustion.`;
    const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
    return hs === as_
      ? `Still ${hs}–${as_} going into extra time. 30 more minutes — the first team to score creates enormous psychological pressure.`
      : `${hs > as_ ? match.homeTeam : match.awayTeam} lead ${Math.max(hs,as_)}–${Math.min(hs,as_)} in extra time. Defending a lead with tired legs is one of the hardest things in soccer.`;
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
120: {
  icon: '⏱', title: 'End of extra time',
  body: (match, espn, stats, firingLate = false) => {
    return `120 minutes played. If the score is still level after this, it goes to a penalty shootout — the most psychologically intense 15 minutes in team sports.`;
  },
},
```

**Timeline fix for extra time:**
In the `timelineProgress` calculation:
```js
const timelineProgress = isSelectedPost
  ? 100
  : isSelectedLive && currentMinute != null
    ? currentMinute <= 90
      ? Math.min((currentMinute / 90) * 100, 99)
      : Math.min(((currentMinute - 90) / 30) * 100, 99)  // ET maps 90–120 to 0–99%
    : 0;
```

When `period >= 3`, the timeline represents extra time, not regular time. You don't need to change the HT marker position — it can stay at 50% as a visual anchor.

---

**NEW-2: Substitution card**

File: `src/pages/LivePulse.jsx` — in `deriveNotifs`, add a new layer between LAYER 2 (milestones) and LAYER 3 (explain cards). Call it LAYER 2.5.

```js
// ── LAYER 2.5: SUBSTITUTION AND DISCIPLINE EVENTS ─────────────────────────

if (isLive && summary?.events) {
  const subEvents = summary.events.filter(ev => ev.family === 'substitution');
  // Fire at most 2 substitution cards per match to avoid clutter
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
```

---

**NEW-3: Red card card**

In the same LAYER 2.5 block:

```js
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
} // end LAYER 2.5
```

---

**NEW-4: Danger zone narrative thread card**

File: `src/pages/LivePulse.jsx` — in `deriveNotifs`, in LAYER 4 (tension band crossings) or as a new LAYER 4.5 after it.

This card fires once when the match is level after 70' AND the counter-attack pattern was already identified. It threads back to the earlier counter-attack card.

```js
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
  const dominant  = hp >= ap ? match.homeTeam : match.awayTeam;
  const counter   = hp >= ap ? match.awayTeam : match.homeTeam;
  const domPoss   = Math.max(hp, ap);
  out.push({
    id: `${match.id}-danger-zone`, type: 'tension', priority: 4, icon: '⚡',
    title: `Level at ${currentMinute}' — the counter-attack tension is now critical`,
    subtext: `Earlier we flagged the counter-attack pattern: ${dominant} with ${domPoss}% possession, ${counter} creating chances from fewer touches. That dynamic is now at maximum pressure. A single counter-attack goal in this window could be the decisive moment of the match. One mistake in transition ends this game.`,
    match, firedAt: Date.now(), matchMinute: currentMinute,
  });
}
```

---

**NEW-5: Card share button**

File: `src/pages/LivePulse.jsx` — in the selected card detail view (`.pulse-detail` block).

After the close button (`pulse-detail__close`), add:

```jsx
<button
  className="pulse-detail__share"
  title="Copy card text"
  onClick={() => {
    const text = `${selectedCard.icon} ${selectedCard.title}\n\n${selectedCard.subtext}\n\n— Live Pulse · wc.ngengwe.com/live-pulse`;
    navigator.clipboard?.writeText(text).catch(() => {});
  }}
>
  📋
</button>
```

Add to `index.css` near `.pulse-detail__close`:
```css
.pulse-detail__share {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.5;
  padding: 0.2rem;
  transition: opacity 0.15s;
}
.pulse-detail__share:hover { opacity: 1; }
```

---

## CSS Color Reference (do not use values not in this list for pulse UI)

```
--surface:        #0f172a  (dark panel background)
--text-primary:   #f1f5f9  (primary text)
--text-secondary: #94a3b8  (secondary/muted text)
beat:             #06b6d4
milestone:        #6366f1
explain:          #a78bfa
tension:          #f59e0b
post:             #22c55e
goal:             #f97316
```

---

## Commit Structure

Make 3 commits total, one per batch:

```
feat(live-pulse): parallelize ESPN fetches, add goal reconstruction and sound
feat(live-pulse): toast context, toast navigation, latest card jump, pre-match picker
feat(live-pulse): extra time cards, substitution/red card events, danger zone thread, card share
```

Each commit message body should note which BACKEND/UX/NEW items were implemented.

After all commits: `git push` to trigger Cloudflare Pages auto-deploy to `wc.ngengwe.com`.
