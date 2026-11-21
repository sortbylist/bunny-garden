import { basics, vocabulary, groups, modes, confusionSets, subjects, featureGroups } from './data.js';
import { chineseTopics } from './chinese-topics.js';
import { mathTopics } from './math-topics.js';
import { englishTopics } from './english-topics.js';
import { hanziCategories, hanziLessons, hanziQuestions } from './hanzi-data.js';
import { phonicsLessons, phonicsWords, phonicsStories, phonicsModes } from './phonics-data.js';
import { phonicsQuestionById, normalizePhonicsState } from './phonics-engine.js';
import { normalizeTopic, topicDefaults } from './chinese-engine.js';
import { createHanziState, normalizeHanziState } from './hanzi-engine.js';
import { rewardTopics } from './reward-curriculum.js';
import { emptyRewards } from './rewards.js';
import { defaultState } from './engine.js';

export const dataVersion = 1;
export const invalidData = () => { throw new Error('学习数据不完整或格式有误，本机记录未修改。'); };
export const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const indexByCategory = items => new Map(items.map(item => [item.id, item.category]));
const pinyinItems = new Map([...basics.map(item => [item.id, item.group]), ...vocabulary.map(item => [item.id, 'words'])]);
const phonicsWordsByLesson = new Map(phonicsWords.map(word => [word.id, word.lessonId]));
const phonicsQuestionLesson = id => phonicsQuestionById.get(id)?.lessonId;
const phonicsLessonIds = new Set(phonicsLessons.map(lesson => lesson.id));
const topicLocations = new Map(rewardTopics.map(topic => [topic.id, topic]));
const phonicsTopic = topicLocations.get('phonics');
const pinyinCategories = [...groups.map(group => group.id), 'words', 'tones', 'blend', 'confusing', 'rules'];
const pinyinStage = featureGroups(subjects.find(subject => subject.id === 'chinese'))
  .find(stage => stage.items.some(item => item.id === 'pinyin'));
const pinyin = { id: 'pinyin', subject: 'chinese', stageId: pinyinStage.id, sections: pinyinCategories.map(id => ({ id: `pinyin/${id}` })) };
topicLocations.set(pinyin.id, pinyin);

const learningTopics = [
  { id: 'hanzi-structure', categories: hanziCategories, lessons: hanziLessons, questions: hanziQuestions },
  ...chineseTopics, ...mathTopics, ...englishTopics,
].map(topic => ({
  topic,
  location: topicLocations.get(topic.id),
  lessons: indexByCategory(topic.lessons),
  questions: indexByCategory(topic.questions),
}));

const pinyinOptionFields = ['mode', 'group', 'wordScope', 'confusion', 'length', 'tonePractice', 'modeGroups'];
const topicOptionFields = ['category', 'lessonId', 'view', 'showPinyin', 'practiceLength'];
const phonicsOptionFields = ['lessonId', 'mode', 'scope', 'length'];
const selectFields = (value, fields) => Object.fromEntries(fields.map(field => [field, value[field]]));
const topicNode = (data, location) => data.subjects[location.subject].stages[location.stageId].topics[location.id];
const sectionKey = section => section.id.split('/')[1];
const isString = value => typeof value === 'string';
const validate = (condition) => { if (!condition) invalidData(); };

function createDocument(state) {
  const { mastery, ...rewards } = state.rewards || emptyRewards();
  const pinyinModes = Object.fromEntries(Object.entries(state.navigationSelections)
    .filter(([key]) => key.startsWith('pinyin-modes:')));
  const data = {
    version: dataVersion,
    profile: { nickname: state.nickname, rewards },
    settings: state.settings,
    navigation: { subject: state.subject, collapsed: state.collapsed, pinyinModes },
    subjects: {},
  };
  for (const subject of subjects) {
    const stages = featureGroups(subject);
    const selected = state.features[subject.id];
    const activeStage = stages.find(stage => stage.items.some(item => item.id === selected)) || stages[0];
    data.subjects[subject.id] = {
      selectedStage: activeStage.id,
      stages: Object.fromEntries(stages.map(stage => {
        const remembered = stage === activeStage && selected
          ? selected : state.navigationSelections[`features-${subject.id}:${stage.id}`];
        const selectedTopic = stage.items.find(item => item.id === remembered)?.id || stage.items[0].id;
        return [stage.id, { selectedTopic, topics: {} }];
      })),
    };
  }
  for (const location of [pinyin, ...rewardTopics]) {
    const stage = data.subjects[location.subject].stages[location.stageId];
    stage.topics[location.id] = {
      categories: Object.fromEntries(location.sections.map(section => {
        const evidence = mastery[section.id];
        return [sectionKey(section), evidence ? { mastery: evidence } : {}];
      })),
    };
  }
  return data;
}

