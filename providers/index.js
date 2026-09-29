const mock = require('./mock');
const replicate = require('./replicate');

function getProvider() {
  const name = (process.env.VIDEO_PROVIDER || 'replicate').toLowerCase();
  if (name === 'mock') return mock;
  if (name === 'replicate') return replicate;
  throw new Error(`Proveedor desconocido: ${name}. Usa VIDEO_PROVIDER=replicate o mock.`);
}

module.exports = { getProvider };
