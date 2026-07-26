require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express(); // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage -- JWT auth via Authorization header (Bearer token), not cookies, so classic cookie-based CSRF does not apply here
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TaskVault backend running on port ${PORT}`);
  });
}

module.exports = app;

// ⚠️ INTENTIONAL SECRET LEAK - Demo only, this is a FAKE key
// DO NOT merge - security/secret-leak-demo branch only
const INTERNAL_SERVICE_TOKEN = "a8f5f167f44f4964e6c998dee827110c1a2b3c4d5e6f7890abcdef123456789";