function bucket(node, category) {
  if (!category) return node;
  const result = node.categories[category];
  validate(Object.hasOwn(node.categories, category));
  return result;
}

function addRecord(node, category, field, value) {
  (bucket(node, category)[field] ||= []).push(value);
}

function addEntry(node, category, field, key, value) {
  (bucket(node, category)[field] ||= {})[key] = value;
}

export function pinyinQuestionCategory(question) {
  return pinyinItems.get(question.itemId) || pinyinQuestionIdCategory(question.id);
}

function pinyinQuestionIdCategory(id) {
  if (id.startsWith('tone:')) return 'tones';
  if (id.startsWith('rule:')) return 'rules';
  if (id.startsWith('confusing:')) return 'confusing';
  if (id.startsWith('hanzi:') || id.startsWith('pinyin:')) return 'words';
  return 'blend';
}

export function pinyinPracticeCategory(key) {
  const [mode, group] = key.split(':');
  if (['sequence', 'random', 'listen', 'audio', 'section-practice'].includes(mode)) return group === 'all' ? null : group;
  if (['hanzi', 'pinyin', 'match'].includes(mode)) return 'words';
  if (mode === 'tonequiz') return 'tones';
  return ['tones', 'blend', 'rules', 'confusing'].includes(mode) ? mode : null;
}

export function phonicsPracticeLesson(state) {
  if (state.mode === 'alphabet') return 'lesson-1';
  if (['diagnostic', 'review', 'favorites'].includes(state.mode) || state.scope === 'all' && !['learn', 'assessment'].includes(state.mode)) return null;
  return state.lessonId;
}

const phonicsKeyLesson = key => {
  const [mode, scope, lessonId] = key.split(':');
  return phonicsPracticeLesson({ mode, scope, lessonId });
};

function favoriteLocation(ref) {
  const [subject, feature, kind, ...parts] = ref.split('/');
  const id = parts.join('/');
  if (subject === 'english' && feature === 'phonics') {
    const lesson = kind === 'question' ? phonicsQuestionLesson(id) : kind === 'story'
      ? phonicsStories.find(story => story.id === id)?.lessonId : id;
    validate(phonicsLessonIds.has(lesson));
    return [phonicsTopic, lesson];
  }
  const location = topicLocations.get(feature);
  validate(location?.subject === subject);
  if (feature === 'pinyin') {
    return [location, kind === 'question' ? pinyinQuestionIdCategory(id.split('?options=', 1)[0]) : kind === 'match' ? 'words' : 'tones'];
  }
  const entry = learningTopics.find(item => item.topic.id === feature);
  return [location, kind === 'entry' ? null : (kind === 'question' ? entry.questions : entry.lessons).get(id)];
}

