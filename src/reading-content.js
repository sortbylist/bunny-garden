import { defineTopic, choice } from './chinese-content.js';

export function defineReadingTopic({ entries, ...definition }) {
  return defineTopic({
    ...definition,
    stage: '第三阶段 · 字词进阶、阅读与积累',
    lessons: entries.map(entry => ({
      id: entry.id, category: entry.category, title: entry.title,
      body: entry.method, examples: entry.tips, task: entry.task,
      reading: { passage: { title: entry.title, paragraphs: entry.paragraphs }, focus: entry.focus, guide: entry.guide },
      activity: entry.order ? {
        type: 'order', unit: '句段', tokens: entry.order,
        answers: [entry.solution.map(index => entry.order[index]).join('')], ending: '',
      } : {
        type: 'write', label: '我的阅读想法（最多 500 字）', sample: entry.sample,
        checklist: ['回答与短文内容有关吗？', '能从原文找到支持自己想法的地方吗？'],
      },
    })),
    questions: entries.flatMap(entry => entry.questions.map(([prompt, answer, distractors, explanation, evidence], index) => ({
      ...choice(`${entry.id}-${index}`, entry.category, prompt, answer, distractors, explanation),
      passage: { title: entry.title, paragraphs: entry.paragraphs }, evidence,
    }))),
  });
}
