const test = require('node:test');
const assert = require('node:assert');
const app = require('../index.js');

test('app should export an Express application', () => {
  assert.strictEqual(typeof app, 'function');
  assert.strictEqual(typeof app.listen, 'function');
});

test('GET /health should return status ok', async () => {
  const server = app.listen(0); // port 0 = choisi automatiquement, évite les conflits de port
  const port = server.address().port;

  const response = await fetch(`http://localhost:${port}/health`);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.status, 'ok');

  server.close();
});
