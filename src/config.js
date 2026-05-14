// ─── DEPLOYMENT CONFIG ────────────────────────────────────────────────────────
// Hosting: Cloudflare Pages  →  wc.ngengwe.com
// Deploy:  git push → GitHub repo → Cloudflare Pages auto-builds

export const DEPLOY = {
  DOMAIN:           'wc.ngengwe.com',
  SITE_URL:         'https://wc.ngengwe.com',
  HOSTING_PROVIDER: 'Cloudflare Pages',
  GITHUB_REPO:      'gngengwe/cup-radar',    // update if repo name differs
  CF_PROJECT_NAME:  'cup-radar',             // Cloudflare Pages project name
  HOSTING_NOTES:    'Connect GitHub repo in Cloudflare Pages dashboard; set custom domain wc.ngengwe.com',
};

// ─── PRODUCT CONFIG ───────────────────────────────────────────────────────────

export const PRODUCT = {
  NAME:             'Cup Radar',
  WORKING_TITLE:    'Cup Radar: Seattle HQ',
  TAGLINE:          'Matches, moments, tickets, and city energy — all in one place.',
  SITE_TITLE:       'Cup Radar — World Cup Seattle HQ',
  META_DESCRIPTION: 'A Seattle-first World Cup command center for matches, tickets, events, travel opportunities, and tournament news.',
  CTA_PRIMARY:      'Open Today Mode',
  CTA_SECONDARY:    'View Seattle HQ',
  SIGNUP_FORM_ACTION: '', // Mailchimp / ConvertKit form action URL — fill in before launch
};

// ─── TOURNAMENT CONFIG ────────────────────────────────────────────────────────

export const TOURNAMENT = {
  NAME:       'FIFA World Cup 2026',
  START_DATE: '2026-06-11T00:00:00Z',
  FINAL_DATE: '2026-07-19',
  SEATTLE_VENUE: 'Lumen Field',
  SEATTLE_MATCHES: [
    { date: 'June 15',  day: 'Mon' },
    { date: 'June 19',  day: 'Fri' },
    { date: 'June 24',  day: 'Wed' },
    { date: 'June 26',  day: 'Fri' },
    { date: 'July 1',   day: 'Wed' },
    { date: 'July 6',   day: 'Mon' },
  ],
};
