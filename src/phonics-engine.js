import { alphabet, phonicsLessons, phonicsWords, phonicsStories, phonicsModes, phonicsWordById, phonicsLessonById } from './phonics-data.js';

export const phonicsStorageKey = 'bunny-phonics-gb-v1';
export const phonicsDefaults = () => ({
  version: 1, locale: 'en-GB', lessonId: 'lesson-1', mode: 'learn', scope: 'lesson', length: 10,
  slow: false, positions: {}, sessions: {}, favorites: [], known: [], seen: [], mistakes: [], history: [], reviews: {},
});

export function shufflePhonics(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function optionsFor(answer, pool) {
  return [answer, ...[...new Set(pool)].filter(value => value !== answer).slice(0, 3)];
}

export const phonicsQuestions = [
  ...phonicsLessons.map(lesson => lesson.rule),
  ...phonicsStories.map(story => ({ ...story.question, storyId: story.id })),
  ...alphabet.map((letter, index) => ({ id: `alphabet-${letter.letter}`, kind: 'alphabet', lessonId: 'lesson-1', prompt: `找到 ${letter.upper} 对应的小写字母`, answer: letter.letter, options: optionsFor(letter.letter, [...alphabet.slice(index + 1), ...alphabet].map(entry => entry.letter)), explanation: `${letter.upper} 与 ${letter.letter} 是同一个字母的大小写。字母名 /${letter.name}/ 不是字母音。` })),
  ...phonicsWords.flatMap((word, index) => {
    const pool = [...phonicsWords.slice(index + 1, index + 12), ...phonicsWords.slice(0, 12)];
    return [
      { id: `meaning-${word.id}`, kind: 'meaning', lessonId: word.lessonId, wordId: word.id, prompt: '读一读，选择这个词的意思', display: word.text, answer: word.meaning, options: optionsFor(word.meaning, pool.map(item => item.meaning)), explanation: `${word.text}：${word.meaning}。词义选择不等于独立朗读测验。` },
      { id: `spelling-${word.id}`, kind: 'spelling', lessonId: word.lessonId, wordId: word.id, prompt: `根据词义拼写：${word.meaning}`, answer: word.text.toLowerCase(), options: [], explanation: `本题目标词为 ${word.text}（${word.meaning}）。字母块数量不是音素数量。`, letters: word.text.toLowerCase().split('') },
      { id: `listen-${word.id}`, kind: 'listen', lessonId: word.lessonId, wordId: word.id, prompt: '听一听，选择你听到的词', answer: word.text, options: optionsFor(word.text, pool.map(item => item.text)), explanation: `${word.text}：${word.meaning}。` },
    ];
  }),
];

export const phonicsQuestionById = new Map(phonicsQuestions.map(question => [question.id, question]));

export function questionPool(state, audioAvailable = () => false) {
  const lessonWords = new Set(phonicsLessonById.get(state.lessonId)?.words.map(word => word.id) || []);
  return phonicsQuestions.filter(question => {
    if (question.kind === 'listen' && (!audioAvailable(question.wordId) || hasHomophoneRisk(question.wordId))) return false;
    if (state.mode === 'review') return state.mistakes.includes(question.id);
    if (state.mode === 'diagnostic') return ['rule-1', 'rule-3', 'rule-4', 'rule-6', 'rule-9', 'rule-10', 'rule-16', 'rule-19', 'rule-20', 'rule-27'].includes(question.id);
    if (question.kind !== (state.mode === 'rules' ? 'rule' : state.mode)) return false;
    return state.scope === 'all' || question.lessonId === state.lessonId || lessonWords.has(question.wordId);
  });
}

const homophoneWords = new Set('rain rein reign see sea bee be tea tee pea pee right write rite night knight no know nose knows one won two to too for four here hear dear deer bare bear pair pear pare air heir buy by bye hi high eye I sun son some sum new knew blue blew so sew sow week weak wood would red read led lead road rode rowed meet meat feet feat our hour eight ate way weigh weight wait tail tale mail male sail sale not knot through threw flour flower'.toLowerCase().split(' '));

export function hasHomophoneRisk(wordId) {
  return homophoneWords.has(phonicsWordById.get(wordId)?.text.toLowerCase());
}

export function availablePhonicsAudio(entry) {
  const identifier = typeof entry?.path === 'string' ? entry.path.split('/').at(-1)?.replace(/\.mp3$/, '') : null;
  const expected = phonicsWordById.get(identifier)?.text || phonicsStories.find(story => story.id === identifier)?.text;
  return Boolean(expected && entry.locale === 'en-GB' && entry.status === 'ready' && entry.provider === 'gtts'
    && entry.lang === 'en' && entry.tld === 'co.uk' && typeof entry.text === 'string' && entry.text.trim()
    && entry.text === expected
    && typeof entry.path === 'string' && /^\/audio\/phonics\/(?:word-[a-z]+|story-\d+)\.mp3$/.test(entry.path));
}

export function createPhonicsRound(pool, length = 10, random = Math.random) {
  const questions = shufflePhonics(pool, random).slice(0, length);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ids: questions.map(question => question.id), index: 0,
    options: Object.fromEntries(questions.map(question => [question.id, shufflePhonics(question.options, random)])),
    responses: {}, views: {}, drafts: {}, finished: false,
  };
}

export function phonicsStats(round) {
  const results = Object.values(round.responses);
  return { total: round.ids.length, answered: results.length, correct: results.filter(result => result.correct).length, skipped: results.filter(result => result.skipped).length };
}

