import './style.css';
import './personal.css';
import './learning-ui.css';
import { observeReadingRows } from './reading-layout.js';
import { basics, groups, modes, playModes, subjects, featureGroups, vocabulary, marked, confusionSets, toneExamples, neutralToneExamples } from './data.js';
import { shuffle, studyPool, learningGroups, nextStudyGroup, visitQuestion, nextUnfinishedQuestion, createRound, recordAnswer, roundStats, selectMatch, defaultState } from './engine.js';
import { icon, bunny } from './icons.js';
import { playAudio, stopAudio, onAudioStatus, chime, hasAudio } from './audio.js';
import { createPoetryAudio } from './poetry-audio.js';
import { initializeRewards, grantRewards, rewardStats, rewardCatalog, rewardProgress, equipReward, normalizeNickname } from './rewards.js';
import { rewardArt, rewardStamp } from './reward-art.js';
import { rewardStages, curriculumProgress } from './reward-curriculum.js';
import { rewardHelp } from './reward-help.js';
import { createRewardCelebration } from './reward-celebration.js';
import { rewardViewer, mountRewardViewer } from './reward-viewer.js';
import { normalizeHanziState, startHanziRound, answerHanzi } from './hanzi-engine.js';
import { hanziLessons } from './hanzi-data.js';
import { libraryTitles, libraryItem, libraryItems, duePhonicsItems, reviewBatchSize, renderLibrary } from './review-library.js';
import { favoriteKey, favoriteQuestionRef } from './content-favorites.js';
import { renderHanzi, handleHanziAction, hanziLearningCard, hanziQuizCard } from './hanzi.js';
import { chineseTopics } from './chinese-topics.js';
import { mathTopics } from './math-topics.js';
import { englishTopics } from './english-topics.js';
import { createEnglishAudio } from './english-learning.js';
import { topicDefaults, startTopicRound, updateTopicActivity, answerTopic } from './chinese-engine.js';
import { renderTopic, handleTopicAction, topicLearningCard, topicQuizCard, dictionaryEntryCard, topicClassName } from './chinese.js';
import { readingText } from './chinese-reading.js';
import { createPhonicsView } from './phonics.js';
import { createPhonicsRound, answerPhonics, editPhonicsDraft } from './phonics-engine.js';
import { createNavigation, renderCoursePicker, renderCurriculum } from './navigation.js';
import { favoriteButton, learningBook, learningPosition, learningTokenClass, roundSettings, reviewShortcut, focusLearningActivity, sectionPracticeButton } from './learning-ui.js';
import { createBookTabs } from './book-tabs.js';
import { practiceLengths } from './chinese-practice.js';
import './ui-theme.css';
import './book-tabs.css';
import { backupFilename, createBackup, parseBackup, restoreBackup, maxBackupBytes } from './backup.js';
import { loadState, saveState } from './storage.js';
import { pinyinPracticeCategory } from './learning-data.js';
import { publicAsset } from './public-asset.js';
import { pinyinBlendAudio, pinyinCardAudio, pinyinOptionAudio, pinyinQuestionAudio } from './pinyin-audio-data.js';
import { pinyinCardContent } from './pinyin-card.js';

const bunnyImage = publicAsset('/bunny.svg');
const app = document.querySelector('#app');
const bookTabs = createBookTabs(app);
const dialog = document.querySelector('#dialog');
const loaded = loadState({ getItem: key => localStorage.getItem(key) });
let state = loaded.state;
const learningTopics = [...chineseTopics, ...mathTopics, ...englishTopics];
const topicById = id => learningTopics.find(topic => topic.id === id);
const activeTopic = () => topicById(state.features[state.subject]);
const isPhonics = () => state.subject === 'english' && state.features.english === 'phonics';
let storageAvailable = loaded.available;
let storageReadFailed = !loaded.available;
let mobileMenu = false;
let toastTimer;
let pendingBackup = null;
let backupReadRequest = 0;
let backupCommitted = false;
let dialogReturnFocus;
let settingsScrollBeforeReset = 0;
let continuousToken = 0;
const pageFromHash = () => {
  const id = location.hash.slice(4);
  return location.hash.startsWith('#my-') && Object.hasOwn(libraryTitles, id) ? id : null;
};
const defaultLibraryFilters = () => ({ subject: 'all', feature: 'all', section: 'all', type: 'all' });
let libraryPage = pageFromHash();
let libraryFilters = defaultLibraryFilters();
let libraryDetail = null;
let pinyinLearningMode = 'sequence';
const studyModes = ['sequence', 'random', 'favorites'];
let rewardFilter = 'all';
let rewardHelpReturn = null;
let rewardHelpHistory = [];
let activeRewardHelp = null;
let rewardDetailReturn = null;
let disposeRewardViewer = () => {};
let disposeRewardHelp = () => {};
let disposeReadingRows = () => {};
initializeRewards(state);
state.nickname = normalizeNickname(state.nickname) || '小小探索家';
const allItems = [...basics, ...vocabulary];
const wordScopes = [
  { id: 'all', name: '字词一起练', short: '单字和词语一起练习', color: 'pink' },
  { id: 'characters', name: '常见单字', short: '一个字一个字认一认', color: 'mint' },
  { id: 'words', name: '双字词语', short: '把字连成生活中的词语', color: 'yellow' },
];
const availableWordScopes = () => ['hanzi', 'pinyin', 'match', 'challenge'].includes(state.mode) ? wordScopes : [];
if (!subjects.some(subject => subject.id === state.subject)) state.subject = 'chinese';
if (!modes.some(mode => mode.id === state.mode)) state.mode = 'sequence';
if (state.group !== 'all' && !groups.some(group => group.id === state.group)) state.group = 'all';
if (!confusionSets[state.confusion]) state.confusion = 'retroflex';
const englishAudio = createEnglishAudio();
const phonics = createPhonicsView({
  state: state.phonics, persist, cardFavorite, slowPlayback: () => state.settings.slow,
  renderNavigation: options => renderCurriculum(navigation, options),
  redraw: render, notify: toast, renderGarden: progressCard, redrawPreview: () => {
    if (libraryDetail?.items[libraryDetail.index]?.feature === 'phonics') refreshLibraryDetail();
  },
  haltOtherAudio: () => { continuousToken++; stopAudio(); },
  rewardAction: action => celebrateReward(grantRewards(state, action)),
});

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = (action, label, symbol, className = '', attributes = '') => `<button type="button" class="${className}" data-action="${action}" ${attributes}>${symbol ? icon(symbol) : ''}${label}</button>`;
const currentMode = () => modes.find(mode => mode.id === state.mode);
const groupName = id => groups.find(group => group.id === id)?.name || '全部拼音';
const key = () => `${state.mode === 'tones' && state.tonePractice ? 'tonequiz' : state.mode}:${state.group}:${state.wordScope}:${state.confusion}:${state.length}`;
const navigation = createNavigation((action, id) => {
  if (action === 'mode') { changeMode(id); return; }
  state.features[state.subject] = id;
  halt();
  state.settings.continuous = false;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
});

function persist() {
  if (backupCommitted || storageReadFailed) return;
  try { saveState(localStorage, state); }
  catch {
    if (storageAvailable) toast('暂时无法保存进度，你仍然可以继续练习。');
    storageAvailable = false;
  }
}

const celebrations = createRewardCelebration({
  getState: () => state, persist, mainDialog: dialog,
  myTarget: () => app.querySelector('.my-menu-toggle'),
  playSound: () => chime(state.settings.effects),
});

function toast(message) {
  const element = document.querySelector('#toast');
  clearTimeout(toastTimer);
  element.textContent = message;
  element.classList.add('visible');
  toastTimer = setTimeout(() => element.classList.remove('visible'), 3500);
}

const poetryAudio = createPoetryAudio((status, message) => {
  const controls = document.querySelector('.ct-poem-audio');
  if (!controls) return;
  const busy = status === 'loading' || status === 'playing';
  controls.setAttribute('aria-busy', String(status === 'loading'));
  controls.querySelector('[data-action="ct-poem-stop"]').disabled = !busy;
  const label = document.querySelector('.ct-poem-audio-status');
  if (label) label.textContent = message || (status === 'loading' ? '正在准备朗读……' : status === 'playing' ? '正在朗读，可以跟着轻声读。' : '普通话合成语音，点击后播放。');
});

function halt() { continuousToken++; stopAudio(); phonics.stop(); poetryAudio.stop(); englishAudio.stop(); }

function session() {
  const sessionKey = key();
  let value = state.sessions[sessionKey];
  if (studyModes.includes(state.mode)) {
    const pool = studyPool(state.mode, state.group, state.favorites);
    const validIds = new Set(pool.map(item => item.id));
    if (!value || !Array.isArray(value.ids)) value = { ids: (state.mode === 'random' ? shuffle(pool) : pool).map(item => item.id), index: 0 };
    value.ids = value.ids.filter(id => validIds.has(id));
    for (const item of pool) if (!value.ids.includes(item.id)) value.ids.push(item.id);
    if (!Number.isInteger(value.index) || value.index < 0 || value.index >= value.ids.length) value.index = 0;
  } else if (state.mode === 'match') {
    if (!value || !Array.isArray(value.pairs)) {
      const unique = vocabulary.filter((item, index) => vocabulary.findIndex(other => other.pinyin === item.pinyin) === index);
      const pairs = shuffle(unique.filter(item => state.wordScope === 'characters' ? item.sounds.length === 1 : state.wordScope === 'words' ? item.sounds.length > 1 : true)).slice(0, 4);
      value = { pairs: pairs.map(item => item.id), right: shuffle(pairs).map(item => item.id), matched: [], left: null, attempts: 0, wrong: [], finished: false };
    }
  } else if (state.mode !== 'tones' || state.tonePractice) {
    if (!value || !Array.isArray(value.questions) || !Array.isArray(value.responses) || (state.mode === 'mistakes' && !value.questions.length && state.mistakes.length)) value = createRound(state.mode === 'tones' ? 'tonequiz' : state.mode, state, state.length);
    if (!Number.isInteger(value.index) || value.index < 0 || value.index >= value.questions.length) value.index = 0;
  } else value = {};
  state.sessions[sessionKey] = value;
  return value;
}

function currentItem() {
  const value = session();
  return allItems.find(item => item.id === value.ids?.[value.index]);
}

