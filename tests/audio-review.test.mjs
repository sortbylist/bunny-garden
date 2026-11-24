import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { audioReviewCatalog, createAudioReviewExport, pendingAudioReviewRows, reviewBatches } from '../src/audio-review-data.js';
import { basics, confusionSets, groups, neutralToneExamples, toneExamples, vocabulary } from '../src/data.js';
import { questionPool } from '../src/engine.js';
import { englishAudioClips } from '../src/english-topics.js';
import { borrowsSyllable, pinyinAudioPaths, pinyinBlendAudio, pinyinCardAudio, pinyinOptionAudio, pinyinQuestionAudio } from '../src/pinyin-audio-data.js';

const audioRoot = new URL('../public/audio/', import.meta.url);
const loadManifest = async name => JSON.parse(await readFile(new URL(name, audioRoot), 'utf8'));
const [pinyin, poetry, phonics, huihuiWords, borrowedSamples, pending] = await Promise.all([
  'manifest.json', 'poetry/manifest.json', 'phonics/manifest.json',
  'huihui/manifest.json', 'huihui-borrowed/manifest.json', 'review/pending.json',
].map(loadManifest));
const catalog = audioReviewCatalog({ pinyin, poetry, phonics, borrowedSamples });
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

test('慧慧补全整词，学习页和试听使用同一录音', () => {
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
});

test('待审清单按条目 ID 加入试听，移除后对应教学场景停止待审', () => {
  pendingAudioReviewRows(catalog, pending.items);
  const word = 'phonics/lesson-1/word-map';
  const syllable = 'pinyin/confusing/retroflex-confusing:cha1';
  const queue = {
    [word]: { status: 'unreviewed' },
    [syllable]: { status: 'recheck', note: '再次确认声调。' },
  };
  const getPending = () => pendingAudioReviewRows(catalog, queue).map(row => row.id);
  assert.deepEqual(getPending(), [syllable, word]);
  delete queue[syllable];
  assert.deepEqual(getPending(), [word]);
  delete queue[word];
  assert.deepEqual(getPending(), []);
  assert.throws(() => pendingAudioReviewRows(catalog, { [word]: { status: 'approved' } }), /无效的待审核状态/);
  assert.throws(() => pendingAudioReviewRows(catalog, { missing: { status: 'unreviewed' } }), /找不到待审核条目：missing/);
});

test('借音卡有独立的试听场景，ün 优先播放现用录音', () => {
  const sampleRows = catalog.filter(row => row.batch === 'huihui-borrowed');
  assert.equal(sampleRows.length, 34);
  assert.equal(sampleRows.filter(row => row.category.id === 'initial').length, 23);
  assert.deepEqual(sampleRows.map(row => row.contentId), basics.filter(borrowsSyllable).map(item => item.id));
  const samples = Object.values(borrowedSamples.files);
  assert.equal(samples.length, 32);
  assert.equal(new Set(samples.map(sample => sample.sha256)).size, 32);
  const cardsBySample = new Map();
  for (const row of sampleRows) {
    const [main, reference] = row.audio;
    const [candidate, current] = row.contentId === 'front-ün' ? [reference, main] : [main, reference];
    const { path, sha256 } = candidate.clips[0];
    assert.equal(sha256, samples.find(sample => sample.path === path)?.sha256);
    assert.equal(main.reference, false);
    assert.equal(reference.reference, true);
    assert.deepEqual(current.clips.map(clip => clip.path), pinyinAudioPaths(pinyin.files, pinyinCardAudio(row.item)));
    const titles = cardsBySample.get(path) ?? [];
    titles.push(row.title);
    cardsBySample.set(path, titles);
  }
  assert.equal(cardsBySample.size, samples.length);
  assert.deepEqual([...cardsBySample.values()].filter(titles => titles.length > 1), [['i', 'y'], ['u', 'w']]);
  assert.ok(samples.every(sample => !Object.values(pinyin.files).includes(sample.path)));

  const row = sampleRows.find(row => row.id === 'pinyin/front/huihui-loan-front-ün');
  assert.equal(row.expected, 'ün（对照音节 yūn）');
  assert.equal(row.audio[0].clips[0].path, '/audio/yun1.mp3');
  assert.equal(row.audio[0].clips[0].source, 'audio-cmn · Chen Wang');
});

test('古诗试听使用当前录音及资源指纹', () => {
  const poems = catalog.filter(row => row.batch === 'poetry');
  assert.equal(poems.length, 20);
  for (const poem of poems) {
    const { sha256 } = poetry.files[poem.contentId];
    assert.ok(sha256, poem.id);
    assert.equal(poem.audio[0].clips[0].sha256, sha256);
  }
  const farmers = poems.find(row => row.contentId === 'farmers');
  assert.ok(farmers.poem.lines.some(([, pinyin]) => pinyin.startsWith('shuí zhī')));
});

