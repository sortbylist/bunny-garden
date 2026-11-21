import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { englishTopics, englishAudioClips } from '../src/english-topics.js';
import { normalizeTopic, startTopicRound, answerTopic } from '../src/chinese-engine.js';
import { decodeLearningData } from '../src/learning-data.js';
import { resolveFavorite } from '../src/content-favorites.js';
import { defaultState } from '../src/engine.js';
import { createBackup, parseBackup } from '../src/backup.js';
import { rewardStages, rewardSections } from '../src/reward-curriculum.js';

test('校园英语题目、音频素材与小节奖励使用稳定的内容标识', async () => {
  const clips = new Map(englishAudioClips.map(clip => [clip.id, clip.text]));
  assert.equal(clips.size, englishAudioClips.length);
  const audioDir = new URL('../public/audio/english/', import.meta.url);
  assert.deepEqual((await readdir(audioDir)).sort(), [...clips.keys()].map(id => `${id}.mp3`).sort());
  for (const id of clips.keys()) {
    const bytes = await readFile(new URL(`${id}.mp3`, audioDir));
    assert.ok(bytes.length > 100 && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224)), id);
  }
  assert.deepEqual(rewardStages.find(stage => stage.id === 'english-1').topics.map(topic => topic.id), ['phonics', ...englishTopics.map(topic => topic.id)]);
  const ids = new Set();
  for (const topic of englishTopics) {
    const category = topic.categories[0].id;
    const section = rewardSections.get(`${topic.id}/${category}`);
    assert.ok(section.questionIds.length >= 5);
    for (const item of [...topic.lessons, ...topic.questions]) {
      assert.ok(!ids.has(item.id), item.id);
      ids.add(item.id);
      assert.equal(item.category, category);
      for (const clip of [item.clip, item.word, item.phrase, item.variation, ...(item.lines || []).map(line => line.clip)].filter(Boolean)) {
        assert.equal(clips.get(clip.id), clip.text);
      }
    }
    for (const question of topic.questions) {
      assert.equal(question.options.length, 3);
      assert.equal(new Set(question.options).size, 3);
      assert.equal(question.choices.filter(choice => choice.id === question.answer).length, 1);
      assert.ok(question.explanation);
      const favorite = resolveFavorite(`english/${topic.id}/question/${question.id}`, () => topic);
      assert.equal(favorite.question, question);
    }
  }
});

test('听力轮次和错题可备份，题干及配图按更新后的课程恢复', () => {
  const topic = englishTopics.find(item => item.id === 'english-listening');
  const state = defaultState();
  const progress = state.topics[topic.id] = normalizeTopic(topic, null);
  const lessonId = topic.lessons[0].id;
  progress.known.push(lessonId);
  assert.ok(startTopicRound(topic, progress, 'all'));
  const question = progress.round.questions[0];
  assert.ok(answerTopic(progress, question.options.find(option => option !== question.answer)).first);
  assert.ok(answerTopic(progress, question.answer).correct);
  const saved = parseBackup(createBackup(state)).data;
  const restored = decodeLearningData(saved).topics[topic.id];
  assert.deepEqual(restored.known, [lessonId]);
  assert.deepEqual(restored.mistakes, [question.id]);
  assert.deepEqual(restored.round.questions[0], question);
  assert.equal(restored.round.responses[0].correct, false);
});
