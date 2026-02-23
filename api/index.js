import express from 'express';
import cors from 'cors';

// Import route handlers
import loginHandler from './_routes/auth/login.js';
import registerHandler from './_routes/auth/register.js';
import carsIndexHandler from './_routes/cars/index.js';
import carsIdHandler from './_routes/cars/[id].js';
import customersIndexHandler from './_routes/customers/index.js';
import customersIdHandler from './_routes/customers/[id].js';
import bookingsIndexHandler from './_routes/bookings/index.js';
import bookingsIdHandler from './_routes/bookings/[id].js';
import paymentsIndexHandler from './_routes/payments/index.js';
import paymentsOutstandingHandler from './_routes/payments/outstanding.js';
import paymentsIdHandler from './_routes/payments/[id].js';
import dashboardHandler from './_routes/dashboard.js';
import locationsHandler from './_routes/locations.js';
import settingsHandler from './_routes/settings.js';
import usersHandler from './_routes/users.js';

const app = express();
app.use(cors());

// Parse JSON body, but first verify if it's not already parsed by Vercel
app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        return next();
    }
    express.json()(req, res, next);
});

// Helper to convert Vercel-style handler to Express route
function wrapHandler(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            console.error('API Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message || 'Internal server error' });
            }
        }
    };
}

// Routes - Map Express params to Vercel query style
function dynamicRoute(handler) {
    return (req, res, next) => {
        req.query = { ...req.query, id: req.params.id };
        return wrapHandler(handler)(req, res, next);
    };
}

app.all('/api/auth/login', wrapHandler(loginHandler));
app.all('/api/auth/register', wrapHandler(registerHandler));

app.all('/api/cars', wrapHandler(carsIndexHandler));
app.all('/api/cars/:id', dynamicRoute(carsIdHandler));

app.all('/api/customers', wrapHandler(customersIndexHandler));
app.all('/api/customers/:id', dynamicRoute(customersIdHandler));

app.all('/api/bookings', wrapHandler(bookingsIndexHandler));
app.all('/api/bookings/:id', dynamicRoute(bookingsIdHandler));

app.all('/api/payments', wrapHandler(paymentsIndexHandler));
app.all('/api/payments/outstanding', wrapHandler(paymentsOutstandingHandler));
app.all('/api/payments/:id', dynamicRoute(paymentsIdHandler));

app.all('/api/dashboard', wrapHandler(dashboardHandler));
app.all('/api/locations', wrapHandler(locationsHandler));
app.all('/api/settings', wrapHandler(settingsHandler));
app.all('/api/users', wrapHandler(usersHandler));

// Default 404
app.use((req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

export default app;
