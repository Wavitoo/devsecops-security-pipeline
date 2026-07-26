const test = require('node:test');
const assert = require('node:assert');
const { add } = require('../index.js');

test('add() should sum two numbers correctly', () => {
  assert.strictEqual(add(2, 3), 5);
});
