# Match Excitement Adaptation Plan for Cup Radar

Date: 2026-06-13
Scope: review and implementation plan only. No code changes are proposed in this document.

## Executive Summary

`game_right_here` already has the right architecture for this feature:

- pure excitement engine
- config-driven badge definitions
- separate badge evaluator layer
- adapter layer for live data
- tests that prove scoring and badge behavior

The good news is that `wc_radar` does not need a server rewrite to get to a real soccer version. ESPN's World Cup `scoreboard` and `summary` endpoints are both CORS-open, and the soccer `summary` response is much richer than the current Cup Radar integration uses today. It includes:

- full commentary/event log
- compact `keyEvents`
- live team box score stats
- live rosters and positions
- group standings context

That means:

1. MVP can ship fast with score/clock/state-driven excitement on the existing 30 second polling loop.
2. V2 can become genuinely event-driven from ESPN summary data without needing a backend, because the summary feed can reconstruct most of the match history on demand.
3. A Cloudflare Pages Function is optional hardening, not a hard requirement to ship.

The main caveat is data normalization. ESPN soccer commentary is usable, but not clean enough to consume raw. Some plays appear twice under the same `play.id` with two human-readable lines, and event subtype strings are very soccer-specific (`penalty---scored`, `own-goal`, `goal---header`, etc.). The adapter needs deduping and event-family normalization before any score or badge math runs.

## What Is Reusable vs. What Needs a Soccer Rewrite

### Reusable almost as-is

From `game_right_here`:

- The overall engine pattern: `weights -> pure scoring function -> threshold labels`.
- The badge architecture: `BadgeDefinition[]` plus independent evaluator functions.
- Core data concepts:
  - score snapshots
  - rolling excitement points
  - dominant badge plus secondary badges
- The adapter pattern: fetch live data, normalize to internal shape, fail soft.
- The testing mindset: pure function tests for components and badge triggers.

Recommended direct conceptual carry-over:

- `ExcitementScorePoint`
- `ScoreSnapshot`
- `BadgeDefinition`
- `evaluateAllBadges(...)`
- sustained-threshold dominant badge logic

### Needs a soccer-specific rewrite

- The math. Basketball assumptions like possessions, lead-change frequency, and trading baskets do not transfer directly.
- The live adapter. `wc_radar` currently only uses ESPN scoreboard status; soccer summary normalization must be added.
- The event taxonomy. Soccer excitement depends on goals, late pressure, cards, penalties, extra time, and knockout stakes.
- The UI implementation. `game_right_here`'s render layer is Tailwind/Next-oriented; Cup Radar should reuse the product idea, not copy the component code.
- The tournament context inputs. Soccer needs rankings and group-stage implication context instead of NCAA seeds.

### Reuse the pattern, not the exact implementation

The strongest translation is:

- keep the architecture
- replace the sport model
- keep the badge engine shape
- rewrite the score inputs
- rebuild the UI in Cup Radar's existing CSS system

## Review Findings From the Current Codebases

### `game_right_here` findings that matter

Files reviewed:

- `../game_right_here/README.md`
- `../game_right_here/types/index.ts`
- `../game_right_here/config/excitementWeights.ts`
- `../game_right_here/config/badgeDefinitions.ts`
- `../game_right_here/lib/analytics/excitementEngine.ts`
- `../game_right_here/lib/analytics/badgeEngine.ts`
- `../game_right_here/lib/data-sources/espnAdapter.ts`
- `../game_right_here/lib/data-sources/mockAdapter.ts`
- `../game_right_here/components/game/ExcitementMeter.tsx`
- `../game_right_here/components/game/BadgeDisplay.tsx`
- `../game_right_here/components/dashboard/BadgeLegend.tsx`
- `../game_right_here/__tests__/excitementEngine.test.ts`
- `../game_right_here/__tests__/badgeEngine.test.ts`

Important takeaways:

- The architecture is already modular enough to port.
- The real basketball engine now uses 8 components, not the older 7-factor README description.
- The badge system is deeper than the README implies and already supports dominant-vs-secondary badge presentation.
- The tests are useful as a blueprint for what a soccer engine test suite should look like.

### `wc_radar` findings that matter

Files reviewed:

