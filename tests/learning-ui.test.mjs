import test from 'node:test';
import assert from 'node:assert/strict';
import { learningCardFooter, learningTokenClass, learningTools, pinyinToggle } from '../src/learning-ui.js';
import { readingHints } from '../src/chinese-reading.js';
import { vocabularyEntries } from '../src/vocabulary-data.js';

test('学习卡复用带图标的轻量操作区，翻页独立且保留边界与认识状态', () => {
  for (const prefix of ['ct', 'hz']) {
    for (const known of [true, false]) {
      const html = learningCardFooter(prefix, { known, category: 'strokes', index: 0, total: 3 });
      const [actions, navigation] = html.split('<div class="hz-actions hz-card-footer');
      assert.match(actions, /class="hz-actions mastery-actions"/);
      assert.ok(actions.includes(`data-action="${prefix}-known" class="soft-button mint" aria-pressed="${known}"`));
      assert.ok(actions.includes(known ? '已经认识啦 ✓' : '我认识啦'));
      assert.ok(actions.includes(`data-action="${prefix}-start" data-id="strokes" class="soft-button"`));
      assert.match(actions, /练练这一节/);
      assert.equal((actions.match(/<svg/g) || []).length, 2);
      assert.match(navigation, /card-navigation/);
      assert.ok(navigation.includes(`data-action="${prefix}-previous" class="outline-button previous" disabled`));
      assert.ok(navigation.includes(`data-action="${prefix}-next" class="outline-button" >`));
      assert.equal((navigation.match(/<svg/g) || []).length, 2);
    }
    const last = learningCardFooter(prefix, { known: false, category: 'strokes', index: 2, total: 3 });
    assert.ok(last.includes(`data-action="${prefix}-previous" class="outline-button previous" >`));
    assert.ok(last.includes(`data-action="${prefix}-next" class="outline-button" disabled`));
    const only = learningCardFooter(prefix, { known: false, category: 'strokes', index: 0, total: 1 });
    assert.equal((only.match(/disabled/g) || []).length, 2);
  }
});

test('短词、单字和单词保留内容标记，长句和说明不标记', () => {
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
      assert.equal(html, '');
    }
    const quiz = learningTools(prefix, { view: 'quiz', showPinyin: false, practiceLength: 20 });
    assert.ok(quiz.includes('新一轮题数'));
    assert.ok(quiz.includes('data-value="20" aria-pressed="true"'));
    assert.ok(!quiz.includes(`${prefix}-reading`));
  }
  assert.equal(learningTools('ct', { view: 'learn' }, { math: true }), '');
});

test('标题区拼音开关使用固定名称和可访问的开关状态', () => {
  for (const prefix of ['ct', 'hz']) {
    for (const showPinyin of [true, false]) {
      const html = pinyinToggle(prefix, { showPinyin });
      assert.ok(html.includes(`data-action="${prefix}-reading"`));
      assert.ok(html.includes('role="switch" aria-label="拼音辅助"'));
      assert.ok(html.includes(`aria-checked="${showPinyin}"`));
      assert.ok(html.includes('<span>拼音</span>'));
      assert.ok(!html.includes('aria-pressed'));
    }
  }
});

test('新增和已有词卡均有完整词组拼音，避免把多音字拆成固定读音', () => {
  for (const entry of vocabularyEntries) {
    assert.ok(readingHints[entry.text], entry.text);
    assert.equal(readingHints[entry.text].split(' ').length, [...entry.text].length, entry.text);
    assert.ok(entry.sentence.includes(entry.text), entry.text);
  }
});
