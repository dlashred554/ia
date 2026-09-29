const { spawn } = require('child_process');
const fs = require('fs');
const ffmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static');

function run(args, allowFail = false) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, ['-y', '-loglevel', allowFail ? 'info' : 'error', ...args]);
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 || allowFail ? resolve(err) : reject(new Error('ffmpeg: ' + err.slice(-400)))));
  });
}

// Recorta/escala a 1080x1920 (9:16), 30 fps, sin audio, para que todos los clips sean concatenables
function normalize(input, output, seconds) {
  return run(['-i', input, '-t', String(seconds),
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1',
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', output]);
}

async function concat(files, output, listPath) {
  fs.writeFileSync(listPath, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
  await run(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', '-movflags', '+faststart', output]);
}

async function duration(file) {
  const out = await run(['-i', file], true);
  const m = /Duration:\s*(\d+):(\d+):(\d+\.?\d*)/.exec(out);
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : null;
}

module.exports = { run, normalize, concat, duration };
