# Cup Radar — External Services & Registrations

All third-party tools, APIs, accounts, and credentials that support this application.
Keep this file updated. Never commit actual secrets — use the references below.

---

## 🌐 Hosting & Deployment

### Cloudflare Pages
- **Purpose:** Static site hosting, CDN, auto-deploy on git push
- **Project name:** `cup-radar`
- **Production URL:** https://wc.ngengwe.com
- **Pages URL:** https://cup-radar.pages.dev
- **Account:** George Ngengwe (gngengwe@gmail.com)
- **Dashboard:** https://dash.cloudflare.com → Workers & Pages → cup-radar
- **Deploy trigger:** Every push to `master` branch via GitHub Actions
- **Deploy time:** ~40 seconds from push to live

### GitHub
- **Purpose:** Source control, CI/CD via GitHub Actions
- **Repository:** https://github.com/gngengwe/cup-radar (public)
- **Account:** gngengwe
- **Branch:** `master` (production)
- **Actions workflow:** `.github/workflows/deploy.yml`
- **Secrets stored in GitHub** (Settings → Secrets → Actions):
  - `CLOUDFLARE_API_TOKEN` — Cloudflare Pages deploy token
  - `VITE_FOOTBALL_API_KEY` — football-data.org (set this!)
  - `VITE_WEATHER_API_KEY` — OpenWeatherMap One Call API 3.0 (set this!)

---

## 🌤️ Weather API

### OpenWeatherMap — One Call API 3.0
- **Purpose:** Match-day weather forecasts on City HQ match cards
- **Account:** gngengwe@gmail.com
- **Plan:** One Call API 3.0 (pay-as-you-go)
- **Free tier:** 1,000 calls/day at no cost
- **Overage:** $0.15 per 100 calls beyond 1,000
- **Expected usage:** <50 calls/day (cached 1hr, only within 48hrs of match)
- **Expected cost:** $0.00
- **API key location:** OpenWeatherMap account → API keys tab
- **Endpoint used:** `https://api.openweathermap.org/data/3.0/onecall`
- **Venues queried:**
  - Seattle (Lumen Field): lat 47.5951, lon -122.3316
  - Kansas City (Arrowhead): lat 39.0489, lon -94.4839
- **Dashboard:** https://home.openweathermap.org/api_keys
- **Docs:** https://openweathermap.org/api/one-call-3
- **Set secret:** `gh secret set VITE_WEATHER_API_KEY --body "KEY" --repo gngengwe/cup-radar`

---

## ⚽ Live Scores API

### football-data.org
- **Purpose:** Live match scores, group standings, real-time tournament data
- **Plan:** Free tier (10 calls/minute, WC included)
- **Account:** gngengwe@gmail.com — https://www.football-data.org/client
- **Competition ID:** 2000 (FIFA World Cup)
- **Season:** 2026
- **Endpoints used:**
  - `/competitions/2000/matches?season=2026` — all matches
  - `/competitions/2000/standings?season=2026` — group standings
  - `/competitions/2000/matches?dateFrom=X&dateTo=X` — today's matches
- **Caching:** localStorage, 5-min TTL (60s during live matches)
- **Fallback:** Local JSON data if API unavailable
- **Dashboard:** https://www.football-data.org/client
- **Secret set:** ✅ `VITE_FOOTBALL_API_KEY` in GitHub Actions secrets

---

## 🏳️ Flag Images

### Twemoji CDN (jsDelivr)
- **Purpose:** Country flag emoji rendered as SVG images (cross-platform, fixes Windows)
- **Account:** None required — open source CDN
- **URL pattern:** `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/{codepoint}.svg`
- **Cost:** Free
- **Implementation:** `src/components/FlagImg.jsx`
- **License:** CC-BY 4.0 (Twitter/X Twemoji)

---

## 🛒 Ticket Links

### FIFA Official Store
- **Purpose:** "Official kit ↗" links in Team IQ section
- **URL:** https://store.fifa.com/collections/world-cup-2026-football-shirts
- **Account:** None — outbound links only, no API
- **Note:** All kit links point to specific product pages on store.fifa.com

---

## 📧 Email Signups (Not yet configured)

