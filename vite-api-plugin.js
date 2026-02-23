/**
 * Vite plugin that serves Vercel-style API routes directly in the dev server.
 * No separate Express backend needed — just `npm run dev`.
 */
import { join } from 'path';
import fs from 'fs';

const simpleRoutes = [
    { path: '/api/auth/login', file: 'api/auth/login.js' },
    { path: '/api/auth/register', file: 'api/auth/register.js' },
    { path: '/api/cars', file: 'api/cars/index.js' },
    { path: '/api/customers', file: 'api/customers/index.js' },
    { path: '/api/bookings', file: 'api/bookings/index.js' },
    { path: '/api/payments', file: 'api/payments/index.js' },
    { path: '/api/dashboard', file: 'api/dashboard.js' },
    { path: '/api/locations', file: 'api/locations.js' },
    { path: '/api/settings', file: 'api/settings.js' },
    { path: '/api/users', file: 'api/users.js' },
];

const dynamicRoutes = [
    { pattern: /^\/api\/cars\/([^/]+)$/, file: 'api/cars/[id].js', param: 'id' },
    { pattern: /^\/api\/customers\/([^/]+)$/, file: 'api/customers/[id].js', param: 'id' },
    { pattern: /^\/api\/bookings\/([^/]+)$/, file: 'api/bookings/[id].js', param: 'id' },
    { pattern: /^\/api\/payments\/([^/]+)$/, file: 'api/payments/[id].js', param: 'id' },
];

function parseBody(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(data)); } catch { resolve({}); }
        });
    });
}

function createRes(nodeRes) {
    let sent = false;
    return {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) {
            if (sent) return;
            sent = true;
            const body = JSON.stringify(data);
            nodeRes.writeHead(this.statusCode, { 'content-type': 'application/json' });
            nodeRes.end(body);
        },
        send(data) { this.json(data); },
        end(data) {
            if (sent) return;
            sent = true;
            nodeRes.writeHead(this.statusCode);
            nodeRes.end(data);
        },
        get headersSent() { return sent; },
    };
}

export default function viteApiPlugin() {
    let rootDir;
    // Load dotenv at import time
    import('dotenv/config').catch(() => { });

    return {
        name: 'vite-api-routes',
        configResolved(config) {
            rootDir = config.root;
        },
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url?.split('?')[0];
                if (!url?.startsWith('/api/')) return next();

                // Parse body
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                    req.body = await parseBody(req);
                } else {
                    req.body = {};
                }

                // Parse query params
                const urlObj = new URL(req.url, 'http://localhost');
                req.query = Object.fromEntries(urlObj.searchParams);

                // Match route
                let handlerFile = null;

                // Simple routes
                for (const route of simpleRoutes) {
                    if (url === route.path) {
                        handlerFile = route.file;
                        break;
                    }
                }

                // Dynamic routes
                if (!handlerFile) {
                    for (const route of dynamicRoutes) {
                        const match = url.match(route.pattern);
                        if (match) {
                            handlerFile = route.file;
                            req.query[route.param] = match[1];
                            break;
                        }
                    }
                }

                if (!handlerFile) return next();

                const fullPath = join(rootDir, handlerFile);
                if (!fs.existsSync(fullPath)) return next();

                try {
                    // Cache-bust for hot reload: append mtime to import URL
                    const stat = fs.statSync(fullPath);
                    const mod = await import(`file://${fullPath}?t=${stat.mtimeMs}`);
                    const handler = mod.default;
                    const apiRes = createRes(res);
                    await handler(req, apiRes);
                } catch (err) {
                    console.error(`\n❌ API Error [${url}]:`, err.message || err);
                    if (!res.headersSent) {
                        res.writeHead(500, { 'content-type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
                    }
                }
            });
        },
    };
}
