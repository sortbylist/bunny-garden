import { basics, confusionSets, featureGroups, groups, marked, neutralToneExamples, subjects, toneExamples, vocabulary, words } from './data.js';
import { questionPool } from './engine.js';
import { borrowsSyllable, pinyinAudioPaths, pinyinBlendAudio, pinyinCardAudio, splitFinals } from './pinyin-audio-data.js';
import { poems, poetryTopic } from './poetry-data.js';
import { phonicsLessons, phonicsStories } from './phonics-data.js';
import { availablePhonicsAudio } from './phonics-engine.js';
import { englishTopics } from './english-topics.js';
import { publishedReviewDecision } from './audio-review-decisions.js';

export const reviewBatches = [
  { id: 'huihui', subject: 'chinese', name: '慧慧整词录音', guide: '试听学习页使用的整词录音。可对比原逐字播放，检查清晰度、连读变调、轻重和节奏。' },
  { id: 'huihui-borrowed', subject: 'chinese', name: '慧慧借音对照', guide: '逐张对比慧慧与学习页现用的借音录音，判断候选音是否适合这张卡。' },
  { id: 'borrowed', subject: 'chinese', name: '借音拼读组合题', guide: '试听学习页现用录音，先听分解，再听完整音节。' },
  { id: 'pinyin', subject: 'chinese', name: '其余拼音录音', guide: '检查声调、轻声、变调及音节和整词的清晰度。逐字播放的词留意连贯性。' },
  { id: 'poetry', subject: 'chinese', name: '古诗示范朗读', guide: '对照标题、作者和原诗，检查多音字、断句、停连和节奏。' },
  { id: 'phonics', subject: 'english', name: '自然拼读', guide: '对照词卡和故事，检查英语读音及朗读是否完整清楚。' },
  { id: 'campus', subject: 'english', name: '校园英语', guide: '对照词汇、指令和对话，检查录音是否与原文、语境和题目相符。' },
];

function topicRows(subjectId, topicId) {
  const subject = subjects.find(item => item.id === subjectId);
  const stage = featureGroups(subject).find(item => item.items.some(topic => topic.id === topicId));
  const topic = stage.items.find(item => item.id === topicId);
  return (category, item) => ({
    ...item,
    id: `${topicId}/${category.id}/${item.key || item.contentId}`,
    subject: { id: subject.id, name: subject.name },
    stage: { id: stage.id, name: `${stage.stage} · ${stage.name}` },
    topic: { id: topic.id, name: topic.name },
    category: { id: category.id, name: category.name },
  });
}

const playback = (id, label, clips, reference = false) => ({ id, label, clips, reference });
const clipRecord = (path, source, entry) => ({
  path: path || null,
  source,
  ...(entry?.text && { sourceText: entry.text }),
  ...(entry?.sha256 && { sha256: entry.sha256 }),
});

function pinyinPlaybacks(manifest) {
  const overridesByPath = new Map(Object.values(manifest.overrides || {}).map(entry => [`/audio/${entry.file}`, entry]));
  return (id, label, request, reference = false) => {
    const wordPath = request.word && manifest.files[`word:${request.word}`];
    const paths = pinyinAudioPaths(manifest.files, request);
    return playback(id, label, paths.map(path => {
      const override = overridesByPath.get(path);
      const source = override
        ? `${override.project}${override.speaker ? ` · ${override.speaker}` : ''}${override.synthetic ? '（合成）' : ''}`
        : wordPath ? 'audio-cmn · Yue Tan' : 'audio-cmn · Chen Wang';
      return clipRecord(path, source, override);
    }), reference);
  };
}

