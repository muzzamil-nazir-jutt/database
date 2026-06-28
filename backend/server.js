// server.js
// Entry point for the Power Plant Equipment Tracking API.
// Boots Express, initializes the DB schema, mounts routes, then starts listening.

const express             = require('express');
const cors                = require('cors');
const { db, initializeSchema } = require('./config/database');
const equipmentRoutes     = require('./routes/equipmentRoutes');

// ─── App Initialization ──────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /^http:\/\/192\.168\./,
    /^http:\/\/10\./,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Lightweight request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status:    'online',
      timestamp: new Date().toISOString(),
      service:   'Power Plant Equipment Tracker API',
      version:   '1.0.0',
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', equipmentRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err.stack);
  res.status(500).json({ success: false, error: 'Unexpected internal server error.' });
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// Initialize DB schema first, then start accepting traffic.
(async () => {
  try {
    await initializeSchema();

    app.listen(PORT, () => {
      console.log('');
      console.log('  ┌─────────────────────────────────────────────────┐');
      console.log('  │   Power Plant Equipment Tracker API              │');
      console.log(`  │   Running on http://localhost:${PORT}               │`);
      console.log('  │                                                  │');
      console.log('  │   POST   /api/add-equipment                      │');
      console.log('  │   GET    /api/all-equipment                      │');
      console.log('  │   GET    /api/equipment/:asset_number            │');
      console.log('  │   PUT    /api/equipment/:asset_number            │');
      console.log('  │   DELETE /api/equipment/:asset_number            │');
      console.log('  │   GET    /api/download-qrs  ← PDF Label Sheet   │');
      console.log('  │   GET    /api/health                             │');
      console.log('  └─────────────────────────────────────────────────┘');
      console.log('');
    });
  } catch (err) {
    console.error('[FATAL] Failed to initialize database schema:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
