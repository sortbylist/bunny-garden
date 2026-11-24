import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { poems, poetryTopic } from '../src/poetry-data.js';
import { createPoetryAudio } from '../src/poetry-audio.js';
import { rewardSections } from '../src/reward-curriculum.js';

test('每首古诗的本地录音与原文一致，WAV 完整且未被替换', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/audio/poetry/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.locale, 'zh-CN');
  assert.equal(manifest.synthetic, true);
  assert.deepEqual(Object.keys(manifest.files).sort(), poems.map(poem => poem.id).sort());
  for (const poem of poems) {
    const entry = manifest.files[poem.id];
    assert.equal(entry.status, 'ready');
    assert.equal(entry.path, `/audio/poetry/${poem.id}.wav`);
    assert.equal(entry.text, `${poem.title}。${poem.dynasty}，${poem.author}。${poem.lines.map(([line]) => line).join('')}`);
    const bytes = await readFile(new URL(`../public${entry.path}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
    assert.ok(bytes.length > 1000);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.ok(poetryTopic.lessons.some(lesson => lesson.poem?.audioId === poem.id));
  }
});

test('诗句修音指定多音字读法，合成文本保留原文', async () => {
  const { files } = JSON.parse(await readFile(new URL('../public/audio/poetry/manifest.json', import.meta.url), 'utf8'));
  const readings = {
    'little-pond': '<phoneme alphabet="sapi" ph="lu 4">露</phoneme>',
    'quiet-night': '疑是<break time="65ms"/><sub alias="帝">地</sub><break time="65ms"/>上霜',
    'village-spring': '<phoneme alphabet="sapi" ph="zhang 3">长</phoneme>',
    orioles: '<phoneme alphabet="sapi" ph="hang 2">行</phoneme>',
  };
  assert.deepEqual(Object.keys(files).filter(id => files[id].ssml).sort(), Object.keys(readings).sort());
  for (const [id, reading] of Object.entries(readings)) {
    const { ssml, text } = files[id];
    assert.ok(ssml.includes(reading));
    assert.equal(ssml.replace(/<[^>]+>/g, ''), text);
  }
});

test('新增诗文自动计入原有主题的小节学习与题目范围', () => {
  for (const category of ['nature', 'feelings', 'stories']) {
    const section = rewardSections.get(`poetry-culture/${category}`);
    assert.deepEqual(section.learnIds, poetryTopic.lessons.filter(lesson => lesson.category === category).map(lesson => lesson.id));
    assert.deepEqual(section.questionIds, poetryTopic.questions.filter(question => question.category === category).map(question => question.id));
  }
});

function mockAudio(context, fetcher) {
  const players = [];
  class AudioMock {
    constructor(path) { this.src = path; players.push(this); }
    play() { this.onplaying?.(); return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ''; }
    load() {}
  }
  context.mock.method(globalThis, 'fetch', fetcher || (async () => ({
    ok: true, json: async () => ({ locale: 'zh-CN', files: {
      goose: { status: 'ready', path: '/audio/poetry/goose.wav' },
      wind: { status: 'ready', path: '/audio/poetry/wind.wav' },
    } }),
  })));
  const previous = globalThis.Audio;
  globalThis.Audio = AudioMock;
  context.after(() => { if (previous) globalThis.Audio = previous; else delete globalThis.Audio; });
  return players;
}

test('快速切换只保留一次朗读，慢速保留音高，停止不报错', async context => {
  const players = mockAudio(context);
  const statuses = [];
  const audio = createPoetryAudio(status => statuses.push(status));
  await audio.ready;
  const first = audio.play('goose');
  await Promise.resolve();
  const next = audio.play('wind', true);
  await Promise.resolve();
  assert.equal(await first, false);
  assert.equal(players[0].paused, true);
  assert.equal(players[1].playbackRate, 0.8);
  assert.equal(players[1].preservesPitch, true);
  audio.stop();
  assert.equal(await next, false);
  assert.equal(players[1].paused, true);
  assert.ok(!statuses.includes('error'));
});

test('清单等待期间停止不会迟到开播', async context => {
  let resolveManifest;
  const players = mockAudio(context, () => new Promise(resolve => { resolveManifest = resolve; }));
  const audio = createPoetryAudio(() => {});
  const playing = audio.play('goose');
  audio.stop();
  resolveManifest({ ok: true, json: async () => ({ locale: 'zh-CN', files: { goose: { status: 'ready', path: '/audio/poetry/goose.wav' } } }) });
  assert.equal(await playing, false);
  assert.equal(players.length, 0);
});

test('录音缺失与播放失败可重试，正常结束恢复空闲', async context => {
  const players = mockAudio(context);
  const statuses = [];
  const audio = createPoetryAudio(status => statuses.push(status));
  assert.equal(await audio.play('missing'), false);
  assert.equal(statuses.at(-1), 'error');
  const failed = audio.play('goose');
  await Promise.resolve();
  players[0].onerror();
  assert.equal(await failed, false);
  assert.equal(players[0].paused, true);
  const retried = audio.play('goose');
  await Promise.resolve();
  players[1].onended();
  assert.equal(await retried, true);
  assert.equal(statuses.at(-1), 'idle');
});