function render() {
  if (backupCommitted) return;
  const previousBook = bookTabs.capture();
  disposeReadingRows();
  poetryAudio.stop();
  englishAudio.stop();
  navigation.capture();
  state.hanzi ||= normalizeHanziState(null);
  for (const topic of learningTopics) state.topics[topic.id] ||= topicDefaults(topic);
  for (const subject of subjects) {
    if (!subject.features.some(feature => feature.id === state.features[subject.id])) state.features[subject.id] = subject.features[0]?.id;
  }
  const focused = document.activeElement;
  const focusedAction = focused?.closest('#app') ? focused.dataset.action : null;
  const focusedNavigation = focused?.closest('.learning-navigation')?.dataset.navigation;
  const focusData = focusedAction ? { action: focusedAction, id: focused.dataset.id, value: focused.dataset.value, index: focused.dataset.index } : null;
  const subject = subjects.find(item => item.id === state.subject);
  const isHanzi = state.subject === 'chinese' && state.features.chinese === 'hanzi-structure';
  const topic = activeTopic();
  const topicState = topic && state.topics[topic.id];
  document.title = `${libraryTitles[libraryPage] || (topic ? topic.name : isHanzi ? '汉字笔画与结构' : subject.name === '语文' ? currentMode().name + ' · 拼音学习' : subject.name)} · 小兔学习乐园`;
  app.className = `${state.collapsed ? 'sidebar-collapsed' : ''} ${mobileMenu ? 'mobile-open' : ''}`;
  app.classList.toggle('no-reward-motion', !state.settings.animations);
  app.innerHTML = `
    <a class="skip-link" href="#main-content">跳到学习内容</a>
    ${mobileMenu ? '<button class="drawer-backdrop" data-action="mobile-menu" aria-label="关闭学科导航"></button>' : ''}
    <aside class="sidebar" aria-label="学科导航">
      <div class="brand"><img src="${bunnyImage}" alt="" width="43" height="43"><div class="brand-text"><strong>小兔学习乐园</strong><span>每天进步一点点</span></div></div>
      ${button('collapse', '<span class="nav-label">收起侧栏</span>', 'panel', 'collapse-button', `aria-label="${state.collapsed ? '展开' : '收起'}侧栏" aria-expanded="${!state.collapsed}"`)}
      <div class="nav-caption">我的学习天地</div>
      <nav class="subjects">${subjects.map(item => `<button class="subject ${item.color} ${state.subject === item.id ? 'active' : ''}" data-action="subject" data-id="${item.id}" aria-label="${item.name}" ${state.subject === item.id ? 'aria-current="page"' : ''}><span class="subject-icon">${icon(item.icon)}</span><span class="subject-name">${item.name}<small>${item.english}</small></span>${icon('chevron', 'nav-arrow')}</button>`).join('')}</nav>
      <div class="sidebar-note">${icon('sprout')}<strong>小小的坚持，<br>大大的成长。</strong><span>跟着小兔，快乐学习</span><i class="note-flower">✿</i></div>
      <div class="sidebar-bottom">${button('settings', '<span class="nav-label">学习设置</span>', 'settings', 'nav-bottom', 'title="学习设置"')}${button('about', '<span class="nav-label">关于学习乐园</span>', 'info', 'nav-bottom', 'title="关于学习乐园"')}<span class="local-note">${icon('leaf')} 学习记录保存在本机</span></div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        ${button('mobile-menu', '', 'menu', 'icon-button mobile-toggle', 'aria-label="切换学科导航"')}
        <div class="breadcrumb">学习乐园 ${icon('chevron')} <span>${libraryPage ? '我的' : subject.name}</span></div>
        <div class="topbar-right"><button class="star-counter" data-action="reward-rules" aria-label="查看星星收获与获取规则">${icon('star')}<b>${rewardStats(state.rewards).stars}</b><span>颗成长星</span>${icon('info')}</button><details class="my-menu"><summary class="my-menu-toggle" aria-label="打开我的菜单"><img src="${bunnyImage}" alt="" width="38" height="38"><span>${escape(state.nickname)}<small>我的 ${icon('down')}</small></span></summary><div class="my-menu-content"><strong>你好，${escape(state.nickname)}</strong>${button('profile', '我的成长空间', 'sprout')}${personalButtons()}${button('reward-collection', '奖励收藏册', 'star')}${button('menu-settings', '学习设置', 'settings')}</div></details></div>
      </header>
      ${libraryPage ? '' : navigation.render({ id: `features-${subject.id}`, label: `${subject.name}主题`, groupLabel: `${subject.name}阶段`, groups: featureGroups(subject), selected: state.features[subject.id], memories: state.navigationSelections, action: 'feature', className: 'feature-navigation' })}
      <main id="main-content" tabindex="-1">${libraryPage ? renderLibrary(libraryPage, libraryFilters, state, learningTopics, topicById) : topic ? renderTopic(topic, { ...topicState, cardFavorite, heard: englishAudio.heard(topicState.round), showPinyin: topicState.showPinyin && state.settings.showPinyin }, progressCard(), navigation) : isHanzi ? renderHanzi({ ...state.hanzi, cardFavorite, showPinyin: state.settings.showPinyin }, progressCard(), navigation) : state.subject === 'chinese' ? learningPage() : state.subject === 'english' ? phonics.render() : comingSoon(subject)}</main>
      <footer>用一点好奇心，收获一点新知识。${icon('heart')}<span>小兔陪你慢慢学</span></footer>
    </div>`;
  disposeReadingRows = observeReadingRows(app);
  if (focusData && !dialog.open) {
    const candidates = [...app.querySelectorAll('[data-action]')];
    const replacement = candidates.find(element => element.dataset.action === focusData.action && element.dataset.id === focusData.id && element.dataset.value === focusData.value && element.dataset.index === focusData.index && !element.disabled && element.getClientRects().length);
    if (replacement) replacement.focus({ preventScroll: true });
    else if (focusedNavigation) app.querySelector(`[data-navigation="${focusedNavigation}"] ${focusData.action === 'nav-group' ? '.nav-group-picker' : '.nav-catalog-picker'} summary`)?.focus({ preventScroll: true });
    else (app.querySelector('[data-action="ct-advance"]') || app.querySelector('[data-action="ct-answer"]:not(:disabled)') || app.querySelector('[data-action="ct-learn"], [data-action="hz-advance"], [data-action="hz-stroke-previous"]:not(:disabled), [data-action="next-question"]:not(:disabled)'))?.focus({ preventScroll: true });
  }
  navigation.bind();
  bookTabs.bind(previousBook);
  persist();
  celebrations.resume();
}

function learningPage() {
  const mode = currentMode();
  const value = session();
  const studying = studyModes.includes(state.mode);
  const item = studying ? allItems.find(entry => entry.id === value.ids[value.index]) : null;
  if (studying) {
    if (item && !state.seen.includes(item.id)) state.seen.push(item.id);
  }
  const learningTones = state.mode === 'tones' && !state.tonePractice;
  const paired = state.mode === 'tones' || state.mode === 'section-practice' || studying && state.mode !== 'favorites';
  const book = learningBook({
    action: 'pinyin-page',
    category: pinyinCategory(),
    page: studying || learningTones ? 'learn' : 'practice',
    paired,
    content: studying ? studyCard(value, item)
      + (state.mode === 'favorites' && value.ids.length ? `<div class="controls">${button('shuffle-favorites', '打乱顺序复习', 'shuffle', 'text-button')}</div>` : '')
      + studyGrid(value) : learningTones ? tonesCard() : state.mode === 'match' ? matchCard(value) : quizCard(value),
  });
  return `<section class="page-heading"><div><div class="eyebrow"><span></span>语文的第一站 · PINYIN GARDEN</div><h1>和拼音交个朋友吧<span class="heading-flower">✿</span></h1><p>听一听，读一读。每认识一个拼音，都是小小的进步！</p></div><div class="heading-sticker">${icon('sprout')}<span>今天也要<br><b>快乐生长</b></span></div></section>
    ${modePicker()}
    <div class="learning-layout"><div class="learning-main" role="region" aria-label="${mode.name}">
      ${book}
      ${value?.questions ? roundSettings('pinyin', state.length, [5, 10, 20], previousPinyinLength()) : ''}
    </div><aside class="learning-aside">${progressCard()}${mapCard()}<div class="help-note">${icon('headphones')}<div><strong>小耳朵，准备好了吗？</strong><p>点击 ${icon('sound')} 就能听读音<br>听完以后，也试着读一读吧。</p></div></aside></div>`;
}

function previousPinyinLength() {
  return [5, 10, 20].find(length => {
    const round = state.sessions[`${key().split(':').slice(0, -1).join(':')}:${length}`];
    return length !== state.length && round && !round.finished && round.responses?.some(Boolean);
  });
}

function pinyinCategory() {
  return ['sequence', 'random', 'section-practice'].includes(state.mode) ? state.group : state.mode;
}

function modePicker() {
  const selected = pinyinCategory();
  const learning = [
    { id: 'all', name: '全部拼音', icon: 'book' },
    ...groups,
    modes.find(mode => mode.id === 'tones'),
  ];
  const category = learning.find(item => item.id === selected);
  return renderCurriculum(navigation, {
    id: 'pinyin-modes',
    selected,
    catalogName: '练习目录',
    leadingPicker: renderCoursePicker({
      name: category?.name || '拼音目录',
      active: Boolean(category),
      content: `<div class="nav-catalog-list">${learning.map(item => `<button type="button" class="nav-catalog-item" data-action="pinyin-category" data-id="${item.id}" ${item.id === selected ? 'aria-current="true"' : ''}>${icon(item.icon || 'book')}<span>${escape(item.name)}</span>${item.id === selected ? icon('check') : ''}</button>`).join('')}</div>`,
    }),
    practice: playModes.filter(mode => mode.group !== '认识拼音').map(mode => ({ ...mode, action: 'mode' })),
  });
}

function personalButtons() {
  const mistakes = state.mistakes.length + state.hanzi.mistakes.length + state.phonics.mistakes.length
    + learningTopics.reduce((total, topic) => total + state.topics[topic.id].mistakes.length, 0);
  const favorites = state.savedContent.length + state.favorites.length + state.phonics.favorites.length;
  return `${button('library-open', `错题本（${mistakes}）`, 'notebook', '', 'data-id="mistakes"')}${button('library-open', `我的收藏（${favorites}）`, 'heart', '', 'data-id="favorites"')}${button('library-open', '学习记录', 'book', '', 'data-id="records"')}`;
}

function stickerMotionHint(reward) {
  return reward.type === 'sticker' && state.settings.animations
    ? '<span class="reward-motion-hint" aria-hidden="true">点一下，看它动起来！</span>'
    : '';
}

function equippedRewards({ inGarden = false } = {}) {
  return Object.entries(state.rewards.equipped).map(([type, id]) => {
    const reward = rewardCatalog.find(item => item.id === id);
    if (!reward) return '';
    const hint = inGarden ? stickerMotionHint(reward) : '';
    return button('equipped-reward-preview', `${rewardArt(reward.art, '', reward.icon)}<span>${reward.name}</span>${hint}`, '', `equipped-item ${type}`, `data-id="${reward.id}" aria-label="查看${reward.name}动效"`);
  }).join('');
}

function cardFavorite(kind, id, question) {
  const ref = `${state.subject}/${state.features[state.subject]}/${kind}/${id}`;
  const saved = state.savedContent.some(value => favoriteKey(value) === ref);
  return favoriteButton('toggle-content-favorite', saved, favoriteQuestionRef(ref, question));
}