- `src/api/espnScoreboard.js`
- `src/api/footballData.js`
- `src/hooks/useMatches.js`
- `src/dashboard/AllGames.jsx`
- `src/dashboard/CityHQTemplate.jsx`
- `src/utils/time.js`
- `src/data/matches.json`

Important takeaways:

- `AllGames.jsx` already does the right first optimization: one ESPN scoreboard fetch per date, then match-level mapping from the shared event list.
- `CityHQTemplate.jsx` still fetches one match status at a time for the featured hero.
- `useMatches()` is mostly local JSON in deployed environments; `football-data.org` live mode only works on localhost because of CORS limits.
- ESPN is already the deployed live-status source that Cup Radar trusts in the browser, so extending the ESPN path is a better fit than trying to build on `football-data.org`.
- `matches.json` remains the correct source of truth for schedule, venue, group, stage, and local editorial notes.

## ESPN Soccer Summary Findings

### Verified endpoints

- Scoreboard:
  - `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260613`
- Summary:
  - `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=760420`
  - `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=760419`

### Browser access

Verified by HTTP headers on 2026-06-13:

- scoreboard returns `Access-Control-Allow-Origin: *`
- summary returns `Access-Control-Allow-Origin: *`
- scoreboard cache header was `max-age=3`
- summary cache header was `max-age=6`

Conclusion: a browser-only implementation is viable.

### What the soccer summary includes

Top-level keys observed on 2026-06-13:

- `article`
- `boxscore`
- `broadcasts`
- `commentary`
- `format`
- `gameInfo`
- `header`
- `keyEvents`
- `leaders`
- `news`
- `odds`
- `rosters`
- `standings`
- `videos`

That is enough for:

- live score and state
- event-driven badge triggers
- pressure heuristics from shots/corners/saves
- player-level context
- group-stage stakes context

### Example response shape

Scoreboard event shape used for match lookup:

```json
{
  "id": "760420",
  "shortName": "SUI @ QAT",
  "state": "post",
  "detail": "FT",
  "clock": "90'+7'",
  "home": "Qatar",
  "homeScore": "1",
  "away": "Switzerland",
  "awayScore": "1"
}
```

Commentary play shape observed from `summary?event=760420`:

```json
{
  "play": {
    "id": "49493954",
    "type": {
      "type": "penalty---scored",
      "text": "Penalty - Scored"
    },
    "text": "Goal! Qatar 0, Switzerland 1. Breel Embolo (Switzerland) converts the penalty...",
    "period": { "number": 1 },
    "clock": {
      "value": 992.0,
      "displayValue": "17'"
    },
    "team": { "displayName": "Switzerland" },
    "participants": [
      { "athlete": { "displayName": "Breel Embolo" } }
    ],
    "wallclock": "2026-06-13T19:21:20Z"
  }
}
```

Live team stat shape observed from `summary?event=760419`:

```json
[
  {
    "team": "Brazil",
    "shots": "4",
    "shotsOnTarget": "1",
    "possessionPct": "56.1",
    "redCards": "0",
    "yellowCards": "1"
  },
  {
    "team": "Morocco",
    "shots": "12",
    "shotsOnTarget": "2",
    "possessionPct": "43.9",
    "redCards": "0",
    "yellowCards": "0"
  }
]
```

Roster data also exists and includes:

- player names
- positions
- starter/sub status
- jersey number
- per-player match stats
- per-player event booleans such as `scoringPlay`, `yellowCard`, `redCard`, `substitution`

Standings data also exists in the summary during group stage, which is useful for implication badges.

### What this means in practice

The soccer summary endpoint is not just a prettier scoreboard. It is rich enough to support:

- goals with minute and players
- yellow cards
- substitutions
- shot pressure
- corners and saves via boxscore
- group-stage stakes from embedded standings
- extra-time and shootout-aware logic through period/clock/event metadata

### Important caveats

#### 1. Commentary contains duplicate play IDs

Example from the same sampled summary:

- one `play.id` can appear once as "Foul by X"
- and again as "Y wins a free kick"

Example:

- `49493925`
  - "Penalty Switzerland. Remo Freuler draws a foul in the penalty area."
  - "Penalty conceded by Mahmoud Abunada (Qatar) after a foul in the penalty area."

