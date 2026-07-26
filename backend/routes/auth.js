const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();
const SALT_ROUNDS = 12;

// POST /register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Requête paramétrée : les valeurs ($1, $2) sont passées séparément,
    // jamais concaténées dans la string SQL -> protège contre l'injection SQL
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      // Violation de la contrainte UNIQUE définie au niveau DB
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    // Message d'erreur volontairement générique (pas "user not found" vs "wrong password")
    // pour ne pas révéler à un attaquant si un username existe ou non
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// ⚠️ VULNERABLE ROUTE - Intentional SQL Injection for SAST demonstration
// DO NOT merge this into develop/main - security/sql-injection-demo branch only
router.get('/search', async (req, res) => {
  const { username } = req.query;

  try {
    // VULNERABLE: string concatenation instead of parameterized query
    const query = `SELECT id, username FROM users WHERE username = '${username}'`;
    const result = await pool.query(query);

    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
