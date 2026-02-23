import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper: Convert Vercel-style handler to Express route
function wrapHandler(handler) {
    return async (req, res) => {
        // Map Express query params from Vercel style
        try {
            await handler(req, res);
        } catch (err) {
            console.error('API Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            }
        }
    };
}

// Dynamically load API routes
async function loadRoutes() {
    // Simple routes (no dynamic params)
    const simpleRoutes = [
        { path: '/api/auth/login', file: './api/_routes/auth/login.js' },
        { path: '/api/auth/register', file: './api/_routes/auth/register.js' },
        { path: '/api/cars', file: './api/_routes/cars/index.js' },
        { path: '/api/customers', file: './api/_routes/customers/index.js' },
        { path: '/api/bookings', file: './api/_routes/bookings/index.js' },
        { path: '/api/payments', file: './api/_routes/payments/index.js' },
        { path: '/api/dashboard', file: './api/_routes/dashboard.js' },
        { path: '/api/locations', file: './api/_routes/locations.js' },
        { path: '/api/settings', file: './api/_routes/settings.js' },
        { path: '/api/users', file: './api/_routes/users.js' },
    ];

    for (const route of simpleRoutes) {
        if (fs.existsSync(join(__dirname, route.file))) {
            const mod = await import(route.file);
            app.all(route.path, wrapHandler(mod.default));
            console.log(`  ✓ ${route.path}`);
        }
    }

    // Dynamic [id] routes
    const dynamicRoutes = [
        { path: '/api/cars/:id', file: './api/_routes/cars/[id].js' },
        { path: '/api/customers/:id', file: './api/_routes/customers/[id].js' },
        { path: '/api/bookings/:id', file: './api/_routes/bookings/[id].js' },
        { path: '/api/payments/:id', file: './api/_routes/payments/[id].js' },
    ];

    for (const route of dynamicRoutes) {
        if (fs.existsSync(join(__dirname, route.file))) {
            const mod = await import(route.file);
            app.all(route.path, (req, res, next) => {
                // Map Express :id param to Vercel query style
                req.query = { ...req.query, id: req.params.id };
                return wrapHandler(mod.default)(req, res, next);
            });
            console.log(`  ✓ ${route.path}`);
        }
    }
}

console.log('\n🚀 Loading API routes...');
await loadRoutes();

app.listen(PORT, () => {
    console.log(`\n✅ API server running at http://localhost:${PORT}`);
    console.log(`   Frontend dev server (Vite) should be at http://localhost:5173\n`);
});
