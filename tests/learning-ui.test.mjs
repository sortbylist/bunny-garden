import test from 'node:test';
import assert from 'node:assert/strict';
import { learningTokenClass, learningTools } from '../src/learning-ui.js';
import { readingHints } from '../src/chinese-reading.js';
import { vocabularyEntries } from '../src/vocabulary-data.js';

test('短词、单字和单词使用学习字号，长句和说明保留原字号', () => {
  for (const text of ['医生', '长颈鹿', '馒头', '图书馆', '12', '24 ÷ 6', 'strawberry', '/ɜː/']) {
    assert.match(learningTokenClass(text), /learning-token/, text);
  }
  assert.match(learningTokenClass('氵'), /learning-glyph/);
  for (const text of ['', '我们在公园里快乐地玩耍。', '把这些词语放进句子里说一说', 'A dolphin swims in the sea.', 'This is a long description']) {
    assert.equal(learningTokenClass(text), '', text);
  }
});

test('学习和查字页面隐藏题数设置，练习页保留下一轮设置及已选题数', () => {
  for (const prefix of ['ct', 'hz']) {
    for (const view of ['learn', 'lookup']) {
      const html = learningTools(prefix, { view, showPinyin: true, practiceLength: 20 });
      assert.ok(!html.includes('新一轮题数'));
      assert.ok(!html.includes(`${prefix}-length`));
      assert.ok(html.includes('outline-button reading-toggle'));
    }
    const quiz = learningTools(prefix, { view: 'quiz', showPinyin: false, practiceLength: 20 });
    assert.ok(quiz.includes('新一轮题数'));
    assert.ok(quiz.includes('data-value="20" aria-pressed="true"'));
    assert.ok(quiz.includes('拼音辅助：关'));
  }
  assert.equal(learningTools('ct', { view: 'learn' }, { math: true }), '');
});

test('新增和已有词卡均有完整词组拼音，避免把多音字拆成固定读音', () => {
  for (const entry of vocabularyEntries) {
    assert.ok(readingHints[entry.text], entry.text);
    assert.equal(readingHints[entry.text].split(' ').length, [...entry.text].length, entry.text);
    assert.ok(entry.sentence.includes(entry.text), entry.text);
  }
});
