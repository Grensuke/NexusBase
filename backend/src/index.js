require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRouter       = require('./routes/auth');
const usersRouter      = require('./routes/users');
const gigsRouter       = require('./routes/gigs');
const categoriesRouter = require('./routes/categories');
const ordersRouter     = require('./routes/orders');
const reviewsRouter    = require('./routes/reviews');
const dashboardRouter  = require('./routes/dashboard');
const assessmentsRouter = require('./routes/assessments');
const trustRouter       = require('./routes/trust');

const app  = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Routes ----
app.use('/api/auth',        authRouter);
app.use('/api/users',       usersRouter);
app.use('/api/gigs',        gigsRouter);
app.use('/api/categories',  categoriesRouter);
app.use('/api/orders',      ordersRouter);
app.use('/api/reviews',     reviewsRouter);
app.use('/api/dashboard',   dashboardRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/trust',       trustRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅  NexusBase API running on http://localhost:${PORT}`);
});

module.exports = app;