function setLibraryPage(page, feature = 'all', section = 'all') {
  halt();
  state.settings.continuous = false;
  if (dialog.open) closeDialog(false);
  if (libraryPage !== page) history.pushState(null, '', page ? `#my-${page}` : `${location.pathname}${location.search}`);
  libraryPage = page;
  libraryFilters = { ...defaultLibraryFilters(), feature, section };
  render();
  app.querySelector('#main-content').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function favoriteList(item) {
  if (item.kind !== 'word') return [state, 'savedContent', item.ref];
  if (item.feature === 'phonics') return [state.phonics, 'favorites', item.word.id];
  return [state, 'favorites', item.word.id];
}

function isSaved(item) {
  const [owner, field, key] = favoriteList(item);
  return owner[field].some(value => favoriteKey(value) === favoriteKey(key));
}

function toggleSaved(item) {
  const [owner, field, key] = favoriteList(item);
  owner[field] = isSaved(item)
    ? owner[field].filter(value => favoriteKey(value) !== favoriteKey(key))
    : [...owner[field], favoriteQuestionRef(key, item.question)];
}

function currentLibraryItem() {
  return libraryDetail?.items[libraryDetail.index];
}

function prepareLibraryCard() {
  const item = currentLibraryItem();
  const question = item.question;
  libraryDetail.heard = false;
  if (question) {
    libraryDetail.round = item.feature === 'phonics' ? createPhonicsRound([question], 1)
      : { questions: [question], responses: [], index: 0, selected: null, revealed: false };
  } else if (item.pairs) {
    libraryDetail.match = { pairs: item.pairs, right: shuffle(item.pairs), matched: [], left: null, attempts: 0, wrong: [] };
  } else if (item.lesson) {
    const progress = item.topic ? state.topics[item.feature] : state.hanzi;
    libraryDetail.lesson = {
      view: 'learn', category: item.lesson.category, lessonId: item.lesson.id, strokeStep: 0,
      known: [], activities: structuredClone(progress.activities || {}),
    };
  }
}

function libraryCardBody(item) {
  const detail = libraryDetail;
  const favorite = favoriteButton('library-toggle-favorite', isSaved(item));
  const options = {
    round: detail.round, preview: true, passive: item.type === 'practice' && !detail.practicing,
    showPinyin: state.settings.showPinyin, cardFavorite: () => favorite,
    favorite, heard: detail.heard, storyHint: detail.storyHint, storyResponse: detail.storyResponse,
    label: detail.review || '收藏练习',
  };
  if (item.feature === 'phonics') return `<div class="phonics-page">${phonics.previewCard(item, options)}</div>`;
  if (item.feature === 'hanzi-structure') {
    const card = item.question ? hanziQuizCard(options) : hanziLearningCard({ ...detail.lesson, ...options });
    return `<div class="hanzi-page">${card}</div>`;
  }
  if (item.topic) {
    options.showPinyin &&= state.topics[item.feature].showPinyin;
    options.heard = englishAudio.heard(detail.round);
    const card = item.entry ? dictionaryEntryCard(item.entry, text => readingText(text, options.showPinyin))
      : item.question ? topicQuizCard(item.topic, options) : topicLearningCard(item.topic, { ...detail.lesson, ...options });
    return `<div class="${topicClassName(item.topic)}">${card}</div>`;
  }
  if (item.word) return studyCard({ index: 0, ids: [item.word.id] }, item.word, favorite);
  if (item.kind === 'tones') return tonesCard(favorite);
  if (item.pairs) return matchCard(detail.match, options);
  return quizCard(detail.round, options);
}

function libraryDetailContent() {
  const item = currentLibraryItem();
  const detail = libraryDetail;
  const question = item.question;
  const resolved = question && (item.feature === 'phonics' ? detail.round.views[question.id]?.resolved : detail.round.revealed);
  const hasAudioGate = question?.clip && !englishAudio.heard(detail.round)
    || item.feature === 'phonics' && question?.kind === 'listen' && !detail.heard;
  const back = button('library-close-card', `返回${libraryTitles[libraryPage]}`, 'chevron', 'outline-button');
  const source = `<p class="review-detail-source">${escape(item.source)} · ${item.type === 'practice' ? '练习题' : '学习卡'}${detail.review ? ` · 第 ${detail.index + 1} / ${detail.items.length} 题` : ''}</p>`;
  const start = !detail.review && item.type === 'practice' ? button('library-practice', detail.practicing ? '重新做这题' : '再做一次', 'pen', 'outline-button') : '';
  const course = item.type === 'learn' ? button('library-course', '去这一节', 'book', 'outline-button') : '';
  const reveal = question && !resolved ? button(detail.practicing ? 'library-skip' : 'library-reveal', detail.practicing ? '跳过并看答案' : '查看答案', '', 'text-button', detail.practicing && hasAudioGate ? 'disabled' : '') : '';
  const next = detail.review && resolved ? button('library-next', detail.index + 1 === detail.items.length ? '完成复习' : '下一题', 'chevron', 'solid-button') : '';
  const defer = detail.review && hasAudioGate && !resolved ? button('library-next', '暂不做这道听音题', 'chevron', 'text-button') : '';
  return `${libraryCardBody(item)}<div class="review-detail-meta">${source}<div class="review-detail-actions">${back}${start}${course}${item.entry ? favoriteButton('library-toggle-favorite', isSaved(item)) : ''}${reveal}${next}${defer}</div></div>`;
}

function refreshLibraryDetail() {
  const body = dialog.querySelector('.review-detail-body');
  if (!body || !libraryDetail) return;
  const focused = document.activeElement;
  const data = { ...focused?.dataset };
  libraryDetail.stopObserving?.();
  body.innerHTML = libraryDetailContent();
  libraryDetail.stopObserving = observeReadingRows(body);
  const replacement = [...body.querySelectorAll('button:not(:disabled)')].find(element => element.dataset.action === data.action && element.dataset.id === data.id && element.dataset.value === data.value && element.dataset.index === data.index);
  if (body.contains(focused) || !focused?.isConnected) {
    (replacement || body.querySelector('[data-action="library-next"], [data-action="library-skip"]:not(:disabled), .answer-option:not(:disabled), [data-action="library-close-card"]'))?.focus({ preventScroll: true });
  }
}

function openLibraryCard(items, trigger, review = libraryPage === 'mistakes' ? '错题复习' : '') {
  if (!items.length) return;
  libraryDetail = { items, index: 0, review, practicing: Boolean(review), results: [], trigger, scroll: window.scrollY };
  prepareLibraryCard();
  openDialog(review || '收藏回看', '<div class="review-detail-body"></div>', 'review-card-dialog');
  refreshLibraryDetail();
}

function returnToLibrary(detail) {
  if (!detail) return;
  detail.stopObserving?.();
  libraryDetail = null;
  dialog.replaceChildren();
  halt();
  render();
  const trigger = [...app.querySelectorAll(`[data-action="${detail.trigger.action}"]`)]
    .find(element => element.dataset.ref === detail.trigger.ref && element.dataset.id === detail.trigger.id);
  (trigger || app.querySelector('#main-content')).focus({ preventScroll: true });
  window.scrollTo(0, detail.scroll);
}

function submitLibraryAnswer(answer, revealOnly = false) {
  const item = currentLibraryItem();
  const detail = libraryDetail;
  const round = detail.round;
  if (!item.question || (!revealOnly && !detail.practicing)) return;
  const tracking = Boolean(detail.review);
  const wasMistake = detail.review === '错题复习' || state.phonics.mistakes.includes(item.question.id);
  let result;
  if (item.feature === 'phonics') {
    if (item.question.kind === 'listen' && !detail.heard && !revealOnly) return;
    const progress = tracking ? state.phonics : { mistakes: [], reviews: {} };
    result = answerPhonics(progress, round, answer);
  } else if (item.topic || item.feature === 'hanzi-structure') {
    if (item.question.clip && !englishAudio.heard(round) && !revealOnly) return;
    const progress = item.topic ? state.topics[item.feature] : state.hanzi;
    const practice = { view: 'quiz', round, mistakes: tracking ? progress.mistakes : [] };
    round.scope = tracking ? 'review' : 'saved';
    result = item.topic ? answerTopic(practice, answer) : answerHanzi(practice, answer);
    if (tracking) progress.mistakes = practice.mistakes;
  } else {
    result = recordAnswer(round, answer);
    if (tracking && result?.first) {
      if (result.correct) state.mistakes = state.mistakes.filter(entry => entry.question.id !== item.question.id);
      else addMistake(item.question);
    }
  }
  if (!result) return;
  if (tracking) {
    if (result.first) detail.results[detail.index] = { correct: result.correct, skipped: result.skipped };
    if (result.correct) {
      const question = item.feature === 'phonics' ? { ...result.question, id: `english:${result.question.id}` } : result.question;
      const reward = grantRewards(state, { type: 'answer', question, reviewed: wasMistake && result.first });
      render();
      celebrateReward(reward);
    } else persist();
  }
  if (result.correct) chime(state.settings.effects);
  refreshLibraryDetail();
}

function advanceLibraryReview() {
  const detail = libraryDetail;
  halt();
  if (detail.index + 1 < detail.items.length) {
    detail.index++;
    prepareLibraryCard();
    refreshLibraryDetail();
    dialog.scrollTop = 0;
    return;
  }
  const item = currentLibraryItem();
  const practiced = detail.items.filter((entry, index) => detail.results[index]);
  const total = practiced.length;
  if (!total) { closeDialog(false); return; }
  const correct = detail.results.filter(result => result.correct).length;
  const skipped = detail.results.filter(result => result.skipped).length;
  const name = `${item.source.split(' / ').at(-1)} · ${detail.review}`;
  if (item.feature === 'phonics') {
    const first = detail.round;
    state.phonics.history = [...state.phonics.history, { id: first.id, time: Date.now(), name, total, correct, skipped, answered: total }].slice(-100);
  } else {
    state.history = [...state.history, { time: Date.now(), name, total, correct, skipped, ...(item.feature === 'pinyin' ? {} : { topicId: item.feature }) }].slice(-100);
  }
  const questions = practiced.map(entry => item.feature === 'phonics' ? { id: `english:${entry.question.id}` } : entry.question);
  const reward = grantRewards(state, {
    type: 'round', mode: item.feature === 'phonics' ? 'english:review' : 'mistakes', name,
    topicId: item.feature, total, answered: total - skipped, questions, responses: detail.results.filter(Boolean),
  });
  persist();
  closeDialog(false);
  toast(`复习完成，首次答对 ${correct} / ${total} 题`);
  celebrateReward(reward);
}

function openLibraryCourse(item) {
  setLibraryPage(null);
  state.subject = item.subject;
  state.features[item.subject] = item.feature;
  if (item.feature === 'phonics') {
    phonics.openLesson(item.mode, item.englishLesson, item.word?.id);
    return;
  }
  if (item.feature === 'pinyin') {
    if (item.kind === 'tones') { state.mode = 'tones'; state.tonePractice = false; }
    else {
      state.mode = state.favorites.includes(item.word.id) && item.word.type === 'word' ? 'favorites' : 'sequence';
      state.group = 'all';
      const value = session();
      const index = value.ids.indexOf(item.word.id);
      if (index >= 0) value.index = index;
    }
  } else if (item.entry) {
    const entry = item.entry;
    state.topics[item.feature].view = 'lookup';
    state.topics[item.feature].lookup = { method: 'sound', selections: [entry.initial, entry.syllable, entry.text] };
  } else {
    const progress = item.topic ? state.topics[item.feature] : state.hanzi;
    Object.assign(progress, { view: 'learn', category: item.lesson.category, lessonId: item.lesson.id });
    if (!item.topic) progress.strokeStep = 0;
  }
  render();
  app.querySelector('#main-content').focus({ preventScroll: true });
}

function handleLibraryCardAction(target) {
  const detail = libraryDetail;
  const item = currentLibraryItem();
  const { action, id, value, index } = target.dataset;
  if (action === 'close-dialog' || action === 'library-close-card') { closeDialog(false); return; }
  if (action === 'library-toggle-favorite') { toggleSaved(item); persist(); refreshLibraryDetail(); return; }
  if (action === 'library-practice') { detail.practicing = true; prepareLibraryCard(); refreshLibraryDetail(); return; }
  if (action === 'library-course') { openLibraryCourse(item); return; }
  if (action === 'library-next') { advanceLibraryReview(); return; }
  if (action === 'library-reveal' || action === 'library-skip') { submitLibraryAnswer(null, action === 'library-reveal'); return; }
  if (['answer', 'ct-answer', 'hz-answer', 'ph-answer'].includes(action)) { submitLibraryAnswer(value); return; }
  if (action === 'ph-play') {
    halt();
    void phonics.playSaved(id).then(success => {
      if (success && libraryDetail === detail && currentLibraryItem() === item && item.question?.wordId === id) {
        detail.heard = true;
        refreshLibraryDetail();
      }
    });
    return;
  }
  if (action === 'en-play' || action === 'en-stop' || action === 'ct-poem-play' || action === 'ct-poem-stop') {
    halt();
    if (action === 'en-play') englishAudio.play(id, state.settings.slow, item.question?.clip?.id === id ? detail.round : null, refreshLibraryDetail);
    if (action === 'ct-poem-play' && item.lesson?.poem) void poetryAudio.play(item.lesson.poem.audioId, state.settings.slow);
    return;
  }
  if (action === 'play-current') { void playAudio(pinyinCardAudio(item.word), state.settings.slow); return; }
  if (action === 'play-question') { void playAudio(pinyinQuestionAudio(item.question), state.settings.slow); return; }
  if (action === 'play-parts') { playQuestionParts(item.question); return; }
  if (action === 'sound') { void playAudio({ sound: target.dataset.sound, recording: target.dataset.recording }, state.settings.slow); return; }
  if (action === 'word-sound') {
    const word = vocabulary.find(entry => entry.text === target.dataset.word);
    void playAudio({ word: target.dataset.word, sounds: word?.sounds }, state.settings.slow);
    return;
  }
  if (action.startsWith('ct-activity-')) updateTopicActivity(item.topic, detail.lesson, action.slice('ct-activity-'.length), value);
  else if (action.startsWith('hz-stroke-')) handleHanziAction({ hanzi: detail.lesson }, action, { index });
  else if (action === 'ph-story-answer') detail.storyResponse = value;
  else if (action === 'ph-story-hint') detail.storyHint = !detail.storyHint;
  else if (action === 'ph-letter' || action === 'ph-erase') {
    const typed = dialog.querySelector('#review-spelling-input').value;
    detail.round.drafts[item.question.id] = editPhonicsDraft(item.question, typed, action.slice(3), value);
  } else if (action === 'match-left' || action === 'match-right') {
    if (!detail.practicing) return;
    const result = selectMatch(detail.match, action, id);
    if (result && !result.correct) toast('这两个还不是一对，再找找看。');
  } else return;
  refreshLibraryDetail();
}

function pinyinReturnToLearning() {
  return state.mode === 'tones'
    ? button('toggle-tones', '回到声调学习', 'book', 'outline-button')
    : button('pinyin-learn', '返回拼音学习', 'book', 'outline-button');
}

function studyCard(value, item = currentItem(), preview = null) {
  if (!item) return emptyCard(state.mode === 'favorites' ? '收藏夹还在等新朋友' : '这个范围里还没有内容', state.mode === 'favorites' ? '在学习卡片上点一下爱心，就能把它收藏在这里。' : '试着选择“全部拼音”吧。', 'heart');
  const favorite = state.favorites.includes(item.id);
  const known = state.known.includes(item.id);
  const isLast = value.index === value.ids.length - 1;
  return `<section class="study-card ${item.type === 'word' ? 'word-card' : ''}"><div class="card-topline"><h2 class="category-badge" data-activity-heading tabindex="-1">${icon('flower')}学习 · ${item.type === 'word' ? '常见字词' : groupName(item.group)}</h2>${preview || learningPosition(value.index, value.ids.length) + favoriteButton('favorite', favorite)}</div>
    ${pinyinCardContent(item, {
      wholeWord: item.type === 'word' && hasAudio({ word: item.text }),
      extraControl: preview ? '' : button('continuous', state.settings.continuous ? '停止连播' : '连续听读', state.settings.continuous ? 'pause' : 'play', 'continuous-button', `aria-pressed="${state.settings.continuous}"`),
    })}
    ${preview ? '' : `<div class="mastery-actions">${button('practice-later', '还要练一练', 'refresh', 'soft-button')}${button('known', known ? '已经认识啦' : '我认识啦', 'check', `soft-button mint ${known ? 'is-known' : ''}`, `aria-pressed="${known}"`)}${state.mode !== 'favorites' ? button('pinyin-order', state.mode === 'random' ? '顺序学习' : '随机认读', 'shuffle', 'text-button') : ''}</div>
    <div class="card-navigation">${button('previous', '上一个', 'chevron', 'outline-button previous', value.index === 0 ? 'disabled' : '')}${isLast && item.type === 'basic' && state.mode !== 'favorites' ? sectionPracticeButton('pinyin-section-practice', state.group, true) : button(isLast ? 'finish-study' : 'next', isLast ? '完成这一轮' : '下一个', 'chevron', 'solid-button next')}</div>`}
  </section>`;
}

function studyGrid(value) {
  if (!value.ids.length) return '';
  return `<section class="pinyin-map"><div class="section-title"><h2>${icon('grid')}这一站的拼音朋友</h2><span>点一个，跳转学习</span></div><div class="letter-grid">${value.ids.map((id, index) => { const item = allItems.find(entry => entry.id === id); return `<button data-action="jump" data-index="${index}" class="letter-tile ${index === value.index ? 'active' : ''} ${state.known.includes(id) ? 'learned' : ''}" aria-label="学习 ${escape(item.text)}" ${index === value.index ? 'aria-current="true"' : ''}>${escape(item.text)}${state.known.includes(id) ? '<span>✓</span>' : ''}</button>`; }).join('')}</div><div class="grid-legend"><span><i class="legend-current"></i>正在学</span><span><i class="legend-learned"></i>自评认识</span><span><i></i>等你认识</span></div></section>`;
}

function progressCard() {
  const topic = activeTopic();
  const progress = topic ? { learned: state.topics[topic.id].known.length, total: topic.lessons.length, label: topic.subject === 'english' ? '项学习内容自评确认' : '项学习内容自评认识' }
    : isPhonics() ? phonics.gardenData()
    : state.features.chinese === 'hanzi-structure' ? { learned: state.hanzi.known.length, total: hanziLessons.length, label: '项汉字内容自评认识' }
    : { learned: state.known.filter(id => basics.some(item => item.id === id)).length, total: basics.length, label: '个拼音自评认识', seen: state.seen.filter(id => basics.some(item => item.id === id)).length };
  const displayedRewards = equippedRewards({ inGarden: true });
  return `<section class="growth-card"><div class="growth-top">${icon('sprout')}我的成长花园<span>慢慢来，也很棒</span></div>${bunny()}<h3>${escape(state.nickname)}，又长大一点</h3><p>每一次认真尝试，都值得被看见。</p>${displayedRewards ? `<div class="garden-display">${displayedRewards}</div>` : ''}<div class="growth-stat"><strong>${progress.learned}<small> / ${progress.total}</small></strong><span>${progress.label}</span></div><div class="progress-track" role="progressbar" aria-label="${progress.label}" aria-valuenow="${progress.learned}" aria-valuemin="0" aria-valuemax="${progress.total}"><span style="width:${progress.learned / progress.total * 100}%"></span></div><div class="growth-bottom">${progress.seen !== undefined ? `<span>已浏览 ${progress.seen} 个</span>` : ''}${button('profile', '我的成长空间', 'chevron', 'text-button')}</div></section>`;
}

function mapCard() {
  const availableGroups = learningGroups(state.mode);
  const availableWords = availableWordScopes();
  if (!availableGroups.length && !availableWords.length && state.mode !== 'confusing') return '';
  const sections = [];
  const rows = entries => entries.map((entry, index) => `<button class="map-stop ${entry.active ? 'active' : ''}" data-action="${entry.action}" data-id="${entry.id}" ${entry.active ? 'aria-current="true"' : ''}><span class="stop-number ${entry.color}">${String(index + 1).padStart(2, '0')}</span><span class="stop-info"><b>${escape(entry.name)}</b><small>${escape(entry.short)}</small></span></button>`).join('');
  const section = (title, entries) => `<div class="map-section"><h3>${escape(title)}</h3><div class="map-stops">${rows(entries)}</div></div>`;
  if (availableGroups.length) {
    const choices = [{ id: 'all', name: '全部拼音', short: '各组一起学', color: 'pink' }, ...availableGroups];
    sections.push(section('拼音分组', choices.map(group => ({ ...group, action: 'map-group', active: state.group === group.id }))));
  }
  if (availableWords.length) {
    sections.push(section('字词分组', availableWords.map(scope => ({ ...scope, action: 'map-word-scope', active: state.wordScope === scope.id }))));
  }
  if (state.mode === 'confusing') sections.push(section('易混音分组', Object.entries(confusionSets).map(([id, item]) => ({ id, name: item.name, short: '', color: 'mint', action: 'map-confusion', active: state.confusion === id }))));
  return `<section class="learning-map"><div class="section-title"><h2>${icon('flag')}学习小地图</h2><span>${currentMode().name}</span></div>${sections.join('')}</section>`;
}

function tonesCard(preview = null) {
  const examples = toneExamples.map(group => `<section class="tone-example" aria-label="${group.syllable} 的四声示例"><h4>${group.items.map(item => item.text).join(' · ')}</h4><p class="muted">${group.tip}</p><div class="tone-grid">${group.items.map((item, index) => `<button class="tone-tile tone-${index}" data-action="sound" data-sound="${item.sound}" aria-label="${item.text} · ${item.character} · ${item.label}"><span class="tone-contour">${['→', '↗', '∨', '↘'][index]}</span><b>${item.text}</b><span class="tone-character">${item.character}</span><span>${item.label}</span>${icon('sound')}</button>`).join('')}</div></section>`).join('');
  return `<section class="quiz-card tones-card"><div class="quiz-top"><h2 class="category-badge" data-activity-heading tabindex="-1">${icon('wave')}学习 · 声音也会走楼梯</h2>${preview || cardFavorite('tones', 'four')}</div>
    <h3>跟着 mā má mǎ mà，听四声</h3><p class="muted">点一点，听四组示例。每组从一声读到四声，对比同一个音节的高低变化。</p>${examples}<div class="tone-note"><h4>轻声：轻轻地、短短地</h4><p>“妈妈”的第二个“妈”不标声调，读得轻而短。听一听下面词语里读轻声的第二个字。</p><div class="neutral-tone-examples">${neutralToneExamples.map(item => button('word-sound', `${item.pinyin} · ${item.text}`, 'sound', 'soft-button', `data-word="${item.text}"`)).join('')}</div></div><details class="lesson-details"><summary>再学一点：变调的小秘密</summary><p>两个三声音节连在一起时，前一个通常读成接近二声，例如“你好”。书面拼音仍标作 nǐ hǎo。</p><p>“一”单读时读 yī，在四声前通常读 yí（如“一定”），在一、二、三声前通常读 yì（如“一天”）。</p><p>“不”单读时读 bù，在四声前通常读 bú（如“不是”）。变调是实际读音的变化，要放进词语和句子里学习。</p></details>
    ${preview ? '' : `<div class="quiz-actions">${sectionPracticeButton('pinyin-section-practice', 'tones', true)}${button('mode', '去练标调与拼写', 'pen', 'outline-button', 'data-id="rules"')}</div>`}</section>`;
}

function quizCard(round, preview = null) {
  if (!round.questions.length) return emptyCard(state.mode === 'mistakes' ? '这里还没有错题，真棒！' : '这个范围暂时没有题目', state.mode === 'mistakes' ? '练习中需要再试一次的题，会来到这里。' : '换个范围，继续探索吧。', 'sprout', pinyinReturnToLearning());
  if (round.finished) return resultCard(round);
  const question = round.questions[round.index];
  const wrong = round.selected !== null && round.selected !== question.answer;
  const answered = round.revealed;
  const favorite = preview ? preview.favorite : cardFavorite('question', question.id, question);
  const disabled = answered || preview?.passive;
  const title = preview?.label || (state.mode === 'tones' ? '听音辨声调' : state.mode === 'section-practice' ? groupName(state.group) : currentMode().name);
  return `<section class="quiz-card"><div class="quiz-top"><h2 class="category-badge" data-activity-heading tabindex="-1">${icon('flag')}练习 · ${escape(title)}</h2>${learningPosition(round.index, round.questions.length, { practice: true })}${favorite}</div><div class="quiz-progress">${round.questions.map((item, index) => `<i class="${round.responses[index]?.correct ? 'correct' : round.responses[index] ? 'miss' : ''} ${index === round.index ? 'current' : ''}"></i>`).join('')}</div><h3 class="question-prompt">${escape(question.prompt)}</h3>
    ${question.display ? `<div class="question-display ${question.kind === 'hanzi' ? 'hanzi' : ''}">${escape(question.display)}</div>` : ''}
    ${question.kind === 'listen' ? button('play-question', '再听一遍', 'sound', 'sound-button question-audio primary-audio') : ''}
    ${question.kind === 'blend' ? `<div class="blend-controls">${button('play-parts', '听分解', 'sound', 'soft-button')}${answered ? button('play-question', '听完整拼读', 'sound', 'soft-button') : ''}</div>` : ''}
    <div class="answer-grid ${question.kind === 'audio' ? 'audio-answers' : ''}" role="group" aria-label="答案选项">${question.options.map((option, index) => {
      const text = typeof option === 'string' ? option : option.value;
      const status = answered && text === question.answer ? 'correct-answer' : round.selected === text && wrong ? 'wrong-answer' : '';
      return typeof option === 'string' ? `<button class="answer-option${learningTokenClass(text)} ${status}" data-action="answer" data-value="${escape(text)}" ${disabled ? 'disabled' : ''}><span class="option-letter">${'ABCD'[index]}</span><span>${escape(text)}</span>${status === 'correct-answer' ? icon('check') : ''}</button>` : `<div class="audio-option ${status}">${button('sound', `试听 ${'ABCD'[index]}`, 'sound', 'audio-choice-play', `data-sound="${escape(option.sound)}" data-recording="${escape(pinyinOptionAudio(option).recording || '')}"`)}${button('answer', `选 ${'ABCD'[index]}`, '', 'audio-choice-pick', `data-value="${escape(text)}" ${disabled ? 'disabled' : ''}`)}</div>`;
    }).join('')}</div>
    <div class="answer-feedback ${answered ? round.selected === null ? 'warning' : 'success' : wrong ? 'retry warning' : ''}" role="status">${answered ? `${icon(round.selected === null ? 'leaf' : 'check')}<div><strong>${round.selected === null ? '先认识答案，下次再试试' : '答对啦，你做得很棒！'}</strong><p>${escape(question.explanation)}</p></div>` : wrong ? `${icon('refresh')}<div><strong>差一点点，再试一次吧！</strong><p>可以再听一听，或者点“看看答案”。首次作答已经记下啦。</p></div>` : `${icon('leaf')}<span>想一想，再选出你的答案。</span>`}</div>
    ${answered && question.audio?.word && !hasAudio({ word: question.audio.word }) && question.audio.sounds?.length > 1 ? '<p class="small-note">这个词一个字一个字读，跟着一起拼一拼。</p>' : ''}
    <div class="quiz-actions">${preview ? '' : pinyinReturnToLearning()}${answered && question.audio ? button('play-question', '听正确读音', 'sound', 'text-button') : !answered && !preview ? button('skip', wrong ? '看看答案' : '先跳过', '', 'text-button') : ''}${preview ? '' : button('next-question', nextUnfinishedQuestion(round) < 0 ? '看看本轮收获' : '下一题', 'chevron', 'solid-button next', answered ? '' : 'disabled')}</div>
  </section>`;
}

function resultCard(round) {
  const stats = roundStats(round);
  return `<section class="quiz-card result-card"><div class="result-star">${icon('star')}</div><span class="eyebrow">又完成了一次小小的冒险</span><h3 data-activity-heading tabindex="-1">认真练习的你，真棒！</h3><p>休息一下，或者带着新收获继续出发。</p><div class="result-stats"><div><b>${stats.total}</b><span>本轮题目</span></div><div><b>${stats.correct}</b><span>首次答对</span></div><div><b>${stats.skipped}</b><span>跳过题目</span></div></div><div class="review-summary">${stats.correct === stats.total ? '这一轮全部首次答对，给自己一个大大的赞！' : `还有 ${stats.total - stats.correct} 道题值得再练一次，已经放进错题本。`}</div><div class="result-actions">${pinyinReturnToLearning()}${button('restart-now', '再来一轮', 'refresh', 'solid-button')}${reviewShortcut('pinyin', pinyinPracticeCategory(key()))}</div></section>`;
}

function matchCard(value, preview = null) {
  if (value.matched.length === value.pairs.length && !preview) return `<section class="quiz-card result-card"><div class="result-star">${icon('link')}</div><h3 data-activity-heading tabindex="-1">拼音朋友都找到伙伴啦！</h3><p>完成了 ${value.pairs.length} 组配对，共尝试 ${value.attempts} 次。</p><div class="result-actions">${pinyinReturnToLearning()}${button('restart-now', '再配一组', 'refresh', 'solid-button')}</div></section>`;
  return `<section class="quiz-card match-card"><div class="quiz-top"><h2 class="category-badge" data-activity-heading tabindex="-1">${icon('link')}练习 · 牵起拼音的小手</h2><span>${value.matched.length} / ${value.pairs.length} 对</span>${preview ? preview.favorite : cardFavorite('match', [...value.pairs].sort().join(','))}</div>
    <h3>先点汉字，再点它的拼音</h3><p class="muted">不用拖动，轻轻点两下就能配对。</p><div class="match-columns"><div>${value.pairs.map(id => { const item = allItems.find(entry => entry.id === id); return button('match-left', item.text, value.matched.includes(id) ? 'check' : '', `match-tile ${value.left === id ? 'selected' : ''} ${value.matched.includes(id) ? 'matched' : ''}`, `data-id="${id}" ${value.matched.includes(id) || preview?.passive ? 'disabled' : ''}`); }).join('')}</div><div>${value.right.map(id => { const item = allItems.find(entry => entry.id === id); return button('match-right', item.pinyin, value.matched.includes(id) ? 'check' : '', `match-tile pinyin ${value.matched.includes(id) ? 'matched' : ''}`, `data-id="${id}" ${value.matched.includes(id) || preview?.passive ? 'disabled' : ''}`); }).join('')}</div></div><div class="gentle-note" role="status">${icon('leaf')}${value.matched.length === value.pairs.length ? '都配好啦！' : value.left ? '选好了汉字，现在找找右边的拼音。' : '从左边选一个你认识的字词吧。'}</div>
    ${preview ? '' : `<div class="quiz-actions">${pinyinReturnToLearning()}</div>`}</section>`;
}

function emptyCard(title, description, symbol, action = button('mode', '去认识拼音朋友', 'book', 'solid-button', 'data-id="sequence"')) {
  return `<section class="quiz-card empty-card"><span class="empty-symbol">${icon(symbol)}</span><h3 data-activity-heading tabindex="-1">${title}</h3><p>${description}</p>${action}</section>`;
}

function comingSoon(subject) {
  return `<section class="coming-soon"><span class="coming-icon ${subject.color}">${icon(subject.icon)}</span><div class="eyebrow">下一站，也有新惊喜</div><h1>${subject.name}小天地，正在准备中</h1><p>${subject.id === 'math' ? '数字的秘密和有趣的计算，等着以后一起探索。' : '字母、单词和有趣的英语故事，正在来的路上。'}</p>${bunny()}${button('subject', '先去拼音乐园逛逛', 'chevron', 'solid-button', 'data-id="chinese"')}</section>`;
}

function openDialog(title, content, className = '') {
  pendingBackup = null;
  backupReadRequest++;
  disposeRewardHelp();
  disposeRewardHelp = () => {};
  disposeRewardViewer();
  disposeRewardViewer = () => {};
  clearRewardNotice();
  halt();
  if (state.settings.continuous) { state.settings.continuous = false; render(); }
  if (!dialog.open) dialogReturnFocus = document.activeElement;
  dialog.className = className;
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${title}</h2>${button('close-dialog', '', 'close', 'icon-button', 'aria-label="关闭弹窗"')}</div>${content}`;
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  if (!dialog.open) dialog.showModal();
  bindRewardHelp();
  celebrations.resume();
}

function closeDialog(returnFromPreview = true) {
  if (!dialog.open) return;
  if (dialog.querySelector('#nickname-form[data-origin="settings"]')) { returnFromNickname(); return; }
  pendingBackup = null;
  backupReadRequest++;
  if (dialog.classList.contains('reward-help-dialog')) { returnFromRewardHelp(); return; }
  if (returnFromPreview && dialog.classList.contains('reward-detail-dialog')) { returnFromRewardDetail(); return; }
  disposeRewardHelp();
  disposeRewardHelp = () => {};
  disposeRewardViewer();
  disposeRewardViewer = () => {};
  rewardDetailReturn = null;
  clearRewardNotice();
  dialog.close();
  if (libraryDetail) returnToLibrary(libraryDetail);
  else restoreDialogFocus();
  celebrations.resume();
}

function dismissDialog() {
  if (!dialog.classList.contains('reset-confirm-dialog')) { closeDialog(); return; }
  showSettings();
  dialog.scrollTop = settingsScrollBeforeReset;
  dialog.querySelector('[data-action="reset-confirm"]').focus({ preventScroll: true });
}

function restoreDialogFocus() {
  if (dialogReturnFocus?.isConnected && dialogReturnFocus.checkVisibility()) dialogReturnFocus.focus();
  else app.querySelector('.my-menu-toggle')?.focus();
}

function settingsToggle(field, label, description) {
  return `<label class="setting-row"><span><b>${label}</b><small>${description}</small></span><input type="checkbox" role="switch" data-setting="${field}" ${state.settings[field] ? 'checked' : ''}></label>`;
}

function settingsAction(action, label, detail = '') {
  return button(action, `<b>${label}</b><span class="setting-value">${detail}${icon('chevron')}</span>`, '', 'setting-row');
}

function showSettings() {
  openDialog('学习设置', `<section class="settings-group" aria-labelledby="profile-heading"><h3 id="profile-heading">个人资料</h3>
    ${settingsAction('edit-nickname', '昵称', escape(state.nickname))}
  </section>
  <section class="settings-group" aria-labelledby="preferences-heading"><h3 id="preferences-heading">学习偏好</h3>
    ${settingsToggle('slow', '慢速读音', '关闭为标准语速，开启为 0.8 倍速。适用于拼音、古诗朗读和英语点读、听题。')}
    ${settingsToggle('showPinyin', '拼音辅助', '在有注音的语文学习卡和练习中显示辅助拼音，不改变题目本身。')}
    ${settingsToggle('effects', '答对时的小音效', '关闭后仍可点读拼音')}
    ${settingsToggle('animations', '奖励庆祝动效', '关闭后仍显示奖励文字，也支持系统减少动态效果')}
  </section>
  <section class="settings-group" aria-labelledby="backup-heading"><h3 id="backup-heading">数据备份</h3>
    <p>备份包含全部配置、昵称、各科学习记录、错题、收藏、草稿和奖励。文件仅在本机处理，不会上传。</p>
    ${settingsAction('export-backup', '导出全部数据')}
    ${settingsAction('choose-backup', '导入备份文件')}
    <input id="backup-file" type="file" accept=".json,application/json" hidden><p id="backup-error" class="storage-warning" role="alert"></p>
    <p>导入会替换当前数据。建议先导出一份。同版本备份缺少的新课程或新设置会使用默认值。</p>
  </section>
  <section class="settings-group" aria-labelledby="cleanup-heading"><h3 id="cleanup-heading">数据清理</h3>
    <p>学习记录仅保存在当前浏览器，不会跨设备同步。清空后无法恢复。</p>
    ${settingsAction('reset-confirm', '清空本机学习记录')}
  </section>${!storageAvailable ? '<p class="storage-warning">当前浏览器无法读取或保存记录，暂以临时模式学习。</p>' : ''}`, 'settings-dialog');
}

function showResetConfirmation() {
  settingsScrollBeforeReset = dialog.scrollTop;
  openDialog('确定清空本机记录吗？', `<p>这会清空学习进度、错题、收藏、昵称、星星、贴纸、徽章、奖牌、花园摆件和设置，清空后无法恢复。</p><div class="dialog-actions">${button('close-dialog', '取消', '', 'outline-button')}${button('reset-all', '确认清空', '', 'danger-button')}</div>`, 'reset-confirm-dialog');
  dialog.querySelector('.dialog-actions [data-action="close-dialog"]').focus();
}

function exportBackup() {
  let downloadUrl;
  try {
    const date = new Date();
    const text = createBackup(state, date);
    downloadUrl = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = backupFilename(date);
    document.body.append(link);
    link.click();
    link.remove();
    toast('完整备份已生成，请妥善保管下载的 JSON 文件。');
  } catch (error) { showBackupError(error.message); }
  finally { if (downloadUrl) setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000); }
}

function showBackupError(message) {
  const element = dialog.querySelector('#backup-error');
  if (element) element.textContent = message;
  else toast(message);
}

async function readBackupFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  const request = ++backupReadRequest;
  input.value = '';
  try {
    if (file.size > maxBackupBytes) throw new Error('备份文件过大，请选择不超过 20 MB 的 JSON 备份。');
    const text = await file.text();
    if (request !== backupReadRequest || !input.isConnected || !dialog.open) return;
    const backup = parseBackup(text);
    openDialog('导入并替换本机数据？', `<p class="dialog-intro">将导入语文、数学、英语的全部学习记录、配置、昵称和奖励，并替换当前数据，不会合并。建议先取消并导出当前数据，保留恢复机会。</p><p>备份昵称：<b>${escape(backup.data.profile.nickname)}</b></p><div class="dialog-actions">${button('settings', '取消，返回设置', '', 'outline-button')}${button('confirm-import', '确认导入并替换', '', 'danger-button')}</div><p id="backup-error" class="storage-warning" role="alert"></p>`);
    pendingBackup = backup;
  } catch (error) {
    if (request === backupReadRequest) showBackupError(error.message || '无法读取备份文件，请重新选择。');
  }
}

function importBackup() {
  if (!pendingBackup) return;
  try {
    halt();
    restoreBackup(localStorage, pendingBackup);
  } catch (error) {
    showBackupError(error.message || '导入失败，无法访问浏览器存储，本机记录未修改。');
    return;
  }
  backupCommitted = true;
  pendingBackup = null;
  celebrations.reset();
  window.location.reload();
}

function showProfile() {
  const stats = rewardStats(state.rewards);
  const badge = rewardCatalog.find(reward => reward.id === state.rewards.equipped.badge);
  openDialog('我的成长空间', `<div class="profile-heading"><img src="${bunnyImage}" alt="" width="76" height="76"><div><h3>${escape(state.nickname)}</h3><p>${badge ? badge.name : '每一天，都可以有新的发现'}</p>${button('edit-nickname', '修改昵称', 'pen', 'text-button')}</div></div><div class="profile-totals"><div><b>${stats.stars}</b><span>成长星星</span></div><div><b>${Object.keys(state.rewards.unlocks).length}</b><span>已解锁奖励</span></div><div><b>${stats.days}</b><span>累计练习天数</span></div></div><div class="profile-display">${equippedRewards() || '<p>解锁奖励后，可以在这里展示喜欢的贴纸、徽章和摆件。</p>'}</div>${button('reward-rules', '星星从哪里来？查看规则与明细', 'info', 'reward-rules-link')}<p class="personal-footnote">按自己的节奏长大，不比较、不扣星；休息几天也不会失去收获。</p>`, 'profile-dialog');
}

function showNickname() {
  const fromSettings = dialog.classList.contains('settings-dialog');
  openDialog('修改昵称', `<p class="dialog-intro">取一个喜欢的昵称吧，1–12 个字符。它只保存在这台设备，不需要填写真实姓名。</p><form id="nickname-form" data-origin="${fromSettings ? 'settings' : 'profile'}"><label class="nickname-label" for="nickname">我的昵称</label><input id="nickname" name="nickname" value="${escape(state.nickname)}" autocomplete="off" aria-describedby="nickname-error" required><p id="nickname-error" class="nickname-error" role="alert"></p><div class="dialog-actions">${button('nickname-back', fromSettings ? '返回学习设置' : '返回我的', '', 'outline-button')}<button type="submit" class="solid-button">保存昵称</button></div></form>`);
  const input = dialog.querySelector('#nickname');
  input.focus();
  input.select();
}

function returnFromNickname() {
  if (dialog.querySelector('#nickname-form').dataset.origin === 'settings') showSettings();
  else showProfile();
  dialog.querySelector('[data-action="edit-nickname"]').focus();
}

function showRewardRules() {
  const stats = rewardStats(state.rewards);
  const events = state.rewards.events.filter(event => event.stars > 0).slice().reverse();
  openDialog('每颗星星，都有来处', `<div class="stars-total">${icon('star')}<strong>${stats.stars}</strong><span>颗成长星</span></div><p class="dialog-intro">星星记录认真学习的足迹，不是考试分数。不会扣除，也不需要花掉。</p><div class="reward-rule-list"><div><b>+1</b><span><strong>认识新朋友</strong>第一次标记认识一个项目；同一项目只发一次。</span></div><div><b>+1</b><span><strong>答对新题目</strong>第一次答对一道题，重试答对也算；每道题只发一次。</span></div><div><b>+2</b><span><strong>独立改正错题</strong>在错题本中，本轮第一次作答就答对；每道错题只奖励一次。</span></div><div><b>+3</b><span><strong>今天认真练习啦</strong>完成一轮且至少实际作答 5 题，或完成 4 对配对；每天奖励一次，跳过不算实际作答。</span></div></div><p class="personal-footnote">同一次答题可同时获得“新题目”和“独立改错”星星。取消“认识”后再标记、刷新和重做已答对题目都不会重复发星。学习天数按本机日期累计，不要求连续。</p>${button('reward-collection', '打开奖励收藏册', 'star', 'outline-button')}<h3 class="personal-section-title">我的星星明细</h3>${events.length ? `<details class="reward-ledger" open><summary>共 ${events.length} 笔收获</summary><ul>${events.map(event => `<li><div><strong>${escape(event.label)}</strong><small>${new Date(event.time).toLocaleString('zh-CN')}${event.migrated ? ' · 旧版学习记录补发' : ''}</small></div><b>+${event.stars}</b></li>`).join('')}</ul></details>` : '<p class="personal-footnote">还没有星星。去认识一个新朋友，第一颗星星就会来到这里。</p>'}`, 'reward-rules-dialog');
}

function showRewardCollection() {
  const stats = rewardStats(state.rewards);
  const names = { all: '全部', sticker: '贴纸', badge: '徽章', medal: '奖牌', decoration: '花园摆件' };
  const filters = Object.entries(names).map(([id, name]) => button('reward-filter', name, '', `collection-filter ${rewardFilter === id ? 'active' : ''}`, `data-id="${id}" aria-pressed="${rewardFilter === id}"`)).join('');
  const typeOrder = { sticker: 0, badge: 1, medal: 2, decoration: 3 };
  const items = rewardCatalog.filter(reward => rewardFilter === 'all' || reward.type === rewardFilter).sort((left, right) => {
    if (left.type !== right.type) return typeOrder[left.type] - typeOrder[right.type];
    if (left.metric === 'solved' && right.metric === 'solved') return left.target - right.target;
    if (left.metric === 'solved') return -1;
    if (right.metric === 'solved') return 1;
    return 0;
  });
  const progress = curriculumProgress(state.rewards);
  openDialog('我的奖励收藏册', `<div class="collection-intro"><div><p>一共收获了 <b>${Object.keys(state.rewards.unlocks).length} / ${rewardCatalog.length}</b> 件奖励</p><span>每一件都有明确的目标，慢慢收集就很好。</span><div class="collection-rule-label">收藏规则 ${rewardHelpButton('all')}</div></div>${button('reward-rules', `${stats.stars} 颗成长星`, 'star', 'stars-small')}</div><div class="collection-filters" role="group" aria-label="奖励分类">${filters}</div>${rewardFilter !== 'all' ? `<div class="collection-category-help">${names[rewardFilter]}规则 ${rewardHelpButton(rewardFilter)}</div>` : ''}<div class="collection-grid">${items.map(reward => {
    const unlocked = Boolean(state.rewards.unlocks[reward.id]);
    const equipped = state.rewards.equipped[reward.type] === reward.id;
    const condition = rewardProgress(state.rewards, reward, progress, stats);
    const art = `${rewardArt(reward.art, '', reward.icon)}${stickerMotionHint(reward)}`;
    return `<article class="reward-card ${unlocked ? 'unlocked' : 'locked'} ${equipped ? 'equipped' : ''}" data-reward="${reward.id}">${unlocked ? rewardStamp() : ''}<span class="reward-kind">${names[reward.type]}${equipped ? ' · 展示中' : ''}</span>${button('reward-detail', art, '', 'reward-preview-trigger', `data-id="${reward.id}" aria-label="放大查看${reward.name}"`)}<h3><span>${reward.name}</span>${reward.help ? rewardHelpButton(reward.help, reward.id) : ''}</h3><p>${reward.rule}</p>${unlocked ? `<span class="unlock-date">${new Date(state.rewards.unlocks[reward.id]).toLocaleDateString('zh-CN')} 获得${state.rewards.unlockDetails[reward.id]?.retroactive ? ' · 历史补发' : ''}</span><div class="reward-card-actions">${button('equip-reward', equipped ? '取消展示' : reward.type === 'badge' ? '佩戴徽章' : reward.type === 'medal' ? '展示奖牌' : reward.type === 'decoration' ? '摆进花园' : '展示贴纸', equipped ? 'check' : '', 'reward-equip', `data-id="${reward.id}" aria-pressed="${equipped}"`)}</div>` : `<span class="reward-progress-text">${Math.min(condition.value, condition.target)} / ${condition.target}</span><progress value="${Math.min(condition.value, condition.target)}" max="${condition.target}" aria-label="${reward.name}解锁进度"></progress>`}</article>`;
  }).join('')}</div><p class="personal-footnote">已获得的奖励一直属于你。星星只累计，不消费；更换展示不花星星。</p>`, 'collection-dialog');
}

function showRewardDetail(id, { fromNotice = false } = {}) {
  const reward = rewardCatalog.find(item => item.id === id);
  if (!reward) return;
  const returningFromHelp = dialog.open && dialog.classList.contains('reward-help-dialog');
  if (fromNotice) rewardDetailReturn = { origin: 'notice', scroll: 0, id };
  else if (!returningFromHelp) {
    const origin = dialog.open && dialog.classList.contains('collection-dialog') ? 'collection' : dialog.open && dialog.classList.contains('profile-dialog') ? 'profile' : 'page';
    rewardDetailReturn = { origin, scroll: dialog.scrollTop, id };
  }
  const unlocked = Boolean(state.rewards.unlocks[id]);
  const condition = rewardProgress(state.rewards, reward, curriculumProgress(state.rewards), rewardStats(state.rewards));
  openDialog(`<span id="reward-detail-name">${reward.name}</span>${reward.help ? rewardHelpButton(reward.help, reward.id) : ''}`, `<div class="reward-detail">${rewardViewer(reward)}<span class="reward-preview-status ${unlocked ? 'obtained' : ''}">${unlocked ? `已获得 · ${new Date(state.rewards.unlocks[id]).toLocaleDateString('zh-CN')}` : '尚未获得 · 可以先看看它的样子'}</span><h3>${reward.description}</h3><p>${reward.rule}</p>${unlocked ? '' : `<span class="reward-detail-progress">当前进度 ${Math.min(condition.value, condition.target)} / ${condition.target}</span>`}${unlocked ? `<div class="dialog-actions">${button('replay-reward', '再庆祝一下', 'star', 'outline-button', `data-id="${id}"`)}</div>` : ''}</div>`, 'reward-detail-dialog');
  dialog.setAttribute('aria-labelledby', 'reward-detail-name');
  const once = rewardDetailReturn?.origin === 'notice';
  disposeRewardViewer = mountRewardViewer(dialog, { animations: state.settings.animations, once, autoplay: !once || !returningFromHelp });
  dialog.scrollTop = 0;
  dialog.querySelector('.reward-viewer-stage').focus({ preventScroll: true });
}

function returnFromRewardDetail() {
  const previous = rewardDetailReturn;
  rewardDetailReturn = null;
  if (previous?.origin === 'page' || previous?.origin === 'notice') {
    closeDialog(false);
    return;
  }
  if (previous?.origin === 'profile') showProfile();
  else showRewardCollection();
  dialog.scrollTop = previous?.scroll || 0;
  if (previous) dialog.querySelector(`[data-action="reward-detail"][data-id="${previous.id}"], [data-action="equipped-reward-preview"][data-id="${previous.id}"]`)?.focus({ preventScroll: true });
}

function rewardHelpButton(id, rewardId = '') {
  const help = rewardHelp[id];
  const reward = rewardCatalog.find(item => item.id === rewardId);
  const identifier = `reward-help-${rewardId || id}`;
  const summary = `${help.summary}${rewardId ? '' : '点击查看完整说明。'}`;
  return `<span class="reward-help-wrap"><button type="button" class="reward-help-button" data-action="reward-help" data-id="${id}" data-reward-id="${rewardId}" aria-label="查看${escape(reward ? `${reward.name}获得条件` : help.title)}" aria-describedby="${identifier}"><span class="reward-help-symbol" aria-hidden="true">?</span></button><span role="tooltip" popover="manual" class="reward-help-tooltip" id="${identifier}">${escape(summary)}</span></span>`;
}

function bindRewardHelp() {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const tooltips = [...dialog.querySelectorAll('.reward-help-tooltip')];
  disposeRewardHelp = () => {
    controller.abort();
    for (const tooltip of tooltips) if (tooltip.matches(':popover-open')) tooltip.hidePopover();
  };
  for (const wrapper of dialog.querySelectorAll('.reward-help-wrap')) {
    const tooltip = wrapper.querySelector('[role="tooltip"]');
    const trigger = wrapper.querySelector('button');
    const show = () => {
      if (trigger.dataset.helpSuppressed || !dialog.open) return;
      const bounds = trigger.getBoundingClientRect();
      tooltip.showPopover();
      const size = tooltip.getBoundingClientRect();
      tooltip.style.left = `${Math.max(10, Math.min(innerWidth - size.width - 10, bounds.left + bounds.width / 2 - size.width / 2))}px`;
      tooltip.style.top = `${bounds.top >= size.height + 12 ? bounds.top - size.height - 8 : Math.min(innerHeight - size.height - 10, bounds.bottom + 8)}px`;
    };
    const hide = () => { if (tooltip.matches(':popover-open')) tooltip.hidePopover(); };
    wrapper.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') show(); }, options);
    wrapper.addEventListener('pointermove', event => {
      if (event.pointerType !== 'touch' && trigger.dataset.helpSuppressed && (event.movementX || event.movementY)) {
        delete trigger.dataset.helpSuppressed;
        show();
      }
    }, options);
    wrapper.addEventListener('pointerleave', () => { delete trigger.dataset.helpSuppressed; if (!wrapper.contains(document.activeElement)) hide(); }, options);
    wrapper.addEventListener('focusin', show, options);
    wrapper.addEventListener('focusout', () => { delete trigger.dataset.helpSuppressed; hide(); }, options);
    trigger.addEventListener('click', () => { trigger.dataset.helpSuppressed = 'true'; hide(); }, options);
    trigger.addEventListener('keydown', event => { if (event.key === 'Escape' && tooltip.matches(':popover-open')) { event.preventDefault(); event.stopPropagation(); trigger.dataset.helpSuppressed = 'true'; hide(); } }, options);
  }
}

function showRewardHelp(id, rewardId = '', fromHistory = false) {
  const help = rewardHelp[id];
  if (!help) return;
  if (!dialog.classList.contains('reward-help-dialog')) {
    rewardHelpReturn = { scroll: dialog.scrollTop, id, rewardId, detail: dialog.classList.contains('reward-detail-dialog') };
    rewardHelpHistory = [];
  } else if (!fromHistory && activeRewardHelp) {
    rewardHelpHistory.push({ ...activeRewardHelp, scroll: dialog.scrollTop, focusId: id, focusRewardId: rewardId });
  }
  activeRewardHelp = { id, rewardId };
  const reward = rewardCatalog.find(item => item.id === rewardId);
  let scope = '';
  if (id === 'stage' && reward?.stageId) {
    const stage = rewardStages.find(item => item.id === reward.stageId);
    const progress = curriculumProgress(state.rewards);
    scope = `<div class="reward-scope"><h3>${escape(stage.label)} · ${escape(stage.name)}</h3>${stage.topics.map(topic => `<details><summary>${escape(topic.name)} · ${topic.sections.filter(section => progress.sections.get(section.id).complete).length} / ${topic.sections.length} 小节</summary><ul>${topic.sections.map(section => {
      const result = progress.sections.get(section.id);
      return `<li><strong>${escape(section.name)}${result.complete ? ' ✓' : ''}</strong><span>学习确认 ${result.learned} / ${result.total} · 练习${result.passed ? '已达标' : '待达标'}</span></li>`;
    }).join('')}</ul></details>`).join('')}</div>`;
  }
  openDialog(reward ? `${reward.name} · 获得条件` : help.title, `<div class="reward-help-content">${help.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}${scope}${id === 'all' ? `<nav class="reward-help-links" aria-label="各类奖励规则">${['sticker', 'badge', 'medal', 'decoration'].map(type => button('reward-help', rewardHelp[type].title, 'info', 'outline-button', `data-id="${type}"`)).join('')}</nav>` : ''}${button('reward-help-back', rewardHelpReturn?.detail ? '返回物品展示' : '返回收藏册', 'book', 'solid-button')}</div>`, `reward-help-dialog${rewardHelpHistory.length ? ' has-rule-history' : ''}`);
  if (rewardHelpHistory.length) dialog.querySelector('.dialog-heading').insertAdjacentHTML('afterbegin', button('reward-help-previous', '<span aria-hidden="true">←</span>返回', '', 'reward-help-previous', 'aria-label="返回上一级规则"'));
  dialog.scrollTop = 0;
}

function returnToPreviousRewardHelp() {
  const previous = rewardHelpHistory.pop();
  if (!previous) return;
  showRewardHelp(previous.id, previous.rewardId, true);
  dialog.scrollTop = previous.scroll;
  dialog.querySelector(`[data-action="reward-help"][data-id="${previous.focusId}"]`)?.focus({ preventScroll: true });
}

function returnFromRewardHelp() {
  const previous = rewardHelpReturn;
  rewardHelpReturn = null;
  rewardHelpHistory = [];
  activeRewardHelp = null;
  if (previous?.detail) showRewardDetail(previous.rewardId);
  else showRewardCollection();
  dialog.scrollTop = previous?.scroll || 0;
  if (previous) {
    const trigger = dialog.querySelector(`[data-action="reward-help"][data-id="${previous.id}"][data-reward-id="${previous.rewardId}"]`);
    if (trigger) { trigger.dataset.helpSuppressed = 'true'; trigger.focus({ preventScroll: true }); }
  }
}

function clearRewardNotice() {
  celebrations.clear();
}

function celebrateReward(result) {
  celebrations.celebrate(result);
}

function showAbout() {
  openDialog('关于小兔学习乐园', `
    <p class="dialog-intro">专为小学生准备的一方学习小天地。没有广告，不需要注册，按照自己的节奏慢慢学。</p>
    <h3>拼音与教学音频</h3>
    <p>拼音包含 23 个声母、24 个韵母和 16 个整体认读音节，采用小学常见分类。</p>
    <p>拼音录音主要来自 <a href="https://github.com/hugolpz/audio-cmn" target="_blank" rel="noopener">audio-cmn</a>，少量来自 <a href="https://commons.wikimedia.org/wiki/File:Zh-m%C3%A1.ogg" target="_blank" rel="noopener">Wikimedia Commons</a> 和<a href="https://www.open.edu/openlearn/mod/oucontent/view.php?id=106435&amp;section=1.1" target="_blank" rel="noopener">英国开放大学 OpenLearn</a>。</p>
    <p>古诗朗读和部分拼音读音由<a href="https://support.microsoft.com/zh-cn/accessibility/windows/narrator/appendix-a-supported-languages-and-voices" target="_blank" rel="noopener">微软慧慧</a>语音合成，英语音频使用 <a href="https://github.com/mrcraked/WordAudio" target="_blank" rel="noopener">WordAudio</a> 和 <a href="https://gtts.readthedocs.io/en/stable/" target="_blank" rel="noopener">gTTS</a> 生成。</p>
    <p><a href="${publicAsset('/audio/ATTRIBUTION.md')}" target="_blank" rel="noopener">查看音频来源与署名说明</a></p>
    <h3>使用小提醒</h3>
    <p>首次听音需要点击喇叭。跟着录音自己读一读即可，本应用不会录音，也不会自动评价你的发音。</p>
    <p>页面风格参考 <a href="https://bunnyland.app/" target="_blank" rel="noopener">Bunny Math</a>，插画与练习界面为本项目绘制。</p>`);
}

function changeMode(id, group) {
  if (!modes.some(mode => mode.id === id)) return;
  if (id !== 'favorites' && (studyModes.includes(id) || id === 'tones')) pinyinLearningMode = id;
  if (id === 'mistakes' && !state.mistakes.length) return;
  halt();
  state.modeGroups ||= {};
  state.modeGroups[state.mode] = state.group;
  state.mode = id;
  state.subject = 'chinese';
  state.features.chinese = 'pinyin';
  state.group = group || state.modeGroups[id] || 'all';
  if (id === 'tones') state.tonePractice = false;
  state.settings.continuous = false;
  if (id === 'mistakes' && state.sessions[key()]?.finished) delete state.sessions[key()];
  closeDialog();
  render();
}

function startPinyinSection(category) {
  if (category === 'tones') {
    halt();
    state.tonePractice = true;
    render();
    return;
  }
  if (state.mode !== 'sequence' && state.mode !== 'random') return;
  state.modeGroups ||= {};
  state.modeGroups['section-practice-return'] = state.mode;
  changeMode('section-practice', category);
}

function returnToPinyinStudy() {
  if (state.mode === 'section-practice') {
    const order = state.modeGroups?.['section-practice-return'];
    changeMode(order === 'random' ? 'random' : 'sequence', state.group);
  } else if (state.mode === 'tones') {
    halt();
    state.tonePractice = false;
    render();
  } else changeMode(pinyinLearningMode);
}

async function playCurrent(continuous = false) {
  const item = currentItem();
  if (!item) return;
  const token = ++continuousToken;
  const success = await playAudio(pinyinCardAudio(item), state.settings.slow);
  if (continuous && success && token === continuousToken && state.settings.continuous) {
    const value = session();
    if (value.index < value.ids.length - 1) {
      setTimeout(() => {
        if (token !== continuousToken || !state.settings.continuous) return;
        value.index++;
        render();
        playCurrent(true);
      }, 700);
    } else { state.settings.continuous = false; render(); toast('这一轮听完啦，真棒！'); }
  } else if (!success && continuous && token === continuousToken) { state.settings.continuous = false; render(); }
}

function addMistake(question) {
  const existing = state.mistakes.find(item => item.question.id === question.id);
  if (existing) { existing.attempts++; existing.time = Date.now(); }
  else state.mistakes.push({ question, attempts: 1, time: Date.now() });
}

function playQuestionParts(question) {
  void playAudio(pinyinBlendAudio(question.parts), state.settings.slow);
}

function submitAnswer(answer) {
  const round = session();
  const result = recordAnswer(round, answer);
  if (!result) return;
  halt();
  const reviewed = result.first && result.correct && state.mode === 'mistakes';
  if (result.first) {
    if (!result.correct) addMistake(result.question);
    else if (state.mode === 'mistakes') state.mistakes = state.mistakes.filter(entry => entry.question.id !== result.question.id);
  }
  const reward = result.correct ? grantRewards(state, { type: 'answer', question: result.question, reviewed }) : null;
  if (result.correct) chime(state.settings.effects);
  render();
  celebrateReward(reward);
}

function restart() {
  halt();
  delete state.sessions[key()];
  state.settings.continuous = false;
  closeDialog();
  render();
}

function finishStudy() {
  const value = session();
  const nextGroup = nextStudyGroup(state.mode, state.group);
  halt();
  state.settings.continuous = false;
  render();
  openDialog('这一站，顺利到达！', `<div class="study-complete">${bunny()}<h3>认真学习的你，真棒！</h3><p>这一轮共有 ${value.ids.length} 个朋友。${nextGroup ? `接下来，去认识${nextGroup.name}吧。` : '当前玩法的内容已经到最后一节啦，可以再练一轮。'}</p><div class="dialog-actions">${button('restart-now', state.mode === 'random' ? '重新洗牌学习' : '再学一遍', 'refresh', 'outline-button')}${nextGroup ? button('next-section', `下一节：${nextGroup.name}`, 'chevron', 'solid-button') : button('mode', '试试听音练习', 'headphones', 'solid-button', 'data-id="listen"')}</div></div>`);
}

function advanceStudy() {
  const value = session();
  halt();
  if (value.index === value.ids.length - 1) {
    if (currentItem()?.type === 'basic') { state.settings.continuous = false; render(); }
    else finishStudy();
    return;
  }
  value.index++;
  render();
  if (state.settings.continuous) playCurrent(true);
}

function changeScope(field, value) {
  halt();
  state.settings.continuous = false;
  state[field] = value;
  render();
}

function handleAction(event) {
  const target = event.target.closest('[data-action]') || event.target.closest('.reward-card')?.querySelector('[data-action="reward-detail"]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (libraryDetail && dialog.contains(target)) { handleLibraryCardAction(target); return; }
  if (action === 'library-open' && Object.hasOwn(libraryTitles, target.dataset.id)) {
    setLibraryPage(target.dataset.id, target.dataset.feature, target.dataset.section);
    return;
  }
  if (action === 'library-exit') { setLibraryPage(null); return; }
  if (action === 'library-filter' && libraryPage) {
    const { filter, id } = target.dataset;
    if (!Object.hasOwn(libraryFilters, filter)) return;
    if (libraryFilters[filter] === id) target.closest('.nav-picker').open = false;
    else {
      libraryFilters[filter] = id;
      if (filter === 'subject') libraryFilters.feature = 'all';
      if (filter === 'subject' || filter === 'feature') libraryFilters.section = 'all';
      render();
    }
    app.querySelector(`#library-filter-${filter}`)?.focus({ preventScroll: true });
    return;
  }
  if (action === 'library-item') {
    const item = libraryItem(decodeURIComponent(target.dataset.ref), state, topicById);
    if (item) openLibraryCard([item], { ...target.dataset });
    return;
  }
  if (action === 'library-review-group') {
    const entries = libraryItems('mistakes', state, learningTopics, topicById).filter(item => item.feature === target.dataset.id
      && (libraryFilters.section === 'all' || item.section === libraryFilters.section));
    openLibraryCard(entries.slice(0, reviewBatchSize), { ...target.dataset });
    return;
  }
  if (action === 'library-review-due') {
    openLibraryCard(duePhonicsItems(state, topicById).slice(0, reviewBatchSize), { ...target.dataset }, '到期复习');
    return;
  }
  if (action === 'toggle-content-favorite') {
    const ref = decodeURIComponent(target.dataset.ref);
    const item = libraryItem(ref, state, topicById);
    if (!item) return;
    toggleSaved(item);
    render();
    return;
  }
  if (action === 'ct-draft') return;
  if (['en-play', 'en-stop', 'en-study-text'].includes(action)) {
    const topic = activeTopic();
    if (topic?.subject !== 'english') return;
    const progress = state.topics[topic.id];
    const round = progress.view === 'quiz' ? progress.round : null;
    const question = round?.questions[round.index];
    halt();
    if (action === 'en-play') {
      const listeningRound = question?.clip?.id === target.dataset.id && !round.revealed ? round : null;
      englishAudio.play(target.dataset.id, state.settings.slow, listeningRound, render);
    }
    if (action === 'en-study-text' && question?.clip) {
      englishAudio.forget();
      const lesson = topic.lessons.find(item => (item.clip || item.word)?.id === question.clip.id);
      if (lesson) Object.assign(progress, { lessonId: lesson.id, category: lesson.category });
      progress.view = 'learn';
      render();
      app.querySelector('#main-content').focus({ preventScroll: true });
    }
    return;
  }
  if (['ct-poem-play', 'ct-poem-stop'].includes(action)) {
    const topic = activeTopic();
    const topicState = topic && state.topics[topic.id];
    const lesson = topic?.lessons.find(item => item.id === topicState.lessonId);
    halt();
    if (topicState?.view === 'learn' && lesson?.poem && action !== 'ct-poem-stop') {
      void poetryAudio.play(lesson.poem.audioId, state.settings.slow);
    }
    return;
  }
  if (action.startsWith('ct-')) {
    const topic = activeTopic();
    if (!topic) return;
    const round = state.topics[topic.id].round;
    if (topic.subject === 'english' && ['ct-answer', 'ct-skip'].includes(action) && round?.questions[round.index]?.clip && !englishAudio.heard(round)) return;
    halt();
    const result = handleTopicAction(state, topic, action, target.dataset);
    render();
    if (['ct-start', 'ct-learn'].includes(action)) focusLearningActivity();
    if (result.correct) chime(state.settings.effects);
    celebrateReward(result.reward);
    return;
  }
  if (action.startsWith('hz-')) {
    if (state.subject !== 'chinese' || state.features.chinese !== 'hanzi-structure') return;
    halt();
    const result = handleHanziAction(state, action, target.dataset);
    render();
    if (['hz-start', 'hz-learn'].includes(action)) focusLearningActivity();
    if (result.correct) chime(state.settings.effects);
    celebrateReward(result.reward);
    return;
  }
  if (action.startsWith('ph-') && isPhonics()) { if (dialog.open) closeDialog(); phonics.handle(target); return; }
  if (action === 'close-dialog') { dismissDialog(); return; }
  if (action === 'settings' || action === 'menu-settings') { showSettings(); return; }
  if (action === 'export-backup') { exportBackup(); return; }
  if (action === 'choose-backup') { dialog.querySelector('#backup-file')?.click(); return; }
  if (action === 'confirm-import') { importBackup(); return; }
  if (action === 'about') { showAbout(); return; }
  if (action === 'profile') { showProfile(); return; }
  if (action === 'edit-nickname') { showNickname(); return; }
  if (action === 'nickname-back') { returnFromNickname(); return; }
  if (action === 'reward-rules') { showRewardRules(); return; }
  if (action === 'reward-collection') { showRewardCollection(); return; }
  if (action === 'reward-notice-view') {
    celebrations.dismiss();
    if (target.dataset.id) showRewardDetail(target.dataset.id, { fromNotice: true });
    else showRewardRules();
    return;
  }
  if (action === 'reward-filter') { if (['all', 'sticker', 'badge', 'medal', 'decoration'].includes(target.dataset.id)) rewardFilter = target.dataset.id; showRewardCollection(); return; }
  if (action === 'reward-help') { showRewardHelp(target.dataset.id, target.dataset.rewardId); return; }
  if (action === 'reward-help-back') { returnFromRewardHelp(); return; }
  if (action === 'reward-help-previous') { returnToPreviousRewardHelp(); return; }
  if (action === 'resume-round-length') {
    const select = target.closest('.round-settings').querySelector('select');
    select.value = target.dataset.length;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  if (action === 'reward-detail') { showRewardDetail(target.dataset.id); return; }
  if (action === 'equipped-reward-preview') { if (state.rewards.unlocks[target.dataset.id]) showRewardDetail(target.dataset.id); return; }
  if (action === 'equip-reward') { if (equipReward(state.rewards, target.dataset.id)) { render(); const scroll = dialog.scrollTop; showRewardCollection(); dialog.scrollTop = scroll; } return; }
  if (action === 'replay-reward') { const reward = rewardCatalog.find(item => item.id === target.dataset.id && state.rewards.unlocks[item.id]); if (reward) celebrateReward({ stars: 0, unlocked: [reward.id], reasons: [], replay: true }); return; }
  if (action === 'dismiss-reward') { celebrations.dismiss(); return; }
  if (action === 'mode') { changeMode(target.dataset.id); return; }
  if (action === 'pinyin-page') {
    if (target.dataset.id === 'learn') returnToPinyinStudy();
    else startPinyinSection(target.dataset.category);
    return;
  }
  if (action === 'pinyin-category') {
    if (target.dataset.id === 'tones') changeMode('tones');
    else changeMode(pinyinLearningMode === 'random' ? 'random' : 'sequence', target.dataset.id);
    return;
  }
  if (action === 'pinyin-order') { changeMode(state.mode === 'random' ? 'sequence' : 'random', state.group); return; }
  if (action === 'pinyin-section-practice') {
    startPinyinSection(target.dataset.id);
    focusLearningActivity();
    return;
  }
  if (action === 'pinyin-learn') { returnToPinyinStudy(); focusLearningActivity(); return; }
  if (action === 'toggle-tones') { halt(); state.tonePractice = !state.tonePractice; render(); focusLearningActivity(); return; }
  if (action === 'shuffle-favorites') { halt(); const value = session(); value.ids = shuffle(value.ids); value.index = 0; render(); toast('顺序打乱啦，来看看还认识谁。'); return; }
  if (action === 'subject') {
    if (!subjects.some(subject => subject.id === target.dataset.id)) return;
    if (libraryPage) setLibraryPage(null);
    halt(); state.subject = target.dataset.id; mobileMenu = false; state.settings.continuous = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return;
  }
  if (action === 'collapse') {
    if (window.matchMedia('(max-width: 760px)').matches) mobileMenu = false;
    else state.collapsed = !state.collapsed;
    render(); return;
  }
  if (action === 'mobile-menu') { mobileMenu = !mobileMenu; render(); return; }
  if (action === 'feature') { state.features[state.subject] = target.dataset.id; halt(); state.settings.continuous = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
  if (action === 'map-group') { if (target.dataset.id === 'all' || learningGroups(state.mode).some(group => group.id === target.dataset.id)) changeScope('group', target.dataset.id); return; }
  if (action === 'map-confusion') { if (Object.hasOwn(confusionSets, target.dataset.id)) changeScope('confusion', target.dataset.id); return; }
  if (action === 'map-word-scope') { if (availableWordScopes().some(scope => scope.id === target.dataset.id)) changeScope('wordScope', target.dataset.id); return; }
  if (action === 'next-section') {
    const nextGroup = nextStudyGroup(state.mode, state.group);
    if (!nextGroup) return;
    halt(); state.group = nextGroup.id; state.settings.continuous = false;
    delete state.sessions[key()];
    closeDialog(); render(); return;
  }
  if (action === 'restart-now') { restart(); return; }
  if (action === 'reset-confirm') { showResetConfirmation(); return; }
  if (action === 'reset-all') { halt(); celebrations.reset(); state = defaultState(); phonics.reset(state.phonics); state.features.english = 'phonics'; initializeRewards(state); storageReadFailed = false; closeDialog(); render(); toast('记录已清空，可以重新出发啦。'); return; }
  if (action === 'sound') { continuousToken++; playAudio({ sound: target.dataset.sound, recording: target.dataset.recording }, state.settings.slow); return; }
  if (action === 'word-sound') { continuousToken++; const item = vocabulary.find(entry => entry.text === target.dataset.word); playAudio({ word: target.dataset.word, sounds: item?.sounds }, state.settings.slow); return; }
  if (studyModes.includes(state.mode)) {
    const value = session();
    const item = currentItem();
    if (!item) return;
    if (action === 'play-current') { playCurrent(state.settings.continuous); return; }
    if (action === 'continuous') { state.settings.continuous = !state.settings.continuous; halt(); render(); if (state.settings.continuous) playCurrent(true); return; }
    if (action === 'favorite') { if (state.mode === 'favorites') { halt(); state.settings.continuous = false; } state.favorites = state.favorites.includes(item.id) ? state.favorites.filter(id => id !== item.id) : [...state.favorites, item.id]; render(); return; }
    if (action === 'known') { if (!state.known.includes(item.id)) { state.known.push(item.id); chime(state.settings.effects); } const reward = grantRewards(state, { type: 'recognize', item }); advanceStudy(); celebrateReward(reward); return; }
    if (action === 'practice-later') { state.known = state.known.filter(id => id !== item.id); if (!state.favorites.includes(item.id)) state.favorites.push(item.id); toast('已放进收藏夹，下次再一起练。'); advanceStudy(); return; }
    if (action === 'finish-study') { finishStudy(); return; }
    if (['next', 'previous', 'jump'].includes(action)) {
      halt();
      value.index = action === 'jump' ? Number(target.dataset.index) : Math.max(0, Math.min(value.ids.length - 1, value.index + (action === 'next' ? 1 : -1)));
      render();
      if (state.settings.continuous) playCurrent(true);
      return;
    }
  }
  if (state.mode === 'match') {
    const value = session();
    if (action === 'match-left') { selectMatch(value, action, target.dataset.id); render(); return; }
    if (action === 'match-right') {
      const result = selectMatch(value, action, target.dataset.id);
      if (!result) { toast('先点左边的汉字，再选拼音哦。'); return; }
      const item = allItems.find(entry => entry.id === result.left);
      let reward = null;
      if (result.correct) {
        reward = grantRewards(state, { type: 'answer', question: { id: `match:${item.id}`, display: item.text } });
        chime(state.settings.effects);
      }
      else {
        const options = value.right.map(id => allItems.find(entry => entry.id === id).pinyin);
        addMistake({ id: `match:${item.id}`, kind: 'hanzi', prompt: '给这个字词找到正确的拼音', display: item.text, answer: item.pinyin, options, explanation: `${item.text}，读作 ${item.pinyin}。`, itemId: item.id, audio: pinyinCardAudio(item) });
        toast('这两个还不是一对，再找找看。');
      }
      if (value.matched.length === value.pairs.length && !value.finished) {
        value.finished = true;
        state.history.push({ time: Date.now(), name: '拼音配对', category: 'words', total: value.pairs.length, correct: value.pairs.length - value.wrong.length });
        state.history = state.history.slice(-100);
        const roundReward = grantRewards(state, { type: 'round', mode: 'match', name: '拼音配对', total: value.pairs.length, answered: value.matched.length });
        reward = { stars: (reward?.stars || 0) + roundReward.stars, unlocked: [...(reward?.unlocked || []), ...roundReward.unlocked], reasons: [...(reward?.reasons || []), ...roundReward.reasons] };
      }
      render(); celebrateReward(reward); return;
    }
  }
  if (!studyModes.includes(state.mode) && state.mode !== 'match' && (state.mode !== 'tones' || state.tonePractice)) {
    const round = session();
    if (round.finished) return;
    const question = round.questions[round.index];
    if (!question) return;
    if (action === 'answer') { submitAnswer(target.dataset.value); return; }
    if (action === 'skip') { submitAnswer(null); return; }
    if (action === 'play-question') { continuousToken++; playAudio(pinyinQuestionAudio(question), state.settings.slow); return; }
    if (action === 'play-parts') { playQuestionParts(question); return; }
    if (action === 'next-question' && round.revealed) {
      halt();
      const nextIndex = nextUnfinishedQuestion(round);
      let reward = null;
      if (nextIndex < 0) {
        round.finished = true;
        const stats = roundStats(round);
        state.history.push({ time: Date.now(), name: currentMode().name, category: pinyinPracticeCategory(key()), total: stats.total, correct: stats.correct });
        state.history = state.history.slice(-100);
        reward = grantRewards(state, { type: 'round', mode: state.mode === 'tones' ? 'tones' : state.mode, name: currentMode().name, total: stats.total, answered: round.responses.filter(response => response && !response.skipped).length });
      } else visitQuestion(round, nextIndex);
      render(); celebrateReward(reward); return;
    }
  }
}

document.addEventListener('click', event => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    app.querySelector('#main-content').focus();
    return;
  }
  if (!event.target.closest('.my-menu')) app.querySelector('.my-menu')?.removeAttribute('open');
  else if (event.target.closest('[data-action]')) app.querySelector('.my-menu')?.removeAttribute('open');
  const previous = event.target.closest('.learning-book');
  const tab = previous && event.target.closest('[role="tab"]');
  const action = event.target.closest('[data-action]');
  if (action || !previous) bookTabs.cancel();
  if (navigation.click(event)) return;
  if (tab?.getAttribute('aria-selected') === 'true') {
    tab.focus({ preventScroll: true });
    return;
  }
  const changesPage = tab || previous?.querySelectorAll('[role="tab"]').length > 1 && (
    ['ct-start', 'hz-start', 'ct-learn', 'hz-learn', 'pinyin-section-practice', 'ph-section-practice', 'pinyin-learn', 'toggle-tones'].includes(action?.dataset.action)
    || previous.dataset.page === 'practice' && action?.dataset.action === 'ph-mode' && action.dataset.id === 'learn'
  );
  if (changesPage) bookTabs.turn(previous, { animate: state.settings.animations, update: () => handleAction(event), focusTab: Boolean(tab) });
  else handleAction(event);
});

