import { basics, confusionSets, vocabulary } from './data.js';
import { questionPool } from './engine.js';
import { hanziLessons, hanziQuestionById } from './hanzi-data.js';
import { dictionaryEntries } from './dictionary-data.js';
import { phonicsLessonById, phonicsStories, phonicsWordById } from './phonics-data.js';
import { phonicsQuestionById } from './phonics-engine.js';

let pinyinQuestions;
const snapshotMarker = '?options=';

export function favoriteKey(ref) {
  return ref.startsWith('chinese/pinyin/question/') ? ref.split(snapshotMarker, 1)[0] : ref;
}

export function favoriteQuestionRef(ref, question) {
  if (!question || !ref.startsWith('chinese/pinyin/question/')) return ref;
  return `${favoriteKey(ref)}${snapshotMarker}${encodeURIComponent(JSON.stringify(question.options))}`;
}

function savedOptions(ref, question) {
  const encoded = ref.split(snapshotMarker, 2)[1];
  if (!encoded || encoded.length > 2048) return question;
  try {
    const options = JSON.parse(decodeURIComponent(encoded));
    const soundChoices = question.kind === 'audio';
    if (!Array.isArray(options) || !options.length || options.length > 4 || !options.every(option => soundChoices
      ? option && typeof option.value === 'string' && typeof option.sound === 'string'
      : typeof option === 'string')) return question;
    const values = options.map(option => soundChoices ? option.value : option);
    return values.includes(question.answer) && new Set(values).size === values.length ? { ...question, options } : question;
  } catch {
    return question;
  }
}

function pinyinQuestion(id, state) {
  const stored = state?.mistakes.find(entry => entry.question.id === id)?.question
    || Object.values(state?.sessions || {}).find(round => round.questions?.some(question => question.id === id))?.questions.find(question => question.id === id);
  if (stored) return stored;
  if (!pinyinQuestions) {
    const questions = ['tonequiz', 'rules', 'blend', 'listen', 'audio'].flatMap(mode => questionPool(mode));
    for (const wordScope of ['all', 'characters', 'words']) {
      for (const mode of ['hanzi', 'pinyin']) questions.push(...questionPool(mode, { wordScope }));
    }
    for (const confusion of Object.keys(confusionSets)) questions.push(...questionPool('confusing', { confusion }));
    pinyinQuestions = new Map(questions.map(question => [question.id, question]));
  }
  const item = id.startsWith('match:') && vocabulary.find(entry => entry.id === id.slice(6));
  return pinyinQuestions.get(id) || (item && {
    ...pinyinQuestions.get(`hanzi:${item.id}`),
    id, kind: 'hanzi', prompt: '给这个字词找到正确的拼音', display: item.text, answer: item.pinyin,
    options: [...new Set([item.pinyin, ...vocabulary.slice(0, 4).map(word => word.pinyin)])].slice(0, 4),
    explanation: `${item.text}，读作 ${item.pinyin}。`, itemId: item.id, audio: { word: item.text, sounds: item.sounds },
  });
}

function practice(question) {
  if (!question) return null;
  return { title: [question.prompt, question.display].filter(Boolean).join(' · '), question };
}

const pinyinItems = new Map([...basics, ...vocabulary].map(item => [item.id, item]));

export function resolveFavorite(ref, topicById, state) {
  const [subject, feature, kind, ...parts] = favoriteKey(ref).split('/');
  const id = parts.join('/');
  if (subject === 'english' && feature === 'phonics') {
    if (kind === 'question') return practice(phonicsQuestionById.get(id));
    if (kind === 'word') {
      const word = phonicsWordById.get(id);
      return word && { title: word.text, word, englishLesson: word.lessonId, mode: 'learn' };
    }
    if (kind === 'story') {
      const story = phonicsStories.find(entry => entry.id === id);
      return story && { title: story.title, story, englishLesson: story.lessonId, mode: 'reading' };
    }
    const lesson = kind === 'lesson' && phonicsLessonById.get(id);
    return lesson && { title: lesson.title, lesson, englishLesson: id, mode: 'learn' };
  }
  if (subject === 'chinese' && feature === 'pinyin') {
    if (kind === 'question') {
      const question = pinyinQuestion(id, state);
      return question && practice(savedOptions(ref, question));
    }
    if (kind === 'word') {
      const word = pinyinItems.get(id);
      return word && { title: word.type === 'word' ? `${word.text} · ${word.pinyin}` : word.text, word };
    }
    if (kind === 'tones' && id === 'four') return { title: '跟着 mā má mǎ mà，听四声' };
    if (kind === 'match') {
      const words = id.split(',').map(itemId => vocabulary.find(item => item.id === itemId));
      if (words.length && words.every(Boolean)) return { title: `字词配对 · ${words.map(item => item.text).join('、')}`, pairs: words.map(item => item.id) };
    }
    return null;
  }
  const hanzi = subject === 'chinese' && feature === 'hanzi-structure';
  const topic = topicById(feature);
  if (!hanzi && (!topic || (topic.subject || 'chinese') !== subject)) return null;
  if (kind === 'question') return practice(hanzi ? hanziQuestionById.get(id) : topic.questions.find(item => item.id === id));
  if (kind === 'entry' && feature === 'dictionary') {
    const entry = dictionaryEntries.find(item => item.text === id);
    return entry && { title: `${entry.text} · ${entry.pinyin}`, entry };
  }
  const lesson = kind === 'lesson' && (hanzi ? hanziLessons : topic.lessons).find(item => item.id === id);
  return lesson && { title: lesson.title, lesson };
}