function pinyinRows(manifest, borrowedSamples) {
  const makeRow = topicRows('chinese', 'pinyin');
  const withAudio = pinyinPlaybacks(manifest);
  const wordsCategory = { id: 'words', name: '常见字词' };
  const tonesCategory = { id: 'tones', name: '声调学习' };
  const blendCategory = { id: 'blend', name: '拼读组合' };
  const confusionCategory = { id: 'confusing', name: '易混专项' };
  const rulesCategory = { id: 'rules', name: '标调与拼写' };
  const basicRows = basics.filter(item => !borrowsSyllable(item)).map(item => makeRow(groups.find(group => group.id === item.group), {
    contentId: item.id, batch: 'pinyin', kind: 'pinyin-card',
    title: item.text, expected: item.text, item, audio: [withAudio('main', '听一听', pinyinCardAudio(item))],
  }));
  const wordRows = vocabulary.map(item => {
    const key = `word:${item.text}`;
    const wholeWord = Boolean(manifest.files[key]);
    const synthetic = wholeWord && manifest.overrides?.[key]?.synthetic;
    return makeRow(wordsCategory, {
      ...(synthetic && { key: `huihui-${item.id}` }),
      contentId: item.id, batch: synthetic ? 'huihui' : 'pinyin', kind: 'pinyin-card',
      title: item.text, expected: `${item.text} · ${item.pinyin}`, item, wholeWord,
      audio: synthetic ? [
        withAudio('main', '听慧慧整词', pinyinCardAudio(item)),
        withAudio('reference', '听原逐字对照', { sounds: item.sounds }, true),
      ] : [withAudio('main', '听一听', pinyinCardAudio(item))],
    });
  });
  const sharedBorrowedSamples = { 'initial-y': 'single-i', 'initial-w': 'single-u' };
  const borrowedSampleRows = basics.filter(borrowsSyllable).map(item => {
    const sampleId = sharedBorrowedSamples[item.id] || item.id;
    const sample = borrowedSamples.files[sampleId];
    const path = `/audio/review/huihui-borrowed/${sampleId}.wav`;
    const sound = marked(item.sound);
    const sourceText = sample?.phonemes ? `${sample.text}（指定读音 ${sound}）` : sample?.text;
    const clip = clipRecord(sample?.path === path && path, `${borrowedSamples.provider} · ${borrowedSamples.voice}（合成）`, { ...sample, text: sourceText });
    return makeRow(groups.find(group => group.id === item.group), {
      key: `huihui-loan-${item.id}`, contentId: item.id, batch: 'huihui-borrowed', kind: 'pinyin-card',
      title: item.text, expected: `${item.text}（对照音节 ${sound}）`, item,
      guide: item.group === 'initial' ? '比较呼读音的起音和清晰度。' : '听韵母部分是否清楚、适合模仿。',
      audio: [
        playback('main', '听慧慧样本', [clip]),
        withAudio('reference', '听现有录音', pinyinCardAudio(item), true),
      ],
    });
  });
  const tones = toneExamples.flatMap(group => group.items.map(item => makeRow(tonesCategory, {
    contentId: item.id, batch: 'pinyin', kind: 'tone',
    title: `${item.text} · ${item.character}`, expected: `${item.text} · ${item.label}`,
    item, audio: [withAudio('main', '听声调示例', { sound: item.sound })],
  })));
  const neutralTones = neutralToneExamples.map(item => makeRow(tonesCategory, {
    key: `neutral-tone-${item.id}`, contentId: item.id, batch: 'pinyin', kind: 'pinyin-card',
    title: `${item.text} · 轻声`, expected: `${item.pinyin}（第二个字读轻声）`, item,
    wholeWord: Boolean(manifest.files[`word:${item.text}`]),
    audio: [withAudio('main', '听轻声示例', { word: item.text })],
  }));
  const quizRow = (category, question, audio, extra = {}) => makeRow(category, {
    contentId: question.id, batch: 'pinyin', kind: 'quiz', question,
    title: question.display || question.prompt, expected: question.answer, audio, ...extra,
  });
  const quizRows = (mode, category, options, group) => questionPool(mode, options).map(question => quizRow(
    category, question, [withAudio('main', '听题目音频', question.audio)], group ? { key: `${group.id}-${question.id}`, context: group.name } : {},
  ));
  const blends = questionPool('blend').map(question => {
    const split = Object.hasOwn(splitFinals, question.parts[1]);
    return quizRow(blendCategory, question, [
      withAudio('parts', '听分解', pinyinBlendAudio(question.parts)),
      withAudio('main', '听完整拼读', question.audio),
    ], { batch: split ? 'borrowed' : 'pinyin' });
  });
  const rows = [
    ...borrowedSampleRows, ...basicRows, ...wordRows, ...tones, ...neutralTones, ...blends,
    ...quizRows('tonequiz', tonesCategory),
    ...Object.entries(confusionSets).flatMap(([id, group]) => quizRows('confusing', confusionCategory, { confusion: id }, { id, name: group.name })),
    ...quizRows('rules', rulesCategory),
  ];
  const coveredPaths = new Set(rows.flatMap(row => {
    const approved = publishedReviewDecision(row)?.status === 'approved';
    return row.audio.filter(action => !approved || !action.reference)
      .flatMap(action => action.clips.map(clip => clip.path));
  }));
  const fallbackSyllables = Object.entries(manifest.files).filter(([key, path]) => key.startsWith('syllable:') && !coveredPaths.has(path));
  return [...rows, ...fallbackSyllables.map(([key]) => {
    const sound = key.slice('syllable:'.length);
    const text = marked(sound);
    const uses = words.filter(word => word.sounds.includes(sound)).map(word => word.text);
    const context = uses.length ? `逐字播放备用音节，用于 ${uses.join('、')}。当前站内优先播放整词。` : '备用音节。';
    return makeRow(wordsCategory, {
      contentId: key, batch: 'pinyin', kind: 'tone', title: `${text} · 备用音节`,
      expected: text, context, item: { text, label: '逐字播放备用音节' },
      audio: [withAudio('main', '听备用音节', { sound })],
    });
  })];
}

function poetryRows(manifest) {
  const makeRow = topicRows('chinese', poetryTopic.id);
  return poems.map(poem => {
    const entry = manifest.files[poem.id];
    const path = `/audio/poetry/${poem.id}.wav`;
    return makeRow(poetryTopic.categories.find(item => item.id === poem.category), {
      contentId: poem.id, batch: 'poetry', kind: 'poem', title: poem.title, poem,
      expected: `${poem.title}。${poem.dynasty}，${poem.author}。${poem.lines.map(([line]) => line).join('')}`,
      audio: [playback('main', '听示范朗读', [clipRecord(entry?.status === 'ready' && entry.path === path && path, `${manifest.provider} · ${manifest.voice}（合成）`, entry)])],
    });
  });
}

