import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

test('WordAudio 生成固定英音参数、复用带指纹缓存，离线缺失或文本变更不冒充就绪', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bunny-gtts-'));
  const execute = promisify(execFile);
  try {
    const upstream = join(directory, 'WordAudio');
    const workspace = join(directory, 'app');
    const output = join(upstream, 'Scripts/audio');
    await mkdir(output, { recursive: true });
    await mkdir(join(upstream, 'Audio'));
    await mkdir(workspace);
    await writeFile(join(upstream, 'Scripts/Audio.py'), `
class gTTS:
    def __init__(self, **options):
        assert options['lang'] == 'en'
        assert options['tld'] == 'co.uk'
        assert options['lang_check'] is False
        assert options['timeout'] == (5, 5)
    def save(self, path):
        with open(path, 'wb') as stream:
            stream.write(b'ID3' + bytes(1021))
`);
    const bytes = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(1021, 3)]);
    await writeFile(join(upstream, 'Audio/map.mp3'), bytes);
    await writeFile(join(upstream, 'Audio/map.json'), JSON.stringify({
      locale: 'en-GB', lang: 'en', tld: 'co.uk', text: 'map',
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }));
    await writeFile(join(upstream, 'Audio/cat.mp3'), bytes);
    const tasks = join(directory, 'tasks.json');
    const items = [{ id: 'word-map', kind: 'word', text: 'map' }, { id: 'word-cat', kind: 'word', text: 'cat' }, { id: 'story-1', kind: 'story', text: 'A cat. A map.' }];
    await writeFile(tasks, JSON.stringify({ locale: 'en-GB', items }));
    const argumentsList = [
      '-X', 'utf8', fileURLToPath(new URL('../scripts/generate-phonics-audio.py', import.meta.url)),
      `--wordaudio=${upstream}`, `--workspace=${workspace}`, `--output=${output}`, `--tasks=${tasks}`, '--retries=0', '--timeout=5',
    ];
    const python = process.platform === 'win32' ? 'python' : 'python3';
    const result = await execute(python, argumentsList);
    assert.ok(result.stdout.includes('"reused": 1'));
    assert.ok(result.stdout.includes('"generated": 2'));
    const manifestPath = join(workspace, 'public/audio/phonics/manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    assert.equal(Object.keys(manifest.files).length, 3);
    assert.equal(manifest.files['word-cat'].tld, 'co.uk');
    assert.equal(manifest.files['story-1'].text, 'A cat. A map.');
    assert.equal(manifest.files['word-cat'].reviewedBy, undefined);
    assert.deepEqual(await readFile(join(workspace, 'public/audio/phonics/word-map.mp3')), bytes);
    await execute(python, [...argumentsList, '--offline']);
    await writeFile(tasks, JSON.stringify({ locale: 'en-GB', items: [{ ...items[2], text: 'A different story.' }] }));
    await assert.rejects(execute(python, [...argumentsList, '--offline']), error => error.code === 1);
    const changed = JSON.parse(await readFile(manifestPath, 'utf8'));
    assert.equal(changed.files['story-1'], undefined);
    assert.ok(changed.files['word-map']);
    assert.equal((await readFile(join(workspace, 'artifacts/phonics-gtts/failed-texts.txt'), 'utf8')).trim(), 'A different story.');
  } finally {
    const target = resolve(directory);
    const within = relative(resolve(tmpdir()), target);
    assert.ok(within.startsWith('bunny-gtts-') && !within.includes('..') && !isAbsolute(within));
    await rm(target, { recursive: true, force: true });
  }
});
