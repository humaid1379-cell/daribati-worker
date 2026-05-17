// ─── Edge-Rendered daribati-proxy Worker ────────────────────────────
// ES Module format with Cache API edge caching for sub-2s mobile LCP
// Uses caches.default (no KV binding required) for edge HTML caching
// All existing functionality preserved: security headers, SEO, accessibility, pricing fixes

const TARGET_ORIGIN = "https://daritax-fhffuwsz.manus.space";
const CANONICAL_DOMAIN = "https://daribati.ae";

// ─── Pages to edge-cache ────────────────────────────────────────────
const CACHED_PAGES = ["/", "/pricing", "/calculator", "/compliance"];

// ─── Cache refresh secret ───────────────────────────────────────────
const CACHE_REFRESH_SECRET = "daribati-edge-refresh-2024";

// ─── Cache TTL (seconds) ────────────────────────────────────────────
const CACHE_TTL = 3600;           // 1 hour fresh
const CACHE_STALE_TTL = 7200;     // 2 hours stale-while-revalidate

// ─── Security headers ───────────────────────────────────────────────
const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://manus-analytics.com https://files.manuscdn.com https://plausible.io https://static.cloudflareinsights.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; " +
    "connect-src 'self' https:; " +
    "frame-src 'self' https://challenges.cloudflare.com; " +
    "object-src 'none'; " +
    "base-uri 'self';",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-XSS-Protection": "1; mode=block",
};

// ─── Pricing JS replacements ────────────────────────────────────────
const JS_PRICING_REPLACEMENTS = [
  [
    'name:a("\u0645\u062C\u0627\u0646\u064A","Free"),price:"0"',
    'name:a("\u0627\u0644\u0645\u062B\u062F\u0626","Starter"),price:"99"',
  ],
  [
    'name:a("\u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A","Pro"),price:"299"',
    'name:a("\u0627\u0644\u0623\u0639\u0645\u0627\u0644","Business"),price:"299"',
  ],
  [
    'price:a("\u0645\u062E\u0635\u0635","Custom"),subtitle:a("\u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649","For groups',
    'price:"799",subtitle:a("\u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649","For groups',
  ],
  [
    'b.plan==="pro"?a==="ar"?"\u0627\u062D\u062A\u0631\u0627\u0641\u064A":"Pro":',
    'b.plan==="pro"?a==="ar"?"\u0623\u0639\u0645\u0627\u0644":"Business":',
  ],
  [
    'b.plan==="free"?a==="ar"?"\u0645\u062C\u0627\u0646\u064A":"Free":b.plan==="starter"',
    'b.plan==="free"?a==="ar"?"\u0645\u062B\u062F\u0626":"Starter":b.plan==="starter"',
  ],
  [
    'free:"Free",freeDesc:"To get started"',
    'free:"Starter",freeDesc:"To get started"',
  ],
  [
    '],i=[{name:a("\u0627\u0644\u0645\u0628\u062a\u062f\u0626","Starter"),price:"99",subtitle:a("\u0644\u0644\u062a\u062c\u0631\u0628\u0629',
    '],i=[{name:a("\u0627\u0644\u0623\u0633\u0627\u0633\u064a","Basic"),price:"99",subtitle:a("\u0644\u0644\u062a\u062c\u0631\u0628\u0629',
  ],
];

// ─── Static responses ───────────────────────────────────────────────

const ROBOTS_TXT = "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dashboard/\n\nSitemap: https://daribati.ae/sitemap.xml\n";

const SITEMAP_XML = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://daribati.ae/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n  <url>\n    <loc>https://daribati.ae/pricing</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>https://daribati.ae/calculator</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n  <url>\n    <loc>https://daribati.ae/compliance</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>\n';

const B2B_OG_DESCRIPTION = "UAE Tax + Billing SaaS platform for businesses, SMEs, and free zone companies. Automate VAT and Corporate Tax compliance with smart CSV import, FTA-compliant invoicing, and Arabic-first dashboard.";

// ─── Cache-Control constants ────────────────────────────────────────
const CACHE_STATIC = "public, max-age=31536000, immutable";
const CACHE_HTML_EDGE = "public, max-age=60, stale-while-revalidate=3600";
const CACHE_HTML_NOCACHE = "no-cache, must-revalidate";
const CACHE_API = "no-store, no-cache, max-age=0";