export function answerPhonics(state, round, answer, now = Date.now()) {
  if (round.finished) return null;
  const question = phonicsQuestionById.get(round.ids[round.index]);
  if (!question || round.views[question.id]?.resolved) return null;
  const skipped = answer === null;
  const correct = answer === question.answer;
  const first = !round.responses[question.id];
  if (first) {
    round.responses[question.id] = { answer, correct, skipped, time: now };
    if (!correct && !state.mistakes.includes(question.id)) state.mistakes.push(question.id);
    if (correct) {
      state.mistakes = state.mistakes.filter(id => id !== question.id);
      const previous = state.reviews[question.id];
      const success = Math.min(3, (previous?.success || 0) + 1);
      state.reviews[question.id] = { success, due: now + [1, 3, 7][success - 1] * 86400000 };
    } else state.reviews[question.id] = { success: 0, due: now };
  }
  round.views[question.id] = { answer, correct, skipped, resolved: correct || skipped };
  return { correct, skipped, first, question };
}

export function advancePhonicsRound(state, round, name, now = Date.now()) {
  if (round.finished || !round.views[round.ids[round.index]]?.resolved) return false;
  const remaining = round.ids.findIndex((id, index) => index > round.index && !round.views[id]?.resolved);
  const first = round.ids.findIndex(id => !round.views[id]?.resolved);
  if (first >= 0) { round.index = remaining >= 0 ? remaining : first; return true; }
  round.finished = true;
  state.history.push({ id: round.id, name, time: now, ...phonicsStats(round) });
  state.history = state.history.slice(-100);
  return true;
}

export function readPhonicsState(storage) {
  const state = phonicsDefaults();
  try {
    const raw = storage.getItem(phonicsStorageKey);
    if (!raw) return { state, available: true };
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || saved.locale !== 'en-GB') throw new Error('Invalid phonics state');
    if (phonicsLessonById.has(saved.lessonId)) state.lessonId = saved.lessonId;
    if ([...phonicsModes.map(mode => mode.id), 'alphabet', 'diagnostic'].includes(saved.mode)) state.mode = saved.mode;
    if (saved.scope === 'all') state.scope = 'all';
    if ([5, 10, 20].includes(saved.length)) state.length = saved.length;
    state.slow = saved.slow === true;
    for (const field of ['favorites', 'known', 'seen']) {
      state[field] = Array.isArray(saved[field]) ? [...new Set(saved[field].filter(id => phonicsWordById.has(id)))] : [];
    }
    state.mistakes = Array.isArray(saved.mistakes) ? [...new Set(saved.mistakes.filter(id => phonicsQuestionById.has(id)))] : [];
    if (saved.positions && typeof saved.positions === 'object') {
      for (const [key, value] of Object.entries(saved.positions)) {
        if (!Array.isArray(value?.ids) || !Number.isInteger(value.index)) continue;
        state.positions[key] = { ids: [...new Set(value.ids.filter(id => phonicsWordById.has(id)))], index: Math.max(0, value.index), finished: value.finished === true };
      }
    }
    if (saved.sessions && typeof saved.sessions === 'object') {
      for (const [key, round] of Object.entries(saved.sessions).slice(-100)) {
        if (!Array.isArray(round?.ids) || !round.ids.length || round.ids.length > 20 || new Set(round.ids).size !== round.ids.length || !round.ids.every(id => phonicsQuestionById.has(id))) continue;
        const clean = createPhonicsRound(round.ids.map(id => phonicsQuestionById.get(id)), 20);
        clean.ids = round.ids;
        clean.index = Number.isInteger(round.index) ? Math.max(0, Math.min(clean.ids.length - 1, round.index)) : 0;
        for (const id of clean.ids) {
          const options = round.options?.[id];
          const expected = phonicsQuestionById.get(id).options;
          if (Array.isArray(options) && options.length === expected.length && new Set(options).size === options.length && options.every(option => expected.includes(option))) clean.options[id] = options;
          const response = round.responses?.[id];
          const question = phonicsQuestionById.get(id);
          if (response && (response.answer === null || typeof response.answer === 'string') && Number.isFinite(response.time)) {
            clean.responses[id] = { answer: response.answer, correct: response.answer === question.answer, skipped: response.answer === null, time: response.time };
          }
          const view = round.views?.[id];
          if (clean.responses[id] && view && (view.answer === null || typeof view.answer === 'string')) clean.views[id] = { answer: view.answer, correct: view.answer === question.answer, skipped: view.answer === null, resolved: view.answer === null || view.answer === question.answer };
          if (question.kind === 'spelling' && typeof round.drafts?.[id] === 'string') clean.drafts[id] = round.drafts[id].slice(0, 40);
        }
        clean.finished = clean.ids.every(id => clean.views[id]?.resolved) && round.finished === true;
        state.sessions[key] = clean;
      }
    }
    state.history = Array.isArray(saved.history) ? saved.history.filter(entry => entry && typeof entry.name === 'string' && Number.isFinite(entry.time) && Number.isInteger(entry.total) && entry.total > 0 && entry.total <= 20 && Number.isInteger(entry.correct) && entry.correct >= 0 && entry.correct <= entry.total && Number.isInteger(entry.skipped) && entry.skipped >= 0 && entry.skipped <= entry.total - entry.correct).slice(-100) : [];
    if (saved.reviews && typeof saved.reviews === 'object') {
      state.reviews = Object.fromEntries(Object.entries(saved.reviews).filter(([id, review]) => phonicsQuestionById.has(id) && Number.isInteger(review?.success) && review.success >= 0 && review.success <= 3 && Number.isFinite(review.due)));
    }
    return { state, available: true };
  } catch { return { state, available: false }; }
}
