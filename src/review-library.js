import './review-library.css';
import { icon } from './icons.js';
import { renderNavPicker } from './navigation.js';
import { favoriteKey, resolveFavorite } from './content-favorites.js';
import { pinyinQuestionCategory } from './learning-data.js';
import { hanziCategories } from './hanzi-data.js';
import { phonicsLessonById } from './phonics-data.js';
import { groups as pinyinGroups } from './data.js';

export const libraryTitles = { mistakes: '错题本', favorites: '我的收藏', records: '学习记录' };
export const reviewBatchSize = 20;
const subjectLabels = { chinese: '语文', math: '数学', english: '英语' };
const featureLabels = { pinyin: '拼音学习', 'hanzi-structure': '汉字笔画与结构', phonics: '自然拼读' };
const descriptions = { mistakes: '选一道题，或按主题练一组。独立改对的题会移出错题本。', favorites: '找回你收藏的学习卡和练习题。', records: '按日期查看各科的练习，以及累计学习进度。' };
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const questionRef = (subject, feature, id) => `${subject}/${feature}/question/${id}`;
const topicSubject = topic => topic.subject || 'chinese';
const pinyinSections = { words: '常见字词', tones: '声调', blend: '拼读', confusing: '易混辨音', rules: '标调与拼写' };

function sectionLabel(feature, section, topic) {
  if (feature === 'phonics') return phonicsLessonById.get(section)?.title;
  if (feature === 'pinyin') return pinyinSections[section] || pinyinGroups.find(group => group.id === section)?.name;
  return (feature === 'hanzi-structure' ? hanziCategories : topic?.categories)?.find(category => category.id === section)?.name;
}

function groupBy(entries, key) {
  const groups = new Map();
  for (const entry of entries) {
    const group = key(entry);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(entry);
  }
  return groups;
}

export function libraryItem(ref, state, topicById) {
  const [subject, feature, kind] = ref.split('/');
  const topic = topicById(feature);
  const card = resolveFavorite(ref, topicById, state);
  if (!card) return null;
  const section = feature === 'pinyin' && card.question ? pinyinQuestionCategory(card.question)
    : card.question?.category || card.question?.lessonId || card.lesson?.category;
  return {
    ...card, ref, subject, feature, topic, kind, section,
    type: ['question', 'match'].includes(kind) ? 'practice' : 'learn',
    source: `${subjectLabels[subject]} / ${featureLabels[feature] || topic.name}`,
  };
}

export function libraryItems(view, state, topics, topicById) {
  const refs = view === 'favorites'
    ? [...state.savedContent].reverse().concat(state.favorites.map(id => `chinese/pinyin/word/${id}`), state.phonics.favorites.map(id => `english/phonics/word/${id}`))
    : [
        ...[...state.mistakes].sort((first, second) => second.time - first.time).map(entry => questionRef('chinese', 'pinyin', entry.question.id)),
        ...state.hanzi.mistakes.map(id => questionRef('chinese', 'hanzi-structure', id)),
        ...state.phonics.mistakes.map(id => questionRef('english', 'phonics', id)),
        ...topics.flatMap(topic => state.topics[topic.id].mistakes.map(id => questionRef(topicSubject(topic), topic.id, id))),
      ];
  const seen = new Set();
  return refs.flatMap(ref => {
    const key = favoriteKey(ref);
    if (seen.has(key)) return [];
    const item = libraryItem(ref, state, topicById);
    if (!item) return [];
    seen.add(key);
    return [item];
  });
}

export function duePhonicsItems(state, topicById) {
  const now = Date.now();
  return Object.entries(state.phonics.reviews).filter(([, entry]) => entry.due <= now)
    .map(([id]) => libraryItem(questionRef('english', 'phonics', id), state, topicById)).filter(Boolean);
}

const action = (name, label, symbol, attributes = '', style = 'outline-button') => `<button type="button" class="${style}" data-action="${name}" ${attributes}>${symbol ? icon(symbol) : ''}${label}</button>`;

function filterPicker(filter, label, entries, selected) {
  const current = entries.find(([id]) => id === selected)?.[1] || `全部${label}`;
  const options = [['all', `全部${label}`], ...entries].map(([id, name]) => {
    const isCurrent = id === selected;
    return `<button type="button" class="nav-catalog-item" data-action="library-filter" data-filter="${filter}" data-id="${escape(id)}"${isCurrent ? ' aria-current="true"' : ''}><span>${escape(name)}</span>${isCurrent ? icon('check') : ''}</button>`;
  });
  return renderNavPicker({
    className: 'review-filter-picker',
    summary: `<span>${escape(current)}</span>`,
    summaryLabel: `选择${label}，当前：${current}`,
    summaryId: `library-filter-${filter}`,
    panelClass: 'review-filter-panel',
    panelLabel: label,
    content: `<div class="nav-panel-heading"><strong>选择${label}</strong></div><div class="nav-catalog-list">${options.join('')}</div>`,
  });
}

