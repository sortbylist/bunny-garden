import { dictionaryTopic } from './dictionary-data.js';
import { vocabularyTopic } from './vocabulary-data.js';
import { relationsTopic } from './word-relations-data.js';
import { collocationTopic } from './collocations-data.js';
import { patternsTopic } from './word-patterns-data.js';
import { sentenceBuildingTopic } from './sentence-building-data.js';
import { punctuationTopic } from './punctuation-data.js';
import { sentencePatternsTopic } from './sentence-patterns-data.js';
import { sentenceRevisionTopic } from './sentence-revision-data.js';
import { vividExpressionTopic } from './vivid-expression-data.js';
import { similarCharactersTopic } from './similar-characters-data.js';
import { characterReadingsTopic } from './character-readings-data.js';
import { poetryTopic } from './poetry-data.js';

export const chineseTopics = [dictionaryTopic, vocabularyTopic, relationsTopic, collocationTopic, patternsTopic, sentenceBuildingTopic, punctuationTopic, sentencePatternsTopic, sentenceRevisionTopic, vividExpressionTopic, similarCharactersTopic, characterReadingsTopic, poetryTopic];
export const topicById = id => chineseTopics.find(topic => topic.id === id);
