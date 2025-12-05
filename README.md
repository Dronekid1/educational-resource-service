# educational-resource-service

Lightweight JavaScript proxy service and a minimal frontend for fetching educational resources from external APIs while avoiding CORS, centralizing keys, and optionally caching/rate-limiting responses.

## What this proxy does (overview)
- Acts as a middleman between the browser frontend and external educational-resource APIs.
- Solves CORS restrictions by making requests server-side and returning responses to the browser.
- Keeps API keys and secrets on the server (never exposed client-side).
- Optionally adds:
  - simple in-memory caching (reduces repeated external calls),
  - rate-limiting (protects external quotas),
  - request/response transformation (normalize external API shapes for the frontend).
- Provides a single, safe endpoint surface the frontend can call (e.g., /api/proxy or /api/resources).

## Security & responsibilities
- Store secrets in environment variables (never commit them).
- Validate and sanitize incoming requests (avoid open proxy abuse).
- Consider adding authentication if proxy will be public.
- For production: prefer a persistent cache (Redis) and robust rate-limiting (e.g., API gateway or proven middleware).

## How the proxy is typically structured
- Server (Node.js/Express)
  - Endpoint: GET/POST /api/proxy (or more specific routes)
  - Reads query/body parameters (e.g., target path, id, query)
  - Validates allowed targets or maps friendly routes to configured external endpoints
  - Attaches server-side API key to external requests
  - Optionally caches responses and enforces rate limits
  - Returns JSON (or passes through content-type) to client
- Frontend (static HTML/JS)
  - Calls the proxy endpoint (same-origin)
  - Shows loading state, renders results, shows errors

## Example environment variables
Replace values as needed.
- PORT=3000
- PROXY_ALLOW_ORIGINS=http://localhost:5500 (or `*` during dev only)
- EXTERNAL_API_BASE=https://api.example.com
- EXTERNAL_API_KEY=your_api_key_here
- CACHE_TTL_SECONDS=60
- RATE_LIMIT_REQUESTS=60
- RATE_LIMIT_WINDOW_SECONDS=60

## Example usage (curl)
Fetch an external resource via the proxy:
curl "http://localhost:3000/api/proxy?path=/resources/123&query=topic:math"

Example fetch from browser:
fetch('/api/proxy?path=/resources&topic=math')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

## Minimal example of the included HTML (what the file does)
The repository contains a minimal `index.html` to demonstrate calling the proxy. It includes:
- A simple form:
  - input#resourcePath — enter a path like `/resources?topic=physics`
  - button#fetchBtn — triggers the request
- UI elements:
  - div#loading — shown while the fetch is in progress
  - pre#result — pretty-prints JSON response
  - div#error — shows any error messages
- Basic JS:
  - reads the value from #resourcePath
  - performs fetch('/api/proxy?path=' + encodeURIComponent(path))
  - toggles #loading visibility, writes JSON into #result, or shows #error

HTML skeleton example you can paste into a static file:
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Educational Resource Proxy Demo</title>
  <style>
    body { font-family: system-ui, Arial; padding: 1rem; }
    #loading { display: none; color: #666; }
    pre { background:#f6f8fa; padding:1rem; border-radius:6px; overflow:auto; }
    #error { color:#b00020; }
  </style>
</head>
<body>
  <h1>Resource Proxy Demo</h1>
  <label>
    Path (relative to external API):
    <input id="resourcePath" value="/resources?topic=math" style="width:60%" />
  </label>
  <button id="fetchBtn">Fetch via Proxy</button>
  <div id="loading">Loading…</div>
  <div id="error"></div>
  <pre id="result"></pre>

  <script>
    const btn = document.getElementById('fetchBtn');
    const input = document.getElementById('resourcePath');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');

    btn.addEventListener('click', async () => {
      error.textContent = '';
      result.textContent = '';
      loading.style.display = 'block';
      try {
        const path = encodeURIComponent(input.value);
        const res = await fetch('/api/proxy?path=' + path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        result.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        error.textContent = err.message;
      } finally {
        loading.style.display = 'none';
      }
    });
  </script>
</body>
</html>
```

## Development & run (typical)
1. npm install
2. Create a .env from the variables above
3. npm start (or node server.js)
4. Open the HTML demo or point your frontend to the server

## Notes for contributors
- Keep the proxy whitelist-restricted: map incoming friendly routes to a configured set of allowed external endpoints.
- Add tests around request validation and cache behavior.
- Use environment-specific configurations (dev vs prod).
