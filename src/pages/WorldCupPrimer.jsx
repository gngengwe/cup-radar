import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import guidePage from '../data/world-cup-guide-page.json';
import soccerLearning from '../data/soccer-learning.json';
import soccerEcosystem from '../data/soccer-ecosystem.json';
import soccerPositions from '../data/soccer-positions.json';
import soccerFormations from '../data/soccer-formations.json';
import worldCupPrimerData from '../data/world-cup-primer.json';
import famousAbsences from '../data/famous-absences.json';
import adoptATeam from '../data/adopt-a-team.json';
import worldCupFunFacts from '../data/world-cup-fun-facts.json';
import sourcesRegistry from '../data/soccer-learning-sources.json';
import americanSportsAnalogies from '../data/american-sports-analogies.json';
import soccerGlossary from '../data/soccer-glossary.json';
import watchPartyPlaybook from '../data/watch-party-playbook.json';
import fanCultureAtlas from '../data/fan-culture-atlas.json';
import worldCupHistoryTimeline from '../data/world-cup-history-timeline.json';
import varOffsideLab from '../data/var-offside-lab.json';

const COLLECTIONS = {
  'soccer-learning': soccerLearning,
  'soccer-ecosystem': soccerEcosystem,
  'soccer-positions': soccerPositions,
  'soccer-formations': soccerFormations,
  'world-cup-primer': worldCupPrimerData,
  'famous-absences': famousAbsences,
  'adopt-a-team': adoptATeam,
  'world-cup-fun-facts': worldCupFunFacts,
  'american-sports-analogies': americanSportsAnalogies,
  'soccer-glossary': soccerGlossary,
  'watch-party-playbook': watchPartyPlaybook,
  'fan-culture-atlas': fanCultureAtlas,
  'world-cup-history-timeline': worldCupHistoryTimeline,
  'var-offside-lab': varOffsideLab,
};

const SOURCES_MAP = Object.fromEntries(sourcesRegistry.sources.map(s => [s.id, s]));

const LAYOUT_CLASS = {
  'featured-grid': 'wcp-grid',
  'step-rail': 'wcp-grid',
  'searchable-grid': 'wcp-grid wcp-grid--compact',
  'stacked-cards': 'wcp-stack',
  'carousel-or-grid': 'wcp-grid',
  'section-rail': 'wcp-grid',
  'story-card-list': 'wcp-stack',
  'personality-grid': 'wcp-grid',
  'masonry-or-grid': 'wcp-grid wcp-grid--facts',
};

// Resolves dot paths like "tiers.first-match.cards" — array segments are
// matched by `id` so the blueprint can point at a specific tier or card list.
function resolvePath(data, path) {
  return path.split('.').reduce((current, part) => {
    if (current == null) return null;
    if (Array.isArray(current)) return current.find(x => x.id === part) ?? null;
    return current[part] ?? null;
  }, data);
}

function buildSearchText(item) {
  const parts = [];
  const walk = (val) => {
    if (typeof val === 'string') parts.push(val);
    else if (Array.isArray(val)) val.forEach(walk);
  };
  Object.entries(item).forEach(([key, val]) => {
    if (key === 'sourceIds' || key === 'sourceTrail' || key === 'id') return;
    walk(val);
  });
  return parts.join(' ').toLowerCase();
}

function extractTags(item) {
  return [
    ...(item.tags || []),
    ...(item.vibeTags || []),
    ...(item.watchWords || []),
    ...(item.relatedTerms || []),
    ...(item.category ? [item.category] : []),
    ...(item.absenceType ? [item.absenceType] : []),
  ];
}

function getItemTitle(item) {
  return item.title || item.label || item.teamName || item.player || '';
}

function getItemSummary(item) {
  return item.summary || item.fact || item.pitch || item.plainEnglish || item.reason || item.hook || '';
}

// "Choose your path" hero — each option sets a fan mode and scrolls to the
// section that best matches that intent.
const FAN_PATHS = [
  {
    id: 'rules',
    label: 'Teach me the rules',
    description: 'Start from zero — the basics, the words people use, and what to watch for first.',
    fanMode: 'brand-new',
    targetSection: 'start-here',
  },
  {
    id: 'team',
    label: 'Help me pick a team',
    description: 'Find a national team whose style and fan culture will make this tournament feel personal.',
    fanMode: 'casual',
    targetSection: 'adopt-a-team',
  },
  {
    id: 'smart',
    label: 'Make me sound smart',
    description: 'Skip to the tactics, formations, and team-culture talk that makes you sound like you know ball.',
    fanMode: 'i-know-ball',
    targetSection: 'soccer-brain',
  },
  {
    id: 'weird',
    label: 'Explain the weird stuff',
    description: 'Jump to the records, oddities, and history that make the World Cup feel bigger than a normal season.',
    fanMode: 'all',
    targetSection: 'world-cup-weirdness',
  },
];