Implementation implication:

- use `commentary` as the rich source
- dedupe by `play.id`
- keep one canonical normalized event for analytics
- optionally keep the full text variants for tooltip or narrative UI later

#### 2. Event subtype strings are not normalized to one soccer-wide standard

Observed values included:

- `penalty---scored`
- `own-goal`
- `yellow-card`
- `substitution`
- `shot-on-target`
- `shot-off-target`
- `shot-blocked`
- `corner-awarded`
- `start-delay`
- `end-delay`

Implementation implication:

- normalize to event families with prefix and flag checks
- do not write badge logic against a single exact ESPN subtype string

#### 3. ESPN is still an unofficial feed

Implementation implication:

- treat it as best-effort live enrichment
- never let summary failure break the match card
- keep `matches.json` as the editorial schedule source of truth

## Recommended Internal Data Model for Soccer

Keep the same broad model as `game_right_here`, but rename the event shape to be soccer-native.

Suggested normalized event shape:

```ts
type SoccerMatchEvent = {
  id: string
  eventId: string
  minute: number
  minuteLabel: string
  period: number
  wallclock?: string
  teamName?: string
  teamId?: string
  primaryPlayer?: string
  secondaryPlayer?: string
  rawType: string
  family:
    | 'goal'
    | 'penalty'
    | 'red-card'
    | 'yellow-card'
    | 'substitution'
    | 'shot'
    | 'corner'
    | 'offside'
    | 'delay'
    | 'phase'
    | 'other'
  scoringPlay: boolean
  ownGoal?: boolean
  shootout?: boolean
  text: string
}
```

Keep these concepts directly:

- `ScoreSnapshot`
- `ExcitementScorePoint`
- `BadgeDefinition`
- `Badge`

## Proposed Soccer Excitement Score Formula

### Design principle

Soccer excitement is not "how much happened per minute" in the basketball sense. It is mostly:

- score pressure
- clock pressure
- stage pressure
- upset pressure
- pressure sequences around the box
- sudden swing moments

So the engine should reward tension, not just event count.

### Proposed weighted model

| Component | Weight | MVP | V2 | Why it matters |
|---|---:|---|---|---|
| `scorePressure` | 0.26 | Yes | Yes | In soccer, tie games and one-goal games are the core tension driver. |
| `clockLeverage` | 0.20 | Yes | Yes | 85'+, stoppage time, extra time, and shootouts dramatically change watchability. |
| `stageAndScenario` | 0.12 | Partial | Yes | Knockout rounds and final group-match stakes matter even before events pile up. |
| `upsetPressure` | 0.10 | Yes | Yes | A lower-ranked team leading or drawing late is instant drama. |
| `attackPressure` | 0.12 | No | Yes | Late shots, corners, saves, and box pressure are soccer's version of "something is coming." |
| `leadSwingDrama` | 0.09 | Partial | Yes | Equalizers, lead changes, and comeback progress should visibly spike the meter. |
| `chaosBonus` | 0.06 | No | Yes | Red cards, penalties, VAR-like delays, and card clusters change match texture fast. |
| `finishBonus` | 0.05 | Yes | Yes | Extra time and penalties deserve a direct bonus. |

Total weight: `1.00`

### Suggested component behavior

#### `scorePressure`

Suggested base curve:

- tie: `1.00`
- one-goal margin: `0.82`
- two-goal margin: `0.38`
- three-plus goal margin: `0.10`

Late-game bump:

- if 75'+ and margin <= 1, add a closeness boost
- if knockout and margin == 1 after 85', push closer to max

#### `clockLeverage`

Suggested curve:

- 0'-59': low-to-moderate
- 60'-74': start climbing
- 75'-84': serious tension window
- 85'-90'+: major spike
- extra time: high baseline
- shootout: max or near-max

#### `stageAndScenario`

Inputs:

- knockout stage > group stage
- group matchday 3 > group matchday 1 or 2
- if summary standings show both teams still live for qualification, add pressure

This can be simplified in MVP:

- group stage = low
- knockout = high
- final group match = medium-high

#### `upsetPressure`

Use a simple team-strength file for now:

- `src/data/team-strength.json`

Recommended upstream choice:

