import { hanziCategories, hanziLessons, hanziQuestions, hanziQuestionById } from './hanzi-data.js';
import { shuffle, recordAnswer, roundStats } from './engine.js';
import { practiceLengths, selectPractice } from './chinese-practice.js';

export function createHanziState() {
  return { category: 'strokes', lessonId: hanziLessons[0].id, view: 'learn', strokeStep: 0, known: [], mistakes: [], round: null, showPinyin: true, practiceLength: 10, practiceSeen: [] };
}

export function normalizeHanziState(saved) {
  const state = createHanziState();
  if (!saved || typeof saved !== 'object') return state;
  state.showPinyin = saved.showPinyin !== false;
  if (practiceLengths.includes(saved.practiceLength)) state.practiceLength = saved.practiceLength;
  state.practiceSeen = [...new Set(Array.isArray(saved.practiceSeen) ? saved.practiceSeen.filter(id => hanziQuestionById.has(id)) : [])];
  if (hanziCategories.some(item => item.id === saved.category)) state.category = saved.category;
  state.lessonId = hanziLessons.find(item => item.id === saved.lessonId && item.category === state.category)?.id || hanziLessons.find(item => item.category === state.category).id;
  const lesson = hanziLessons.find(item => item.id === state.lessonId);
  state.strokeStep = Number.isInteger(saved.strokeStep) ? Math.max(0, Math.min(lesson.strokes?.length || 0, saved.strokeStep)) : 0;
  state.known = [...new Set(Array.isArray(saved.known) ? saved.known.filter(id => hanziLessons.some(item => item.id === id)) : [])];
  state.mistakes = [...new Set(Array.isArray(saved.mistakes) ? saved.mistakes.filter(id => hanziQuestionById.has(id)) : [])];
  const round = saved.round;
  if (round && ['all', 'review', ...hanziCategories.map(item => item.id)].includes(round.scope) &&
      Array.isArray(round.questions) && round.questions.length > 0 && round.questions.length <= 30 &&
      round.questions.every(item => hanziQuestionById.has(item?.id)) &&
      new Set(round.questions.map(item => item.id)).size === round.questions.length &&
      Number.isInteger(round.index) && round.index >= 0 && round.index < round.questions.length &&
      Array.isArray(round.responses)) {
    const questions = round.questions.map(item => {
      const canonical = hanziQuestionById.get(item.id);
      const validOptions = Array.isArray(item.options) && item.options.length === canonical.options.length &&
        new Set(item.options).size === canonical.options.length && item.options.every(option => canonical.options.includes(option));
      return { ...canonical, options: validOptions ? [...item.options] : [...canonical.options] };
    });
    const responses = questions.map((item, index) => {
      const response = round.responses[index];
      return response && (response.answer === null || item.options.includes(response.answer))
        ? { answer: response.answer, correct: response.answer === item.answer, skipped: response.answer === null } : null;
    });
    if (responses.slice(0, round.index).some(response => !response)) return state;
    const selected = questions[round.index].options.includes(round.selected) ? round.selected : null;
    const revealed = Boolean(responses[round.index] && round.revealed && (selected === questions[round.index].answer || round.selected === null));
    state.round = { scope: round.scope, questions, responses, index: round.index, selected, revealed, finished: Boolean(round.finished && revealed && responses.every(Boolean)) };
    if (saved.view === 'quiz') state.view = 'quiz';
  }
  return state;
}

export function startHanziRound(state, scope) {
  if (!['all', 'review', ...hanziCategories.map(item => item.id)].includes(scope)) return false;
  const pool = hanziQuestions.filter(item => scope === 'all' || (scope === 'review' ? state.mistakes.includes(item.id) : item.category === scope));
  if (!pool.length) return false;
  const selection = selectPractice(pool, scope === 'all' ? hanziCategories.map(item => item.id) : [], state.practiceLength || 10, state.practiceSeen || [], shuffle);
  if (scope !== 'review') state.practiceSeen = selection.seenIds;
  state.round = { scope, questions: selection.questions.map(item => ({ ...item, options: shuffle(item.options) })), index: 0, responses: [], selected: null, revealed: false, finished: false };
  state.view = 'quiz';
  return true;
}

export function answerHanzi(state, answer) {
  const round = state.round;
  if (state.view !== 'quiz' || !round || round.finished) return null;
  if (answer !== null && !round.questions[round.index].options.includes(answer)) return null;
  const result = recordAnswer(round, answer);
  if (!result) return null;
  const reviewed = round.scope === 'review' && result.first && result.correct;
  if (result.first && !result.correct && !state.mistakes.includes(result.question.id)) state.mistakes.push(result.question.id);
  if (reviewed) state.mistakes = state.mistakes.filter(id => id !== result.question.id);
  return { ...result, reviewed };
}

export function advanceHanziRound(state) {
  const round = state.round;
  if (state.view !== 'quiz' || !round?.revealed || round.finished) return null;
  if (round.index < round.questions.length - 1) {
    round.index++;
    round.selected = null;
    round.revealed = false;
    return null;
  }
  round.finished = true;
  const stats = roundStats(round);
  return { time: Date.now(), name: round.scope === 'review' ? '汉字错题复习' : '汉字笔画与结构', total: stats.total, correct: stats.correct };
}
