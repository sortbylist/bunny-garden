export function defineTopic({ id, name, description, categories, lessons, questions }) {
  return {
    id, name, description, categories,
    lessons: lessons.map(lesson => ({ ...lesson, id: `${id}:lesson:${lesson.id}` })),
    questions: questions.map(question => ({ ...question, id: `${id}:question:${question.id}` })),
  };
}

export function choice(id, category, prompt, answer, distractors, explanation, display = '') {
  return { id, category, prompt, display, answer, options: [answer, ...distractors], explanation };
}
