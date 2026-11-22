import { basics, groups, vocabulary, characters, words, marked, spellingRules, blends, confusionSets, tonePracticeSounds } from './data.js';
import { phonicsDefaults } from './phonics-engine.js';


export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function visibleTabs(features, selected, expanded) {
  if (expanded || features.length <= 10) return features;
  const visible = features.slice(0, 10);
  const active = features.find(feature => feature.id === selected);
  if (active && !visible.includes(active)) visible[9] = active;
  return visible;
}

export function studyPool(mode, group, favorites = []) {
  let pool = basics;
  if (mode === 'initials') pool = basics.filter(item => item.group === 'initial');
  else if (mode === 'finals') pool = basics.filter(item => !['initial', 'whole'].includes(item.group));
  else if (mode === 'whole') pool = basics.filter(item => item.group === 'whole');
  else if (mode === 'favorites') pool = [...basics, ...vocabulary].filter(item => favorites.includes(item.id));
  if (group !== 'all') pool = pool.filter(item => item.group === group);
  return pool;
}

export function learningGroups(mode) {
  if (mode === 'initials') return groups.filter(group => group.id === 'initial');
  if (mode === 'finals') return groups.filter(group => !['initial', 'whole'].includes(group.id));
  if (mode === 'whole') return groups.filter(group => group.id === 'whole');
  if (['listen', 'audio'].includes(mode)) return groups.filter(group => group.id !== 'initial');
  if (['sequence', 'random', 'challenge'].includes(mode)) return groups;
  return [];
}

export function nextStudyGroup(mode, group) {
  const available = learningGroups(mode);
  const index = available.findIndex(item => item.id === group);
  return index < 0 ? null : available[index + 1] || null;
}

export function questionView(round, index) {
  if (index === round.index) return { selected: round.selected, revealed: round.revealed };
  if (round.views?.[index]) return round.views[index];
  const response = round.responses[index];
  return { selected: response?.answer ?? null, revealed: Boolean(response?.correct || response?.skipped) };
}

export function visitQuestion(round, index) {
  if (round.finished || !Number.isInteger(index) || index < 0 || index >= round.questions.length) return;
  const destination = questionView(round, index);
  round.views ||= {};
  round.views[round.index] = { selected: round.selected, revealed: round.revealed };
  round.index = index;
  Object.assign(round, destination);
}

export function nextUnfinishedQuestion(round) {
  for (let offset = 1; offset < round.questions.length; offset++) {
    const index = (round.index + offset) % round.questions.length;
    if (!questionView(round, index).revealed) return index;
  }
  return -1;
}

function choices(correct, pool) {
  return shuffle([correct, ...shuffle([...new Set(pool)].filter(option => option !== correct)).slice(0, 3)]);
}

function wordQuestions(mode, wordScope) {
  const source = wordScope === 'characters' ? characters : wordScope === 'words' ? words : vocabulary;
  const unique = source.filter((item, index) => source.findIndex(other => other.pinyin === item.pinyin) === index);
  return unique.map(item => ({
    id: `${mode}:${item.id}`, kind: mode,
    prompt: mode === 'hanzi' ? '读一读，选出正确的拼音' : '读一读，找到对应的字词',
    display: mode === 'hanzi' ? item.text : item.pinyin,
    answer: mode === 'hanzi' ? item.pinyin : item.text,
    options: choices(mode === 'hanzi' ? item.pinyin : item.text, unique.map(other => mode === 'hanzi' ? other.pinyin : other.text)),
    explanation: `${item.text}，读作 ${item.pinyin}。`, itemId: item.id,
    audio: { word: item.text, sounds: item.sounds },
  }));
}

function soundQuestions(mode, group, includeInitials = false) {
  const pool = basics.filter(item => (includeInitials || item.group !== 'initial') && (group === 'all' || item.group === group));
  const unique = pool.filter((item, index) => pool.findIndex(other => other.sound === item.sound) === index);
  if (unique.length < 2) return [];
  return unique.map(item => {
    const candidates = shuffle([item, ...shuffle(unique.filter(other => other.id !== item.id)).slice(0, 3)]);
    return {
      id: `${mode}:${item.id}`, kind: mode,
      prompt: mode === 'listen' ? '听一听，是哪个拼音朋友？' : '哪个声音读的是这个拼音？',
      display: mode === 'audio' ? item.text : '', answer: item.text,
      options: mode === 'listen' ? candidates.map(other => other.text) : candidates.map(other => ({ value: other.text, sound: other.sound })),
      explanation: `这是 ${item.text}。${item.tip}`, audio: { sound: item.sound }, itemId: item.id,
    };
  });
}

