import { dictionaryTopic } from './dictionary-data.js';
import { vocabularyTopic } from './vocabulary-data.js';
import { relationsTopic } from './word-relations-data.js';
import { collocationTopic } from './collocations-data.js';
import { patternsTopic } from './word-patterns-data.js';
import { sentenceBuildingTopic } from './sentence-building-data.js';
import { punctuationTopic } from './punctuation-data.js';
import { sentencePatternsTopic } from './sentence-patterns-data.js';

export const chineseTopics = [dictionaryTopic, vocabularyTopic, relationsTopic, collocationTopic, patternsTopic, sentenceBuildingTopic, punctuationTopic, sentencePatternsTopic];
export const topicById = id => chineseTopics.find(topic => topic.id === id);