- FIFA ranking snapshot or Elo-style editorial snapshot

Behavior:

- zero if ranking gap is small
- moderate if underdog is drawing late
- high if underdog is leading after 60'
- very high if underdog leads in knockout or elimination context

#### `attackPressure`

This is the most soccer-specific new component.

Suggested signals:

- shots on target in last 10 minutes
- blocked shots in last 10 minutes
- corners in last 10 minutes
- saves by the leading side's goalkeeper
- pressure by the trailing team gets extra weight

This lets a 0-0 or 1-0 match still feel hot when one side is pounding the door.

#### `leadSwingDrama`

Suggested signals:

- equalizer in the last 15 minutes
- recent lead change
- deficit cut from 2 goals to 1
- comeback completed

MVP version can infer a simplified form from score snapshots only.

#### `chaosBonus`

Suggested triggers:

- red card
- second yellow
- penalty awarded
- penalty saved or missed
- review/delay clusters
- two or more cards in a short span

This should be a bonus, not the main score driver.

#### `finishBonus`

Suggested behavior:

- knockout match tied after 90': strong bonus
- extra time active: higher bonus
- shootout active: max bonus

### Scoring thresholds

Keep the same broad user-facing threshold structure from `game_right_here`, translated to soccer:

- `0-39`: calm
- `40-59`: live, but normal
- `60-74`: tense
- `75-84`: high alert
- `85-100`: "Goal Right Here"

Recommendation:

- keep the same power-curve idea from basketball so the score feels sticky in the middle and only reaches 85+ when several signals line up

## Proposed Badge Set (12 to Start)

Start with a smaller badge set than `game_right_here`. Soccer-specific clarity matters more than raw badge count.

| Priority | Badge ID | Phase | Trigger |
|---:|---|---|---|
| 1 | `goal-right-here` | MVP | Excitement 85+ for 2 consecutive ticks. Dominant badge. |
| 2 | `late-equalizer-watch` | MVP | 75'+, one-goal game or tie with high clock leverage. |
| 3 | `stoppage-time-stunner` | V2 | Goal in 90'+ or 120'+. |
| 4 | `comeback-complete` | V2 | Team erases a 2-goal deficit to draw or win. |
| 5 | `upset-alert` | MVP | Underdog drawing or leading in the second half. |
| 6 | `giant-killers` | V2 | Underdog completes the upset or is minutes from doing so. |
| 7 | `red-card-chaos` | V2 | Red card or second yellow creates a man advantage. |
| 8 | `penalty-drama` | V2 | Penalty awarded, saved, missed, or retaken. |
| 9 | `siege-mode` | V2 | Trailing team logs a pressure burst of shots/corners/saves in a short window. |
| 10 | `win-or-go-home` | MVP | Knockout match, or final group match with live qualification stakes. |
| 11 | `extra-time-drama` | MVP | Knockout tie after 90' or extra time underway. |
| 12 | `shootout-thriller` | V2 | Shootout active or just decided. |

### Strong next-wave badges after the first 12

- `keeper-under-siege`
  - close match plus 5+ saves by one keeper
- `clean-sheet-watch`
  - 70'+ with a 0-0 or 1-0 match that is still live
- `group-of-death-decider`
  - final group match where multiple teams remain live
- `late-leveler`
  - equalizer after 80'

### Badge presentation recommendation

On Cup Radar cards:

- one dominant badge
- up to two secondary pills
- no wall of badges on match cards

This matches what worked visually in `game_right_here` while staying cleaner in Cup Radar's denser layouts.

## Data and Architecture Plan for `wc_radar`

### Core recommendation

Add a dedicated live-excitement hook that sits beside the existing match data hook, instead of burying this logic inside `useMatches()`.

Reason:

- `useMatches()` is mostly schedule/status state
- excitement has a different polling cadence and different data source
- it should be easy to disable or fail independently

### Files to add

- `src/config/matchExcitementWeights.js`
- `src/config/matchBadgeDefinitions.js`
- `src/utils/normalizeEspnSoccerSummary.js`
- `src/utils/matchExcitementEngine.js`
- `src/utils/matchBadgeEngine.js`
- `src/hooks/useMatchExcitement.js`
- `src/components/ExcitementMeter.jsx`
- `src/components/MatchExcitementBadges.jsx`
- `src/data/team-strength.json`

