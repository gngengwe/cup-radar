# World Cup Primer Expansion Plan

## Goal
Turn the current `World Cup Primer` from a strong standalone explainer into the definitive World-Cup-2026-for-Americans guide without breaking its current contract:

- evergreen, not live
- smart but welcoming
- clear before clever
- fun without fake urgency
- confident but never snobby

This plan separates what was built here as pure content from what should be handled by Claude Code on the React/CSS side.

## Priorities
1. `Soccer Translated`
Why it is high priority:
American sports fans need analogies before they need jargon. This is the fastest way to make the page feel written for them instead of at them.

2. `Soccer Dictionary`
Why it is high priority:
The current page already generates a useful search surface, but the actual guide still needs a dedicated language-decoder section.

3. `World Cup History`
Why it is high priority:
The page currently has facts, but not enough story-shaped history. A light timeline gives the event more emotional scale.

4. `Fan Culture Atlas`
Why it is high priority:
New fans often choose teams socially and emotionally before they choose them tactically.

5. `Watch Party Playbook`
Why it is high priority:
It makes the page useful in real life, not just intellectually useful.

6. `Visual Offside / VAR Lab`
Why it is high priority:
This is probably the single most valuable interactive explainer for beginners, but it needs a new component.

7. `What Kind of Fan Are You?`
Why it is high priority:
This creates replay value and gives the page more personality, but it needs logic/UI work.

## ✅ Built Here

### Files Added
- [american-sports-analogies.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\american-sports-analogies.json:1>)
- [soccer-glossary.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\soccer-glossary.json:1>)
- [watch-party-playbook.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\watch-party-playbook.json:1>)
- [fan-culture-atlas.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\fan-culture-atlas.json:1>)
- [world-cup-history-timeline.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\world-cup-history-timeline.json:1>)

### Files Updated
- [soccer-learning-sources.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\soccer-learning-sources.json:1>)
- [editorial-content-manifest.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\editorial-content-manifest.json:1>)

### Buildable Addition 1: Soccer Translated
Section definition:
```json
{
  "id": "soccer-translated",
  "label": "Soccer Translated",
  "contentType": "analogy-cards",
  "layout": "section-rail",
  "cardType": "explainer",
  "description": "American-sports analogies that help new fans understand what soccer is asking them to notice.",
  "defaultFanModes": ["brand-new", "casual"]
}
```

Card type:
- Uses existing `explainer`

JSON shape:
```json
{
  "_note": "Evergreen analogy cards that translate soccer ideas into language American sports fans already understand.",
  "lastUpdated": "2026-06-12",
  "cards": [
    {
      "id": "string",
      "title": "string",
      "hook": "string",
      "summary": "string",
      "whyItMatters": "string",
      "whatToWatch": "string",
      "tags": ["string"],
      "fanModes": ["brand-new", "casual"],
      "sourceIds": ["editorial-house"]
    }
  ]
}
```

Actual examples authored:
- full-court press analogy
- fast-break counterattack analogy
- red-zone set-piece analogy
- pitchers'-duel 1-0 analogy
- exhausted overtime extra-time analogy

Data file:
- [american-sports-analogies.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\american-sports-analogies.json:1>)

### Buildable Addition 2: Soccer Dictionary
Section definition:
```json
{
  "id": "soccer-dictionary",
  "label": "Soccer Dictionary",
  "contentType": "glossary-cards",
  "layout": "searchable-grid",
  "cardType": "explainer",
  "description": "A dictionary section for the words soccer people throw around like everyone grew up hearing them.",
  "defaultFanModes": ["brand-new", "casual", "i-know-ball"]
}
```

Card type:
- Uses existing `explainer`

JSON shape:
```json
{
  "_note": "Search-friendly soccer dictionary cards for terms commentators and fans use without always stopping to define them.",
  "lastUpdated": "2026-06-12",
  "terms": [
    {
      "id": "string",
      "title": "string",
      "hook": "string",
      "summary": "string",
      "whyItMatters": "string",
      "whatToWatch": "string",
      "tags": ["string"],
      "relatedTerms": ["string"],
      "fanModes": ["brand-new", "casual"],
      "sourceIds": ["ifab-law-12"]
    }
  ]
}
```

Actual examples authored:
- Advantage
- Counter-press
- Low block
- Switch of play
- Through ball

Data file:
- [soccer-glossary.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\soccer-glossary.json:1>)