export function encodeLearningData(state) {
  const data = createDocument(state);
  const pinyinNode = topicNode(data, pinyin);
  pinyinNode.options = selectFields(state, pinyinOptionFields);
  for (const field of ['seen', 'known', 'favorites']) {
    for (const id of state[field]) addRecord(pinyinNode, pinyinItems.get(id), field, id);
  }
  for (const entry of state.mistakes) addRecord(pinyinNode, pinyinQuestionCategory(entry.question), 'mistakes', entry);
  for (const [key, session] of Object.entries(state.sessions)) addEntry(pinyinNode, pinyinPracticeCategory(key), 'sessions', key, session);

  for (const { topic, location, lessons, questions } of learningTopics) {
    const hanzi = topic.id === 'hanzi-structure';
    const progress = hanzi ? state.hanzi : state.topics[topic.id];
    const saved = progress || (hanzi ? createHanziState() : topicDefaults(topic));
    const node = topicNode(data, location);
    node.options = selectFields(saved, topicOptionFields);
    if (saved.view === 'practice') node.options.view = 'learn';
    if (topic.id === 'dictionary') node.lookup = saved.lookup;
    if (hanzi && saved.strokeStep) bucket(node, saved.category).strokeStep = saved.strokeStep;
    for (const id of saved.known) addRecord(node, lessons.get(id), 'known', id);
    for (const field of ['mistakes', 'practiceSeen']) {
      for (const id of saved[field]) addRecord(node, questions.get(id), field, id);
    }
    for (const [id, activity] of Object.entries(saved.activities || {})) addEntry(node, lessons.get(id), 'activities', id, activity);
    if (saved.round) {
      const { scope } = saved.round;
      bucket(node, topic.categories.some(category => category.id === scope) ? scope : null).round = encodeTopicRound(saved.round);
    }
    for (const [key, round] of Object.entries(saved.rounds || {})) {
      if (round === saved.round && key === `${round.scope}:${saved.practiceLength}`) continue;
      const category = topic.categories.some(item => item.id === round.scope) ? round.scope : null;
      addEntry(node, category, 'rounds', key, encodeTopicRound(round));
    }
  }
  for (const record of state.history) {
    const { topicId, category, ...entry } = record;
    addRecord(topicNode(data, topicLocations.get(topicId || 'pinyin')), category, 'history', entry);
  }

  const phonics = state.phonics;
  const phonicsNode = topicNode(data, phonicsTopic);
  phonicsNode.options = selectFields(phonics, phonicsOptionFields);
  const phonicsBucket = lesson => bucket(phonicsNode, lesson);
  for (const field of ['seen', 'known', 'favorites', 'mistakes']) {
    const lessonFor = field === 'mistakes' ? phonicsQuestionLesson : id => phonicsWordsByLesson.get(id);
    for (const id of phonics[field]) addRecord(phonicsBucket(lessonFor(id)), null, field, id);
  }
  for (const [id, review] of Object.entries(phonics.reviews)) addEntry(phonicsBucket(phonicsQuestionLesson(id)), null, 'reviews', id, review);
  for (const field of ['positions', 'sessions']) {
    for (const [key, value] of Object.entries(phonics[field])) addEntry(phonicsBucket(phonicsKeyLesson(key)), null, field, key, value);
  }
  for (const { lessonId, ...entry } of phonics.history) addRecord(phonicsBucket(lessonId), null, 'history', entry);
  for (const ref of state.savedContent) {
    const [location, category] = favoriteLocation(ref);
    addRecord(topicNode(data, location), category, 'savedContent', ref);
  }
  return data;
}

function encodeTopicRound(round) {
  return {
    ...round,
    questions: round.questions.map(({ id, options }) => ({ id, options })),
    responses: round.questions.map((_, index) => round.responses[index] ?? null),
  };
}

function record(value, required, optional = []) {
  validate(isRecord(value) && required.every(field => Object.hasOwn(value, field)) &&
    Object.keys(value).every(field => required.includes(field) || optional.includes(field)));
}

export function checkTree(value, depth = 0) {
  if (depth > 80) invalidData();
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) invalidData();
    checkTree(entry, depth + 1);
  }
}

const stringArray = values => Array.isArray(values) && values.every(isString);
const isIndex = value => Number.isInteger(value) && value >= 0;
const checkQuizLength = value => validate([5, 10, 20].includes(value));
const checkStringMap = value => validate(isRecord(value) && Object.values(value).every(isString));
const readList = (node, field, check) => {
  const values = Object.hasOwn(node, field) ? node[field] : [];
  validate(Array.isArray(values) && values.every(check));
  return values;
};
const readMap = (node, field, check) => {
  const values = Object.hasOwn(node, field) ? node[field] : {};
  validate(isRecord(values) && Object.entries(values).every(([key, value]) => check(key, value)));
  return values;
};

function checkHistory(entry) {
  return isRecord(entry) && isString(entry.name) && Number.isFinite(entry.time) &&
    isIndex(entry.correct) && isIndex(entry.total) && entry.correct <= entry.total;
}

function checkQuestion(question) {
  return isRecord(question) && isString(question.id) && isString(question.kind) && isString(question.answer) &&
    Array.isArray(question.options) && question.options.every(option => isString(option) ||
      isRecord(option) && isString(option.value) && isString(option.sound)) &&
    (question.kind !== 'blend' || stringArray(question.parts));
}

