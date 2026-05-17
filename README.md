# daribati-proxy Cloudflare Worker

Edge-rendered reverse proxy Worker for [daribati.ae](https://daribati.ae), built on Cloudflare Workers.

## Features

- Reverse-proxies requests to the upstream Manus origin
- Applies security headers (CSP, HSTS, X-Frame-Options, etc.)
- Edge-caches HTML pages for sub-2s mobile LCP
- Injects SEO metadata, JSON-LD structured data, and accessibility fixes
- Rewrites pricing labels and hides the Manus badge

## CI/CD

Every push to `main` automatically deploys the Worker via GitHub Actions using [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `CF_API_TOKEN` | Cloudflare API token with Workers:Edit permission |
| `CF_ACCOUNT_ID` | Cloudflare Account ID |

## Local Development

```bash
npm install -g wrangler
wrangler dev
```

## Manual Deploy

```bash
wrangler deploy
```
