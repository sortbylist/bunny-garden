export function defineTopic({ id, name, description, categories, lessons, questions, stage = '第一阶段 · 字词基础' }) {
  return {
    id, name, description, categories, stage,
    lessons: lessons.map(lesson => ({ ...lesson, id: `${id}:lesson:${lesson.id}` })),
    questions: questions.map(question => ({ ...question, id: `${id}:question:${question.id}` })),
  };
}

export function choice(id, category, prompt, answer, distractors, explanation, display = '') {
  return { id, category, prompt, display, answer, options: [answer, ...distractors], explanation };
}
