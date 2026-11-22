import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { phonicsLessons, phonicsWords, phonicsStories } from '../src/phonics-data.js';

const workspace = fileURLToPath(new URL('../', import.meta.url));
const argumentsList = process.argv.slice(2);
const option = (name, fallback) => argumentsList.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const supported = ['wordaudio', 'output', 'python', 'limit', 'retries', 'timeout', 'workers', 'offline', 'help'];
for (const argument of argumentsList) {
  if (!supported.includes(argument.replace(/^--/, '').split('=')[0])) throw new Error(`Unknown option: ${argument}`);
}
if (argumentsList.includes('--help')) {
  console.log('npm run phonics:audio:generate -- [--wordaudio=../WordAudio] [--output=<MP3 cache>] [--python=python] [--limit=950] [--retries=2] [--timeout=20] [--workers=3] [--offline]');
  process.exit(0);
}
const wordAudio = resolve(option('wordaudio', resolve(workspace, '../WordAudio')));
const output = resolve(option('output', resolve(wordAudio, 'Scripts/audio')));
const examples = new Set(phonicsLessons.map(lesson => lesson.parts.join('').toLowerCase()));
const words = [...phonicsWords.filter(word => examples.has(word.text.toLowerCase())), ...phonicsWords.filter(word => !examples.has(word.text.toLowerCase()))];
const items = [
  ...words.map(word => ({ id: word.id, text: word.text, kind: 'word' })),
  ...phonicsStories.map(story => ({ id: story.id, text: story.text, kind: 'story' })),
];
const limit = Number(option('limit', items.length));
if (!Number.isInteger(limit) || limit < 1 || limit > items.length) throw new Error(`--limit must be from 1 to ${items.length}`);
const tasks = resolve(workspace, 'artifacts/phonics-gtts/tasks.json');
await mkdir(resolve(workspace, 'artifacts/phonics-gtts'), { recursive: true });
await writeFile(tasks, JSON.stringify({ locale: 'en-GB', items: items.slice(0, limit) }, null, 2));
console.log(`WordAudio: ${wordAudio}\nMP3 cache: ${output}\nPreparing ${limit} items with gTTS en / co.uk. Existing audio requires matching British generation metadata.`);
const child = spawn(option('python', process.platform === 'win32' ? 'python' : 'python3'), [
  '-X', 'utf8', resolve(workspace, 'scripts/generate-phonics-audio.py'),
  `--wordaudio=${wordAudio}`, `--output=${output}`, `--tasks=${tasks}`, `--workspace=${workspace}`,
  `--retries=${option('retries', '2')}`, `--timeout=${option('timeout', '20')}`,
  `--workers=${option('workers', '3')}`,
  ...(argumentsList.includes('--offline') ? ['--offline'] : []),
], { cwd: workspace, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(`Could not start Python: ${error.message}`); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
