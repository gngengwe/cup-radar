import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FlagImg from '../components/FlagImg';
import GoalRadarMap from '../components/GoalRadarMap';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import { VENUE_COORDS } from '../data/venueCoords';
import { getGoalFeed, getCityGoalCounts, getTopScorers } from '../utils/goalFeed';
import { createGoalShareCardFile } from '../utils/goalShareCard';
import { formatGoalDate, getCityHeadline, getGoalMomentCopy, getShareText, getTopCities } from '../utils/goalRadarStory';

const PLAY_INTERVAL_MS = 2600;
const HOST_CITY_COUNT = Object.keys(VENUE_COORDS).length;

function resolveGoalIndex(feed, goalId) {
  if (!feed.length) return -1;
  if (!goalId) return feed.length - 1;

  const decoded = decodeURIComponent(goalId);
  const index = feed.findIndex(goal => goal.id === decoded);
  return index === -1 ? feed.length - 1 : index;
}

function wrapIndex(index, length) {
  if (!length) return -1;
  return (index + length) % length;
}

function findLatestGoalByCity(feed, venueKey) {
  for (let index = feed.length - 1; index >= 0; index -= 1) {
    if (feed[index].venueKey === venueKey) return index;
  }
  return -1;
}

function downloadFile(file) {
  const href = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = href;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function getStageChip(goal) {
  if (!goal) return '';
  if (goal.group) return `${goal.stage} · Group ${goal.group}`;
  return goal.stage;
}

function getGoalShareUrl(goal) {
  if (!goal || typeof window === 'undefined') return '';
  return `${window.location.origin}/goal-radar/g/${encodeURIComponent(goal.id)}`;
}

function getGoalSharePath(goal) {
  if (!goal) return '/goal-radar';
  return `/goal-radar/g/${encodeURIComponent(goal.id)}`;
}

export default function GoalMontagePage() {
  const { goalId } = useParams();
  const reducedMotion = usePrefersReducedMotion();
  const shareMode = Boolean(goalId);
  const feed = useMemo(() => getGoalFeed(), []);
  const [active, setActive] = useState(() => resolveGoalIndex(feed, goalId));
  const [playing, setPlaying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [transitionState, setTransitionState] = useState({ fromCity: null, burstKey: 0 });
  const itemRefs = useRef({});
  const feedRef = useRef(null);
  const touchStartRef = useRef(null);
  const previousActiveRef = useRef(resolveGoalIndex(feed, goalId));
  const skipInitialScroll = useRef(true);

  useEffect(() => {
    const nextIndex = resolveGoalIndex(feed, goalId);
    setActive(prev => (prev === nextIndex ? prev : nextIndex));
    if (goalId) setPlaying(false);
  }, [feed, goalId]);

  useEffect(() => {
    if (!playing || feed.length < 2) return undefined;

    const id = setInterval(() => {
      setActive(prev => wrapIndex(prev + 1, feed.length));
    }, PLAY_INTERVAL_MS);

    return () => clearInterval(id);
  }, [playing, feed.length]);

  useEffect(() => {
    if (active < 0) return;

    const prev = previousActiveRef.current;
    if (prev !== active) {
      setTransitionState(state => ({
        fromCity: prev >= 0 ? feed[prev]?.venueKey || null : null,
        burstKey: state.burstKey + 1,
      }));
      previousActiveRef.current = active;
    }

    if (skipInitialScroll.current) {
      skipInitialScroll.current = false;
      return;
    }

    // Scroll only the feed rail itself, never an ancestor — native
    // scrollIntoView() walks the whole scrollable-ancestor chain (including
    // the page), so on mobile, where the feed rail sits below the fold
    // while the user swipes through the story card, every goal change was
    // yanking the entire page down toward the rail. scrollTo() on the
    // rail's own container can't escape its bounds.
    const node = itemRefs.current[active];
    const container = feedRef.current;
    if (node && container) {
      const left = node.offsetLeft - (container.clientWidth - node.clientWidth) / 2;
      const top  = node.offsetTop - (container.clientHeight - node.clientHeight) / 2;
      container.scrollTo({
        left: Math.max(0, left),
        top: Math.max(0, top),
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [active, feed, reducedMotion]);

  useEffect(() => {
    if (!shareStatus) return undefined;
    const id = setTimeout(() => setShareStatus(''), 3600);
    return () => clearTimeout(id);
  }, [shareStatus]);

  const activeGoal = active >= 0 ? feed[active] : null;
  const liveCounts = useMemo(() => {
    if (active < 0) return {};
    return getCityGoalCounts(feed.slice(0, active + 1));
  }, [active, feed]);
  const topCities = useMemo(() => getTopCities(liveCounts, 5), [liveCounts]);
  const liveScorers = useMemo(() => getTopScorers(feed.slice(0, active + 1)), [active, feed]);
  const activeCityCount = activeGoal ? (liveCounts[activeGoal.venueKey] || 0) : 0;
  const citiesLit = Object.keys(liveCounts).length;
  const sharePath = getGoalSharePath(activeGoal);
  const shareUrl = activeGoal ? getGoalShareUrl(activeGoal) : '';
  const shareText = activeGoal ? getShareText(activeGoal) : '';
  const progressPct = feed.length && active >= 0 ? ((active + 1) / feed.length) * 100 : 0;
  const activeCityRank = activeGoal
    ? Object.entries(liveCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .findIndex(([key]) => key === activeGoal.venueKey) + 1
    : 0;
  const activeBootRank = useMemo(() => {
    if (!activeGoal || activeGoal.isOwnGoal) return 0;
    const idx = liveScorers.findIndex(s => s.player === activeGoal.player);
    return idx === -1 ? 0 : idx + 1;
  }, [activeGoal, liveScorers]);

  function selectGoal(nextIndex, { stopPlaying = true } = {}) {
    if (!feed.length) return;
    if (stopPlaying) setPlaying(false);
    setActive(wrapIndex(nextIndex, feed.length));
  }

  function handleMapJump(venueKey) {
    const nextIndex = findLatestGoalByCity(feed, venueKey);
    if (nextIndex !== -1) selectGoal(nextIndex);
  }

  function handleTouchStart(event) {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches?.[0];
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!touch || !start) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < 54 || Math.abs(dx) < Math.abs(dy)) return;
    selectGoal(active + (dx < 0 ? 1 : -1));
  }

  async function handleShareCard({ downloadOnly = false } = {}) {
    if (!activeGoal || sharing) return;

    setSharing(true);
    try {
      const file = await createGoalShareCardFile(activeGoal, {
        goalCount: feed.length,
        cityCounts: liveCounts,
      });

      if (downloadOnly) {
        downloadFile(file);
        setShareStatus('Saved a PNG goal card.');
        return;
      }

      if (navigator.share) {
        const title = `Cup Radar: ${activeGoal.player} ${activeGoal.minute}'`;
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title, text: shareText, files: [file] });
          setShareStatus('Shared the goal card.');
          return;
        }

        await navigator.share({ title, text: shareText, url: shareUrl });
        setShareStatus('Shared the goal link.');
        return;
      }

      downloadFile(file);
      setShareStatus('Native sharing is unavailable here, so the PNG downloaded instead.');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareStatus('Share failed. Try saving the PNG instead.');
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Copied the deep link.');
    } catch {
      setShareStatus('Clipboard access is unavailable in this browser.');
    }
  }

  return (
    <>
      <Navbar />
      <main className={`goal-radar-page${shareMode ? ' goal-radar-page--share-mode' : ''}`}>
        <div className="container goal-radar-page__head">
          <Link to="/" className="goal-radar-page__back">← Cup Radar</Link>
          <span className="section-label">{feed.length} goals tracked</span>
          <h1 className="goal-radar-page__title">The Goal Radar.</h1>
          <p className="section-sub">
            A mobile-first goal reel that turns every finish into a city-level event. Swipe it, play it,
            and share a card people can actually post.
          </p>
        </div>

        <div className="container goal-radar-page__experience">
          {feed.length === 0 && (
            <p className="goal-radar-page__empty">
              No goals tracked yet. Once today&apos;s matches get backfilled, the reel wakes up automatically.
            </p>
          )}

          {activeGoal && (
            <>
              <section className="goal-radar-page__stage">
                <div className="goal-radar-page__map-panel">
                  <div className="goal-radar-page__map-shell">
                    <GoalRadarMap
                      cityCounts={liveCounts}
                      activeCity={activeGoal.venueKey}
                      previousCity={transitionState.fromCity}
                      burstKey={transitionState.burstKey}
                      reducedMotion={reducedMotion}
                      onBlipClick={handleMapJump}
                    />
                    <div className="goal-radar-page__map-caption">
                      <span className="goal-radar-page__map-kicker">City hit</span>
                      <strong>{activeGoal.city}</strong>
                      <span>{activeCityCount} goal{activeCityCount === 1 ? '' : 's'} here so far</span>
                    </div>
                  </div>

                  <div className="goal-radar-page__stats-grid">
                    <div className="goal-radar-page__stat-card">
                      <span className="goal-radar-page__stat-label">Goal feed</span>
                      <strong>{active + 1} / {feed.length}</strong>
                      <span className="goal-radar-page__stat-note">Chronological reel position</span>
                    </div>
                    <div className="goal-radar-page__stat-card">
                      <span className="goal-radar-page__stat-label">Cities lit</span>
                      <strong>{citiesLit} / {HOST_CITY_COUNT}</strong>
                      <span className="goal-radar-page__stat-note">Host cities with at least one goal</span>
                    </div>
                    <div className="goal-radar-page__stat-card">
                      <span className="goal-radar-page__stat-label">City rank</span>
                      <strong>{activeCityRank || '-'}</strong>
                      <span className="goal-radar-page__stat-note">Where {activeGoal.city} sits right now</span>
                    </div>
                  </div>

                  <div className="goal-radar-page__leaderboard">
                    <div className="goal-radar-page__panel-head">
                      <div>
                        <span className="goal-radar-page__panel-kicker">Top Scoring Cities</span>
                        <h2>Host city leaderboard</h2>
                      </div>
                      {topCities[0] && (
                        <span className="goal-radar-page__panel-badge">
                          {topCities[0].label} leads on {topCities[0].count}
                        </span>
                      )}
                    </div>

                    <div className="goal-radar-page__leaderboard-list">
                      {topCities.map((city) => (
                        <button
                          key={city.key}
                          type="button"
                          className={`goal-radar-page__leaderboard-item${city.key === activeGoal.venueKey ? ' is-active' : ''}`}
                          onClick={() => handleMapJump(city.key)}
                        >
                          <span className="goal-radar-page__leaderboard-city">{city.label}</span>
                          <span className="goal-radar-page__leaderboard-bar">
                            <span
                              className="goal-radar-page__leaderboard-bar-fill"
                              style={{ width: `${(city.count / Math.max(1, topCities[0]?.count || 1)) * 100}%` }}
                            />
                          </span>
                          <strong className="goal-radar-page__leaderboard-count">{city.count}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <article
                  className="goal-radar-page__story"
                  tabIndex={0}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight') selectGoal(active + 1);
                    if (event.key === 'ArrowLeft') selectGoal(active - 1);
                  }}
                >
                  <div className="goal-radar-page__story-top">
                    <div className="goal-radar-page__story-badges">
                      <span className="badge badge--accent">{shareMode ? 'Shared Goal' : 'Goal Story'}</span>
                      <span className="badge">{getStageChip(activeGoal)}</span>
                      {activeGoal.isOwnGoal && <span className="badge">Own Goal</span>}
                    </div>
                    <span className="goal-radar-page__story-hint">
                      {reducedMotion ? 'Tap the reel below to jump around.' : 'Swipe left or right, or let the montage run.'}
                    </span>
                  </div>

                  <div className="goal-radar-page__story-progress">
                    <span className="goal-radar-page__story-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>

                  <div className="goal-radar-page__story-minute-row">
                    <span className="goal-radar-page__story-minute">{activeGoal.minute}'</span>
                    <span className="goal-radar-page__story-sequence">Goal {activeGoal.sequence} of {feed.length}</span>
                  </div>

                  <div className="goal-radar-page__story-player">
                    <FlagImg emoji={activeGoal.flag} size={30} />
                    <div className="goal-radar-page__story-player-copy">
                      <h2 className="goal-radar-page__story-player-name">{activeGoal.player}</h2>
                      <p className="goal-radar-page__story-matchup">
                        {activeGoal.team} vs {activeGoal.opponent}
                      </p>
                    </div>
                  </div>

                  <div className="goal-radar-page__story-scoreboard">
                    <div className={`goal-radar-page__story-team${activeGoal.team === activeGoal.homeTeam ? ' is-scoring' : ''}`}>
                      <span className="goal-radar-page__story-team-code">{activeGoal.homeCode}</span>
                      <strong>{activeGoal.homeScoreAfter}</strong>
                    </div>
                    <span className="goal-radar-page__story-score-divider">-</span>
                    <div className={`goal-radar-page__story-team${activeGoal.team === activeGoal.awayTeam ? ' is-scoring' : ''}`}>
                      <strong>{activeGoal.awayScoreAfter}</strong>
                      <span className="goal-radar-page__story-team-code">{activeGoal.awayCode}</span>
                    </div>
                  </div>

                  <p className="goal-radar-page__story-headline">{getGoalMomentCopy(activeGoal)}</p>
                  <p className="goal-radar-page__story-subhead">{getCityHeadline(activeGoal, liveCounts)}</p>

                  <div className="goal-radar-page__story-tags">
                    <span className="goal-radar-page__story-tag">{activeGoal.venue}</span>
                    <span className="goal-radar-page__story-tag">{formatGoalDate(activeGoal.date)}</span>
                    <span className="goal-radar-page__story-tag">
                      Match goal {activeGoal.goalNumberInMatch} of {activeGoal.matchGoalCount}
                    </span>
                  </div>

                  <div className="goal-radar-page__actions">
                    <div className="goal-radar-page__action-group">
                      <button type="button" className="btn btn-secondary goal-radar-page__control" onClick={() => selectGoal(active - 1)}>
                        Prev
                      </button>
                      <button
                        type="button"
                        className={`btn ${playing ? 'btn-secondary' : 'btn-primary'} goal-radar-page__control goal-radar-page__control--play`}
                        onClick={() => setPlaying(state => !state)}
                        disabled={feed.length < 2}
                      >
                        {playing ? 'Pause' : 'Play'}
                      </button>
                      <button type="button" className="btn btn-secondary goal-radar-page__control" onClick={() => selectGoal(active + 1)}>
                        Next
                      </button>
                    </div>

                    <div className="goal-radar-page__action-group">
                      <button
                        type="button"
                        className="btn btn-primary goal-radar-page__control"
                        onClick={() => handleShareCard()}
                        disabled={sharing}
                      >
                        {sharing ? 'Rendering...' : 'Share Card'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary goal-radar-page__control"
                        onClick={() => handleShareCard({ downloadOnly: true })}
                        disabled={sharing}
                      >
                        Save PNG
                      </button>
                      <button type="button" className="btn btn-secondary goal-radar-page__control" onClick={handleCopyLink}>
                        Copy Link
                      </button>
                    </div>
                  </div>

                  <div className="goal-radar-page__story-footer">
                    <p className="goal-radar-page__story-footer-copy">
                      {shareStatus || `${shareText}.`}
                    </p>
                    <Link to={sharePath} className="goal-radar-page__deep-link">
                      Open this exact goal view
                    </Link>
                  </div>
                </article>
              </section>

              {liveScorers.length > 0 && (
                <section className="goal-radar-page__golden-boot">
                  <div className="goal-radar-page__panel-head">
                    <div>
                      <span className="goal-radar-page__panel-kicker">Live Race</span>
                      <h2>Golden Boot Race</h2>
                    </div>
                    <span className="goal-radar-page__panel-badge">
                      {liveScorers[0]
                        ? `${liveScorers[0].player} leads · ${liveScorers[0].count} goal${liveScorers[0].count === 1 ? '' : 's'}`
                        : 'Race on'}
                    </span>
                  </div>

                  <div className="goal-radar-page__gb-list">
                    {liveScorers.map((scorer) => {
                      const isScoring = !activeGoal.isOwnGoal && scorer.player === activeGoal.player;
                      const barPct = (scorer.count / (liveScorers[0]?.count || 1)) * 100;
                      const barColor = scorer.rank === 1
                        ? 'linear-gradient(90deg,#FFD700,#FFA500)'
                        : scorer.rank === 2
                          ? 'linear-gradient(90deg,#C0C0C0,#9ba3af)'
                          : scorer.rank === 3
                            ? 'linear-gradient(90deg,#cd7f32,#b5651d)'
                            : 'linear-gradient(90deg,var(--accent),#4d8eff)';
                      const medal = scorer.rank === 1 ? '🥇' : scorer.rank === 2 ? '🥈' : scorer.rank === 3 ? '🥉' : scorer.rank;
                      return (
                        <div
                          key={isScoring ? `${scorer.player}-${active}` : scorer.player}
                          className={`goal-radar-page__gb-row${isScoring ? ' is-scoring' : ''}`}
                        >
                          <span className="goal-radar-page__gb-medal">{medal}</span>
                          <FlagImg emoji={scorer.flag} size={18} />
                          <div className="goal-radar-page__gb-identity">
                            <span className="goal-radar-page__gb-name">{scorer.player}</span>
                            <span className="goal-radar-page__gb-team">{scorer.code}</span>
                          </div>
                          <div className="goal-radar-page__gb-bar">
                            <span
                              className="goal-radar-page__gb-bar-fill"
                              style={{ width: `${barPct}%`, background: barColor }}
                            />
                          </div>
                          <strong className="goal-radar-page__gb-count">
                            {scorer.count}
                            {isScoring && <span className="goal-radar-page__gb-just-scored" aria-hidden="true">▲</span>}
                          </strong>
                        </div>
                      );
                    })}
                    {activeGoal && !activeGoal.isOwnGoal && activeBootRank === 0 && liveScorers.length > 0 && (
                      <p className="goal-radar-page__gb-offpodium">
                        {activeGoal.player} is outside the top {liveScorers.length} at this point in the race.
                      </p>
                    )}
                    {activeGoal?.isOwnGoal && (
                      <p className="goal-radar-page__gb-offpodium">
                        Own goals don&apos;t count toward the Golden Boot.
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section className="goal-radar-page__feed-panel">
                <div className="goal-radar-page__panel-head">
                  <div>
                    <span className="goal-radar-page__panel-kicker">Goal Reel</span>
                    <h2>Jump to any finish</h2>
                  </div>
                  <span className="goal-radar-page__panel-badge">{feed.length} tracked</span>
                </div>

                <div className="goal-radar-page__feed" ref={feedRef}>
                  {feed.map((goal, index) => (
                    <button
                      key={goal.id}
                      type="button"
                      ref={(node) => { itemRefs.current[index] = node; }}
                      className={`goal-radar-page__item${index === active ? ' is-active' : ''}`}
                      onClick={() => selectGoal(index)}
                    >
                      <span className="goal-radar-page__item-sequence">{String(index + 1).padStart(2, '0')}</span>
                      <span className="goal-radar-page__item-minute">{goal.minute}'</span>
                      <FlagImg emoji={goal.flag} size={20} />
                      <div className="goal-radar-page__item-body">
                        <div className="goal-radar-page__item-player">{goal.player}</div>
                        <div className="goal-radar-page__item-meta">
                          {goal.team} · {goal.city} · {formatGoalDate(goal.date, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <span className="goal-radar-page__item-score">{goal.homeScoreAfter}-{goal.awayScoreAfter}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