Optional but recommended if this grows:

- `src/utils/matchExcitementLabels.js`
- `src/utils/matchExcitementCache.js`

### Files to change

- `src/api/espnScoreboard.js`
  - add summary fetch helpers or a sibling summary adapter
- `src/dashboard/AllGames.jsx`
  - render excitement meter and badges on Match Day cards
- `src/dashboard/CityHQTemplate.jsx`
  - render a larger meter and top badges on MatchDayHero

Optional:

- `src/hooks/useMatches.js`
  - only if you want shared coordination between schedule status and excitement

### Suggested adapter responsibilities

#### `src/api/espnScoreboard.js`

Keep:

- `fetchEspnScoreboard(dateStr)`
- `matchEspnStatus(events, match)`

Add:

- `matchEspnEventId(events, match)`
- `fetchEspnSummary(eventId)`

#### `src/utils/normalizeEspnSoccerSummary.js`

Responsibilities:

- read `summary.commentary`
- drop entries without `play`
- dedupe by `play.id`
- normalize ESPN subtype strings into event families
- derive last-10-minute pressure counts
- expose:
  - normalized events
  - current team stats
  - live standings context
  - roster context if needed later

### Suggested runtime flow

#### All Games page

1. Keep the current shared scoreboard fetch per date every 30 seconds.
2. For today's matches, resolve `eventId` from the scoreboard result.
3. Only fetch `summary` for matches whose ESPN state is `in`.
4. Optionally keep fetching for a short `post` window to catch final updates and badge settlement.
5. Run the excitement engine from:
   - current score/state
   - match metadata from `matches.json`
   - normalized summary data if available
6. Render:
   - current excitement score
   - one dominant badge
   - up to two secondary badges

#### City HQ hero

1. Resolve the featured match's ESPN `eventId`.
2. Reuse the same summary cache and scoring hook.
3. Show:
   - excitement score
   - dominant badge
   - short "why hot" line, such as:
     - `89', tied, knockout`
     - `Trailing side has 3 shots on target in 8 minutes`

### Polling strategy

Recommended initial cadence:

- scoreboard: keep current 30 second cadence
- summary: 30 seconds for live matches only

Why 30 seconds is enough:

- aligns with existing Cup Radar behavior
- respects browser simplicity
- summary is already server-cached at 6 seconds, so 30 seconds is not wasteful
- World Cup live-match concurrency is low enough that this is manageable client-side

### Persistence strategy

No backend persistence is required for V2.

Reason:

- the soccer summary response already contains most of the match history
- excitement can be recomputed from the full normalized event log on each fetch

Recommendation:

- MVP: current scalar score only, optional in-memory snapshot history
- V2: compute a rolling `ExcitementScorePoint[]` from the normalized event timeline
- optional: cache the latest excitement payload in `sessionStorage` or `localStorage` per `eventId` so refreshes feel instant

### Fallback behavior

This needs to match Cup Radar's current fail-soft style.

#### If summary fetch fails

- still show match status from scoreboard
- compute MVP excitement from score, clock, stage, and upset context only
- if even that is too thin, hide badges and meter rather than show wrong drama

#### If scoreboard fetch fails

- keep local `matches.json` schedule and status presentation
- show no excitement UI, or show a quiet placeholder state

#### If rankings/strength data is missing

- zero out `upsetPressure`
- do not block the whole score

#### If event normalization sees unknown subtypes

- map to `other`
- ignore in badge math
- do not crash the hook

### Reliability hardening path

The pure browser path is good enough to ship.

If traffic grows or ESPN changes behavior, the next hardening step should be:

- add a Cloudflare Pages Function
- fetch ESPN there
- normalize once at the edge
- cache for 10 to 15 seconds
- send Cup Radar a smaller stable response

That should be treated as a reliability upgrade, not a prerequisite.

## UI Recommendation for Cup Radar

### Match Day cards on All Games

Add, in order:

1. a slim excitement meter under the live status line
2. one dominant badge beneath the meter
3. optional one-line explanation:
   - `Tied in 88'`
   - `Underdog leading`
   - `Knockout extra time`

### Match Day hero on City HQ

