// Educational Web Access Service - Advanced Stealth Version
// Uses multiple techniques to bypass filtering

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// FIXED: Trust proxy setting for Render deployment
app.set('trust proxy', true);

// Enable compression
app.use(compression());

// Enable CORS with specific headers to avoid detection
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('X-Powered-By', 'Educational-Platform/2.0');
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/resource', limiter);

// Cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
}, 10 * 60 * 1000);

let activeConnections = 0;
let totalRequests = 0;

// Educational homepage
app.get('/', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Educational Resource Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            color: #212529;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; }
        .container {
            max-width: 1000px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #1e3a8a;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }
        .stat {
            background: #f1f5f9;
            padding: 1.5rem;
            border-radius: 6px;
            text-align: center;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #3b82f6;
            display: block;
        }
        .stat-label {
            color: #64748b;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 0.75rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .feature-list li:last-child { border-bottom: none; }
        .feature-list li:before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
            margin-right: 0.5rem;
        }
        .footer {
            text-align: center;
            padding: 2rem;
            color: #64748b;
            font-size: 0.875rem;
        }
        .status-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Educational Resource Platform</h1>
        <p>Secure Academic Content Delivery System</p>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>System Status <span class="status-badge">Operational</span></h2>
            <div class="stats">
                <div class="stat">
                    <span class="stat-value">${activeConnections}</span>
                    <span class="stat-label">Active Sessions</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${totalRequests}</span>
                    <span class="stat-label">Resources Delivered</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${cache.size}</span>
                    <span class="stat-label">Cached Resources</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${hours}h ${minutes}m</span>
                    <span class="stat-label">Uptime</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Platform Features</h2>
            <ul class="feature-list">
                <li>Content Delivery Optimization</li>
                <li>Multi-User Access Management</li>
                <li>Bandwidth Optimization</li>
                <li>Automatic Resource Caching</li>
                <li>Usage Analytics & Monitoring</li>
                <li>Fair Access Rate Limiting</li>
            </ul>
        </div>

        <div class="card">
            <h2>Technical Specifications</h2>
            <ul class="feature-list">
                <li>Capacity: 30+ concurrent users</li>
                <li>Cache Duration: 5 minutes</li>
                <li>Compression: Enabled</li>
                <li>Rate Limit: 100 requests per 15 minutes</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>Educational Resource Platform • Academic Use Only</p>
        <p>All usage monitored for quality assurance</p>
    </div>
</body>
</html>`);
});

// Helper function to rewrite URLs in HTML content
function rewriteUrls(html, targetOrigin, proxyUrl) {
    try {
        const base = new URL(targetOrigin);
        
        // Rewrite absolute URLs
        html = html.replace(
            /(href|src|action|data)=["']https?:\/\/[^"']+["']/gi,
            (match, attr) => {
                const urlMatch = match.match(/["'](https?:\/\/[^"']+)["']/);
                if (urlMatch && urlMatch[1]) {
                    return `${attr}="${proxyUrl}?url=${encodeURIComponent(urlMatch[1])}"`;
                }
                return match;
            }
        );
        
        // Rewrite protocol-relative URLs (//example.com/path)
        html = html.replace(
            /(href|src|action|data)=["']\/\/[^"']+["']/gi,
            (match, attr) => {
                const urlMatch = match.match(/["'](\/\/[^"']+)["']/);
                if (urlMatch && urlMatch[1]) {
                    const fullUrl = 'https:' + urlMatch[1];
                    return `${attr}="${proxyUrl}?url=${encodeURIComponent(fullUrl)}"`;
                }
                return match;
            }
        );
        
        // Rewrite root-relative URLs (/path)
        html = html.replace(
            /(href|src|action|data)=["']\/[^/"'][^"']*["']/gi,
            (match, attr) => {
                const urlMatch = match.match(/["'](\/[^"']+)["']/);
                if (urlMatch && urlMatch[1]) {
                    const fullUrl = base.origin + urlMatch[1];
                    return `${attr}="${proxyUrl}?url=${encodeURIComponent(fullUrl)}"`;
                }
                return match;
            }
        );
        
        // Rewrite relative URLs (path/to/resource)
        html = html.replace(
            /(href|src|action|data)=["'](?!https?:\/\/|\/\/|\/|#|data:|javascript:)[^"']+["']/gi,
            (match, attr) => {
                const urlMatch = match.match(/["']([^"']+)["']/);
                if (urlMatch && urlMatch[1]) {
                    const fullUrl = new URL(urlMatch[1], targetOrigin).href;
                    return `${attr}="${proxyUrl}?url=${encodeURIComponent(fullUrl)}"`;
                }
                return match;
            }
        );
        
        // Add base tag to help with remaining relative URLs
        if (!html.includes('<base ')) {
            html = html.replace(
                /<head[^>]*>/i,
                `$&\n<base href="${proxyUrl}?url=${encodeURIComponent(targetOrigin)}/">`
            );
        }
        
        return html;
    } catch (error) {
        console.error('URL rewrite error:', error);
        return html;
    }
}

// STEALTH PROXY ENDPOINT
app.get('/api/resource', async (req, res) => {
    const targetUrl = req.query.url || req.query.src || req.query.link;
    
    if (!targetUrl) {
        return res.status(400).json({
            error: 'Missing parameter',
            message: 'Required parameter: url, src, or link'
        });
    }

    activeConnections++;
    totalRequests++;

    try {
        const url = new URL(targetUrl);
        
        // Check cache
        const cacheKey = targetUrl;
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            console.log(`[CACHE] ${targetUrl}`);
            res.set('X-Cache-Status', 'HIT');
            res.set('Content-Type', cached.contentType);
            res.set('Access-Control-Allow-Origin', '*');
            activeConnections--;
            return res.send(cached.body);
        }
        
        console.log(`[FETCH] ${targetUrl} | Active: ${activeConnections}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Upgrade-Insecure-Requests': '1',
                'Connection': 'keep-alive'
            }
        });

        clearTimeout(timeout);

        const contentType = response.headers.get('content-type') || 'text/html';
        let body = await response.text();
        
        // FIXED: Rewrite URLs in HTML content so internal links work through proxy
        if (contentType.includes('text/html')) {
            const proxyUrl = `${req.protocol}://${req.get('host')}/api/resource`;
            body = rewriteUrls(body, targetUrl, proxyUrl);
            
            // Inject JavaScript to handle client-side navigation
            const injectedScript = `
            <script>
            (function() {
                // Store the original site info
                window.__PROXY_ORIGIN__ = '${new URL(targetUrl).origin}';
                window.__PROXY_URL__ = '${req.protocol}://${req.get('host')}/api/resource';
                
                // Intercept window.location changes
                const originalLocation = window.location;
                let currentHref = window.location.href;
                
                // Override window.location.href setter
                Object.defineProperty(window.location, 'href', {
                    get: function() { return currentHref; },
                    set: function(url) {
                        if (url.startsWith('/')) {
                            // Relative URL - redirect through proxy
                            currentHref = window.__PROXY_URL__ + '?url=' + encodeURIComponent(window.__PROXY_ORIGIN__ + url);
                            originalLocation.href = currentHref;
                        } else if (url.startsWith('http')) {
                            // Absolute URL - redirect through proxy
                            currentHref = window.__PROXY_URL__ + '?url=' + encodeURIComponent(url);
                            originalLocation.href = currentHref;
                        } else {
                            currentHref = url;
                            originalLocation.href = url;
                        }
                    }
                });
                
                // Intercept pushState and replaceState
                const pushState = history.pushState;
                const replaceState = history.replaceState;
                
                history.pushState = function(state, title, url) {
                    if (url && url.startsWith('/')) {
                        url = window.__PROXY_URL__ + '?url=' + encodeURIComponent(window.__PROXY_ORIGIN__ + url);
                    }
                    return pushState.call(history, state, title, url);
                };
                
                history.replaceState = function(state, title, url) {
                    if (url && url.startsWith('/')) {
                        url = window.__PROXY_URL__ + '?url=' + encodeURIComponent(window.__PROXY_ORIGIN__ + url);
                    }
                    return replaceState.call(history, state, title, url);
                };
            })();
            </script>
            `;
            
            body = body.replace('</head>', injectedScript + '</head>');
        }
        
        // Cache successful responses
        if (response.ok && body.length < 1024 * 1024) {
            cache.set(cacheKey, {
                body,
                contentType,
                timestamp: Date.now()
            });
        }
        
        res.set('Content-Type', contentType);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('X-Cache-Status', 'MISS');
        res.set('X-Content-Source', 'Academic-Repository');
        
        res.send(body);
        
    } catch (error) {
        console.error(`[ERROR] ${targetUrl} - ${error.message}`);
        
        if (error.name === 'AbortError') {
            res.status(504).json({ error: 'Timeout', message: 'Resource unavailable' });
        } else {
            res.status(500).json({ error: 'Fetch failed', message: error.message });
        }
    } finally {
        activeConnections--;
    }
});

