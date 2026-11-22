import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { audioReviewCatalog, createAudioReviewExport, reviewBatches } from '../src/audio-review-data.js';
import { publishedReviewDecision, publishedReviewDecisions } from '../src/audio-review-decisions.js';
import { basics, confusionSets, groups, neutralToneExamples, toneExamples, vocabulary } from '../src/data.js';
import { questionPool } from '../src/engine.js';
import { englishAudioClips } from '../src/english-topics.js';
import { borrowsSyllable, pinyinAudioPaths, pinyinBlendAudio, pinyinCardAudio } from '../src/pinyin-audio-data.js';

const audioRoot = new URL('../public/audio/', import.meta.url);
const loadManifest = async name => JSON.parse(await readFile(new URL(name, audioRoot), 'utf8'));
const [pinyin, poetry, phonics, huihuiWords, borrowedSamples] = await Promise.all([
  'manifest.json', 'poetry/manifest.json', 'phonics/manifest.json',
  'review/huihui/manifest.json', 'review/huihui-borrowed/manifest.json',
].map(loadManifest));
const catalog = audioReviewCatalog({ pinyin, poetry, phonics, borrowedSamples });
const pending = catalog.filter(row => publishedReviewDecision(row)?.status !== 'approved');
const clipPaths = rows => rows.flatMap(row => row.audio.flatMap(action => action.clips.map(clip => clip.path)));

test('试听清单覆盖已发布音频，独立样本与教学场景使用稳定标识', async () => {
  const paths = new Set(clipPaths(catalog));
  assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length);
  assert.equal(paths.has(null), false);
  for (const path of [
    ...Object.values(pinyin.files),
    ...[poetry, phonics, huihuiWords, borrowedSamples].flatMap(manifest => Object.values(manifest.files).map(item => item.path)),
    ...englishAudioClips.map(item => `/audio/english/${item.id}.mp3`),
  ]) assert.ok(paths.has(path), `${path} should be available to review`);

  const localSamples = [huihuiWords, borrowedSamples].flatMap(manifest => Object.values(manifest.files));
  for (const { path, sha256 } of localSamples) {
    const wav = await readFile(new URL(`../public${path}`, import.meta.url));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(createHash('sha256').update(wav).digest('hex'), sha256);
  }
  const borrowed = catalog.filter(row => row.batch === 'borrowed');
  assert.deepEqual(borrowed.map(row => row.title), ['h + ua', 'g + ua', 'd + uo', 'x + iong']);
  assert.ok(borrowed.every(row => row.kind === 'quiz'));
  assert.equal(catalog.filter(row => row.batch === 'poetry').length, 20);
  assert.deepEqual(borrowed.find(row => row.title === 'x + iong').audio.map(audio => audio.clips.map(clip => clip.path)), [
    ['/audio/xi1.mp3', '/audio/yi1.mp3', '/audio/ong-openlearn.wav'],
    ['/audio/xiong2.mp3'],
  ]);
});

test('慧慧补全整词且沿用已确认录音', () => {
  const words = Object.values(huihuiWords.files);
  const wordRows = catalog.filter(row => row.batch === 'huihui');
  assert.equal(words.length, 13);
  assert.equal(wordRows.length, 13);
  assert.deepEqual(pinyin.missing, []);
  for (const word of vocabulary.filter(item => item.sounds.length > 1)) {
    assert.ok(pinyin.files[`word:${word.text}`], word.text);
  }
  for (const { path, text, sha256 } of words) {
    const row = wordRows.find(item => item.title === text);
    assert.deepEqual(pinyinAudioPaths(pinyin.files, pinyinCardAudio(row.item)), [path]);
    assert.equal(row.audio[0].clips[0].path, path);
    assert.equal(row.audio[0].clips[0].sha256, sha256);
    assert.equal(row.audio[0].clips[0].sourceText, text);
    assert.equal(row.audio[1].reference, true);
    assert.deepEqual(row.audio[1].clips.map(clip => clip.path), row.item.sounds.map(sound => pinyin.files[`syllable:${sound}`]));
  }
  const approved = wordRows.filter(row => publishedReviewDecisions[row.id]?.status === 'approved');
  assert.deepEqual(approved.map(row => row.title).sort(), ['白云', '小草', '画画'].sort());
  for (const row of approved) {
    assert.equal(publishedReviewDecisions[row.id].sha256, row.audio[0].clips[0].sha256);
  }
  assert.equal(pending.filter(row => row.batch === 'huihui').length, 10);
});