Add:

- larger meter
- dominant badge
- up to two secondary pills
- one short rationale line

This should feel like "what should I watch right now?", not like a stat dashboard exploded onto the page.

## Phased Rollout

### MVP: ships fastest

Goal: add believable excitement without event parsing complexity.

Inputs:

- `matches.json`
- ESPN scoreboard state
- current clock
- current score
- stage/group metadata
- static team-strength file

Components enabled:

- `scorePressure`
- `clockLeverage`
- simplified `stageAndScenario`
- `upsetPressure`
- simplified `leadSwingDrama` from score snapshots
- `finishBonus`

Badges enabled:

- `goal-right-here`
- `late-equalizer-watch`
- `upset-alert`
- `win-or-go-home`
- `extra-time-drama`

Why this MVP works:

- it adds clear value quickly
- it fits the current polling model
- it does not depend on commentary normalization being perfect

### V2: event-driven match drama

Goal: make the score feel truly soccer-aware.

Add:

- summary fetch by `eventId`
- commentary normalization
- attack pressure
- penalty/card/substitution chaos triggers
- event-driven badge evaluation
- optional excitement history sparkline

Badges unlocked:

- `stoppage-time-stunner`
- `comeback-complete`
- `red-card-chaos`
- `penalty-drama`
- `siege-mode`
- `shootout-thriller`
- `giant-killers`

### V3: reliability and editorial depth

Only if the feature proves valuable:

- edge-normalized summary proxy
- precomputed team-strength refresh workflow
- historical peak excitement for finished matches
- group-scenario explainer copy

## Open Product Questions

These should be answered before implementation starts:

1. Should the score mean "how urgent is this match right now?" or "how great has this match been overall so far?"
   - Recommendation: optimize for "right now" because the feature is going on live cards.

2. What should define "underdog"?
   - FIFA ranking snapshot
   - Elo-style rating
   - Cup Radar editorial tiering

3. Should group-stage implication badges depend on live standings from ESPN only, or on a local scenario file that is easier to reason about?

4. Do you want excitement on only live Match Day cards first, or also on finished matches later as a "peak drama" score?

5. How much UI weight should badges get on dense cards?
   - Recommendation: one dominant badge plus two secondary pills max.

6. Should we add a small test harness now?
   - Recommendation: yes, if implementation starts. The engine is pure enough that light Vitest coverage would pay off quickly.

## Final Recommendation

This adaptation is more viable than expected.

Recommended path:

1. Build MVP first with score/clock/state-based excitement.
2. Add a dedicated ESPN soccer summary adapter immediately after.
3. Use `commentary` as the primary event source, not `keyEvents`.
4. Dedupe by `play.id` before analytics.
5. Keep the implementation fully client-side for now.
6. Only introduce a Cloudflare function if traffic or reliability pressure justifies it.

If we follow that path, Cup Radar can get a believable live "Match Excitement" layer quickly, then grow into something genuinely distinctive once the event-driven V2 badges land.

## Sources Reviewed

Local code reviewed:

- `src/api/espnScoreboard.js`
- `src/api/footballData.js`
- `src/hooks/useMatches.js`
- `src/dashboard/AllGames.jsx`
- `src/dashboard/CityHQTemplate.jsx`
- `src/utils/time.js`
- `src/data/matches.json`
- `../game_right_here/README.md`
- `../game_right_here/types/index.ts`
- `../game_right_here/config/excitementWeights.ts`
- `../game_right_here/config/badgeDefinitions.ts`
- `../game_right_here/lib/analytics/excitementEngine.ts`
- `../game_right_here/lib/analytics/badgeEngine.ts`
- `../game_right_here/lib/data-sources/espnAdapter.ts`
- `../game_right_here/lib/data-sources/mockAdapter.ts`
- `../game_right_here/components/game/ExcitementMeter.tsx`
- `../game_right_here/components/game/BadgeDisplay.tsx`
- `../game_right_here/components/dashboard/BadgeLegend.tsx`
- `../game_right_here/__tests__/excitementEngine.test.ts`
- `../game_right_here/__tests__/badgeEngine.test.ts`

Live ESPN endpoints verified on 2026-06-13:

- `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260613`
- `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=760420`
- `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=760419`