### Buildable Addition 3: Watch Party Playbook
Section definition:
```json
{
  "id": "watch-party-playbook",
  "label": "Watch Party Playbook",
  "contentType": "hosting-steps",
  "layout": "step-rail",
  "cardType": "tier-card",
  "description": "Practical hosting advice so the page helps people enjoy the tournament together, not just understand it alone.",
  "defaultFanModes": ["brand-new", "casual"]
}
```

Card type:
- Uses existing `tier-card`

JSON shape:
```json
{
  "_note": "Evergreen hosting guidance for World Cup watch parties built for casual American sports fans and mixed-experience rooms.",
  "lastUpdated": "2026-06-12",
  "steps": [
    {
      "id": "string",
      "label": "string",
      "summary": "string",
      "whyItMatters": "string",
      "watcherTranslation": "string",
      "examples": ["string"],
      "tags": ["string"],
      "fanModes": ["brand-new", "casual"],
      "sourceIds": ["editorial-house"]
    }
  ]
}
```

Actual examples authored:
- Start with three rules, not thirty
- Use halftime as the social inning break
- Give neutrals a reason to care
- Leave the sound on
- Serve in waves, not in a single giant timeout

Data file:
- [watch-party-playbook.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\watch-party-playbook.json:1>)

### Buildable Addition 4: Fan Culture Atlas
Section definition:
```json
{
  "id": "fan-culture-atlas",
  "label": "Fan Culture Atlas",
  "contentType": "country-culture-cards",
  "layout": "personality-grid",
  "cardType": "recommendation-card",
  "description": "Country and fan-culture cards that explain why different national-team support feels different.",
  "defaultFanModes": ["casual", "i-know-ball"]
}
```

Card type:
- Uses existing `recommendation-card`

JSON shape:
```json
{
  "_note": "Fan-culture cards meant to make national teams feel social and human, not just tactical.",
  "lastUpdated": "2026-06-12",
  "profiles": [
    {
      "id": "string",
      "teamCode": "string",
      "teamName": "string",
      "pitch": "string",
      "whyYouWillEnjoyIt": ["string"],
      "vibeTags": ["string"],
      "watchWords": ["string"],
      "fanModes": ["casual", "i-know-ball"],
      "sourceIds": ["editorial-house"]
    }
  ]
}
```

Actual examples authored:
- Argentina
- Mexico
- USA
- Japan
- Morocco

Data file:
- [fan-culture-atlas.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\fan-culture-atlas.json:1>)

### Buildable Addition 5: World Cup History Timeline
Section definition:
```json
{
  "id": "world-cup-history",
  "label": "World Cup History",
  "contentType": "timeline-cards",
  "layout": "masonry-or-grid",
  "cardType": "fact-card",
  "description": "A story-shaped history rail that gives the tournament more emotional scale than trivia alone.",
  "defaultFanModes": ["brand-new", "casual", "i-know-ball"]
}
```

Card type:
- Uses existing `fact-card`

JSON shape:
```json
{
  "_note": "History cards that give the World Cup a stronger sense of timeline and lore without becoming a textbook.",
  "lastUpdated": "2026-06-12",
  "moments": [
    {
      "id": "string",
      "title": "string",
      "category": "history",
      "tone": "string",
      "fact": "string",
      "whyItPlays": "string",
      "tags": ["string"],
      "fanModes": ["string"],
      "sourceIds": ["wikipedia-fifa-world-cup"]
    }
  ]
}
```

Actual examples authored:
- 1930 Uruguay beginning
- 1950 Maracana shock
- 1970 Pele's Brazil
- 2010 South Africa
- 2022 Morocco semifinal breakthrough

Data file:
- [world-cup-history-timeline.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\world-cup-history-timeline.json:1>)

### Wiring Notes For Claude
- None of the new collections are wired into `WorldCupPrimer.jsx` yet.
- None of the new sections are added to [world-cup-guide-page.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\world-cup-guide-page.json:1>) yet.
- That is intentional because this task explicitly said not to touch the page component, blueprint, or CSS.

Recommended wiring order:
1. Import the five new collections into `WorldCupPrimer.jsx`
2. Add them to `COLLECTIONS`
3. Append the new sections to `world-cup-guide-page.json`
4. Decide final section order

Suggested order after wiring:
1. Start Here
2. Soccer Translated
3. How Soccer Is Built
4. Soccer Dictionary
5. Positions and Roles
6. Formations Made Simple
7. Watch Smart
8. Tactics Without the Jargon
9. World Cup Primer
10. World Cup History
11. Famous Missing Names
12. Fan Culture Atlas
13. Adopt a Team
14. Watch Party Playbook
15. Fun Facts

