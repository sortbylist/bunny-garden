import { dictionaryTopic } from './dictionary-data.js';
import { vocabularyTopic } from './vocabulary-data.js';
import { relationsTopic } from './word-relations-data.js';
import { collocationTopic } from './collocations-data.js';

export const chineseTopics = [dictionaryTopic, vocabularyTopic, relationsTopic, collocationTopic];
export const topicById = id => chineseTopics.find(topic => topic.id === id);
