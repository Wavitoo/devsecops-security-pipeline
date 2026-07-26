require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express(); // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage -- JWT auth via Authorization header (Bearer token), not cookies, so classic cookie-based CSRF does not apply here
const PORT = process.env.PORT || 3000;

// helmet applique un ensemble de headers de sécurité HTTP recommandés :
// - désactive X-Powered-By (masque la stack technique)
// - définit une Content-Security-Policy stricte par défaut
// - configure Permissions-Policy, X-Content-Type-Options, etc.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use((req, res, next) => {
  res.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

app.use(express.json());

// Cache-Control: no-store sur toutes les routes API — les réponses (tokens, données
// utilisateur) ne doivent jamais être mises en cache par un intermédiaire
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

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
