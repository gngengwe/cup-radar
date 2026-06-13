# World Cup Primer Dynamic Roadmap

## North Star
Make the `World Cup Primer` feel dynamic because it adapts to the reader, not because it pretends to know what is happening live.

That means:
- more guided entry points
- better visual rhythm
- stronger cross-linking between concepts
- more personality
- more “this was made for me” energy for American sports fans

It does **not** mean:
- fake urgency
- live-score language
- countdown gimmicks
- arbitrary animation for its own sake

## Current Strengths
- The page is already content-driven through [world-cup-guide-page.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\world-cup-guide-page.json:1>).
- [WorldCupPrimer.jsx](<c:\becomiNG\HK_Clearway\wc_radar\src\pages\WorldCupPrimer.jsx:1>) already supports section-level rendering, global search, tag filtering, and fan-mode filtering.
- The content system is now broad enough that the page can start behaving like a guided product instead of a static article.

## What “More Dynamic” Should Mean Here

### 1. Personalized entry, not just filtered content
The page should help a visitor choose a path:
- `Teach me the rules`
- `Help me pick a team`
- `Make me sound smart`
- `Explain the weird stuff`

This is stronger than simply showing all sections at once because it reduces overwhelm and makes the page feel intentionally welcoming.

### 2. Search that behaves like guidance
The current search is functional, but it should feel editorially smart.

If someone searches:
- `offside`
- `VAR`
- `Xavi Simons`
- `4-3-3`
- `Mexico`

The page should not only filter cards. It should surface a `best match` or `start here` block at the top.

### 3. Fan mode should change page choreography
Right now fan mode mostly hides/shows cards. That is useful, but not magical.

Better behavior:
- `Brand New`: start with rules, analogies, dictionary, then simple World Cup context
- `Casual Fan`: start with watch-smart, adopt-a-team, history, missing stars
- `I Know Ball`: start with tactics, formations, culture, history, and then let basics fall lower

This makes the page feel remixed rather than merely filtered.

### 4. Break the “all cards are equal” pattern
The current page architecture is very good for consistency, but it risks visual sameness.

The page needs a few high-contrast moments:
- one oversized feature explainer
- one visual rule lab
- one timeline rail
- one quiz block
- one “adopt a path” hero module

Without those moments, even great content can start to feel like an inventory grid.

### 5. Let sections talk to each other
The best dynamic experience here is not a new API. It is stronger internal linking.

Examples:
- glossary cards should be clickable into related tactic cards
- a missing-player card should point toward the relevant team-culture or adopt-a-team card
- offside/VAR explainers should surface from rules, glossary, and search

## Recommended Build Order

## Phase 1: High Impact, Low Complexity
Goal:
Make the page feel more intentional without needing new data models or major interactivity.

### Feature A: Choose Your Path Hero
Why:
This is probably the single highest-value upgrade for first-time visitors.

Implementation:
- Add a hero module directly under the page subtitle
- Show 4 CTA cards:
  - `Teach me the rules`
  - `Help me pick a team`
  - `Make me sound smart`
  - `Explain the weird stuff`
- Clicking one should set:
  - a suggested `fanMode`
  - a suggested `activeSection`
  - optional search/tag presets
  - smooth scroll to the first recommended section

Suggested mapping:
- `Teach me the rules` -> `fanMode: brand-new`, first section `start-here`
- `Help me pick a team` -> `fanMode: casual`, first section `adopt-a-team`
- `Make me sound smart` -> `fanMode: i-know-ball`, first section `soccer-brain`
- `Explain the weird stuff` -> section `world-cup-weirdness` or `world-cup-history`

Why it works:
- feels dynamic immediately
- gives nervous users permission to start somewhere simple
- no live data required

### Feature B: Smarter Search Results Header
Why:
Search should feel curated, not mechanical.

Implementation:
- If `query` is non-empty, compute a `best match` card above the filtered results
- For now this can be simple:
  - exact title match wins
  - then starts-with
  - then search-text inclusion
- Show a small block:
  - `Best match for "offside"`
  - card title
  - one-sentence summary
  - section label

Why it works:
- makes search feel more premium
- especially useful for glossary-style queries
- easy win using current data

### Feature C: Reorder Sections By Fan Mode
Why:
This makes the page feel smarter without changing the actual content set.

Implementation:
- keep the blueprint order as the canonical default
- create a `fanModeSectionPriority` map in `WorldCupPrimer.jsx`
- when `fanMode !== all`, sort visible sections using the mode’s preferred order

Suggested priority:
- `brand-new`: start-here, soccer-translated, soccer-dictionary, how-soccer-is-built, world-cup-primer, watch-smart
- `casual`: soccer-translated, watch-smart, adopt-a-team, famous-missing-names, fan-culture-atlas, world-cup-history
- `i-know-ball`: soccer-brain, formations-made-simple, soccer-dictionary, fan-culture-atlas, world-cup-history

Why it works:
- turns filtering into page choreography
- makes the same content feel more tailored

### Feature D: Section Spotlight Style
Why:
The page needs at least one featured visual rhythm break.

