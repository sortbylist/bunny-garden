import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { basics, groups, characters, words, vocabulary, marked, confusionSets } from '../src/data.js';
import { shuffle, visibleTabs, studyPool, questionPool, createRound, recordAnswer, roundStats, loadState, defaultState } from '../src/engine.js';

test('基础内容分类完整，顺序从 a o e i u ü 开始', () => {
  assert.equal(basics.length, 63);
  assert.deepEqual(basics.slice(0, 6).map(item => item.text), ['a', 'o', 'e', 'i', 'u', 'ü']);
  assert.deepEqual(groups.map(group => basics.filter(item => item.group === group.id).length), [6, 23, 9, 5, 4, 16]);
  assert.ok(characters.length >= 100);
  assert.ok(words.length >= 50);
  assert.equal(new Set([...basics, ...vocabulary].map(item => item.id)).size, basics.length + vocabulary.length);
});

test('声调位置、ü 以及轻声转换正确', () => {
  const cases = { shui3: 'shuǐ', jiu3: 'jiǔ', nv3: 'nǚ', lve4: 'lüè', hao3: 'hǎo', ou1: 'ōu', ma5: 'ma', xue2: 'xué', ying1: 'yīng' };
  for (const [source, expected] of Object.entries(cases)) assert.equal(marked(source), expected);
});

test('随机洗牌不改变原数组，一轮不重复不漏项', () => {
  const original = basics.map(item => item.id);
  const shuffled = shuffle(original, () => 0.3);
  assert.equal(new Set(shuffled).size, original.length);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
  assert.notDeepEqual(shuffled, original);
  assert.deepEqual(original, basics.map(item => item.id));
  assert.equal(studyPool('finals', 'all').length, 24);
  assert.equal(studyPool('random', 'single').length, 6);
});

test('超过十项时仍显示当前选中的隐藏 tab', () => {
  const features = Array.from({ length: 12 }, (_, index) => ({ id: String(index) }));
  assert.equal(visibleTabs(features, '11', false).length, 10);
  assert.equal(visibleTabs(features, '11', false)[9].id, '11');
  assert.equal(visibleTabs(features, '0', true).length, 12);
  assert.deepEqual(visibleTabs(features.slice(0, 8), '0', false), features.slice(0, 8));
});

test('每题只有一个正确选项，听辨不把相同读音当不同选项', () => {
  for (const mode of ['listen', 'audio', 'hanzi', 'pinyin', 'rules', 'blend', 'challenge', 'tonequiz']) {
    for (const question of questionPool(mode)) {
      const options = question.options.map(option => typeof option === 'string' ? option : option.value);
      assert.equal(options.filter(option => option === question.answer).length, 1, question.id);
      assert.equal(new Set(options).size, options.length, question.id);
      if (mode === 'audio') assert.equal(new Set(question.options.map(option => option.sound)).size, question.options.length);
      if (mode === 'pinyin') {
        const target = vocabulary.find(item => item.id === question.itemId);
        assert.equal(options.filter(option => vocabulary.find(item => item.text === option)?.pinyin === target.pinyin).length, 1);
      }
    }
  }
  for (const confusion of Object.keys(confusionSets)) assert.ok(questionPool('confusing', { confusion }).length >= 8);
});

test('首次答题统计不被重试和查看答案覆盖', () => {
  const round = createRound('rules', {}, 5);
  const question = round.questions[0];
  recordAnswer(round, question.options.find(option => option !== question.answer));
  recordAnswer(round, question.answer);
  assert.equal(round.responses[0].correct, false);
  assert.equal(round.revealed, true);
  assert.equal(recordAnswer(round, question.answer), null);
  assert.equal(roundStats(round).correct, 0);
  round.index = 1;
  round.revealed = false;
  recordAnswer(round, null);
  assert.equal(roundStats(round).skipped, 1);
  const small = createRound('listen', { group: 'single' }, 20);
  assert.equal(small.questions.length, 6);
});

test('浏览器存储不可用或损坏时可降级', () => {
  const blocked = loadState({ getItem() { throw new Error('blocked'); } });
  assert.equal(blocked.available, false);
  assert.equal(blocked.state.mode, 'sequence');
  assert.equal(loadState({ getItem: () => '{' }).available, false);
  assert.equal(loadState({ getItem: () => null }).available, true);
});

test('扁平本机数据不会被当作四层结构读取', () => {
  const saved = { ...defaultState(), known: ['single-a'], mode: 'audio' };
  const result = loadState({ getItem: () => JSON.stringify(saved) });
  assert.equal(result.available, false);
  assert.deepEqual(result.state.known, []);
});

test('所有基础点读与练习音频均有本地资源，完整词语缺失时允许逐字拼读', async () => {
  const root = new URL('../public', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('../public/audio/manifest.json', import.meta.url), 'utf8'));
  const sounds = new Set(basics.map(item => item.sound));
  for (const mode of ['listen', 'hanzi', 'rules', 'blend', 'challenge', 'tonequiz']) {
    for (const question of questionPool(mode)) {
      if (question.audio.sound) sounds.add(question.audio.sound);
      if (question.audio.word && !manifest.files[`word:${question.audio.word}`]) {
        const item = vocabulary.find(entry => entry.text === question.audio.word);
        for (const sound of item.sounds) sounds.add(sound);
      }
    }
  }
  for (const sound of sounds) {
    const path = manifest.files[`syllable:${sound}`];
    assert.ok(path, `缺少 ${sound}`);
    assert.ok((await stat(new URL(`.${path}`, root + '/'))).size > 500);
  }
});