function checkPinyinSession(key, session) {
  const [mode] = key.split(':');
  if (!isRecord(session)) return false;
  if (['sequence', 'random', 'favorites'].includes(mode)) {
    return stringArray(session.ids) && session.ids.every(id => pinyinItems.has(id)) && isIndex(session.index);
  }
  if (mode === 'match') {
    return ['pairs', 'right', 'matched', 'wrong'].every(field => stringArray(session[field]) &&
      session[field].every(id => pinyinItems.get(id) === 'words')) &&
      (session.left === null || pinyinItems.get(session.left) === 'words') &&
      isIndex(session.attempts) && typeof session.finished === 'boolean';
  }
  if (mode === 'tones') return !Object.keys(session).length;
  return Array.isArray(session.questions) && session.questions.every(checkQuestion) &&
    Array.isArray(session.responses) && session.responses.every(response => response === null ||
      isRecord(response) && (response.answer === null || isString(response.answer))) && isIndex(session.index);
}

function restorePinyin(state, node) {
  record(node.options, pinyinOptionFields);
  const { mode, group, wordScope, confusion, length, tonePractice, modeGroups } = node.options;
  validate(modes.some(item => item.id === mode) && (group === 'all' || groups.some(item => item.id === group)) &&
    ['all', 'characters', 'words'].includes(wordScope) && Object.hasOwn(confusionSets, confusion) && typeof tonePractice === 'boolean');
  checkQuizLength(length);
  checkStringMap(modeGroups);
  Object.assign(state, node.options);
  for (const [category, part] of [[null, node], ...Object.entries(node.categories)]) {
    for (const field of ['seen', 'known', 'favorites']) {
      state[field].push(...readList(part, field, id => pinyinItems.get(id) === category));
    }
    state.mistakes.push(...readList(part, 'mistakes', entry => isRecord(entry) && checkQuestion(entry.question) && pinyinQuestionCategory(entry.question) === category));
    Object.assign(state.sessions, readMap(part, 'sessions', (key, session) => pinyinPracticeCategory(key) === category && checkPinyinSession(key, session)));
    state.history.push(...readList(part, 'history', checkHistory).map(entry => ({ ...entry, ...(category ? { category } : {}) })));
  }
}

function restoreTopic(state, node, definition) {
  const { topic, lessons, questions } = definition;
  const hanzi = topic.id === 'hanzi-structure';
  record(node.options, topicOptionFields);
  const { category, lessonId, view, showPinyin, practiceLength } = node.options;
  validate(lessons.get(lessonId) === category && topic.categories.some(item => item.id === category) &&
    (['learn', 'quiz'].includes(view) || topic.id === 'dictionary' && view === 'lookup') &&
    typeof showPinyin === 'boolean' && [10, 20, 30].includes(practiceLength));
  const saved = { ...node.options, known: [], mistakes: [], practiceSeen: [], activities: {}, lookup: node.lookup };
  for (const [id, part] of [[null, node], ...Object.entries(node.categories)]) {
    saved.known.push(...readList(part, 'known', value => lessons.get(value) === id));
    for (const field of ['mistakes', 'practiceSeen']) {
      saved[field].push(...readList(part, field, value => questions.get(value) === id));
    }
    Object.assign(saved.activities, readMap(part, 'activities', (key, value) => lessons.get(key) === id && isRecord(value)));
    state.history.push(...readList(part, 'history', checkHistory).map(entry => ({ ...entry, topicId: topic.id, ...(id ? { category: id } : {}) })));
    if (Object.hasOwn(part, 'round')) {
      validate(!saved.round && isRecord(part.round) && (id ? part.round.scope === id : ['all', 'review'].includes(part.round.scope)));
      saved.round = part.round;
    }
    if (Object.hasOwn(part, 'rounds')) Object.assign(saved.rounds ||= {}, readMap(part, 'rounds', (key, round) => isRecord(round) &&
      (id ? round.scope === id : ['all', 'review'].includes(round.scope)) &&
      [10, 20, 30].some(length => key === `${round.scope}:${length}`)));
  }
  if (hanzi) saved.strokeStep = node.categories[category].strokeStep;
  const result = hanzi ? normalizeHanziState(saved) : normalizeTopic(topic, saved);
  validate(!saved.round || result.round);
  validate(Object.keys(saved.rounds || {}).every(key => Object.hasOwn(result.rounds, key)));
  if (hanzi) state.hanzi = result;
  else state.topics[topic.id] = result;
}

