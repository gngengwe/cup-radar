CREATE TABLE IF NOT EXISTS match_summaries (
  event_id   TEXT PRIMARY KEY,
  match_id   TEXT NOT NULL,
  data       TEXT NOT NULL,
  stored_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_id ON match_summaries (match_id);