### Mailchimp / ConvertKit
- **Purpose:** Daily Brief email list from landing page signup form
- **Status:** ⚠️ NOT YET SET UP — form currently shows success but doesn't submit
- **To activate:**
  1. Create a Mailchimp or ConvertKit account
  2. Create an audience/list
  3. Get the form POST URL
  4. Set `PRODUCT.SIGNUP_FORM_ACTION` in `src/config.js`
- **Code location:** `src/components/DailyBrief.jsx`

---

## 🔧 Admin Panel

### GitHub Personal Access Token
- **Purpose:** Admin panel at `/admin` uses a GitHub token to read/write data files
- **Scope required:** `repo` (read + write to cup-radar repository)
- **Create at:** https://github.com/settings/tokens
- **Storage:** Browser `sessionStorage` only (clears on browser close)
- **Usage:** One-time login at `wc.ngengwe.com/admin`
- **Never commit this token**

### Automated Refresh & Ops Digest
- **Purpose:** Keeps scores, upsets, bracket, news, and narrative drafts in sync without manual button presses
- **Workflow:** `.github/workflows/refresh.yml`
- **Schedule:** Every 3 hours (`cron: '0 */3 * * *'`), plus manual trigger from Admin → Web Refresh
- **What runs automatically:**
  - **Scores** — synced from football-data.org, committed directly (no review needed)
  - **Upsets** — auto-resolved to "happened"/"didn't happen" based on finished matches
  - **Bracket** — knockout slots filled in and scored from match results
  - **News** & **Narratives** — new items added as `draft: true`, require manual review in Admin
- **Ops Digest:** If a run produces changes, drafts, or flags, the bot opens a GitHub issue
  labeled `ops-digest` titled "Cup Radar Ops Digest — <date>". GitHub emails this to the repo
  owner automatically (no extra secrets needed). The issue lists:
  - ✅ Auto-applied changes (no action needed)
  - 📝 New drafts pending review (checklist — review in Admin Panel)
  - ⚠️ Close calls worth a manual look (e.g., upsets resolved as a draw)
  - ❌ Errors (e.g., missing API key)
  - Runs that produce nothing notable post **no** issue (keeps the inbox quiet)

---

## 🌍 Domain

### ngengwe.com (via Cloudflare)
- **Registrar:** Cloudflare (previously HostMonster — migrated)
- **DNS managed by:** Cloudflare
- **Subdomain in use:** `wc.ngengwe.com`
- **DNS record:** CNAME `wc` → `cup-radar.pages.dev` (auto-created by Cloudflare Pages)
- **Account:** gngengwe@gmail.com

---

## 📦 npm Packages (Key Dependencies)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | DOM rendering |
| `react-router-dom` | ^6.26.2 | Client-side routing |
| `vite` | ^5.4.10 | Build tool |
| `@vitejs/plugin-react` | ^4.3.2 | React + Vite integration |

No other runtime dependencies. All data is local JSON or fetched from the APIs above.

---

## 🔑 Secret Management Reference

### GitHub Secrets (set via CLI or GitHub UI)
```bash
# Cloudflare deploy (already set)
gh secret set CLOUDFLARE_API_TOKEN --body "TOKEN" --repo gngengwe/cup-radar

# Live scores (football-data.org — set this!)
gh secret set VITE_FOOTBALL_API_KEY --body "KEY" --repo gngengwe/cup-radar

# Weather forecasts (OpenWeatherMap — set this!)
gh secret set VITE_WEATHER_API_KEY --body "KEY" --repo gngengwe/cup-radar
```

### Local Development (.env.local — gitignored)
```bash
# Copy .env.example to .env.local and fill in:
VITE_FOOTBALL_API_KEY=your_football_key
VITE_WEATHER_API_KEY=your_weather_key
```

---

## 📊 Service Status Summary

| Service | Status | Cost | Critical? |
|---------|--------|------|-----------|
| Cloudflare Pages | ✅ Live | Free | Yes |
| GitHub | ✅ Connected | Free | Yes |
| Twemoji CDN | ✅ Active | Free | Yes (flags) |
| FIFA store links | ✅ Active | Free | No (outbound only) |
| OpenWeatherMap | ⚠️ Key not set | ~$0/mo | No (fallback exists) |
| football-data.org | ✅ Key set | Free | No (fallback exists) |
| Email signups | ❌ Not configured | TBD | No |

---

*Last updated: May 2026*
*Maintained by: HK Clearway LLC, powered by becomiNG*