function restorePhonics(state, node) {
  record(node.options, phonicsOptionFields);
  const { lessonId, mode, scope, length } = node.options;
  validate(phonicsLessonIds.has(lessonId) && [...phonicsModes.map(item => item.id), 'alphabet', 'diagnostic', 'assessment'].includes(mode) &&
    ['lesson', 'all'].includes(scope));
  checkQuizLength(length);
  const saved = { ...state.phonics, ...node.options };
  const parts = [[null, node], ...Object.entries(node.categories)];
  for (const [lesson, part] of parts) {
    for (const field of ['seen', 'known', 'favorites']) {
      saved[field].push(...readList(part, field, id => phonicsWordsByLesson.get(id) === lesson));
    }
    saved.mistakes.push(...readList(part, 'mistakes', id => phonicsQuestionLesson(id) === lesson));
    Object.assign(saved.reviews, readMap(part, 'reviews', (key, review) => phonicsQuestionLesson(key) === lesson &&
      isRecord(review) && isIndex(review.success) && review.success <= 3 && Number.isFinite(review.due)));
    Object.assign(saved.positions, readMap(part, 'positions', (key, value) => phonicsKeyLesson(key) === lesson &&
      isRecord(value) && stringArray(value.ids) && value.ids.every(id => phonicsWordsByLesson.has(id)) && isIndex(value.index)));
    Object.assign(saved.sessions, readMap(part, 'sessions', (key, value) => phonicsKeyLesson(key) === lesson &&
      isRecord(value) && isString(value.id) && stringArray(value.ids) && value.ids.length <= 20 &&
      new Set(value.ids).size === value.ids.length && value.ids.every(id => phonicsQuestionById.has(id))));
    saved.history.push(...readList(part, 'history', entry => checkHistory(entry) && isString(entry.id) &&
      entry.total > 0 && entry.total <= 20 && isIndex(entry.skipped) && entry.correct + entry.skipped <= entry.total)
      .map(entry => ({ ...entry, ...(lesson ? { lessonId: lesson } : {}) })));
  }
  saved.history.sort((first, second) => first.time - second.time);
  state.phonics = normalizePhonicsState(saved);
}

const categoryFields = {
  pinyin: ['seen', 'known', 'favorites', 'mistakes', 'sessions', 'savedContent', 'history'],
  phonics: ['seen', 'known', 'favorites', 'mistakes', 'reviews', 'positions', 'sessions', 'savedContent', 'history', 'mastery'],
  topic: ['known', 'mistakes', 'practiceSeen', 'activities', 'round', 'rounds', 'savedContent', 'history', 'mastery'],
};