export function questionPool(mode, { group = 'all', wordScope = 'all', confusion = 'retroflex', mistakes = [] } = {}) {
  if (mode === 'tonequiz') {
    const labels = ['一声 →', '二声 ↗', '三声 ∨', '四声 ↘'];
    return tonePracticeSounds.map(sound => ({
      id: `tone:${sound}`, kind: 'listen', prompt: '听一听，这个音节是第几声？',
      display: '', answer: labels[Number(sound.at(-1)) - 1], options: [...labels],
      explanation: `${marked(sound)}，是${labels[Number(sound.at(-1)) - 1]}。再听一遍，感受音高的变化。`, audio: { sound },
    }));
  }
  if (mode === 'mistakes') return mistakes.map(entry => entry.question);
  if (mode === 'hanzi' || mode === 'pinyin') return wordQuestions(mode, wordScope);
  if (mode === 'listen' || mode === 'audio') return soundQuestions(mode, group);
  if (mode === 'section-practice') return soundQuestions('listen', group, true);
  if (mode === 'rules') return spellingRules.map(rule => ({ ...rule, kind: 'rules', id: `rule:${rule.id}`, audio: rule.word ? { word: rule.word } : { sound: rule.sound } }));
  if (mode === 'confusing') return confusionSets[confusion].pairs.flatMap(pair => pair.map(sound => ({
    id: `confusing:${sound}`, kind: 'listen', prompt: '仔细听，选出这个音节', display: '',
    answer: marked(sound), options: shuffle(pair.map(marked)), audio: { sound },
    explanation: `听到的是 ${marked(sound)}。再把几个选项分别读一读，比比它们的不同。`,
  })));
  if (mode === 'blend') return blends.map(item => ({
    id: item.id, kind: 'blend', prompt: '拼一拼，它们合起来怎么读？',
    display: `${item.initial} + ${item.final}`, answer: marked(item.sound),
    options: choices(marked(item.sound), blends.map(other => marked(other.sound))),
    explanation: `${item.text}，读作 ${marked(item.sound)}。${['j', 'q', 'x'].includes(item.initial) && item.final.includes('ü') ? 'ü 与 j、q、x 相拼时省去两点。' : ''}${item.final.length > 1 && ['ua', 'uo', 'iong'].includes(item.final) ? '先读声母，再接介母，最后接韵母。' : ''}`,
    audio: { sound: item.sound }, parts: [item.initial, item.final],
  }));
  if (mode === 'challenge') return ['listen', 'hanzi', 'pinyin', 'rules', 'blend'].flatMap(kind => questionPool(kind, { group, wordScope, confusion }));
  return [];
}

export function createRound(mode, options, length) {
  const pool = questionPool(mode, options);
  return { mode, questions: shuffle(pool).slice(0, length), index: 0, responses: [], selected: null, revealed: false, finished: false, available: pool.length };
}

export function recordAnswer(round, answer) {
  const question = round.questions[round.index];
  if (!question || round.revealed) return null;
  const correct = answer === question.answer;
  const first = !round.responses[round.index];
  if (first) round.responses[round.index] = { answer, correct, skipped: answer === null };
  round.selected = answer;
  round.revealed = correct || answer === null;
  return { correct, first, skipped: answer === null, question };
}

export function roundStats(round) {
  return { total: round.questions.length, correct: round.responses.filter(response => response?.correct).length, skipped: round.responses.filter(response => response?.skipped).length };
}

export function selectMatch(value, action, id) {
  if (action === 'match-left') {
    value.left = id;
    return null;
  }
  if (!value.left) return null;
  const left = value.left;
  const correct = left === id;
  value.left = null;
  value.attempts++;
  if (correct) value.matched.push(left);
  else if (!value.wrong.includes(left)) value.wrong.push(left);
  return { left, correct };
}

export const defaultState = () => ({
  subject: 'chinese', collapsed: false, features: { chinese: 'pinyin' }, mode: 'sequence',
  group: 'all', wordScope: 'all', confusion: 'retroflex', length: 10,
  seen: [], known: [], favorites: [], savedContent: [], mistakes: [], history: [], sessions: {},
  settings: { slow: false, showPinyin: true, effects: true, continuous: false, animations: true },
  nickname: '小小探索家', navigationSelections: {}, rewards: null,
  tonePractice: false, modeGroups: {}, hanzi: null, topics: {}, phonics: phonicsDefaults(),
});
