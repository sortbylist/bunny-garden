import { dictionaryTopic } from './dictionary-data.js';
import { vocabularyTopic } from './vocabulary-data.js';
import { relationsTopic } from './word-relations-data.js';

export const chineseTopics = [dictionaryTopic, vocabularyTopic, relationsTopic];
export const topicById = id => chineseTopics.find(topic => topic.id === id);