document.addEventListener('input', event => {
  if (navigation.input(event)) return;
  if (event.target.dataset.action !== 'ct-draft') return;
  if (libraryDetail && dialog.contains(event.target)) {
    updateTopicActivity(currentLibraryItem().topic, libraryDetail.lesson, 'draft', event.target.value);
    return;
  }
  const topic = state.subject === 'chinese' ? topicById(state.features.chinese) : null;
  if (!topic) return;
  updateTopicActivity(topic, state.topics[topic.id], 'draft', event.target.value);
  persist();
});

document.addEventListener('change', event => {
  if (event.target.id === 'backup-file') { void readBackupFile(event.target); return; }
  const lengthScope = event.target.dataset.roundLength;
  if (lengthScope) {
    const length = Number(event.target.value);
    if (lengthScope === 'pinyin' && [5, 10, 20].includes(length)) { halt(); state.length = length; }
    else if (lengthScope === 'ct' && activeTopic() && practiceLengths.includes(length)) {
      const topic = activeTopic();
      const progress = state.topics[topic.id];
      halt();
      if (progress.round && startTopicRound(topic, progress, progress.round.scope, length, false)) progress.practiceLength = length;
    } else if (lengthScope === 'hz' && practiceLengths.includes(length)) {
      halt();
      if (state.hanzi.round && startHanziRound(state.hanzi, state.hanzi.round.scope, length, false)) state.hanzi.practiceLength = length;
    }
    else if (lengthScope !== 'phonics' || state.subject !== 'english' || !phonics.change(event.target)) return;
    if (lengthScope !== 'phonics') render();
    const replacement = app.querySelector(`[data-round-length="${lengthScope}"]`);
    if (replacement) {
      replacement.closest('details').open = true;
      replacement.focus({ preventScroll: true });
    }
    return;
  }
  const field = event.target.dataset.setting;
  if (!field) return;
  halt();
  state.settings.continuous = false;
  if (['slow', 'showPinyin', 'effects', 'animations'].includes(field)) state.settings[field] = event.target.checked;
  render();
});

