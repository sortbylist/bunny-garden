import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { englishAudioClips } from '../src/english-topics.js';

const source = process.argv[2] || fileURLToPath(new URL('../../WordAudio/Scripts/Audio.py', import.meta.url));
const output = fileURLToPath(new URL('../public/audio/english/', import.meta.url));
const runner = fileURLToPath(new URL('./run-wordaudio.py', import.meta.url));
const result = spawnSync(process.env.PYTHON || 'python', [runner, source, output], {
  input: JSON.stringify(englishAudioClips), encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
