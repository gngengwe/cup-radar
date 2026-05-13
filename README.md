# Cup Radar — Landing Page

Phase One of Cup Radar: a polished landing / coming-soon page for the World Cup 2026 Seattle HQ dashboard.

**Live at:** [wc.ngengwe.com](https://wc.ngengwe.com)

## Stack

- **Vite 5** + **React 18**
- Pure CSS design system (no framework)
- Hosted on **Cloudflare Pages**, deployed via GitHub push

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for production

```bash
npm run build   # output → dist/
npm run preview # local preview of the built output
```

---

## Deploying

This project uses **Cloudflare Pages** with automatic GitHub deploys.

### One-time setup (do once)

1. **Push to GitHub** — `git push origin main`
2. **Connect in Cloudflare Pages**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com) → Create a project → Connect to Git
   - Select the `cup-radar` repository
   - Build settings:
     | Setting | Value |
     |---------|-------|
     | Framework preset | None (or Vite) |
     | Build command | `npm run build` |
     | Build output directory | `dist` |
   - Click **Save and Deploy**
3. **Add custom domain**
   - In Cloudflare Pages project → Custom domains → Add `wc.ngengwe.com`
   - Since `ngengwe.com` is already on Cloudflare, the DNS record is created automatically

### Subsequent deploys

```bash
git add .
git commit -m "your message"
git push
```

Cloudflare Pages detects the push and rebuilds automatically. Typically live in ~60 seconds.

---

## Configuration

All configurable variables live in **`src/config.js`**.

### Product config (`PRODUCT` object)

| Field                | Description                                          |
|----------------------|------------------------------------------------------|
| `SIGNUP_FORM_ACTION` | Email form POST URL (Mailchimp, ConvertKit, etc.)    |

---

## Project Structure

```
wc_radar/
├── public/
│   ├── favicon.svg              # Radar SVG icon
│   └── _redirects               # Cloudflare Pages SPA routing
├── src/
│   ├── config.js                # ← deployment & product config
│   ├── App.jsx                  # Root — section layout
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Full design system & styles
│   └── components/
│       ├── Navbar.jsx           # Sticky nav with scroll detection
│       ├── Hero.jsx             # Countdown timer, hero copy, CTAs
│       ├── SeattleHQ.jsx        # 6 match dates + local module grid
│       ├── WhatWeTrack.jsx      # 8 coverage module cards
│       ├── TicketRadar.jsx      # Ticket intelligence feature list
│       ├── CityJump.jsx         # Multi-city trip comparison preview
│       ├── DailyBrief.jsx       # Email signup with success state
│       ├── FounderClose.jsx     # Closing quote + repeat CTAs
│       └── Footer.jsx           # Disclaimer, copyright
├── index.html
├── vite.config.js
└── package.json
```

---

## What's Still Needed

- [ ] **Cloudflare Pages** — connect GitHub repo (one-time, see above)
- [ ] **Custom domain** — add `wc.ngengwe.com` in CF Pages project settings
- [ ] **Email form action** — set `PRODUCT.SIGNUP_FORM_ACTION` in `src/config.js`
- [ ] **OG image** — add `/public/og.png` (1200×630) for social link previews

---

## Phase Two (MVP Dashboard)

This landing page is structured for incremental extension:

- Add **React Router** when multi-page routing is needed
- Add `src/pages/` for dashboard views (Today, Matches, Groups, SeattleHQ, etc.)
- Extend `src/config.js` with API keys and data source URLs
- Existing module preview cards in `src/components/` become live modules in place