// When a fan mode is active, sections in this list are pulled to the top in
// this order so the page feels remixed for that reader, not just filtered.
const FAN_MODE_SECTION_PRIORITY = {
  'brand-new': ['start-here', 'soccer-translated', 'soccer-dictionary', 'how-soccer-is-built', 'world-cup-primer', 'watch-smart'],
  casual: ['soccer-translated', 'watch-smart', 'adopt-a-team', 'missing-stars', 'fan-culture-atlas', 'world-cup-history'],
  'i-know-ball': ['soccer-brain', 'formations-made-simple', 'soccer-dictionary', 'fan-culture-atlas', 'world-cup-history'],
};

function SourceChips({ sourceIds }) {
  if (!sourceIds || sourceIds.length === 0) return null;
  const sources = sourceIds.map(id => SOURCES_MAP[id]).filter(Boolean);
  if (sources.length === 0) return null;
  return (
    <div className="wcp-card__sources">
      <span className="wcp-card__sources-label">Source:</span>
      {sources.map(s => (
        s.url
          ? (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="wcp-source-chip">
              {s.publisher}<span className="wcp-source-chip__ext" aria-hidden="true">↗</span>
            </a>
          )
          : <span key={s.id} className="wcp-source-chip">{s.publisher}</span>
      ))}
    </div>
  );
}

