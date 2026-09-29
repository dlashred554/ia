const mock = require('./mock');
const local = require('./local');

function getProvider() {
  const name = (process.env.VIDEO_PROVIDER || 'local').toLowerCase();
  if (name === 'mock') return mock;
  if (name === 'local') return local;
  throw new Error(`Proveedor desconocido: ${name}. Usa VIDEO_PROVIDER=local o mock.`);
}

module.exports = { getProvider };