test('全部借音卡独立审核，慧慧候选与现用录音逐张对照', () => {
  const sampleRows = catalog.filter(row => row.batch === 'huihui-borrowed');
  assert.equal(sampleRows.length, 34);
  assert.equal(sampleRows.filter(row => row.category.id === 'initial').length, 23);
  assert.deepEqual(sampleRows.map(row => row.contentId), basics.filter(borrowsSyllable).map(item => item.id));
  const samples = Object.values(borrowedSamples.files);
  assert.equal(samples.length, 32);
  assert.equal(new Set(samples.map(sample => sample.sha256)).size, 32);
  const cardsBySample = new Map();
  for (const row of sampleRows) {
    const [candidate, reference] = row.audio;
    const { path, sha256 } = candidate.clips[0];
    assert.equal(sha256, samples.find(sample => sample.path === path)?.sha256);
    assert.equal(candidate.reference, false);
    assert.equal(reference.reference, true);
    assert.deepEqual(reference.clips.map(clip => clip.path), pinyinAudioPaths(pinyin.files, pinyinCardAudio(row.item)));
    const titles = cardsBySample.get(path) ?? [];
    titles.push(row.title);
    cardsBySample.set(path, titles);
  }
  assert.equal(cardsBySample.size, samples.length);
  assert.deepEqual([...cardsBySample.values()].filter(titles => titles.length > 1), [['i', 'y'], ['u', 'w']]);
  assert.ok(samples.every(sample => !Object.values(pinyin.files).includes(sample.path)));
});

test('语文待审清单覆盖学习页音频及备用音节，已通过的整词除外', () => {
  const chinese = pending.filter(row => row.subject.id === 'chinese');
  const paths = new Set(clipPaths(chinese));
  const approvedPaths = ['白云', '小草', '画画'].map(word => pinyin.files[`word:${word}`]);
  const blends = questionPool('blend');
  const questions = [
    ...groups.flatMap(group => ['listen', 'audio', 'section-practice'].flatMap(mode => questionPool(mode, { group: group.id }))),
    ...['listen', 'audio', 'hanzi', 'pinyin', 'tonequiz', 'rules'].flatMap(mode => questionPool(mode)),
    ...Object.keys(confusionSets).flatMap(confusion => questionPool('confusing', { confusion })),
    ...blends,
  ];
  const requests = [
    ...[...basics, ...vocabulary].map(pinyinCardAudio),
    ...toneExamples.flatMap(group => group.items.map(item => ({ sound: item.sound }))),
    ...neutralToneExamples.map(item => ({ word: item.text })),
    ...blends.map(question => pinyinBlendAudio(question.parts)),
    ...questions.flatMap(question => [question.audio, ...question.options.filter(option => typeof option === 'object')]),
  ];
  const livePaths = new Set(requests.flatMap(request => pinyinAudioPaths(pinyin.files, request)));
  assert.equal(livePaths.has(undefined), false);
  assert.deepEqual([...livePaths].filter(path => !paths.has(path)).sort(), approvedPaths.sort());
  assert.deepEqual(Object.values(pinyin.files).filter(path => !paths.has(path)).sort(), approvedPaths);
  assert.ok(Object.values(poetry.files).every(item => paths.has(item.path)));
  assert.deepEqual(clipPaths(chinese.filter(row => row.title === 'huà · 备用音节')), ['/audio/hua4.mp3']);
  assert.deepEqual(clipPaths(chinese.filter(row => row.title === 'má · 麻')), ['/audio/ma2-yue-tan.ogg']);
  assert.deepEqual(clipPaths(chinese.filter(row => row.title === 'ong')), ['/audio/ong-openlearn.wav']);
  assert.ok(!reviewBatches.some(batch => batch.id === 'huihui-pronunciation'));
});