test('拼音试听使用当前录音及资源指纹，保留按场景替换的读音', async () => {
  const paths = new Set(clipPaths(catalog));
  for (const { file, sha256 } of Object.values(pinyin.overrides)) {
    const path = `/audio/${file}`;
    assert.ok(paths.has(path), path);
    if (sha256) {
      const bytes = await readFile(new URL(file, audioRoot));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), sha256);
    }
  }

  const pathsFor = id => clipPaths(catalog.filter(row => row.id === id));
  assert.deepEqual(pathsFor('pinyin/whole/whole-chi'), ['/audio/huihui-pinyin/chi1.wav']);
  assert.ok(pathsFor('pinyin/blend/blend-15').includes('/audio/chi1.mp3'));
  assert.deepEqual(pathsFor('pinyin/words/char-竹'), ['/audio/huihui-pinyin/zhu2.wav']);
  assert.deepEqual(pathsFor('pinyin/blend/blend-14').slice(-1), ['/audio/zhu2.mp3']);
  assert.deepEqual(pathsFor('pinyin/words/char-沙'), ['/audio/sha1.mp3']);
  assert.deepEqual(pathsFor('pinyin/confusing/retroflex-confusing:cha1'), ['/audio/huihui-pinyin/cha1.wav']);
  assert.deepEqual(pathsFor('pinyin/confusing/retroflex-confusing:sha1'), ['/audio/huihui-pinyin/sha1.wav']);
  const xia = pathsFor('pinyin/confusing/jqx-confusing:xia1');
  assert.deepEqual(xia, ['/audio/audio-cmn/xia1.mp3']);
  assert.deepEqual(pathsFor('pinyin/words/char-虾'), xia);
  const savedQuestion = { id: 'listen:whole-chi', itemId: 'whole-chi', audio: { sound: 'chi1' } };
  assert.deepEqual(pinyinAudioPaths(pinyin.files, pinyinQuestionAudio(savedQuestion)), pathsFor('pinyin/whole/whole-chi'));
  assert.deepEqual(pinyinAudioPaths(pinyin.files, pinyinOptionAudio({ value: 'chi', sound: 'chi1' })), pathsFor('pinyin/whole/whole-chi'));
});

test('语文试听清单覆盖正式学习页音频和备用音节', () => {
  const chinese = catalog.filter(row => row.subject.id === 'chinese');
  const paths = new Set(clipPaths(chinese));
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
    ...questions.flatMap(question => [
      pinyinQuestionAudio(question), ...question.options.filter(option => typeof option === 'object').map(pinyinOptionAudio),
    ]),
  ];
  const livePaths = new Set(requests.flatMap(request => pinyinAudioPaths(pinyin.files, request)));
  assert.equal(livePaths.has(undefined), false);
  assert.deepEqual([...livePaths].filter(path => !paths.has(path)), []);
  assert.deepEqual(Object.values(pinyin.files).filter(path => !paths.has(path)), []);
  assert.deepEqual(clipPaths(chinese.filter(row => row.title === 'huà · 备用音节')), ['/audio/hua4.mp3']);
  assert.deepEqual(clipPaths(chinese.filter(row => row.title === 'má · 麻')), ['/audio/ma2-yue-tan.ogg']);
  assert.deepEqual(clipPaths(chinese.filter(row => row.title === 'ong')), ['/audio/ong-openlearn.wav']);
  assert.ok(!reviewBatches.some(batch => batch.id === 'huihui-pronunciation'));
});

test('审核导出包含本轮通过决定、修改意见和播放文件', () => {
  const rows = catalog.filter(row => [
    'pinyin/confusing/retroflex-confusing:cha1',
    'pinyin/confusing/retroflex-confusing:sha1',
  ].includes(row.id));
  const reviewed = rows.at(-1);
  const decisions = new Map([
    [rows[0].id, { status: 'approved' }],
    [reviewed.id, { status: 'needs-change', note: '  声调需要再确认。\n' }],
  ]);
  const scope = { subject: reviewed.subject, batch: { id: 'pinyin', name: '其余拼音录音' } };
  const report = createAudioReviewExport(rows, decisions, scope, new Date('2026-11-22T09:00:00Z'));
  assert.equal(report.format, 'bunny-garden-audio-review');
  assert.equal(report.version, 2);
  assert.equal(report.total, 2);
  assert.equal(report.reviewed, 2);
  assert.deepEqual(report.scope, scope);
  assert.equal(report.items[0].status, 'approved');
  const item = report.items.at(-1);
  assert.equal(item.status, 'needs-change');
  assert.equal(report.notes[item.noteIndex], '声调需要再确认。');
  assert.equal(item.contentId, reviewed.contentId);
  assert.deepEqual(item.audio[0].clipIndexes.map(index => report.clips[index].path), ['/audio/huihui-pinyin/sha1.wav']);
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