Implementation:
- allow a section to opt into `featured-first-card`
- on supported layouts, render the first card wider or more visually prominent
- best sections for this:
  - `soccer-translated`
  - `world-cup-primer`
  - `var-lab`
  - `world-cup-history`

Why it works:
- reduces sameness
- creates editorial hierarchy
- easy to understand visually

## Phase 2: Signature Features
Goal:
Add the features people remember and talk about.

### Feature E: VAR / Offside Lab
Why:
This is the most obvious “I’m new to soccer, help me” feature.

Implementation shape:
- new `diagram-card`
- simple inline SVG or CSS field diagram
- tabbed frames or stepped frames
- one visual explainer each for:
  - offside timing
  - second-last defender
  - VAR review flow

Why it works:
- clarifies the single most asked-about rule area
- visually distinctive
- makes the page feel handcrafted

### Feature F: Fan Type Quiz
Why:
Replayable, friendly, and a perfect way to convert casual curiosity into guided exploration.

Implementation:
- `PrimerFanQuiz` component
- 4 to 6 short questions
- no persistence needed
- outcome maps to:
  - a fan archetype
  - best sections
  - best adopt-a-team cards

Best outcome labels:
- `Chaos Hunter`
- `Tactics Nerd`
- `Culture Rider`
- `Legacy Chaser`

Why it works:
- gives the primer a memorable signature
- increases time-on-page naturally
- creates useful recommendation logic elsewhere

### Feature G: A-Z Dictionary Experience
Why:
The data exists, but the interface can make it feel much more intentional.

Implementation:
- add a letter rail above glossary results
- clicking a letter jumps to the first term starting with it
- gray out unused letters
- if search is active, show glossary matches first

Why it works:
- converts “cards in a grid” into an actual reference tool
- helps the page feel more complete and useful

### Feature H: World Cup History Timeline
Why:
The page needs one section that feels like story, not just facts.

Implementation:
- desktop: vertical spine or alternating timeline rail
- mobile: clean stacked year cards
- emphasize year chips and iconic moment names

Why it works:
- creates emotional scale
- visually differentiates the history section
- gives users a strong scroll moment

## Phase 3: Polish And Personality
Goal:
Turn the page from smart to unmistakably memorable.

### Feature I: Related Card Trails
Implementation:
- for cards with `relatedTerms`, `watchWords`, `vibeTags`, or matching team/player references, show:
  - `Read next`
  - `Related idea`
  - `If this interests you`
- clicking a related item can set:
  - a search query
  - a tag
  - or scroll to a related section

Why it works:
- makes the page feel alive
- improves discovery without needing more content

### Feature J: Section Exit Prompts
Implementation:
- at the end of major sections, show one line like:
  - `Now you know enough to watch for pressing. Want the American-sports version?`
  - `Ready to pick a team?`
  - `Want the visual version of this rule?`

Why it works:
- gently guides the reader through the page
- feels more editorial than mechanical

### Feature K: Progress Without Cheesiness
Implementation:
- a subtle sticky mini-progress bar or section tracker
- language like:
  - `You’ve covered the basics`
  - `Now you’re watching smarter`
  - `Now you know ball`

Why it works:
- gives structure
- helps long-page confidence
- still works without accounts or saved state

### Feature L: Rotating “Featured Curiosity”
Implementation:
- one small hero slot above the first section
- rotates each load from:
  - a fun fact
  - a missing-star card
  - a history moment
  - an analogy card

Why it works:
- gives repeat visitors freshness
- no live data required
- easy to power from existing collections

## Design Recommendations

### 1. Stop treating every section as the same density
Use three tempos:
- `fast`: simple rule/analogy cards
- `medium`: glossary/tactics/history
- `slow`: quiz, visual lab, team-culture reading

### 2. Make the page feel less like a dashboard in at least two spots
The primer should borrow from editorial design more than product UI in a few moments:
- oversized type
- asymmetric featured card
- timeline or diagram

### 3. Give the search/filter area one personality move
Good options:
- small prompt chips under search:
  - `Offside`
  - `VAR`
  - `Pick a team`
  - `History`
  - `Missing stars`
- these should act like guided shortcuts, not just tags

## What Claude Should Build First
If the goal is to make the page feel noticeably more dynamic as fast as possible:

1. `Choose Your Path Hero`
2. `Soccer Translated` wiring
3. `Smarter Search Results Header`
4. `Fan-mode section reordering`
5. `VAR / Offside Lab`

That sequence gives the best balance of:
- immediate perceived improvement
- clarity for new fans
- low reliance on live data
- strong personality

## What To Avoid
- fake “today” or “live now” framing
- countdown widgets
- auto-rotating carousels that feel generic
- over-gamified quiz mechanics
- too many tiny filters competing with each other
- turning the page into a data warehouse instead of a guided guide

## Definition Of Success
The page is winning if a first-time visitor can do at least one of these in under two minutes:
- understand offside better than they did before
- pick a team to root for
- learn one tactical idea they can notice on TV
- find a clear explanation of a term they heard on a broadcast
- feel like the page was built for them, not just for soccer diehards