document.addEventListener('submit', event => {
  if (event.target.id === 'review-spelling-form' && libraryDetail) {
    event.preventDefault();
    const answer = new FormData(event.target).get('spelling')?.trim().toLowerCase();
    if (answer) submitLibraryAnswer(answer);
    return;
  }
  if (event.target.id === 'ph-spelling-form' && isPhonics()) { phonics.submitForm(event); return; }
  if (event.target.id !== 'nickname-form') return;
  event.preventDefault();
  const input = dialog.querySelector('#nickname');
  const nickname = normalizeNickname(input.value);
  if (!nickname) {
    input.setAttribute('aria-invalid', 'true');
    dialog.querySelector('#nickname-error').textContent = '请输入 1–12 个字符的昵称。';
    input.focus();
    return;
  }
  state.nickname = nickname;
  render();
  returnFromNickname();
  toast('记住你的新昵称啦！');
});

document.addEventListener('input', event => {
  if (event.target.id === 'review-spelling-input' && libraryDetail) {
    libraryDetail.round.drafts[currentLibraryItem().question.id] = event.target.value;
  } else if (isPhonics()) phonics.input(event.target);
});

window.addEventListener('popstate', () => {
  const page = pageFromHash();
  if (page === libraryPage) return;
  if (dialog.open) closeDialog(false);
  halt();
  libraryPage = page;
  libraryFilters = defaultLibraryFilters();
  render();
});

