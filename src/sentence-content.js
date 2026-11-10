import { defineTopic, choice } from './chinese-content.js';

export function defineSentenceTopic({ entries, ...metadata }) {
  return defineTopic({
    ...metadata,
    stage: '第二阶段 · 句子理解与运用',
    lessons: entries.map(({ questions, sample, checklist, ...lesson }) => ({
      ...lesson,
      activity: lesson.activity || { type: 'write', sample, checklist },
    })),
    questions: entries.flatMap(entry => entry.questions.map(([prompt, display, answer, distractors, explanation], index) =>
      choice(`${entry.id}-${index + 1}`, entry.category, prompt, answer, distractors, explanation, display))),
  });
}
