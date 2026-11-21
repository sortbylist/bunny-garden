import test from 'node:test';
import assert from 'node:assert/strict';
import { favoriteButton, learningCardFooter, learningTokenClass, learningTools, roundSettings } from '../src/learning-ui.js';
import { difficultCharacters, contextualCharacters } from '../src/prose-readings-data.js';
import { chineseTopics } from '../src/chinese-topics.js';
import { hanziLessons, hanziQuestions } from '../src/hanzi-data.js';

test('学习卡复用带图标的轻量操作区，翻页独立且保留边界与认识状态', () => {
  for (const prefix of ['ct', 'hz']) {
    for (const known of [true, false]) {
      const html = learningCardFooter(prefix, { known, category: 'strokes', index: 0, total: 3 });
      const [actions, navigation] = html.split('<div class="hz-actions hz-card-footer');
      assert.match(actions, /class="hz-actions mastery-actions"/);
      assert.ok(actions.includes(`data-action="${prefix}-known" class="soft-button mint" aria-pressed="${known}"`));
      assert.ok(actions.includes(known ? '已经认识啦 ✓' : '我认识啦'));
      assert.ok(actions.includes(`data-action="${prefix}-start" data-id="strokes" class="soft-button"`));
      assert.match(actions, /开始本节练习/);
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
    assert.match(quiz, /<details class="lesson-details round-settings">/);
    assert.match(quiz, /每轮题数/);
    assert.match(quiz, /value="20" selected/);
    assert.match(quiz, /题数用于下一轮/);
  }
  assert.equal(learningTools('ct', { view: 'learn' }, { math: true }), '');
});

test('各练习共用设置外观，收藏组件同步图标和选中状态', () => {
  for (const scope of ['phonics', 'pinyin']) {
    const html = roundSettings(scope, 5, [5, 10, 20]);
    assert.match(html, /<details class="lesson-details round-settings">/);
    assert.match(html, /value="5" selected/);
    assert.match(html, /切换到对应题量的练习/);
  }
  for (const action of ['favorite', 'favorite-question', 'ph-favorite']) {
    assert.match(favoriteButton(action, false), /aria-label="收藏" aria-pressed="false".*收藏<\/button>/);
    assert.match(favoriteButton(action, true), /aria-label="收藏" aria-pressed="true".*已收藏<\/button>/);
  }
});

test('正文字表中的目标字和消歧语境均来自实际课程', () => {
  const corpus = JSON.stringify([chineseTopics, hanziLessons, hanziQuestions]);
  for (const character of [...Object.keys(difficultCharacters), ...Object.keys(contextualCharacters)]) {
    assert.match(character, /^\p{Script=Han}$/u);
    assert.ok(corpus.includes(character), character);
  }
  for (const [character, readings] of Object.entries(contextualCharacters)) {
    assert.ok(!Object.hasOwn(difficultCharacters, character));
    for (const word of Object.values(readings).flat()) {
      assert.ok(word.includes(character) && corpus.includes(word), word);
    }
  }
});