// ─── Error Tracking State (In-Memory Ring Buffer) ───────────────────
// Note: Workers reset memory frequently, but this provides recent visibility.
const MAX_ERRORS = 100;
let errorBuffer = [];

function logError(error, request, context = {}) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    message: error.message || String(error),
    stack: error.stack || "No stack trace",
    url: request ? request.url : "N/A",
    method: request ? request.method : "N/A",
    headers: request ? Object.fromEntries(request.headers.entries()) : {},
    userAgent: request ? request.headers.get("user-agent") : "N/A",
    ...context
  };
  
  errorBuffer.unshift(errorEntry);
  if (errorBuffer.length > MAX_ERRORS) {
    errorBuffer.pop();
  }
  console.error("Worker Error:", errorEntry);
}

function logSlowRequest(duration, request) {
  logError(new Error(`Slow Request: ${duration}ms`), request, { 
    type: "performance", 
    duration: duration 
  });
}

// ─── Helper: compute ETag from content ─────────────────────────────
function computeETag(content) {
  if (typeof content === 'string' && content.length > 0) {
    var len = content.length;
    var h = len;
    for (var i = 0; i < content.length; i += Math.max(1, Math.floor(content.length / 64))) {
      h = ((h << 5) - h + content.charCodeAt(i)) | 0;
    }
    return '"' + (h >>> 0).toString(36) + '-' + len.toString(36) + '"';
  }
  return null;
}

// ─── Helper: check If-None-Match for 304 response ─────────────────
function checkNotModified(request, etag) {
  if (!etag) return false;
  var ifNoneMatch = request.headers.get('If-None-Match');
  return ifNoneMatch === etag;
}

