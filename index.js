// Para añadir un proveedor: crea providers/<nombre>.js con la misma interfaz y regístralo aquí.
const providers = {
  mock: require('./mock'),
  replicate: require('./replicate'),
};

function getProvider() {
  const name = (process.env.VIDEO_PROVIDER || 'mock').toLowerCase();
  if (!providers[name]) {
    throw new Error(`VIDEO_PROVIDER="${name}" no existe. Opciones: ${Object.keys(providers).join(', ')}`);
  }
  return providers[name];
}

module.exports = { getProvider };
