# SEO Booster — Generative Engine Optimization (GEO) Platform

A standalone web app with all the premium features and functionality for AI search visibility.

## Features

- **GEO Checker** — Analyze any URL for AI search readiness (JSON-LD, schema.org, meta tags, machine readability)
- **AI Mentions Tracker** — Log when your brand is mentioned (or not) in ChatGPT, Claude, Gemini, Perplexity
- **Structured Data Generator** — Create JSON-LD for Organization, WebSite, Product, SoftwareApplication
- **AI Visibility Dashboard** — Track citations, extraction depth, competitor positioning, displacement actions
- **One-Pager** — Full premium copy and value proposition

## Quick Start

**Option 1 — Dev server (recommended):**
```bash
npm install
npm run dev
```
Then open **http://localhost:5173** in your browser.

**Option 2 — Production build + serve:**
```bash
npm install
npm run start
```
Then open **http://localhost:3001** in your browser.

> ⚠️ Do NOT open index.html directly by double-clicking. The app must be served over HTTP (localhost). Use one of the commands above.

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static host.

## Deploy to Vercel (GitHub + Vercel)

1. Push your code to GitHub.
2. Import the repo in [Vercel](https://vercel.com) (New Project → Import Git Repository).
3. Vercel auto-detects Vite. Build command: `npm run build`, Output: `dist`.
4. Deploy. The `/api` routes (GEO Checker, Content Generator) run as serverless functions automatically.
5. **Optional:** Add `OPENAI_API_KEY` in Vercel → Project Settings → Environment Variables for AI-enhanced content generation.

The app works fully on Vercel: frontend, GEO Checker API, and Content Generator API.

### Build failed on Vercel?

1. **Check the build logs** in Vercel → Project → Deployments → click the failed deployment → View Build Logs. The actual error appears there.
2. **Node version:** The project requires Node 18+. Vercel uses Node 18 by default. If needed, set `NODE_VERSION=18` in Vercel → Project Settings → Environment Variables.
3. **Root directory:** If the project is in a subfolder, set "Root Directory" in Vercel project settings to that folder.
4. **Repo name:** Avoid spaces in the GitHub repo name (e.g. use `seo-booster` not `seo booster`).

## Tech Stack

- React 18 + Vite
- React Router
- Recharts (dashboard)
- Express (API server for GEO Checker)
- node-html-parser (HTML analysis)