## 🔧 Needs Claude Code

### Addition 6: VAR / Offside Visual Lab
Why it needs Claude:
- needs a new `diagram-card` card type
- needs a diagram-friendly layout
- ideally needs static SVG or a responsive illustrated board

Section definition:
```json
{
  "id": "var-lab",
  "label": "VAR and Offside Lab",
  "contentType": "diagram-cards",
  "layout": "stacked-cards",
  "cardType": "diagram-card",
  "description": "The two rule areas new fans ask about most, explained visually instead of only verbally.",
  "defaultFanModes": ["brand-new", "casual"]
}
```

New card type:
- `diagram-card`

Suggested fields:
```json
{
  "id": "string",
  "title": "string",
  "summary": "string",
  "diagramType": "offside-line | var-check | penalty-setup",
  "frames": [
    {
      "label": "string",
      "caption": "string",
      "callouts": ["string"]
    }
  ],
  "commonMistake": "string",
  "tags": ["string"],
  "fanModes": ["string"],
  "sourceIds": ["string"]
}
```

Example entries:
```json
[
  {
    "id": "diagram-offside-moment-of-pass",
    "title": "Offside is judged when the pass is played",
    "summary": "The freeze-frame moment is the passer's touch, not the runner's first touch later.",
    "diagramType": "offside-line",
    "frames": [
      {
        "label": "Frame 1",
        "caption": "The passer lifts their head and strikes the ball.",
        "callouts": ["Freeze the line here", "Ignore the later touch for the offside decision"]
      },
      {
        "label": "Frame 2",
        "caption": "The runner arrives after the ball has already been played.",
        "callouts": ["The run can continue", "The timing question was already decided"]
      }
    ],
    "commonMistake": "Fans often judge offside by where the attacker receives the pass instead of where they were when the pass began.",
    "tags": ["offside", "var", "rules"],
    "fanModes": ["brand-new", "casual"],
    "sourceIds": ["ifab-law-11"]
  },
  {
    "id": "diagram-offside-second-last-defender",
    "title": "It is the second-last defender, not always the goalkeeper",
    "summary": "The keeper is usually one of the last two defenders, but not automatically.",
    "diagramType": "offside-line",
    "frames": [
      {
        "label": "Frame 1",
        "caption": "The goalkeeper has rushed out, leaving two field defenders deeper.",
        "callouts": ["Count defenders, not positions", "Use the second-last defender as the line"]
      }
    ],
    "commonMistake": "People talk about being 'behind the keeper' when the real law is about the second-last opponent.",
    "tags": ["offside", "defenders", "rules"],
    "fanModes": ["brand-new", "casual"],
    "sourceIds": ["ifab-law-11"]
  },
  {
    "id": "diagram-var-check-stages",
    "title": "VAR is a review tool, not a second referee running the whole match",
    "summary": "VAR checks certain game-changing moments and either confirms the call or recommends an on-field review.",
    "diagramType": "var-check",
    "frames": [
      {
        "label": "Check",
        "caption": "Video officials quietly review the incident while play is paused or continuing.",
        "callouts": ["Goal", "Penalty", "Red card", "Mistaken identity"]
      },
      {
        "label": "Review",
        "caption": "The referee may be sent to the monitor for a closer look.",
        "callouts": ["Final decision still belongs to the referee"]
      }
    ],
    "commonMistake": "Fans often think every foul can become a full VAR intervention when the review categories are narrower than that.",
    "tags": ["var", "refereeing", "rules"],
    "fanModes": ["brand-new", "casual"],
    "sourceIds": ["ifab-law-12", "ifab-law-14"]
  }
]
```

### Addition 7: What Kind of Fan Are You?
Why it needs Claude:
- needs stateful quiz logic
- needs result screens
- works best as a reusable interactive module rather than a static card list

Section definition:
```json
{
  "id": "fan-type-quiz",
  "label": "What Kind of Fan Are You?",
  "contentType": "quiz-module",
  "layout": "single-feature",
  "cardType": "quiz-card",
  "description": "A light, replayable guide that turns a new visitor into a self-aware World Cup fan archetype.",
  "defaultFanModes": ["brand-new", "casual"]
}
```

New component:
- `PrimerFanQuiz`