// Backwards compatibility endpoint
app.get('/proxy', async (req, res) => {
    req.url = '/api/resource' + (req.url.includes('?') ? '&' : '?') + 'url=' + (req.query.url || '');
    app.handle(req, res);
});

// FIXED: Catch-all route handler for paths that should go through proxy
// This handles routes like /login, /register, etc. when accessed directly
app.get('*', (req, res) => {
    // If it's not the homepage and doesn't start with /api/, redirect through proxy
    if (req.path !== '/' && !req.path.startsWith('/api/')) {
        // Get the referer to figure out what site they were browsing
        const referer = req.get('referer');
        
        if (referer && referer.includes('/api/resource?url=')) {
            // Extract the original site URL from the referer
            const urlMatch = referer.match(/[?&]url=([^&]+)/);
            if (urlMatch) {
                try {
                    const originalSite = decodeURIComponent(urlMatch[1]);
                    const siteOrigin = new URL(originalSite).origin;
                    // Redirect to the path on the original site through the proxy
                    const targetUrl = siteOrigin + req.path + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
                    return res.redirect(`/api/resource?url=${encodeURIComponent(targetUrl)}`);
                } catch (e) {
                    console.error('Failed to parse referer:', e);
                }
            }
        }
        
        // If we can't determine the original site, return an error with helpful message
        return res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Navigation Error</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                    .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
                    .home-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h2>⚠️ Navigation Error</h2>
                    <p>You tried to access: <code>${req.path}</code></p>
                    <p>This path must be accessed through the proxy. Please navigate to the website using the proxy first:</p>
                    <p><strong>Format:</strong> <code>/api/resource?url=https://example.com</code></p>
                </div>
                <a href="/" class="home-link">← Back to Home</a>
            </body>
            </html>
        `);
    }
    
    // For homepage, continue normally
    next();
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});

// Start
app.listen(PORT, () => {
    console.log(`📚 Educational Resource Platform`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`✅ Ready to serve resources`);
});
