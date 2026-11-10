import { shuffle, recordAnswer, roundStats } from './engine.js';
import { dictionaryLookup } from './dictionary-data.js';

export function topicDefaults(topic) {
  return { category: topic.categories[0].id, lessonId: topic.lessons[0].id, view: 'learn', known: [], mistakes: [], round: null, lookup: { method: 'sound', selections: [] } };
}

export function normalizeTopic(topic, saved) {
  const state = topicDefaults(topic);
  if (!saved || typeof saved !== 'object') return state;
  if (topic.categories.some(item => item.id === saved.category)) state.category = saved.category;
  const lessons = topic.lessons.filter(item => item.category === state.category);
  state.lessonId = lessons.find(item => item.id === saved.lessonId)?.id || lessons[0].id;
  for (const [field, items] of [['known', topic.lessons], ['mistakes', topic.questions]]) {
    state[field] = [...new Set(Array.isArray(saved[field]) ? saved[field].filter(id => items.some(item => item.id === id)) : [])];
  }
  if (topic.id === 'dictionary') {
    const method = saved.lookup?.method === 'radical' ? 'radical' : 'sound';
    state.lookup = { method, selections: dictionaryLookup(method, saved.lookup?.selections).selections };
    if (saved.view === 'lookup') state.view = 'lookup';
  }
  const round = saved.round;
  if (!round || !['all', 'review', ...topic.categories.map(item => item.id)].includes(round.scope) ||
      !Array.isArray(round.questions) || !round.questions.length || round.questions.length > 10 ||
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
  const pool = shuffle(topic.questions.filter(item => scope === 'all' || (scope === 'review' ? state.mistakes.includes(item.id) : item.category === scope)));
  if (!pool.length) return false;
  const representatives = scope === 'all' ? topic.categories.map(category => pool.find(item => item.category === category.id)).filter(Boolean) : [];
  const questions = shuffle([...representatives, ...pool.filter(item => !representatives.includes(item)).slice(0, 10 - representatives.length)]);
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
  return { time: Date.now(), name: `${topic.name}${round.scope === 'review' ? ' · 错题复习' : ''}`, total: stats.total, correct: stats.correct };
}