Suggested data shape:
```json
{
  "questions": [
    {
      "id": "string",
      "prompt": "string",
      "answers": [
        {
          "label": "string",
          "scores": {
            "chaos-hunter": 2,
            "tactics-nerd": 1
          }
        }
      ]
    }
  ],
  "outcomes": [
    {
      "id": "string",
      "label": "string",
      "summary": "string",
      "watchStyle": "string",
      "bestSections": ["string"],
      "adoptATeamIds": ["string"]
    }
  ]
}
```

Example entries:
```json
{
  "questions": [
    {
      "id": "favorite-game-shape",
      "prompt": "Which kind of game sounds best to you?",
      "answers": [
        {
          "label": "Back-and-forth chaos with counters both ways",
          "scores": {
            "chaos-hunter": 2,
            "casual-peak-moments": 1
          }
        },
        {
          "label": "One smart team solving a tactical puzzle",
          "scores": {
            "tactics-nerd": 2,
            "patient-reader": 1
          }
        },
        {
          "label": "A huge atmosphere and a match that feels socially important",
          "scores": {
            "culture-rider": 2,
            "casual-peak-moments": 1
          }
        }
      ]
    },
    {
      "id": "best-star-story",
      "prompt": "What kind of player story pulls you in fastest?",
      "answers": [
        {
          "label": "The aging legend on one last run",
          "scores": {
            "legacy-chaser": 2
          }
        },
        {
          "label": "The breakout kid everyone will know after this",
          "scores": {
            "future-scout": 2
          }
        },
        {
          "label": "The underdog who just will not go away",
          "scores": {
            "culture-rider": 1,
            "chaos-hunter": 1
          }
        }
      ]
    }
  ],
  "outcomes": [
    {
      "id": "chaos-hunter",
      "label": "Chaos Hunter",
      "summary": "You want transitions, counterattacks, and a match that feels slightly one mistake away from bedlam.",
      "watchStyle": "Start in Watch Smart, then jump to Adopt a Team and the Fan Culture Atlas.",
      "bestSections": ["watch-smart", "adopt-a-team", "fan-culture-atlas"],
      "adoptATeamIds": ["morocco-underdog-force", "senegal-strength", "curacao-fairytale"]
    },
    {
      "id": "tactics-nerd",
      "label": "Tactics Nerd",
      "summary": "You enjoy shape, spacing, and seeing how smart teams solve each other.",
      "watchStyle": "Live in Formations, Tactics Without the Jargon, and the Soccer Dictionary.",
      "bestSections": ["formations-made-simple", "soccer-brain", "soccer-dictionary"],
      "adoptATeamIds": ["japan-precision", "netherlands-structure", "uruguay-edge"]
    },
    {
      "id": "culture-rider",
      "label": "Culture Rider",
      "summary": "You are here for atmosphere, identity, and the feeling that the shirt means more than ninety minutes.",
      "watchStyle": "Spend time in Fan Culture Atlas, World Cup History, and Fun Facts.",
      "bestSections": ["fan-culture-atlas", "world-cup-history", "world-cup-weirdness"],
      "adoptATeamIds": ["morocco-underdog-force", "usa-home-drama", "curacao-fairytale"]
    }
  ]
}
```

### Addition 8: Glossary UI Upgrade
Why it needs Claude:
- the content is already built in [soccer-glossary.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\soccer-glossary.json:1>)
- the missing piece is UX polish, not data

Suggested implementation:
- add an `A-Z` letter rail above the glossary section
- let letters gray out if no term starts with that letter
- optionally allow `relatedTerms` links to set the search box value
- optionally promote glossary hits above other sections when searching

No new card type required:
- keep `explainer`

### Addition 9: History Timeline Visual Upgrade
Why it needs Claude:
- the content is already built in [world-cup-history-timeline.json](<c:\becomiNG\HK_Clearway\wc_radar\src\data\world-cup-history-timeline.json:1>)
- a real timeline experience wants visual chronology, not just a generic grid

Suggested implementation:
- create a `timeline-rail` layout class
- show year chips prominently
- alternate cards or use a vertical spine on desktop
- collapse to a clean stacked timeline on mobile

No new card type required:
- keep `fact-card`

## Final Recommendation To Claude
If you only implement three things first, make them:
1. wire in `Soccer Translated`
2. wire in `Soccer Dictionary`
3. build `VAR and Offside Lab`

That combination would make the page feel much more intentionally built for new American fans instead of simply more complete.
