const https = require('https');

/* ══════════════════════════════════════════════════════════
   OpenSky proxy — hardened with upstream reliability patterns
   - In-memory response cache (30s TTL, serves stale on failure)
   - Rate-limit guard (10s minimum between upstream requests)
   - Request timeout (8s)
   - Request deduplication (concurrent requests share one fetch)
   ══════════════════════════════════════════════════════════ */

const CACHE_TTL_MS = 30_000;           // 30s — OpenSky auth'd rate is ~10s
const STALE_SERVE_MS = 5 * 60_000;     // serve stale cache up to 5 min old
const MIN_REQUEST_INTERVAL_MS = 10_000; // don't hit upstream faster than 10s
const REQUEST_TIMEOUT_MS = 8_000;       // abort after 8s

let cache = { data: null, time: 0 };
let lastRequestTime = 0;
let inflightPromise = null;

function fetchUpstream(authString) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'opensky-network.org',
            path: '/api/states/all?lamin=12&lamax=35&lomin=34&lomax=60',
            method: 'GET',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Accept': 'application/json'
            },
            timeout: REQUEST_TIMEOUT_MS,
        };

        const proxyReq = https.request(options, (proxyRes) => {
            // Rate-limited by upstream
            if (proxyRes.statusCode === 429) {
                reject(new Error('RATE_LIMITED'));
                return;
            }
            if (proxyRes.statusCode === 401) {
                reject(new Error('AUTH_FAILED'));
                return;
            }

            let data = '';
            proxyRes.on('data', (chunk) => { data += chunk; });
            proxyRes.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (e) {
                    reject(new Error(`PARSE_ERROR: ${e.message}`));
                }
            });
        });

        proxyReq.on('timeout', () => {
            proxyReq.destroy();
            reject(new Error('TIMEOUT'));
        });

        proxyReq.on('error', (error) => {
            reject(new Error(`NETWORK: ${error.message}`));
        });

        proxyReq.end();
    });
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const username = process.env.OPENSKY_USERNAME;
    const password = process.env.OPENSKY_PASSWORD;

    if (!username || !password) {
        res.status(503).json({
            error: 'Missing OpenSky credentials',
            status: 'UNCONFIGURED',
            message: 'Set OPENSKY_USERNAME and OPENSKY_PASSWORD in the deployment environment.'
        });
        return;
    }

    const now = Date.now();

    // Serve from fresh cache
    if (cache.data && (now - cache.time) < CACHE_TTL_MS) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', String(now - cache.time));
        res.status(200).json(cache.data);
        return;
    }

    // Rate-limit guard: if we fetched recently, serve stale cache
    if ((now - lastRequestTime) < MIN_REQUEST_INTERVAL_MS && cache.data) {
        res.setHeader('X-Cache', 'RATE_GUARD');
        res.setHeader('X-Cache-Age', String(now - cache.time));
        res.status(200).json(cache.data);
        return;
    }

    // Deduplicate concurrent requests
    if (!inflightPromise) {
        const authString = Buffer.from(`${username}:${password}`).toString('base64');
        lastRequestTime = now;

        inflightPromise = fetchUpstream(authString)
            .then(data => {
                cache = { data, time: Date.now() };
                inflightPromise = null;
                return { ok: true, data };
            })
            .catch(err => {
                inflightPromise = null;
                return { ok: false, error: err.message };
            });
    }

    const result = await inflightPromise;

    if (result && result.ok) {
        res.setHeader('X-Cache', 'MISS');
        res.status(200).json(result.data);
        return;
    }

    // Upstream failed — serve stale cache if available
    if (cache.data && (now - cache.time) < STALE_SERVE_MS) {
        res.setHeader('X-Cache', 'STALE');
        res.setHeader('X-Cache-Age', String(now - cache.time));
        res.setHeader('X-Upstream-Error', result ? result.error : 'unknown');
        res.status(200).json(cache.data);
        return;
    }

    // No cache, upstream failed
    const errMsg = result ? result.error : 'unknown';
    const statusCode = errMsg.includes('AUTH_FAILED') ? 401
        : errMsg.includes('RATE_LIMITED') ? 429
        : 502;

    res.status(statusCode).json({
        error: 'Upstream unavailable',
        status: 'OFFLINE',
        detail: errMsg,
    });
};