function phonicsRows(manifest) {
  const makeRow = topicRows('english', 'phonics');
  return phonicsLessons.flatMap(lesson => {
    const category = { id: lesson.id, name: `第 ${lesson.number} 课 · ${lesson.title}` };
    const audioFor = (item, label) => {
      const entry = manifest.files[item.id];
      const path = `/audio/phonics/${item.id}.mp3`;
      return [playback('main', label, [clipRecord(availablePhonicsAudio(entry) && entry.path === path && path, 'WordAudio / gTTS（英式英语合成）', entry)])];
    };
    return [
      ...lesson.words.map(word => makeRow(category, {
        contentId: word.id, batch: 'phonics', kind: 'phonics-word',
        title: word.text, expected: word.text, word, audio: audioFor(word, '听一听'),
      })),
      ...phonicsStories.filter(story => story.lessonId === lesson.id).map(story => makeRow(category, {
        contentId: story.id, batch: 'phonics', kind: 'phonics-story',
        title: story.title, expected: story.text, story, audio: audioFor(story, '听故事'),
      })),
    ];
  });
}

const englishPlayback = (clip, label) => playback(
  clip.id, label, [clipRecord(`/audio/english/${clip.id}.mp3`, 'WordAudio / gTTS（英式英语合成）', clip)],
);

function campusRows() {
  return englishTopics.flatMap(topic => {
    const makeRow = topicRows('english', topic.id);
    const categoryOf = item => topic.categories.find(category => category.id === item.category);
    const lessons = topic.lessons.map(lesson => {
      const audio = [
        ...(lesson.word ? [englishPlayback(lesson.word, '听单词'), englishPlayback(lesson.phrase, '听短语')] : []),
        ...(lesson.clip ? [englishPlayback(lesson.clip, '听指令')] : []),
        ...(lesson.lines || []).map(({ clip }, index) => englishPlayback(clip, `听第 ${index + 1} 句`)),
        ...(lesson.variation ? [englishPlayback(lesson.variation, '听替换句')] : []),
      ];
      return makeRow(categoryOf(lesson), {
        contentId: lesson.id, batch: 'campus', kind: 'english-lesson', title: lesson.title, lesson, audio,
        expected: audio.map(item => item.clips[0].sourceText).join('\n'),
      });
    });
    return [...lessons, ...topic.questions.filter(question => question.clip).map(question => makeRow(categoryOf(question), {
      contentId: question.id, batch: 'campus', kind: 'english-quiz', title: question.prompt, question,
      expected: question.clip.text, audio: [englishPlayback(question.clip, '播放题目')],
    }))];
  });
}

export function audioReviewCatalog({ pinyin, poetry, phonics, borrowedSamples }) {
  return [
    ...pinyinRows(pinyin, borrowedSamples),
    ...poetryRows(poetry),
    ...phonicsRows(phonics),
    ...campusRows(),
  ];
}

export const reviewStatuses = [
  ['unreviewed', '未审核'], ['approved', '通过'], ['needs-change', '需修改'], ['recheck', '待复核'],
];

function createExportTable() {
  const values = [];
  const indexes = new Map();
  return {
    values,
    add(value) {
      const key = JSON.stringify(value);
      if (!indexes.has(key)) {
        indexes.set(key, values.length);
        values.push(value);
      }
      return indexes.get(key);
    },
  };
}

export function createAudioReviewExport(rows, decisions, scope, createdAt = new Date()) {
  const locations = createExportTable();
  const sources = createExportTable();
  const clips = createExportTable();
  const notes = createExportTable();
  const items = rows.map(row => {
    const decision = decisions.get(row.id);
    const status = decision?.status;
    const note = decision?.note?.trim();
    const locationIndex = locations.add({
      stage: row.stage, topic: row.topic, category: row.category,
      ...(!scope.batch && { batch: row.batch }),
    });
    return {
      id: row.id, contentId: row.contentId, locationIndex, title: row.title,
      ...(row.expected !== row.title && { expected: row.expected }),
      ...(row.context && { context: row.context }),
      audio: row.audio.map(({ id, label, clips: playbackClips, reference }) => ({
        id, label,
        clipIndexes: playbackClips.map(({ source, ...clip }) => clips.add({ ...clip, sourceIndex: sources.add(source) })),
        ...(reference && { reference: true }),
      })),
      ...(status && status !== 'unreviewed' && { status }),
      ...(note && { noteIndex: notes.add(note) }),
    };
  });
  return {
    format: 'bunny-garden-audio-review', version: 2, exportedAt: createdAt.toISOString(), scope,
    total: items.length, reviewed: items.filter(item => item.status).length,
    locations: locations.values, sources: sources.values, clips: clips.values, notes: notes.values, items,
  };
}
