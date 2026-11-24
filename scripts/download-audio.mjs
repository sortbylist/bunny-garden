import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { basics, vocabulary, spellingRules, blends, confusionSets, toneExamples, tonePracticeSounds } from '../src/data.js';

const root = new URL('../public/audio/', import.meta.url);
await mkdir(root, { recursive: true });
const syllables = new Set([
  ...basics.map(item => item.sound),
  ...vocabulary.flatMap(item => item.sounds).filter(sound => !sound.endsWith('5')),
  ...spellingRules.map(rule => rule.sound).filter(Boolean),
  ...blends.map(item => item.sound),
  ...Object.values(confusionSets).flatMap(set => set.pairs.flat()),
  ...toneExamples.flatMap(group => group.items.map(item => item.sound)),
  ...tonePracticeSounds,
]);
const overrides = JSON.parse(await readFile(new URL('overrides.json', root), 'utf8'));
for (const folder of ['huihui', 'huihui-pinyin']) {
  const huihui = JSON.parse(await readFile(new URL(`${folder}/manifest.json`, root), 'utf8'));
  for (const { text, path, sha256, keys = [`word:${text}`] } of Object.values(huihui.files)) {
    for (const key of keys) {
      overrides[key] = {
        file: path.slice('/audio/'.length), localOnly: true, project: huihui.provider,
        speaker: huihui.voice, synthetic: true, text, sha256,
      };
    }
  }
}
const tasks = [
  ...[...syllables].map(sound => ({ key: `syllable:${sound}`, file: `${sound}.mp3`, source: `64k/syllabs/cmn-${sound}.mp3` })),
  ...vocabulary.filter(item => item.sounds.length > 1).map(item => ({ key: `word:${item.text}`, file: `word-${item.text}.mp3`, source: `64k/hsk/cmn-${item.text}.mp3` })),
].map(task => ({ ...task, ...overrides[task.key] }));
const standardKeys = new Set(tasks.map(task => task.key));
for (const [key, override] of Object.entries(overrides)) {
  if (!standardKeys.has(key)) tasks.push({ key, ...override });
}
let previous = { files: {} };
try { previous = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8')); } catch {}
const files = { ...previous.files };
for (const key of Object.keys(previous.overrides || {})) {
  if (!standardKeys.has(key) && !Object.hasOwn(overrides, key)) delete files[key];
}
const manifest = {
  source: 'https://github.com/hugolpz/audio-cmn',
  authors: { syllables: 'Chen Wang', words: 'Yue Tan', curation: 'Hugo Lopez, Nicolas Vion' },
  license: 'CC BY-SA (upstream README does not specify a version)',
  review: 'Pending educational listening reviews are tracked by item.',
  overrides,
  files, missing: [],
};
let cursor = 0;
let completed = 0;
const sameDigest = (bytes, sha256) => createHash('sha256').update(bytes).digest('hex') === sha256;
async function worker() {
  while (cursor < tasks.length) {
    const task = tasks[cursor++];
    const destination = new URL(task.file.split('/').map(encodeURIComponent).join('/'), root);
    try {
      if ((await stat(destination)).size > 500 && (!task.sha256 || sameDigest(await readFile(destination), task.sha256))) {
        manifest.files[task.key] = `/audio/${task.file}`;
        completed++;
        continue;
      }
    } catch {}
    if (task.localOnly) {
      delete manifest.files[task.key];
      manifest.missing.push(task.key);
      completed++;
      continue;
    }
    let downloaded = false;
    for (let attempt = 0; attempt < 3 && !downloaded; attempt++) {
      try {
        const response = await fetch(task.url || `https://raw.githubusercontent.com/hugolpz/audio-cmn/master/${task.source.split('/').map(encodeURIComponent).join('/')}`, { signal: AbortSignal.timeout(18000) });
        if (response.status === 404) break;
        if (!response.ok) continue;
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length < 500 || !response.headers.get('content-type')?.includes('audio') ||
          (task.sha256 && !sameDigest(bytes, task.sha256))) continue;
        await mkdir(new URL('.', destination), { recursive: true });
        await writeFile(destination, bytes);
        manifest.files[task.key] = `/audio/${task.file}`;
        downloaded = true;
      } catch {}
    }
    if (!downloaded) {
      delete manifest.files[task.key];
      manifest.missing.push(task.key);
    }
    completed++;
    if (completed % 40 === 0) console.log(`Audio resources: ${completed}/${tasks.length}`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
await writeFile(new URL('manifest.json', root), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Available: ${Object.keys(manifest.files).length}. Missing: ${manifest.missing.length}.`);
if (manifest.missing.length) console.log(manifest.missing.join(', '));
