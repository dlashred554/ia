// Proveedor de prueba: NO usa IA ni cuesta nada. Genera clips de test con ffmpeg
// para comprobar todo el flujo (escenas, unión, descarga).
const { run } = require('../lib/ffmpeg');

module.exports = {
  name: 'mock',
  requiresApiKey: false,
  envVar: null,
  clipSeconds: +process.env.CLIP_SECONDS || 6,
  notice: 'Modo demostración: los clips son patrones de prueba, no vídeo generado por IA. Configura un proveedor real para generar vídeo con IA.',
  isConfigured: () => true,
  async generateClip({ seconds, outPath }) {
    await run(['-f', 'lavfi', '-i', `testsrc2=size=540x960:rate=30:duration=${Math.max(1, Math.ceil(seconds))}`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', outPath]);
  },
};