function CardBody({ item, cardType, index }) {
  switch (cardType) {
    case 'explainer':
    case 'watch-for-card':
      return (
        <>
          <h3 className="wcp-card__title">{item.title}</h3>
          {item.hook && <p className="wcp-card__hook">{item.hook}</p>}
          <p className="wcp-card__summary">{item.summary}</p>
          {item.whyItMatters && <p className="wcp-card__detail"><strong>Why it matters:</strong> {item.whyItMatters}</p>}
          {item.whatToWatch && <p className="wcp-card__detail"><strong>Watch for:</strong> {item.whatToWatch}</p>}
        </>
      );

    case 'tier-card':
      return (
        <>
          <div className="wcp-card__top">
            <span className="wcp-step-badge">{index + 1}</span>
            <h3 className="wcp-card__title">{item.label}</h3>
          </div>
          <p className="wcp-card__summary">{item.summary}</p>
          {item.whyItMatters && <p className="wcp-card__detail"><strong>Why it matters:</strong> {item.whyItMatters}</p>}
          {item.watcherTranslation && <p className="wcp-card__detail wcp-card__quote">{item.watcherTranslation}</p>}
          {item.examples && (
            <div className="wcp-card__chips">
              {item.examples.map(e => <span key={e} className="wcp-chip">{e}</span>)}
            </div>
          )}
        </>
      );

    case 'role-card':
      return (
        <>
          <div className="wcp-card__top">
            <span className="wcp-role-badge">{item.shortLabel}</span>
            <h3 className="wcp-card__title">{item.label}</h3>
          </div>
          <p className="wcp-card__summary">{item.summary}</p>
          {item.whatToWatch && <p className="wcp-card__detail"><strong>Watch for:</strong> {item.whatToWatch}</p>}
          {item.mainJobs && (
            <div className="wcp-card__chips">
              {item.mainJobs.map(j => <span key={j} className="wcp-chip">{j}</span>)}
            </div>
          )}
        </>
      );

    case 'formation-card':
      return (
        <>
          <div className="wcp-card__top">
            <h3 className="wcp-card__title">{item.label}</h3>
            <span className="wcp-card__vibe">{item.vibe}</span>
          </div>
          <p className="wcp-card__summary">{item.plainEnglish}</p>
          {item.whyCoachesUseIt && <p className="wcp-card__detail"><strong>Why coaches use it:</strong> {item.whyCoachesUseIt}</p>}
          {item.whatFansWillNotice && <p className="wcp-card__detail"><strong>What you'll notice:</strong> {item.whatFansWillNotice}</p>}
          {(item.strengths || item.tradeoffs) && (
            <div className="wcp-card__pros-cons">
              {item.strengths && (
                <div>
                  <strong>Strengths</strong>
                  <ul>{item.strengths.map(s => <li key={s}>{s}</li>)}</ul>
                </div>
              )}
              {item.tradeoffs && (
                <div>
                  <strong>Tradeoffs</strong>
                  <ul>{item.tradeoffs.map(t => <li key={t}>{t}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          {item.bestFor && <p className="wcp-card__detail wcp-card__quote"><strong>Best for:</strong> {item.bestFor}</p>}
        </>
      );

    case 'primer-card':
      return (
        <>
          <h3 className="wcp-card__title">{item.title}</h3>
          <p className="wcp-card__summary">{item.summary}</p>
          {item.whyItMatters && <p className="wcp-card__detail"><strong>Why it matters:</strong> {item.whyItMatters}</p>}
          {item.whatToWatch && <p className="wcp-card__detail"><strong>Watch for:</strong> {item.whatToWatch}</p>}
        </>
      );

    case 'absence-card':
      return (
        <>
          <div className="wcp-card__top">
            <h3 className="wcp-card__title">{item.player}</h3>
            <span className="wcp-status-badge">{item.statusLabel}</span>
          </div>
          <p className="wcp-card__detail">{item.teamName} ({item.teamCode}) &middot; {item.date}</p>
          <p className="wcp-card__summary">{item.reason}</p>
          {item.whyFansKnowHim && <p className="wcp-card__detail wcp-card__quote">{item.whyFansKnowHim}</p>}
        </>
      );

    case 'recommendation-card':
      return (
        <>
          <div className="wcp-card__top">
            <h3 className="wcp-card__title">{item.teamName}</h3>
            <span className="wcp-card__code">{item.teamCode}</span>
          </div>
          <p className="wcp-card__summary">{item.pitch}</p>
          {item.whyYouWillEnjoyIt && (
            <ul className="wcp-card__list">
              {item.whyYouWillEnjoyIt.map(w => <li key={w}>{w}</li>)}
            </ul>
          )}
        </>
      );

    case 'fact-card':
      return (
        <>
          <h3 className="wcp-card__title">{item.title}</h3>
          <p className="wcp-card__summary">{item.fact}</p>
          {item.whyItPlays && <p className="wcp-card__detail wcp-card__quote">{item.whyItPlays}</p>}
        </>
      );

    case 'diagram-card':
      return (
        <>
          <h3 className="wcp-card__title">{item.title}</h3>
          <p className="wcp-card__summary">{item.summary}</p>
          {item.frames && (
            <div className="wcp-diagram-frames">
              {item.frames.map((frame, i) => (
                <div key={frame.label || i} className="wcp-diagram-frame">
                  <span className="wcp-diagram-frame__label">{frame.label}</span>
                  <p className="wcp-diagram-frame__caption">{frame.caption}</p>
                  {frame.callouts && (
                    <div className="wcp-card__chips">
                      {frame.callouts.map(c => <span key={c} className="wcp-chip wcp-chip--callout">{c}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {item.commonMistake && (
            <p className="wcp-card__detail wcp-card__quote"><strong>Common mistake:</strong> {item.commonMistake}</p>
          )}
        </>
      );

    default:
      return <h3 className="wcp-card__title">{item.title || item.label}</h3>;
  }
}

export default function WorldCupPrimer() {
  const [fanMode, setFanMode] = useState('all');
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [pendingScrollTo, setPendingScrollTo] = useState(null);

  const { sections, page } = guidePage;
  const fanModes = useMemo(
    () => [{ id: 'all', label: 'All Levels', promise: 'Show everything in the guide.' }, ...page.fanModes],
    [page.fanModes]
  );

  const sectionEntries = useMemo(() => sections.map(section => {
    const items = section.dataRefs.flatMap(ref => {
      const data = resolvePath(COLLECTIONS[ref.collectionId], ref.path);
      return Array.isArray(data) ? data : [];
    });
    return {
      section,
      items: items.map(item => ({
        item,
        fanModes: item.fanModes || item.bestFor || section.defaultFanModes,
        searchText: buildSearchText(item),
        tags: extractTags(item),
      })),
    };
  }), [sections]);

  const allTags = useMemo(() => {
    const counts = new Map();
    sectionEntries.forEach(({ items }) => items.forEach(({ tags }) => {
      tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t);
  }, [sectionEntries]);

  const q = query.trim().toLowerCase();

  const sectionsForActiveSection = sectionEntries
    .filter(({ section }) => activeSection === 'all' || section.id === activeSection);

  const visibleSections = sectionsForActiveSection
    .map(({ section, items }) => ({
      section,
      items: items.filter(({ fanModes: cardFanModes, searchText, tags }) => {
        if (fanMode !== 'all' && !cardFanModes.includes(fanMode)) return false;
        if (activeTag && !tags.includes(activeTag)) return false;
        if (q && !searchText.includes(q)) return false;
        return true;
      }),
    }))
    .filter(({ items }) => items.length > 0);

  // When a fan mode is active, pull its priority sections to the top so the
  // page reads like it was remixed for that reader, not just filtered.
  const orderedVisibleSections = useMemo(() => {
    const priority = FAN_MODE_SECTION_PRIORITY[fanMode];
    if (!priority) return visibleSections;
    const priorityIndex = new Map(priority.map((id, i) => [id, i]));
    return [...visibleSections].sort((a, b) => {
      const ai = priorityIndex.has(a.section.id) ? priorityIndex.get(a.section.id) : priority.length;
      const bi = priorityIndex.has(b.section.id) ? priorityIndex.get(b.section.id) : priority.length;
      return ai - bi;
    });
  }, [visibleSections, fanMode]);

  const hasActiveFilters = fanMode !== 'all' || activeSection !== 'all' || !!activeTag || !!q;
  const clearFilters = () => {
    setFanMode('all');
    setQuery('');
    setActiveTag(null);
    setActiveSection('all');
  };

  // "Choose your path" hero — sets a fan mode and scrolls to the section
  // that best matches that reader's intent.
  const choosePath = (path) => {
    setFanMode(path.fanMode);
    setQuery('');
    setActiveTag(null);
    setActiveSection('all');
    setPendingScrollTo(path.targetSection);
  };

  useEffect(() => {
    if (!pendingScrollTo) return;
    const el = document.getElementById(pendingScrollTo);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setPendingScrollTo(null);
  }, [pendingScrollTo, orderedVisibleSections]);

  // Sections that vanish because a tag/search left zero matching cards —
  // distinct from sections a fan mode deliberately hides.
  const hiddenByTagOrSearch = (activeTag || q)
    ? sectionsForActiveSection.length - visibleSections.length
    : 0;

  const activeFilterLabels = [];
  if (fanMode !== 'all') {
    const fm = fanModes.find(f => f.id === fanMode);
    if (fm) activeFilterLabels.push(`"${fm.label}" mode`);
  }
  if (activeSection !== 'all') {
    const sec = sections.find(s => s.id === activeSection);
    if (sec) activeFilterLabels.push(`the "${sec.label}" section`);
  }
  if (activeTag) activeFilterLabels.push(`the "#${activeTag}" tag`);
  if (q) activeFilterLabels.push(`your search for "${query.trim()}"`);

  // Smarter search: surface the single best-matching card above the
  // filtered grid, scored by title match quality.
  const bestMatch = useMemo(() => {
    if (!q) return null;
    let best = null;
    let bestScore = 0;
    for (const { section, items } of sectionsForActiveSection) {
      for (const entry of items) {
        if (fanMode !== 'all' && !entry.fanModes.includes(fanMode)) continue;
        if (activeTag && !entry.tags.includes(activeTag)) continue;
        const title = getItemTitle(entry.item).toLowerCase();
        let score = 0;
        if (title === q) score = 3;
        else if (title.startsWith(q)) score = 2;
        else if (entry.searchText.includes(q)) score = 1;
        if (score > bestScore) {
          bestScore = score;
          best = { section, item: entry.item };
        }
      }
    }
    return best;
  }, [q, sectionsForActiveSection, fanMode, activeTag]);

  return (
    <div className="wcp-page">
      <div className="wcp-topnav">
        <Link to="/" className="wcp-back">← Cup Radar</Link>
      </div>

      <div className="wcp-container">
        <header className="wcp-hero">
          <span className="section-label">{page.eyebrow}</span>
          <h1 className="wcp-title">{page.title}</h1>
          <p className="wcp-subtitle">{page.subtitle}</p>

          <div className="wcp-paths" role="group" aria-label="Choose how you want to use this guide">
            <p className="wcp-paths__label">Choose your path</p>
            <div className="wcp-paths__grid">
              {FAN_PATHS.map(path => (
                <button
                  key={path.id}
                  type="button"
                  className="wcp-path-card"
                  onClick={() => choosePath(path)}
                >
                  <span className="wcp-path-card__label">{path.label}</span>
                  <span className="wcp-path-card__desc">{path.description}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="wcp-controls">
          <p className="wcp-controls__hint">Pick your level — it reshapes what's shown below.</p>
          <div className="wcp-fanmodes" role="group" aria-label="Filter by fan experience level">
            {fanModes.map(fm => (
              <button
                key={fm.id}
                type="button"
                className={`wcp-fanmode${fanMode === fm.id ? ' active' : ''}`}
                onClick={() => setFanMode(fm.id)}
                title={fm.promise}
                aria-pressed={fanMode === fm.id}
              >
                {fm.label}
              </button>
            ))}
            {hasActiveFilters && (
              <button type="button" className="wcp-clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="wcp-controls__row">
            <input
              type="search"
              className="wcp-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={page.search.placeholder}
              aria-label="Search the World Cup primer"
            />
            <select
              className="wcp-section-select"
              value={activeSection}
              onChange={e => setActiveSection(e.target.value)}
              aria-label="Filter by section"
            >
              <option value="all">All sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {allTags.length > 0 && (
            <div className="wcp-tags">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`wcp-tag${activeTag === tag ? ' active' : ''}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  aria-pressed={activeTag === tag}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {bestMatch && (
          <button
            type="button"
            className="wcp-best-match"
            onClick={() => setPendingScrollTo(bestMatch.section.id)}
          >
            <span className="wcp-best-match__label">Best match for &ldquo;{query.trim()}&rdquo;</span>
            <span className="wcp-best-match__title">{getItemTitle(bestMatch.item)}</span>
            {getItemSummary(bestMatch.item) && (
              <span className="wcp-best-match__summary">{getItemSummary(bestMatch.item)}</span>
            )}
            <span className="wcp-best-match__section">In {bestMatch.section.label} ↓</span>
          </button>
        )}

        {visibleSections.length > 0 && hiddenByTagOrSearch > 0 && (
          <div className="wcp-hidden-note">
            {hiddenByTagOrSearch} {hiddenByTagOrSearch === 1 ? 'section is' : 'sections are'} hidden because no cards match your current filters —{' '}
            <button type="button" className="wcp-hidden-note__clear" onClick={clearFilters}>clear filters</button> to see everything.
          </div>
        )}

        {visibleSections.length === 0 && (
          <div className="wcp-empty">
            {activeFilterLabels.length > 0
              ? <>Nothing matches {activeFilterLabels.join(' + ')}. <button type="button" className="wcp-empty__clear" onClick={clearFilters}>Clear all filters</button> to see the full guide.</>
              : 'Nothing to show yet.'}
          </div>
        )}

        {orderedVisibleSections.map(({ section, items }) => (
          <section key={section.id} id={section.id} className="wcp-section">
            <div className="wcp-section__head">
              <h2 className="wcp-section__title">{section.label}</h2>
              <p className="wcp-section__desc">{section.description}</p>
            </div>

            {section.id === 'missing-stars' && famousAbsences.caution && (
              <div className="wcp-caution">
                {famousAbsences.caution.map((c, i) => <p key={i}>{c}</p>)}
              </div>
            )}

            <div className={LAYOUT_CLASS[section.layout] || 'wcp-grid'}>
              {items.map(({ item, tags }, index) => (
                <article key={item.id} className="wcp-card">
                  <CardBody item={item} cardType={section.cardType} index={index} />
                  {tags.length > 0 && (
                    <div className="wcp-card__chips wcp-card__tags">
                      {tags.map(t => <span key={t} className="wcp-chip wcp-chip--tag">#{t}</span>)}
                    </div>
                  )}
                  <SourceChips sourceIds={item.sourceIds} />
                </article>
              ))}
            </div>
          </section>
        ))}

        <footer className="wcp-disclaimer-section">
          <p className="wcp-disclaimer">
            This is an evergreen reference guide, not a live scoreboard — it explains the sport, the 2026
            format, and the people around it so it stays useful before, during, and after the tournament.
            Rule explainers are based on the IFAB Laws of the Game; history, records, and format details
            are based on Wikipedia; player availability notes are based on Cup Radar's local availability
            overlay and may change. Guide content last reviewed {guidePage.lastUpdated}.
          </p>
        </footer>
      </div>
    </div>
  );
}
