import { shuffle, recordAnswer, roundStats } from './engine.js';
import { dictionaryLookup } from './dictionary-data.js';
import { practiceLengths, selectPractice } from './chinese-practice.js';

export function topicDefaults(topic) {
  return { category: topic.categories[0].id, lessonId: topic.lessons[0].id, view: 'learn', known: [], mistakes: [], round: null, activities: {}, lookup: { method: 'sound', selections: [] }, showPinyin: true, practiceLength: 10, practiceSeen: [] };
}

export function updateTopicActivity(topic, state, action, value) {
  const lesson = topic.lessons.find(item => item.id === state.lessonId);
  if (state.view !== 'learn' || !lesson?.activity) return;
  const activity = lesson.activity;
  const saved = state.activities[lesson.id] ||= { text: '', order: [], checked: false, showExample: false };
  if (action === 'draft' && activity.type === 'write' && typeof value === 'string') saved.text = value.slice(0, 500);
  if (action === 'example') saved.showExample = !saved.showExample;
  if (activity.type !== 'order') return;
  const index = Number(value);
  if (action === 'pick' && Number.isInteger(index) && index >= 0 && index < activity.tokens.length && !saved.order.includes(index)) { saved.order.push(index); saved.checked = false; }
  if (action === 'undo') { saved.order.pop(); saved.checked = false; }
  if (action === 'clear') { saved.order = []; saved.checked = false; saved.showExample = false; }
  if (action === 'check' && saved.order.length === activity.tokens.length) saved.checked = true;
}

export function normalizeTopic(topic, saved) {
  const state = topicDefaults(topic);
  if (!saved || typeof saved !== 'object') return state;
  state.showPinyin = saved.showPinyin !== false;
  if (practiceLengths.includes(saved.practiceLength)) state.practiceLength = saved.practiceLength;
  state.practiceSeen = [...new Set(Array.isArray(saved.practiceSeen) ? saved.practiceSeen.filter(id => topic.questions.some(item => item.id === id)) : [])];
  if (topic.categories.some(item => item.id === saved.category)) state.category = saved.category;
  const lessons = topic.lessons.filter(item => item.category === state.category);
  state.lessonId = lessons.find(item => item.id === saved.lessonId)?.id || lessons[0].id;
  for (const [field, items] of [['known', topic.lessons], ['mistakes', topic.questions]]) {
    state[field] = [...new Set(Array.isArray(saved[field]) ? saved[field].filter(id => items.some(item => item.id === id)) : [])];
  }
  for (const lesson of topic.lessons.filter(item => item.activity)) {
    const entry = saved.activities?.[lesson.id];
    if (!entry || typeof entry !== 'object') continue;
    const order = lesson.activity.type === 'order' && Array.isArray(entry.order) ? [...new Set(entry.order.filter(index => Number.isInteger(index) && index >= 0 && index < lesson.activity.tokens.length))] : [];
    state.activities[lesson.id] = {
      text: typeof entry.text === 'string' ? entry.text.slice(0, 500) : '',
      order, checked: Boolean(entry.checked && order.length === lesson.activity.tokens?.length),
      showExample: entry.showExample === true,
    };
  }
  if (topic.id === 'dictionary') {
    const method = saved.lookup?.method === 'radical' ? 'radical' : 'sound';
    state.lookup = { method, selections: dictionaryLookup(method, saved.lookup?.selections).selections };
    if (saved.view === 'lookup') state.view = 'lookup';
  }
  const round = saved.round;
  if (!round || !['all', 'review', ...topic.categories.map(item => item.id)].includes(round.scope) ||
      !Array.isArray(round.questions) || !round.questions.length || round.questions.length > 30 ||
      !Number.isInteger(round.index) || round.index < 0 || round.index >= round.questions.length ||
      !Array.isArray(round.responses) || new Set(round.questions.map(item => item?.id)).size !== round.questions.length) return state;
  const questions = [];
  for (const item of round.questions) {
    const canonical = topic.questions.find(question => question.id === item?.id);
    if (!canonical || (round.scope !== 'all' && round.scope !== 'review' && canonical.category !== round.scope)) return state;
    const options = Array.isArray(item.options) && item.options.length === canonical.options.length && new Set(item.options).size === canonical.options.length && item.options.every(option => canonical.options.includes(option)) ? [...item.options] : [...canonical.options];
    questions.push({ ...canonical, options });
  }
  const responses = questions.map((question, index) => {
    const response = round.responses[index];
    return response && (response.answer === null || question.options.includes(response.answer)) ? { answer: response.answer, correct: response.answer === question.answer, skipped: response.answer === null } : null;
  });
  if (responses.slice(0, round.index).some(response => !response)) return state;
  const selected = questions[round.index].options.includes(round.selected) ? round.selected : null;
  const revealed = Boolean(round.revealed && responses[round.index] && (selected === questions[round.index].answer || round.selected === null));
  state.round = { scope: round.scope, questions, responses, index: round.index, selected, revealed, finished: Boolean(round.finished && round.index === questions.length - 1 && revealed && responses.every(Boolean)) };
  if (saved.view === 'quiz') state.view = 'quiz';
  return state;
}

export function startTopicRound(topic, state, scope) {
  if (!['all', 'review', ...topic.categories.map(item => item.id)].includes(scope)) return false;
  const pool = topic.questions.filter(item => scope === 'all' || (scope === 'review' ? state.mistakes.includes(item.id) : item.category === scope));
  if (!pool.length) return false;
  const selection = selectPractice(pool, scope === 'all' ? topic.categories.map(item => item.id) : [], state.practiceLength || 10, state.practiceSeen || [], shuffle);
  const questions = selection.questions;
  if (scope !== 'review') state.practiceSeen = selection.seenIds;
  state.round = { scope, questions: questions.map(item => ({ ...item, options: shuffle(item.options) })), index: 0, responses: [], selected: null, revealed: false, finished: false };
  state.view = 'quiz';
  return true;
}

export function answerTopic(state, answer) {
  const round = state.round;
  if (state.view !== 'quiz' || !round || round.finished || (answer !== null && !round.questions[round.index].options.includes(answer))) return null;
  const result = recordAnswer(round, answer);
  if (!result) return null;
  const reviewed = round.scope === 'review' && result.first && result.correct;
  if (result.first && !result.correct && !state.mistakes.includes(result.question.id)) state.mistakes.push(result.question.id);
  if (reviewed) state.mistakes = state.mistakes.filter(id => id !== result.question.id);
  return { ...result, reviewed };
}

export function advanceTopic(topic, state) {
  const round = state.round;
  if (state.view !== 'quiz' || !round?.revealed || round.finished) return null;
  if (round.index < round.questions.length - 1) { round.index++; round.selected = null; round.revealed = false; return null; }
  round.finished = true;
  const stats = roundStats(round);
  return { time: Date.now(), name: `${topic.name}${round.scope === 'review' ? ' · 错题本' : ''}`, total: stats.total, correct: stats.correct };
}
