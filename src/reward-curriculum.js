import { chineseTopics } from './chinese-topics.js';
import { mathTopics } from './math-topics.js';
import { hanziCategories, hanziLessons, hanziQuestions } from './hanzi-data.js';
import { phonicsModules, phonicsLessons } from './phonics-data.js';
import { phonicsQuestions } from './phonics-engine.js';
import { subjects } from './data.js';

const topicIcon = (subjectId, topicId) => {
  const subject = subjects.find(item => item.id === subjectId);
  return subject.features.find(feature => feature.id === topicId)?.icon || subject.features[0].icon;
};

const makeTopic = (topic, subject) => ({
  id: topic.id, name: topic.name, subject, icon: topicIcon(subject, topic.id),
  stageId: `${subject}-${Math.max(1, '一二三四'.indexOf(topic.stage.match(/[一二三四]/)?.[0]) + 1)}`,
  sections: topic.categories.map(category => ({
    id: `${topic.id}/${category.id}`, name: category.name,
    learnIds: topic.lessons.filter(lesson => lesson.category === category.id).map(lesson => lesson.id),
    questionIds: topic.questions.filter(question => question.category === category.id).map(question => question.id),
  })),
});

export const rewardTopics = [
  {
    id: 'hanzi-structure', name: '汉字笔画与结构', subject: 'chinese', stageId: 'chinese-1', icon: topicIcon('chinese', 'hanzi-structure'),
    sections: hanziCategories.map(category => ({
      id: `hanzi-structure/${category.id}`, name: category.name,
      learnIds: hanziLessons.filter(lesson => lesson.category === category.id).map(lesson => `hanzi:${lesson.id}`),
      questionIds: hanziQuestions.filter(question => question.category === category.id).map(question => question.id),
    })),
  },
  ...chineseTopics.map(topic => makeTopic(topic, 'chinese')),
  ...mathTopics.map(topic => makeTopic(topic, 'math')),
  ...phonicsModules.map((module, index) => ({
    id: module.id, name: module.name, subject: 'english', stageId: `english-${Math.floor(index / 3) + 1}`, icon: module.icon || topicIcon('english', 'phonics'),
    sections: phonicsLessons.filter(lesson => lesson.moduleId === module.id).map(lesson => ({
      id: `english/${lesson.id}`, name: `第 ${lesson.number} 课 · ${lesson.title}`,
      learnIds: lesson.words.map(word => `english:${word.id}`),
      questionIds: phonicsQuestions.filter(question => question.lessonId === lesson.id || lesson.words.some(word => word.id === question.wordId)).map(question => `english:${question.id}`),
    })),
  })),
];

const stageNames = {
  'chinese-1': '字词基础', 'chinese-2': '句子运用', 'chinese-3': '阅读积累',
  'math-1': '数与运算', 'english-1': '拼读启航', 'english-2': '拼读进阶',
  'english-3': '拼读探索', 'english-4': '拼读应用',
};
const subjectNames = { chinese: '语文', math: '数学', english: '英语' };

export const rewardStages = Object.entries(stageNames).map(([id, name]) => ({
  id, name, subject: id.split('-')[0],
  label: `${subjectNames[id.split('-')[0]]}第${'一二三四'[Number(id.split('-')[1]) - 1]}阶段`,
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