function readCurriculum(state, data) {
  const nodes = new Map();
  record(data.subjects, [], subjects.map(subject => subject.id));
  for (const subject of subjects) {
    const saved = data.subjects[subject.id];
    if (saved === undefined) continue;
    const stages = featureGroups(subject);
    const locations = [...topicLocations.values()].filter(location => location.subject === subject.id);
    record(saved, ['selectedStage', 'stages']);
    validate(stages.some(stage => stage.id === saved.selectedStage));
    record(saved.stages, [saved.selectedStage], stages.map(stage => stage.id));
    for (const definition of stages) {
      const stage = saved.stages[definition.id];
      if (stage === undefined) continue;
      record(stage, ['selectedTopic', 'topics']);
      validate(definition.items.some(item => item.id === stage.selectedTopic));
      record(stage.topics, [stage.selectedTopic], locations.filter(location => location.stageId === definition.id).map(location => location.id));
      state.navigationSelections[`features-${subject.id}:${definition.id}`] = stage.selectedTopic;
    }
    state.features[subject.id] = saved.stages[saved.selectedStage].selectedTopic;
    for (const location of locations) {
      const node = saved.stages[location.stageId]?.topics[location.id];
      if (node === undefined) continue;
      const isPinyin = location === pinyin;
      const fields = location.phonics ? categoryFields.phonics : isPinyin ? categoryFields.pinyin : categoryFields.topic;
      const shared = isPinyin ? ['sessions', 'history'] : location.phonics ? ['positions', 'sessions', 'history'] : ['round', 'rounds', 'history'];
      if (location.id === 'dictionary') shared.push('lookup', 'savedContent');
      record(node, ['categories', 'options'], shared);
      validate(isRecord(node.options));
      const selectedCategory = location.phonics ? node.options.lessonId : node.options.category;
      record(node.categories, isString(selectedCategory) ? [selectedCategory] : [], location.sections.map(sectionKey));
      for (const section of location.sections) {
        const key = sectionKey(section);
        const part = node.categories[key];
        if (part === undefined) continue;
        record(part, [], location.id === 'hanzi-structure' ? [...fields.filter(field => field !== 'activities'), 'strokeStep'] : fields);
        if (Object.hasOwn(part, 'strokeStep')) validate(isIndex(part.strokeStep) && node.options.category === key);
        if (Object.hasOwn(part, 'mastery')) {
          const evidence = part.mastery;
          validate(isRecord(evidence) && evidence.version === 1 && Number.isFinite(evidence.time) &&
            stringArray(evidence.questionIds) && stringArray(evidence.correctIds));
          state.rewards.mastery[section.id] = evidence;
        }
      }
      for (const [category, part] of [[null, node], ...Object.entries(node.categories)]) {
        state.savedContent.push(...readList(part, 'savedContent', ref => {
          if (!isString(ref)) return false;
          const [target, targetCategory] = favoriteLocation(ref);
          return target === location && (targetCategory ?? null) === category;
        }));
      }
      nodes.set(location.id, node);
    }
  }
  return nodes;
}

export function decodeLearningData(data) {
  checkTree(data);
  record(data, ['version', 'profile', 'settings', 'navigation', 'subjects']);
  validate(data.version === dataVersion);
  const state = defaultState();
  record(data.profile, ['nickname', 'rewards']);
  validate(isString(data.profile.nickname));
  state.nickname = data.profile.nickname;
  const rewards = data.profile.rewards;
  record(rewards, ['version', 'events', 'unlocks', 'pending', 'unlockDetails', 'equipped']);
  validate(rewards.version === 1 && Array.isArray(rewards.events) && rewards.events.every(event =>
    isRecord(event) && isString(event.id) && isString(event.kind) && isString(event.label) && Number.isFinite(event.stars) && event.stars >= 0) &&
    stringArray(rewards.pending) && isRecord(rewards.unlocks) && isRecord(rewards.unlockDetails));
  record(rewards.equipped, Object.keys(emptyRewards().equipped));
  validate(Object.values(rewards.equipped).every(id => id === null || isString(id)));
  state.rewards = { ...rewards, mastery: {} };
  record(data.settings, [], Object.keys(state.settings));
  validate(Object.values(data.settings).every(value => typeof value === 'boolean'));
  Object.assign(state.settings, data.settings);
  record(data.navigation, ['subject', 'collapsed', 'pinyinModes']);
  validate(subjects.some(subject => subject.id === data.navigation.subject) &&
    isRecord(data.subjects) && Object.hasOwn(data.subjects, data.navigation.subject) &&
    typeof data.navigation.collapsed === 'boolean');
  checkStringMap(data.navigation.pinyinModes);
  validate(Object.keys(data.navigation.pinyinModes).every(key => key.startsWith('pinyin-modes:')));
  state.subject = data.navigation.subject;
  state.collapsed = data.navigation.collapsed;
  state.navigationSelections = { ...data.navigation.pinyinModes };
  const nodes = readCurriculum(state, data);
  if (nodes.has(pinyin.id)) restorePinyin(state, nodes.get(pinyin.id));
  for (const entry of learningTopics) {
    const node = nodes.get(entry.topic.id);
    if (node) restoreTopic(state, node, entry);
    else if (entry.topic.id === 'hanzi-structure') state.hanzi = createHanziState();
    else state.topics[entry.topic.id] = topicDefaults(entry.topic);
  }
  if (nodes.has(phonicsTopic.id)) restorePhonics(state, nodes.get(phonicsTopic.id));
  state.history.sort((first, second) => first.time - second.time);
  return state;
}
