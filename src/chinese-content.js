const categoryIcons = {
  dictionary: { sound: 'type', radical: 'search', meaning: 'quote' },
  'word-categories': { people: 'person', animals: 'paw', plants: 'sprout', actions: 'running', feelings: 'smile', seasons: 'seasons' },
  'word-relations': { synonyms: 'link', antonyms: 'compare', context: 'quote' },
  collocations: { measure: 'ruler', verb: 'running', de: 'puzzle' },
  'word-patterns': { ABB: 'pattern-abb', AABB: 'pattern-aabb', ABAB: 'pattern-abab', four: 'four-words', idioms: 'scroll' },
  'sentence-building': { order: 'word-order', complete: 'sentence-complete', fluent: 'check' },
  punctuation: { period: 'punctuation-period', comma: 'punctuation-comma', question: 'punctuation-question', exclamation: 'punctuation-exclamation', colon: 'punctuation-colon', quotes: 'quote' },
  'sentence-patterns': { together: 'parallel', cause: 'arrow-right', relations: 'branches', imitate: 'copy' },
  'sentence-revision': { expand: 'expand', missing: 'puzzle', wording: 'pen', repeat: 'eraser' },
  'vivid-expression': { simile: 'link', personification: 'smile', distinguish: 'compare', express: 'pen' },
  'similar-characters': { radicals: 'character-radical', details: 'search' },
  'character-readings': { homophones: 'sound', polyphones: 'branches' },
  'poetry-culture': { nature: 'leaf', feelings: 'heart', festivals: 'lantern', stories: 'book', sayings: 'scroll' },
};

export function defineTopic({ id, name, description, categories, lessons, questions, stage = '第一阶段 · 字词基础' }) {
  return {
    id, name, description, stage,
    categories: categories.map(category => ({ ...category, icon: category.icon || categoryIcons[id]?.[category.id] })),
    lessons: lessons.map(lesson => ({ ...lesson, id: `${id}:lesson:${lesson.id}` })),
    questions: questions.map(question => ({ ...question, id: `${id}:question:${question.id}` })),
  };
}

export function choice(id, category, prompt, answer, distractors, explanation, display = '') {
  return { id, category, prompt, display, answer, options: [answer, ...distractors], explanation };
}