document.addEventListener('keydown', event => {
  if (navigation.keydown(event)) return;
  if (event.key === 'Escape' && app.querySelector('.my-menu[open]')) { app.querySelector('.my-menu').removeAttribute('open'); app.querySelector('.my-menu-toggle').focus(); return; }
  if (event.key === 'Escape' && mobileMenu && !dialog.open) { mobileMenu = false; render(); }
  if (bookTabs.keydown(event)) return;
  if (dialog.open || libraryPage || event.target.closest('input, select, textarea, button, a, summary')) return;
  if (state.subject === 'chinese' && state.features.chinese !== 'hanzi-structure' && !topicById(state.features.chinese) && studyModes.includes(state.mode) && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    const value = session();
    const next = value.index + (event.key === 'ArrowRight' ? 1 : -1);
    if (next >= 0 && next < value.ids.length) { event.preventDefault(); halt(); value.index = next; render(); }
  }
});

dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismissDialog();
});
dialog.addEventListener('cancel', event => {
  if (event.target.id === 'backup-file') dialog.querySelector('[data-action="choose-backup"]').focus({ preventScroll: true });
  if (event.target !== dialog) return;
  event.preventDefault();
  dismissDialog();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { halt(); clearRewardNotice(); state.settings.continuous = false; persist(); } else { if (!dialog.open) render(); celebrations.resume(); } });
onAudioStatus((status, message) => {
  document.querySelectorAll('.primary-audio').forEach(element => { element.classList.toggle('playing', status === 'playing'); element.setAttribute('aria-busy', String(status === 'loading')); });
  if (status === 'error') toast(message);
});
state.settings.continuous = false;
render();
if (!storageAvailable) toast('历史记录暂时无法读取，你可以先继续练习。');
