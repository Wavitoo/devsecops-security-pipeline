const express = require('express');
const pool = require('../db/pool');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken); // toutes les routes ci-dessous nécessitent un JWT valide

// GET /tasks - retourne uniquement les tâches de l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, completed, created_at FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks - crée une tâche pour l'utilisateur connecté
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title) VALUES ($1, $2) RETURNING id, title, completed, created_at',
      [req.user.userId, title]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /tasks/:id - supprime une tâche, uniquement si elle appartient à l'utilisateur connecté
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