test('审核导出包含未审项目、意见和有序播放文件', () => {
  const rows = catalog.filter(row => row.batch === 'huihui' && !publishedReviewDecisions[row.id]);
  const decisions = new Map([[rows[0].id, { status: 'needs-change', note: '  第二个音节太轻。\n' }]]);
  const scope = { subject: rows[0].subject, batch: { id: 'huihui', name: '慧慧整词录音' } };
  const report = createAudioReviewExport(rows, decisions, scope, new Date('2026-11-22T09:00:00Z'));
  assert.equal(report.format, 'bunny-garden-audio-review');
  assert.equal(report.version, 2);
  assert.equal(report.total, 10);
  assert.equal(report.reviewed, 1);
  assert.deepEqual(report.scope, scope);
  assert.equal(report.items[0].status, 'needs-change');
  assert.ok(report.items.slice(1).every(item => !Object.hasOwn(item, 'status')));
  assert.equal(report.notes[report.items[0].noteIndex], '第二个音节太轻。');
  assert.equal(report.items[0].contentId, 'word-写字');
  assert.equal(report.items[0].audio[1].reference, true);
  assert.deepEqual(report.items[0].audio[1].clipIndexes.map(index => report.clips[index].path), ['/audio/xie3.mp3', '/audio/zi4.mp3']);
});

test('审核导出合并重复清单数据并保留所有批次的课程位置和音频信息', () => {
  for (const subjectId of ['chinese', 'english']) {
    const rows = catalog.filter(row => row.subject.id === subjectId);
    const scope = { subject: rows[0].subject, batch: null };
    const decisions = new Map(rows.slice(0, 2).map(row => [row.id, { status: 'recheck', note: '需再试听。' }]));
    decisions.set(rows[2].id, { status: 'unreviewed', note: '  ' });
    const report = createAudioReviewExport(rows, decisions, scope);
    const allClips = rows.flatMap(row => row.audio.flatMap(action => action.clips));
    assert.ok(report.locations.length < rows.length);
    assert.ok(report.clips.length < allClips.length);
    assert.equal(report.clips.length, new Set(allClips.map(clip => JSON.stringify(clip))).size);
    assert.equal(report.sources.length, new Set(allClips.map(clip => clip.source)).size);
    assert.deepEqual(report.notes, ['需再试听。']);
    assert.deepEqual(report.items.slice(0, 3).map(item => item.noteIndex), [0, 0, undefined]);
    assert.ok(report.items.some(item => item.expected === undefined));

    const expanded = report.items.map(({ locationIndex, noteIndex, audio, ...item }) => ({
      ...item,
      ...report.locations[locationIndex],
      expected: item.expected ?? item.title,
      status: item.status ?? 'unreviewed',
      note: report.notes[noteIndex] ?? '',
      audio: audio.map(({ clipIndexes, reference = false, ...action }) => ({
        ...action,
        reference,
        clips: clipIndexes.map(index => {
          const { sourceIndex, ...clip } = report.clips[index];
          return { ...clip, source: report.sources[sourceIndex] };
        }),
      })),
    }));
    assert.deepEqual(expanded, rows.map(row => ({
      id: row.id, contentId: row.contentId, stage: row.stage, topic: row.topic, category: row.category,
      batch: row.batch, title: row.title, expected: row.expected, ...(row.context && { context: row.context }),
      audio: row.audio, status: decisions.get(row.id)?.status || 'unreviewed', note: decisions.get(row.id)?.note.trim() || '',
    })));
  }
});
