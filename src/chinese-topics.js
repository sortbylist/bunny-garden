import { dictionaryTopic } from './dictionary-data.js';
import { vocabularyTopic } from './vocabulary-data.js';

export const chineseTopics = [dictionaryTopic, vocabularyTopic];
export const topicById = id => chineseTopics.find(topic => topic.id === id);
