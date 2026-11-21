import { chineseTopics } from './chinese-topics.js';
import { mathTopics } from './math-topics.js';
import { englishTopics } from './english-topics.js';
import { hanziCategories, hanziLessons, hanziQuestions } from './hanzi-data.js';
import { phonicsModules, phonicsLessons } from './phonics-data.js';
import { phonicsQuestions } from './phonics-engine.js';
import { featureGroups, subjects } from './data.js';

const topicIcon = (subjectId, topicId) => {
  const subject = subjects.find(item => item.id === subjectId);
  return subject.features.find(feature => feature.id === topicId)?.icon || subject.features[0].icon;
};

const curriculumStages = subjects.flatMap(subject => featureGroups(subject).map(stage => ({ ...stage, subject })));
const stageByTopic = new Map(curriculumStages.flatMap(stage => stage.items.map(topic => [topic.id, stage.id])));

const makeTopic = (topic, subject) => ({
  id: topic.id, name: topic.name, subject, icon: topicIcon(subject, topic.id),
  stageId: stageByTopic.get(topic.id),
  sections: topic.categories.map(category => ({
    id: `${topic.id}/${category.id}`, name: category.name,
    learnIds: topic.lessons.filter(lesson => lesson.category === category.id).map(lesson => lesson.id),
    questionIds: topic.questions.filter(question => question.category === category.id).map(question => question.id),
  })),
});

const phonicsSections = phonicsLessons.map(lesson => ({
  id: `english/${lesson.id}`, name: `第 ${lesson.number} 课 · ${lesson.title}`,
  moduleId: lesson.moduleId,
  learnIds: lesson.words.map(word => `english:${word.id}`),
  questionIds: phonicsQuestions.filter(question => question.lessonId === lesson.id || lesson.words.some(word => word.id === question.wordId)).map(question => `english:${question.id}`),
}));

export const phonicsRewardModules = phonicsModules.map(module => ({
  id: module.id, name: module.name, subject: 'english', icon: module.icon || topicIcon('english', 'phonics'),
  sections: phonicsSections.filter(section => section.moduleId === module.id),
}));

export const rewardTopics = [
  {
    id: 'hanzi-structure', name: '汉字笔画与结构', subject: 'chinese', stageId: stageByTopic.get('hanzi-structure'), icon: topicIcon('chinese', 'hanzi-structure'),
    sections: hanziCategories.map(category => ({
      id: `hanzi-structure/${category.id}`, name: category.name,
      learnIds: hanziLessons.filter(lesson => lesson.category === category.id).map(lesson => `hanzi:${lesson.id}`),
      questionIds: hanziQuestions.filter(question => question.category === category.id).map(question => question.id),
    })),
  },
  ...chineseTopics.map(topic => makeTopic(topic, 'chinese')),
  ...mathTopics.map(topic => makeTopic(topic, 'math')),
  { id: 'phonics', name: '自然拼读', subject: 'english', stageId: stageByTopic.get('phonics'), icon: topicIcon('english', 'phonics'), phonics: true, sections: phonicsSections },
  ...englishTopics.map(topic => makeTopic(topic, 'english')),
];

export const rewardStages = curriculumStages.map(({ id, name, stage, subject }) => ({
  id,
  name: id === 'chinese-3' ? '阅读积累' : name,
  subject: subject.id,
  label: `${subject.name}${stage}`,
  topics: rewardTopics.filter(topic => topic.stageId === id),
})).filter(stage => stage.topics.length);

export const rewardSections = new Map(rewardTopics.flatMap(topic => topic.sections.map(section => [section.id, { ...section, topicId: topic.id, subject: topic.subject }])));

export function sectionProgress(rewards, section, confirmed = new Set(rewards.events.filter(event => event.kind === 'learn').map(event => event.id.slice(6)))) {
  const learned = section.learnIds.filter(id => confirmed.has(id)).length;
  const required = Math.min(5, section.questionIds.length);
  const evidence = rewards.mastery?.[section.id];
  const passed = Boolean(required && Array.isArray(evidence?.questionIds) && evidence.questionIds.length >= required &&
    new Set(evidence.questionIds).size === evidence.questionIds.length &&
    evidence.questionIds.every(id => section.questionIds.includes(id)) &&
    Array.isArray(evidence.correctIds) && new Set(evidence.correctIds).size === evidence.correctIds.length &&
    evidence.correctIds.every(id => evidence.questionIds.includes(id)) &&
    evidence.correctIds?.length >= Math.ceil(evidence.questionIds.length * 0.8));
  return { learned, total: section.learnIds.length, passed, complete: learned === section.learnIds.length && section.learnIds.length > 0 && passed };
}

export function curriculumProgress(rewards) {
  const confirmed = new Set(rewards.events.filter(event => event.kind === 'learn').map(event => event.id.slice(6)));
  const sections = new Map(rewardTopics.flatMap(topic => topic.sections.map(section => [section.id, sectionProgress(rewards, section, confirmed)])));
  const topics = new Map(rewardTopics.map(topic => [topic.id, topic.sections.length > 0 && topic.sections.every(section => sections.get(section.id).complete)]));
  return { sections, topics, completed: [...sections.values()].filter(section => section.complete).length };
}
