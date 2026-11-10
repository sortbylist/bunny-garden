import { dictionaryTopic } from './dictionary-data.js';

export const chineseTopics = [dictionaryTopic];
export const topicById = id => chineseTopics.find(topic => topic.id === id);