function records(state, topics, subject, topicById) {
  const progress = [
    { subject: 'chinese', name: featureLabels.pinyin, seen: state.seen.length, known: state.known.length },
    { subject: 'chinese', name: featureLabels['hanzi-structure'], known: state.hanzi.known.length },
    { subject: 'english', name: featureLabels.phonics, seen: state.phonics.seen.length, known: state.phonics.known.length },
    ...topics.map(topic => ({ subject: topicSubject(topic), name: topic.name, known: state.topics[topic.id].known.length })),
  ].filter(entry => (subject === 'all' || entry.subject === subject) && (entry.seen || entry.known));
  const topicSubjects = new Map(topics.map(topic => [topic.id, topicSubject(topic)]));
  const history = [
    ...state.history.map(entry => ({ ...entry, subject: topicSubjects.get(entry.topicId) || 'chinese' })),
    ...state.phonics.history.map(entry => ({ ...entry, subject: 'english' })),
  ].filter(entry => subject === 'all' || entry.subject === subject).sort((first, second) => second.time - first.time);
  const days = groupBy(history, entry => new Date(entry.time).toLocaleDateString('zh-CN'));
  const due = subject !== 'chinese' && subject !== 'math' ? duePhonicsItems(state, topicById).length : 0;
  return `<section class="review-panel"><h2>累计学习进度</h2>${progress.length ? `<ul class="review-progress">${progress.map(entry => `<li><strong>${escape(entry.name)}</strong><span>${entry.seen === undefined ? '' : `已浏览 ${entry.seen} 项 · `}自评确认 ${entry.known} 项</span></li>`).join('')}</ul>` : '<p>浏览词卡或标记「我认识啦」后，就能在这里看到累计进度。</p>'}</section>
    ${due ? `<section class="review-panel review-group"><h2>自然拼读 · ${due} 道题到期</h2>${action('library-review-due', '复习到期题目', 'pen')}</section>` : ''}
    <section class="review-panel"><h2>练习记录</h2>${days.size ? [...days].map(([day, entries]) => `<section class="review-day"><h3>${escape(day)}</h3><ul class="history-list">${entries.map(entry => `<li><span>${escape(entry.name)}<small>${subjectLabels[entry.subject]}</small></span><b>${entry.correct} / ${entry.total}<small>${entry.skipped === undefined ? '首次答对' : `首次答对 · 跳过 ${entry.skipped} 题`}</small></b></li>`).join('')}</ul></section>`).join('') : '<p>完成一轮练习后，成绩会出现在这里。</p>'}</section>`;
}

export function renderLibrary(view, filters, state, topics, topicById) {
  const items = view === 'records' ? [] : libraryItems(view, state, topics, topicById);
  const bySubject = items.filter(item => filters.subject === 'all' || item.subject === filters.subject);
  const themes = new Map(bySubject.map(item => [item.feature, item.source]));
  if (filters.feature !== 'all' && !themes.has(filters.feature)) {
    const label = featureLabels[filters.feature] || topicById(filters.feature)?.name;
    if (label) themes.set(filters.feature, label);
  }
  const byTheme = bySubject.filter(item => filters.feature === 'all' || item.feature === filters.feature);
  const sections = new Map(byTheme.filter(item => item.section).map(item => [item.section, sectionLabel(item.feature, item.section, item.topic)]));
  if (filters.section !== 'all' && !sections.has(filters.section)) {
    const label = sectionLabel(filters.feature, filters.section, topicById(filters.feature));
    if (label) sections.set(filters.section, label);
  }
  const filtered = byTheme.filter(item => (filters.section === 'all' || item.section === filters.section)
    && (filters.type === 'all' || item.type === filters.type));
  const groups = groupBy(filtered, item => view === 'mistakes' ? item.source : '');
  const lists = [...groups].map(([source, entries]) => `<section class="review-panel">
    ${source ? `<div class="review-group"><h2>${escape(source)} <small>${entries.length} 题</small></h2>${action('library-review-group', entries.length > reviewBatchSize ? `开始复习 · ${reviewBatchSize} 题` : '练这组错题', 'pen', `data-id="${escape(entries[0].feature)}"`)}</div>` : ''}
    <ul class="review-items">${entries.map(item => `<li><button type="button" data-action="library-item" data-ref="${encodeURIComponent(item.ref)}"><span><strong>${escape(item.title)}</strong><small>${item.type === 'learn' ? '学习卡' : '练习题'}${source ? '' : ` · ${escape(item.source)}`}</small></span>${icon('chevron')}</button></li>`).join('')}</ul>
  </section>`).join('');
  return `<section class="review-library" aria-labelledby="library-title">
    ${action('library-exit', '返回课程', 'book', '', 'text-button')}
    <div class="page-heading"><div><h1 id="library-title">${libraryTitles[view]}</h1><p>${descriptions[view]}</p></div></div>
    <div class="review-filters" role="group" aria-label="筛选">
    ${filterPicker('subject', '学科', Object.entries(subjectLabels), filters.subject)}
    ${view === 'mistakes' ? filterPicker('feature', '主题', [...themes], filters.feature) : ''}
    ${view === 'mistakes' && filters.feature !== 'all' && sections.size ? filterPicker('section', '小节', [...sections], filters.section) : ''}
    ${view === 'favorites' ? filterPicker('type', '类型', [['learn', '学习卡'], ['practice', '练习题']], filters.type) : ''}
    ${view !== 'records' ? `<span role="status">${filtered.length} ${view === 'mistakes' ? '道待复习' : '项收藏'}</span>` : ''}</div>
    ${view === 'records' ? records(state, topics, filters.subject, topicById) : lists || `<section class="review-panel"><p>${items.length ? '这个筛选范围暂时没有内容。' : view === 'mistakes' ? '暂时没有待复习的错题。' : '在学习卡或练习题上点爱心，就能在这里找到它。'}</p></section>`}
  </section>`;
}
