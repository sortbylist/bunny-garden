import { confusionSets, toneExamples, vocabulary } from './data.js';
import { questionPool } from './engine.js';
import { hanziLessons, hanziQuestionById } from './hanzi-data.js';
import { dictionaryEntries } from './dictionary-data.js';
import { phonicsLessonById, phonicsStories } from './phonics-data.js';
import { phonicsQuestionById } from './phonics-engine.js';

let pinyinQuestions;

function pinyinQuestion(id) {
  if (!pinyinQuestions) {
    const questions = ['tonequiz', 'rules', 'blend'].flatMap(mode => questionPool(mode));
    for (const confusion of Object.keys(confusionSets)) questions.push(...questionPool('confusing', { confusion }));
    pinyinQuestions = new Map(questions.map(question => [question.id, question]));
  }
  return pinyinQuestions.get(id);
}

function practice(question) {
  if (!question) return null;
  const answer = question.choices?.find(choice => choice.id === question.answer)?.label || question.answer;
  return { title: [question.prompt, question.display].filter(Boolean).join(' · '), lines: [...(question.passage?.paragraphs || []), question.clip?.text, `答案：${answer}`, question.explanation] };
}

export function resolveFavorite(ref, topicById) {
  const [subject, feature, kind, ...parts] = ref.split('/');
  const id = parts.join('/');
  if (subject === 'english' && feature === 'phonics') {
    if (kind === 'question') return practice(phonicsQuestionById.get(id));
    if (kind === 'story') {
      const story = phonicsStories.find(entry => entry.id === id);
      return story && { title: story.title, lines: [story.text, story.question.prompt, story.question.answer], englishLesson: story.lessonId, mode: 'reading' };
    }
    const lesson = kind === 'lesson' && phonicsLessonById.get(id);
    return lesson && { title: lesson.title, lines: [lesson.tip], englishLesson: id, mode: 'learn' };
  }
  if (subject === 'chinese' && feature === 'pinyin') {
    if (kind === 'question') return practice(pinyinQuestion(id));
    if (kind === 'tones' && id === 'four') return { title: '跟着 mā má mǎ mà，听四声', lines: toneExamples.map(group => `${group.items.map(item => item.text).join(' · ')}：${group.tip}`) };
    if (kind === 'match') {
      const words = id.split(',').map(itemId => vocabulary.find(item => item.id === itemId));
      if (words.length && words.every(Boolean)) return { title: `字词配对 · ${words.map(item => item.text).join('、')}`, lines: words.map(item => `${item.text}：${item.pinyin}`) };
    }
    return null;
  }
  const hanzi = subject === 'chinese' && feature === 'hanzi-structure';
  const topic = topicById(feature);
  if (!hanzi && (!topic || (topic.subject || 'chinese') !== subject)) return null;
  if (kind === 'question') return practice(hanzi ? hanziQuestionById.get(id) : topic.questions.find(item => item.id === id));
  if (kind === 'entry' && feature === 'dictionary') {
    const entry = dictionaryEntries.find(item => item.text === id);
    return entry && { title: `${entry.text} · ${entry.pinyin}`, lines: entry.meanings.map(pair => pair.join('：')) };
  }
  const lesson = kind === 'lesson' && (hanzi ? hanziLessons : topic.lessons).find(item => item.id === id);
  return lesson && { title: lesson.title, lines: [lesson.body || lesson.tip || lesson.rule, ...(lesson.lines || []).map(item => item.clip.text)], lesson, feature, hanzi };
}