// ─── Helper: detect asset type from path and content-type ──────────
function getAssetType(pathname, contentType) {
  if (/^\/api\//.test(pathname)) return 'api';
  if (/\.(js|mjs)$/i.test(pathname) || (contentType && contentType.indexOf('javascript') !== -1)) return 'static';
  if (/\.(css)$/i.test(pathname) || (contentType && contentType.indexOf('text/css') !== -1)) return 'static';
  if (/\.(woff2?|ttf|eot|otf)$/i.test(pathname) || (contentType && /font\/|application\/font/.test(contentType))) return 'static';
  if (/\.(png|jpe?g|gif|svg|ico|webp|avif|bmp)$/i.test(pathname) || (contentType && /image\//.test(contentType))) return 'static';
  if (/\.(mp4|webm|ogg|mp3|wav)$/i.test(pathname)) return 'static';
  if (contentType && contentType.indexOf('text/html') !== -1) return 'html';
  return 'other';
}

// ─── Helper: apply cache headers based on asset type ───────────────
function applyCacheHeaders(headers, assetType, isEdgeCached) {
  switch (assetType) {
    case 'static':
      headers.set('Cache-Control', CACHE_STATIC);
      break;
    case 'html':
      headers.set('Cache-Control', isEdgeCached ? CACHE_HTML_EDGE : CACHE_HTML_NOCACHE);
      break;
    case 'api':
      headers.set('Cache-Control', CACHE_API);
      headers.set('Pragma', 'no-cache');
      break;
    default:
      headers.set('Cache-Control', 'public, max-age=3600');
  }
  headers.set('Vary', 'Accept-Encoding');
}

// ─── Helper: apply security headers ─────────────────────────────────
function applySecurityHeaders(headers) {
  var keys = Object.keys(SECURITY_HEADERS);
  for (var i = 0; i < keys.length; i++) {
    headers.set(keys[i], SECURITY_HEADERS[keys[i]]);
  }
  headers.delete("X-Powered-By");
}

// ─── Helper: build a JSON response ─────────────────────────────────
function jsonResponse(body, status) {
  if (!status) status = 200;
  var resp = new Response(JSON.stringify(body), {
    status: status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  applySecurityHeaders(resp.headers);
  return resp;
}

// ─── Helper: build a redirect response ─────────────────────────────
function redirectResponse(url, status) {
  if (!status) status = 301;
  var resp = new Response(null, {
    status: status,
    headers: { "Location": url },
  });
  applySecurityHeaders(resp.headers);
  return resp;
}

// ─── HTML transforms ───────────────────────────────────────────────
function transformHTML(html, pathname) {

  // FIX 3: Plausible analytics tracks under manus.space instead of daribati.ae
  html = html.replace(/data-domain="[^"]*manus\.space"/g, 'data-domain="daribati.ae"');

  // 1. Fix lang attribute
  html = html.replace(/<html\s+lang="en"/, '<html lang="ar" dir="rtl"');

  // 2. Rewrite canonical URL from manus.space → daribati.ae
  html = html.split("https://daritax-fhffuwsz.manus.space").join(CANONICAL_DOMAIN);

  // 3. Hide the "Made with Manus" badge
  html = html.split("hideBadge : false").join("hideBadge : true");

  // 4. Remove the Manus space editor script
  html = html.replace(/<script\s+src="https:\/\/files\.manuscdn\.com\/manus-space-dispatcher\/[^"]*"[^>]*><\/script>/g, "");

  // 5. Replace OG description
  html = html.replace(
    /(<meta\s+(?:property="og:description"|name="description"|name="twitter:description")\s+content=")[^"]*(")/gi,
    '$1' + B2B_OG_DESCRIPTION + '$2'
  );
  html = html.replace(
    /(<meta\s+content=")[^"]*freelancer[^"]*("\s+(?:property="og:description"|name="description"|name="twitter:description"))/gi,
    '$1' + B2B_OG_DESCRIPTION + '$2'
  );

  // ── ACCESSIBILITY FIX: meta-viewport — remove maximum-scale ──────
  html = html.replace(
    /(<meta\s+name="viewport"\s+content="[^"]*?)(?:,?\s*maximum-scale=\d+(?:\.\d+)?|(?:maximum-scale=\d+(?:\.\d+)?,?\s*))([^"]*")/gi,
    function(match, before, after) {
      var result = before.replace(/,\s*$/, '') + after;
      return result;
    }
  );

  // ── ACCESSIBILITY FIX: button-name — add aria-label to icon-only buttons ──
  html = html.replace(
    /(<button(?=[^>]*class="[^"]*\bp-2\b[^"]*")[^>]*)(>)(\s*<svg)/gi,
    function(match, before, gt, svgStart) {
      if (before.indexOf('aria-label') === -1) {
        return before + ' aria-label="\u0641\u062A\u062D \u0627\u0644\u0642\u0627\u0626\u0645\u0629"' + gt + svgStart;
      }
      return match;
    }
  );

  html = html.replace(
    /(<button(?![^>]*aria-label)[^>]*>)(\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<\/button>)/gi,
    function(match, openTag, rest) {
      var innerText = rest.replace(/<[^>]+>/g, '').trim();
      if (innerText === '') {
        return openTag.replace('>', ' aria-label="\u0641\u062A\u062D \u0627\u0644\u0642\u0627\u0626\u0645\u0629">') + rest;
      }
      return match;
    }
  );

  // 6. Inject CSS fixes + accessibility CSS before </head>
  var injectedCSS = '<style>' +
    'button[aria-label="Toggle language"],.language-toggle{min-width:44px;min-height:44px;}' +
    '[dir="rtl"] .not-found-message,[dir="rtl"] .error-page p{text-align:right;direction:rtl;unicode-bidi:plaintext;}' +
    '.__manus_space_badge,.__manus_space_badge_container,[class*="manus-badge"],[id*="manus-badge"],a[href*="manus.im"][style]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;position:absolute!important;z-index:-9999!important;}' +
    'footer p,footer span,footer a,footer .text-muted,footer [class*="text-gray"],[class*="bg-\\[#1e3a5f\\]"] p,[class*="bg-\\[#1e3a5f\\]"] span{color:#b8c8d8!important;}' +
    'footer .text-\\[\\#78899f\\],footer [style*="#78899f"],[style*="color:#78899f"],[style*="color: #78899f"]{color:#b8c8d8!important;}' +
    'nav a,nav button,header a,header button{min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center;}' +
    'footer a,footer button{min-height:44px;padding-top:12px;padding-bottom:12px;display:inline-flex;align-items:center;}' +
    'button.p-2{padding:10px!important;}' +
    'a[href],button{position:relative;}' +
    'nav a::after,nav button::after,footer a::after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:44px;min-height:44px;}' +
    '.a11y-skip-link{position:absolute;top:-100%;left:0;z-index:99999;padding:12px 24px;background:#1e3a5f;color:#ffffff!important;font-size:16px;font-weight:600;text-decoration:none;border-radius:0 0 4px 0;transition:top 0.1s;}' +
    '.a11y-skip-link:focus{top:0;}' +
    '</style>';
  // ── Inject theme-color meta tag ──────────────────────────────────
  var themeColorMeta = '<meta name="theme-color" content="#1e3a5f">';

  // ── Inject JSON-LD structured data for SaaS product ─────────────
  var jsonLd = '<script type="application/ld+json">' + JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "\u0636\u0631\u064a\u0628\u062a\u064a - Daribati",
    "url": "https://daribati.ae",
    "description": B2B_OG_DESCRIPTION,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "AED",
      "lowPrice": "99",
      "highPrice": "799",
      "offerCount": "3"
    },
    "author": {
      "@type": "Organization",
      "name": "Daribati",
      "url": "https://daribati.ae"
    },
    "inLanguage": ["ar", "en"],
    "availableLanguage": ["ar", "en"],
    "featureList": [
      "VAT Compliance",
      "Corporate Tax Filing",
      "FTA-Compliant Invoicing",
      "Smart CSV Import",
      "Arabic-First Dashboard",
      "Free Zone Company Support"
    ]
  }) + '</script>';

  html = html.replace("</head>", themeColorMeta + jsonLd + injectedCSS + "</head>");

  // ── ACCESSIBILITY FIX: skip navigation link ──────────────────────
  var skipLink = '<a href="#main-content" class="a11y-skip-link">\u062A\u062E\u0637\u064A \u0625\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0626\u064A\u0633\u064A</a>';
  html = html.replace(/<body([^>]*)>/, '<body$1>' + skipLink);

  // ── ACCESSIBILITY FIX: landmark-one-main + region ────────────────
  if (html.indexOf('<main') === -1 && html.indexOf('<div id="root">') !== -1) {
    html = html.replace(
      /<div id="root">/,
      '<div id="root"><main id="main-content" role="main" style="display:contents;">'
    );
    html = html.replace('</body>', '</main></body>');
  } else if (html.indexOf('<main') !== -1) {
    html = html.replace(/<main(?![^>]*id=)([^>]*)>/, '<main id="main-content"$1>');
  }

  // ── ACCESSIBILITY FIX: page-has-heading-one — pricing page ──────
  var isPricingPage = pathname && (pathname === '/pricing' || pathname.startsWith('/pricing/') || pathname.startsWith('/pricing?'));
  if (isPricingPage) {
    var pricingH1 = '<h1 style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">\u0628\u0627\u0642\u0627\u062A \u0648\u0623\u0633\u0639\u0627\u0631 \u0636\u0631\u064A\u0628\u062A\u064A</h1>';
    html = html.replace(
      /(<a[^>]*class="a11y-skip-link"[^>]*>[^<]*<\/a>)/,
      '$1' + pricingH1
    );
  }

  // 7. Add aria-label to language toggle buttons
  html = html.replace(
    /(<button[^>]*class="[^"]*language[^"]*")(>)/gi,
    function(match, before, after) {
      if (before.indexOf("aria-label") === -1) {
        return before + ' aria-label="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0644\u063A\u0629 / Toggle Language"' + after;
      }
      return match;
    }
  );

  return html;
}

// ─── JS transforms ─────────────────────────────────────────────────
function transformJS(js) {
  for (var i = 0; i < JS_PRICING_REPLACEMENTS.length; i++) {
    js = js.split(JS_PRICING_REPLACEMENTS[i][0]).join(JS_PRICING_REPLACEMENTS[i][1]);
  }
  js = js.split("/ibmplexsansarabic/v12/").join("/ibmplexsansarabic/v15/");
  js = js.split("daritax-fhffuwsz.manus.space").join("daribati.ae");
  return js;
}

// ─── Cache API helpers ─────────────────────────────────────────────
// Build a canonical cache key URL for a given page path
function cacheKeyUrl(pathname) {
  // Use a stable URL as the cache key — must be a valid URL
  return "https://daribati.ae/__edge_cache__" + pathname;
}

// Check if a pathname should be edge-cached
function isCacheablePage(pathname) {
  var normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  return CACHED_PAGES.indexOf(normalized) !== -1;
}

// Store HTML in the Cache API with proper headers
async function cachePut(cache, pathname, html, status) {
  var cacheKey = cacheKeyUrl(pathname);
  var headers = new Headers();
  headers.set('Content-Type', 'text/html; charset=utf-8');
  // Cache-Control tells Cloudflare's cache how long to keep this entry
  headers.set('Cache-Control', 'public, max-age=' + CACHE_TTL + ', stale-while-revalidate=' + CACHE_STALE_TTL);
  headers.set('X-Cached-At', Date.now().toString());
  applySecurityHeaders(headers);
  var resp = new Response(html, { status: status || 200, headers: headers });
  await cache.put(cacheKey, resp);
}

// Get HTML from Cache API
async function cacheGet(cache, pathname) {
  var cacheKey = cacheKeyUrl(pathname);
  var cached = await cache.match(cacheKey);
  if (!cached) return { html: null, isMiss: true };

  var cachedAt = parseInt(cached.headers.get('X-Cached-At') || '0', 10);
  var age = Date.now() - cachedAt;
  var isStale = age > (CACHE_TTL * 1000);

  var html = await cached.text();
  return { html: html, isMiss: false, isStale: isStale, age: age };
}

// ─── Background revalidation ────────────────────────────────────────
async function backgroundRevalidate(cache, pathname) {
  try {
    var targetUrl = new URL(pathname, TARGET_ORIGIN);
    var originResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: { "Host": new URL(TARGET_ORIGIN).hostname, "User-Agent": "Daribati-Edge-Revalidator/1.0" },
      redirect: "follow",
    });
    var contentType = originResponse.headers.get("content-type") || "";
    if (contentType.indexOf("text/html") !== -1) {
      var htmlText = await originResponse.text();
      htmlText = transformHTML(htmlText, pathname);
      await cachePut(cache, pathname, htmlText, originResponse.status);
    }
  } catch (e) {
    console.error("Background revalidation failed for " + pathname + ": " + e.message);
  }
}

// ─── Cache warming: fetch all pages and store ──────────────────────
async function warmCache(cache) {
  var results = [];
  for (var i = 0; i < CACHED_PAGES.length; i++) {
    var pathname = CACHED_PAGES[i];
    try {
      var targetUrl = new URL(pathname, TARGET_ORIGIN);
      var originResponse = await fetch(targetUrl.toString(), {
        method: "GET",
        headers: { "Host": new URL(TARGET_ORIGIN).hostname, "User-Agent": "Daribati-Edge-CacheWarmer/1.0" },
        redirect: "follow",
      });
      var contentType = originResponse.headers.get("content-type") || "";
      if (contentType.indexOf("text/html") !== -1) {
        var htmlText = await originResponse.text();
        htmlText = transformHTML(htmlText, pathname);
        await cachePut(cache, pathname, htmlText, originResponse.status);
        results.push({ page: pathname, status: "cached", size: htmlText.length });
      } else {
        results.push({ page: pathname, status: "skipped", reason: "not HTML" });
      }
    } catch (e) {
      results.push({ page: pathname, status: "error", reason: e.message });
    }
  }
  return results;
}

// ─── Main request handler (ES Module format) ───────────────────────
async function handleRequest(request, env, ctx) {
  var startTime = Date.now();
  var url = new URL(request.url);
  var hostname = url.hostname;
  var pathname = url.pathname;

  try {
    // Get the Cache API instance
    var cache = caches.default;

    // ── HTTP → HTTPS redirect (fallback for Always Use HTTPS) ────
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return redirectResponse(url.toString(), 301);
    }

    // ── www redirect ──────────────────────────────────────────────
    if (hostname === "www.daribati.ae") {
      var target = new URL(url.toString());
      target.hostname = "daribati.ae";
      return redirectResponse(target.toString(), 301);
    }

    // ── /login → redirect to dashboard ───────────────────────────
    if (pathname === "/login" || pathname === "/login/") {
      return redirectResponse(CANONICAL_DOMAIN + "/dashboard/", 302);
    }

    // ── /api/health → JSON response ───────────────────────────────
    if (pathname === "/api/health" || pathname === "/api/health/") {
      var healthResp = jsonResponse({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "daribati.ae",
        version: "2.1.0-edge-monitored",
        cache_backend: "Cache API (caches.default)",
      });
      applyCacheHeaders(healthResp.headers, 'api');
      return healthResp;
    }

    // ── /api/trpc (root) → JSON response ─────────────────────────
    if (pathname === "/api/trpc" || pathname === "/api/trpc/") {
      var trpcResp = jsonResponse({
        message: "tRPC endpoint active",
        docs: "Use specific procedure paths like /api/trpc/<procedure>",
      }, 200);
      applyCacheHeaders(trpcResp.headers, 'api');
      return trpcResp;
    }

    // ── /api/cache-refresh → trigger cache warming (protected) ───
    if (pathname === "/api/cache-refresh") {
      var authKey = url.searchParams.get("key");
      if (authKey !== CACHE_REFRESH_SECRET) {
        return jsonResponse({ error: "Unauthorized" }, 403);
      }
      var warmResults = await warmCache(cache);
      return jsonResponse({
        status: "ok",
        message: "Cache warmed successfully",
        results: warmResults,
        timestamp: new Date().toISOString(),
      });
    }

    // ── /api/cache-purge → purge a specific page from cache ──────
    if (pathname === "/api/cache-purge") {
      var authKey3 = url.searchParams.get("key");
      if (authKey3 !== CACHE_REFRESH_SECRET) {
        return jsonResponse({ error: "Unauthorized" }, 403);
      }
      var pageToPurge = url.searchParams.get("page") || "/";
      var purgeKey = cacheKeyUrl(pageToPurge);
      var deleted = await cache.delete(purgeKey);
      return jsonResponse({
        status: "ok",
        page: pageToPurge,
        deleted: deleted,
        timestamp: new Date().toISOString(),
      });
    }

    // ── /api/errors → return recent errors (protected) ───────────
    if (pathname === "/api/errors") {
      var authKeyErrors = url.searchParams.get("key");
      if (authKeyErrors !== CACHE_REFRESH_SECRET) {
        return jsonResponse({ error: "Unauthorized" }, 403);
      }
      return jsonResponse({
        status: "ok",
        count: errorBuffer.length,
        errors: errorBuffer,
        timestamp: new Date().toISOString(),
      });
    }

    // ── /api/errors/stats → return error statistics (protected) ──
    if (pathname === "/api/errors/stats") {
      var authKeyStats = url.searchParams.get("key");
      if (authKeyStats !== CACHE_REFRESH_SECRET) {
        return jsonResponse({ error: "Unauthorized" }, 403);
      }
      
      const stats = {
        total: errorBuffer.length,
        byType: {},
        byPath: {},
        byTime: {
          lastHour: 0,
          last24Hours: 0
        }
      };
      
      const now = Date.now();
      errorBuffer.forEach(err => {
        // By Type
        const type = err.type || "exception";
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        
        // By Path
        try {
          const errUrl = new URL(err.url);
          const path = errUrl.pathname;
          stats.byPath[path] = (stats.byPath[path] || 0) + 1;
        } catch(e) {
          stats.byPath["unknown"] = (stats.byPath["unknown"] || 0) + 1;
        }
        
        // By Time
        const errTime = new Date(err.timestamp).getTime();
        if (now - errTime < 3600000) stats.byTime.lastHour++;
        if (now - errTime < 86400000) stats.byTime.last24Hours++;
      });
      
      return jsonResponse({
        status: "ok",
        stats: stats,
        timestamp: new Date().toISOString(),
      });
    }

    // ── robots.txt → serve our own ──────────────────────────────
    if (pathname === "/robots.txt") {
      var robotsETag = computeETag(ROBOTS_TXT);
      if (checkNotModified(request, robotsETag)) {
        return new Response(null, { status: 304, headers: { 'ETag': robotsETag } });
      }
      var robotsResp = new Response(ROBOTS_TXT, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
          "ETag": robotsETag,
          "Vary": "Accept-Encoding",
        },
      });
      applySecurityHeaders(robotsResp.headers);
      return robotsResp;
    }

    // ── sitemap.xml → serve our own ─────────────────────────────
    if (pathname === "/sitemap.xml") {
      var sitemapETag = computeETag(SITEMAP_XML);
      if (checkNotModified(request, sitemapETag)) {
        return new Response(null, { status: 304, headers: { 'ETag': sitemapETag } });
      }
      var sitemapResp = new Response(SITEMAP_XML, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
          "ETag": sitemapETag,
          "Vary": "Accept-Encoding",
        },
      });
      applySecurityHeaders(sitemapResp.headers);
      return sitemapResp;
    }

    // ═══════════════════════════════════════════════════════════════
    // ── EDGE RENDERING: Serve cacheable pages from Cache API ─────
    // ═══════════════════════════════════════════════════════════════
    var normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    let response;

    if (isCacheablePage(normalizedPath) && request.method === "GET") {

      // Try Cache API first
      var cacheResult = await cacheGet(cache, normalizedPath);

      if (!cacheResult.isMiss) {
        // ── CACHE HIT (fresh or stale) ───────────────────────────
        var cachedHtml = cacheResult.html;
        var cacheStatus = cacheResult.isStale ? "STALE" : "HIT";

        // If stale, trigger background revalidation via waitUntil
        if (cacheResult.isStale) {
          ctx.waitUntil(backgroundRevalidate(cache, normalizedPath));
        }

        var htmlETag = computeETag(cachedHtml);
        if (checkNotModified(request, htmlETag)) {
          var notModHeaders = new Headers();
          notModHeaders.set('ETag', htmlETag);
          notModHeaders.set('X-Cache', cacheStatus);
          notModHeaders.set('X-Response-Time', (Date.now() - startTime) + 'ms');
          response = new Response(null, { status: 304, headers: notModHeaders });
        } else {
          var edgeHeaders = new Headers();
          edgeHeaders.set('Content-Type', 'text/html; charset=utf-8');
          applySecurityHeaders(edgeHeaders);
          applyCacheHeaders(edgeHeaders, 'html', true);
          if (htmlETag) edgeHeaders.set('ETag', htmlETag);
          edgeHeaders.set('X-Cache', cacheStatus);
          edgeHeaders.set('X-Response-Time', (Date.now() - startTime) + 'ms');
          edgeHeaders.set('X-Edge-Rendered', 'true');

          response = new Response(cachedHtml, { status: 200, headers: edgeHeaders });
        }
      } else {
        // ── CACHE MISS: fetch from origin, transform, cache, serve ─
        var targetUrl = new URL(normalizedPath + url.search, TARGET_ORIGIN);
        var proxyReq = new Request(targetUrl.toString(), {
          method: "GET",
          headers: { "Host": new URL(TARGET_ORIGIN).hostname },
          redirect: "follow",
        });

        var originResp;
        try {
          originResp = await fetch(proxyReq);
        } catch (err) {
          response = jsonResponse({ error: "Origin unreachable" }, 502);
        }

        if (!response) {
          var ct = originResp.headers.get("content-type") || "";
          if (ct.indexOf("text/html") !== -1) {
            var freshHtml = await originResp.text();
            freshHtml = transformHTML(freshHtml, normalizedPath);

            // Store in cache in the background — don't block the response
            ctx.waitUntil(cachePut(cache, normalizedPath, freshHtml, originResp.status));

            var missETag = computeETag(freshHtml);
            if (checkNotModified(request, missETag)) {
              var missNotModHeaders = new Headers();
              missNotModHeaders.set('ETag', missETag);
              missNotModHeaders.set('X-Cache', 'MISS');
              missNotModHeaders.set('X-Response-Time', (Date.now() - startTime) + 'ms');
              response = new Response(null, { status: 304, headers: missNotModHeaders });
            } else {
              var missHeaders = new Headers();
              missHeaders.set('Content-Type', 'text/html; charset=utf-8');
              applySecurityHeaders(missHeaders);
              applyCacheHeaders(missHeaders, 'html', true);
              if (missETag) missHeaders.set('ETag', missETag);
              missHeaders.set('X-Cache', 'MISS');
              missHeaders.set('X-Response-Time', (Date.now() - startTime) + 'ms');
              missHeaders.set('X-Edge-Rendered', 'true');

              response = new Response(freshHtml, { status: originResp.status || 200, headers: missHeaders });
            }
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ── Standard proxy for non-cached paths ──────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (!response) {
      var proxyTargetUrl = new URL(pathname + url.search, TARGET_ORIGIN);

      var proxyRequest = new Request(proxyTargetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "follow",
      });
      proxyRequest.headers.set("Host", proxyTargetUrl.hostname);

      var originResponse;
      try {
        originResponse = await fetch(proxyRequest);
      } catch (err) {
        response = jsonResponse({ error: "Origin unreachable" }, 502);
      }

      if (!response) {
        var contentType = originResponse.headers.get("content-type") || "";
        var isJS =
          contentType.indexOf("javascript") !== -1 ||
          /\/assets\/.*\.js(\?.*)?$/.test(pathname);
        var isHTML = contentType.indexOf("text/html") !== -1;
        var isCSS = contentType.indexOf("text/css") !== -1 || pathname.endsWith(".css");

        // ── HTML responses (non-cached pages: /dashboard, etc.) ──────
        if (isHTML) {
          var htmlText = await originResponse.text();
          htmlText = transformHTML(htmlText, pathname);

          var htmlETag2 = computeETag(htmlText);
          if (checkNotModified(request, htmlETag2)) {
            response = new Response(null, { status: 304, headers: { 'ETag': htmlETag2 } });
          } else {
            var htmlHeaders = new Headers(originResponse.headers);
            applySecurityHeaders(htmlHeaders);
            applyCacheHeaders(htmlHeaders, 'html', false);
            if (htmlETag2) htmlHeaders.set('ETag', htmlETag2);
            htmlHeaders.set('X-Cache', 'BYPASS');
            htmlHeaders.set('X-Response-Time', (Date.now() - startTime) + 'ms');

            response = new Response(htmlText, {
              status: originResponse.status,
              statusText: originResponse.statusText,
              headers: htmlHeaders,
            });
          }
        }

        // ── JS responses ────────────────────────────────────────────
        else if (isJS) {
          var jsText = await originResponse.text();
          jsText = transformJS(jsText);

          var jsETag = computeETag(jsText);
          if (checkNotModified(request, jsETag)) {
            response = new Response(null, { status: 304, headers: { 'ETag': jsETag } });
          } else {
            var jsHeaders = new Headers(originResponse.headers);
            applySecurityHeaders(jsHeaders);
            applyCacheHeaders(jsHeaders, 'static');
            if (jsETag) jsHeaders.set('ETag', jsETag);

            response = new Response(jsText, {
              status: originResponse.status,
              statusText: originResponse.statusText,
              headers: jsHeaders,
            });
          }
        }

        // ── CSS responses ───────────────────────────────────────────
        else if (isCSS) {
          var cssText = await originResponse.text();
          cssText = cssText.split("/ibmplexsansarabic/v12/").join("/ibmplexsansarabic/v15/");

          var cssETag = computeETag(cssText);
          if (checkNotModified(request, cssETag)) {
            response = new Response(null, { status: 304, headers: { 'ETag': cssETag } });
          } else {
            var cssHeaders = new Headers(originResponse.headers);
            applySecurityHeaders(cssHeaders);
            applyCacheHeaders(cssHeaders, 'static');
            if (cssETag) cssHeaders.set('ETag', cssETag);

            response = new Response(cssText, {
              status: originResponse.status,
              statusText: originResponse.statusText,
              headers: cssHeaders,
            });
          }
        }

        // ── All other responses (images, fonts, etc.) ──────────────
        else {
          var otherHeaders = new Headers(originResponse.headers);
          applySecurityHeaders(otherHeaders);
          var otherAssetType = getAssetType(pathname, contentType);
          applyCacheHeaders(otherHeaders, otherAssetType);

          response = new Response(originResponse.body, {
            status: originResponse.status,
            statusText: originResponse.statusText,
            headers: otherHeaders,
          });
        }
      }
    }

    // Performance Monitoring: Check if request was slow
    const duration = Date.now() - startTime;
    if (duration > 3000) {
      logSlowRequest(duration, request);
    }

    return response;

  } catch (err) {
    logError(err, request);
    return jsonResponse({ 
      error: "Internal Server Error", 
      message: err.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}

// ─── ES Module export ──────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },

  // ─── Scheduled handler: warm cache every hour ────────────────
  async scheduled(event, env, ctx) {
    var cache = caches.default;
    ctx.waitUntil(warmCache(cache));
  },
};
