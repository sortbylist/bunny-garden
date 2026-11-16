import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { toneExamples, neutralToneExamples, marked } from '../src/data.js';
import { questionPool } from '../src/engine.js';

const audioRoot = new URL('../public/audio/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', audioRoot), 'utf8'));

test('四组声调示例覆盖四声，拼音、汉字及本地录音齐全', async () => {
  assert.equal(toneExamples.length, 4);
  const ids = new Set();
  const practiceSounds = new Set(questionPool('tonequiz').map(question => question.audio.sound));
  for (const group of toneExamples) {
    assert.equal(group.items.length, 4);
    for (const [index, item] of group.items.entries()) {
      assert.equal(item.sound, `${group.syllable}${index + 1}`);
      assert.equal(item.text, marked(item.sound));
      assert.equal([...item.character].length, 1);
      assert.ok(!ids.has(item.id));
      ids.add(item.id);
      assert.ok(practiceSounds.has(item.sound));
      const path = manifest.files[`syllable:${item.sound}`];
      assert.ok(path, item.sound);
      assert.ok((await stat(new URL(path.slice('/audio/'.length), audioRoot))).size > 500);
    }
  }
});

test('轻声示例使用完整词语录音，保留第二个字的轻声标记', async () => {
  assert.equal(neutralToneExamples.length, 6);
  for (const item of neutralToneExamples) {
    assert.ok(item.sounds[1].endsWith('5'), item.text);
    const path = manifest.files[`word:${item.text}`];
    assert.ok(path, item.text);
    assert.ok((await stat(new URL(path.slice('/audio/'.length), audioRoot))).size > 500);
  }
});

test('má 的点读和听辨共用替换录音，重新下载时保留覆盖关系', async () => {
  const overrides = JSON.parse(await readFile(new URL('overrides.json', audioRoot), 'utf8'));
  const override = overrides['syllable:ma2'];
  assert.equal(manifest.files['syllable:ma2'], `/audio/${override.file}`);
  assert.notEqual(override.file, 'ma2.mp3');
  const bytes = await readFile(new URL(override.file, audioRoot));
  assert.equal(bytes.subarray(0, 4).toString(), 'OggS');
  assert.equal(questionPool('tonequiz').find(question => question.id === 'tone:ma2').audio.sound, 'ma2');
});
