import test from 'node:test';
import assert from 'node:assert/strict';
import { learningPosition } from '../src/learning-ui.js';

test('学习位置显示准确的首项、末项与总数，不按九个圆点估算', () => {
  for (const total of [1, 2, 6, 9, 23, 63, 200]) {
    for (const index of new Set([0, Math.floor(total / 2), total - 1])) {
      const html = learningPosition(index, total);
      assert.ok(html.includes(`第 <b>${index + 1}</b> / ${total} 项`));
      assert.ok(html.includes('class="card-position learning-position"'));
      assert.ok(html.includes('aria-label="当前学习位置"'));
      assert.ok(!html.includes('<i'));
    }
  }
});

test('练习位置复用同一组件，以题为单位，空列表不显示无效计数', () => {
  assert.match(learningPosition(1, 5, { practice: true }), /当前练习位置.*第 <b>2<\/b> \/ 5 题/);
  assert.equal(learningPosition(0, 0), '');
  assert.equal(learningPosition(0, 0, { practice: true }), '');
});
