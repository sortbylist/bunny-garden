import './style.css';
import './personal.css';
import './learning-ui.css';
import { observeReadingRows } from './reading-layout.js';
import { basics, groups, modes, playModes, modeSections, subjects, vocabulary, marked, confusionSets, toneExamples, neutralToneExamples } from './data.js';
import { shuffle, studyPool, learningGroups, nextStudyGroup, visitQuestion, nextUnfinishedQuestion, createRound, recordAnswer, roundStats, loadState, defaultState } from './engine.js';
import { icon, bunny } from './icons.js';
import { playAudio, stopAudio, onAudioStatus, chime, hasAudio } from './audio.js';
import { createPoetryAudio } from './poetry-audio.js';
import { initializeRewards, grantRewards, rewardStats, rewardCatalog, rewardProgress, equipReward, normalizeNickname } from './rewards.js';
import { rewardArt, rewardStamp } from './reward-art.js';
import { rewardStages, rewardSections, curriculumProgress, sectionProgress } from './reward-curriculum.js';
import { rewardHelp } from './reward-help.js';
import { createRewardCelebration } from './reward-celebration.js';
import { rewardViewer, mountRewardViewer } from './reward-viewer.js';
import { normalizeHanziState, startHanziRound } from './hanzi-engine.js';
import { hanziLessons } from './hanzi-data.js';
import { renderHanzi, handleHanziAction } from './hanzi.js';
import { chineseTopics } from './chinese-topics.js';
import { mathTopics } from './math-topics.js';
import { normalizeTopic, topicDefaults, startTopicRound, updateTopicActivity } from './chinese-engine.js';
import { renderTopic, handleTopicAction } from './chinese.js';
import { createPhonicsView } from './phonics.js';
import { createNavigation, featureGroups } from './navigation.js';
import { learningPosition, learningTokenClass } from './learning-ui.js';
import './ui-theme.css';
import { createBackup, parseBackup, restoreBackup, maxBackupBytes } from './backup.js';
import { saveState } from './storage.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const loaded = loadState({ getItem: key => localStorage.getItem(key) });
let state = loaded.state;
const learningTopics = [...chineseTopics, ...mathTopics];
const topicById = id => learningTopics.find(topic => topic.id === id);
const activeTopic = () => ['chinese', 'math'].includes(state.subject) ? topicById(state.features[state.subject]) : null;
state.hanzi = normalizeHanziState(state.hanzi);
state.topics = Object.fromEntries(learningTopics.map(topic => [topic.id, normalizeTopic(topic, state.topics?.[topic.id])]));
let storageAvailable = loaded.available;
let mobileMenu = false;
let toastTimer;
let pendingBackup = null;
let backupReadRequest = 0;
let backupCommitted = false;
let dialogReturnFocus;
let settingsScrollBeforeReset = 0;
let continuousToken = 0;
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
state.features.english = 'phonics';
const phonics = createPhonicsView({
  state: state.phonics, persist,
  redraw: render, notify: toast, renderGarden: progressCard,
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
  if (backupCommitted) return;
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

function halt() { continuousToken++; stopAudio(); phonics.stop(); poetryAudio.stop(); }

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
  disposeReadingRows();
  poetryAudio.stop();
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
  document.title = `${topic ? topic.name : isHanzi ? '汉字笔画与结构' : subject.name === '语文' ? currentMode().name + ' · 拼音学习' : subject.name} · 小兔学习乐园`;
  app.className = `${state.collapsed ? 'sidebar-collapsed' : ''} ${mobileMenu ? 'mobile-open' : ''}`;
  app.classList.toggle('no-reward-motion', !state.settings.animations);
  app.innerHTML = `
    <a class="skip-link" href="#main-content">跳到学习内容</a>
    ${mobileMenu ? '<button class="drawer-backdrop" data-action="mobile-menu" aria-label="关闭学科导航"></button>' : ''}
    <aside class="sidebar" aria-label="学科导航">
      <div class="brand"><img src="/bunny.svg" alt="" width="43" height="43"><div class="brand-text"><strong>小兔学习乐园</strong><span>每天进步一点点</span></div></div>
      ${button('collapse', '<span class="nav-label">收起侧栏</span>', 'panel', 'collapse-button', `aria-label="${state.collapsed ? '展开' : '收起'}侧栏" aria-expanded="${!state.collapsed}"`)}
      <div class="nav-caption">我的学习天地</div>
      <nav class="subjects">${subjects.map(item => `<button class="subject ${item.color} ${state.subject === item.id ? 'active' : ''}" data-action="subject" data-id="${item.id}" aria-label="${item.name}" ${state.subject === item.id ? 'aria-current="page"' : ''}><span class="subject-icon">${icon(item.icon)}</span><span class="subject-name">${item.name}<small>${item.english}</small></span>${icon('chevron', 'nav-arrow')}</button>`).join('')}</nav>
      <div class="sidebar-note">${icon('sprout')}<strong>小小的坚持，<br>大大的成长。</strong><span>跟着小兔，快乐学习</span><i class="note-flower">✿</i></div>
      <div class="sidebar-bottom">${button('settings', '<span class="nav-label">学习设置</span>', 'settings', 'nav-bottom', 'title="学习设置"')}${button('about', '<span class="nav-label">关于学习乐园</span>', 'info', 'nav-bottom', 'title="关于学习乐园"')}<span class="local-note">${icon('leaf')} 学习记录保存在本机</span></div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        ${button('mobile-menu', '', 'menu', 'icon-button mobile-toggle', 'aria-label="切换学科导航"')}
        <div class="breadcrumb">学习乐园 ${icon('chevron')} <span>${subject.name}</span></div>
        <div class="topbar-right"><button class="star-counter" data-action="reward-rules" aria-label="查看星星收获与获取规则">${icon('star')}<b>${rewardStats(state.rewards).stars}</b><span>颗成长星</span>${icon('info')}</button><details class="my-menu"><summary class="my-menu-toggle" aria-label="打开我的菜单"><img src="/bunny.svg" alt="" width="38" height="38"><span>${escape(state.nickname)}<small>我的 ${icon('down')}</small></span></summary><div class="my-menu-content"><strong>你好，${escape(state.nickname)}</strong>${button('profile', '我的成长空间', 'sprout')}${personalButtons('menu')}${button('reward-collection', '奖励收藏册', 'star')}${button('menu-settings', '学习设置', 'settings')}</div></details></div>
      </header>
      ${navigation.render({ id: `features-${subject.id}`, label: `${subject.name}主题`, groups: featureGroups(subject), selected: state.features[subject.id], memories: state.navigationSelections, action: 'feature', className: 'feature-navigation' })}
      <main id="main-content" tabindex="-1">${topic ? renderTopic(topic, state.topics[topic.id], progressCard()) : isHanzi ? renderHanzi(state.hanzi, progressCard()) : state.subject === 'chinese' ? learningPage() : state.subject === 'english' ? phonics.render() : comingSoon(subject)}</main>
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
  persist();
  celebrations.resume();
}

function learningPage() {
  const mode = currentMode();
  const value = session();
  if (studyModes.includes(state.mode)) {
    const item = currentItem();
    if (item && !state.seen.includes(item.id)) state.seen.push(item.id);
  }
  return `<section class="page-heading"><div><div class="eyebrow"><span></span>语文的第一站 · PINYIN GARDEN</div><h1>和拼音交个朋友吧<span class="heading-flower">✿</span></h1><p>听一听，读一读。每认识一个拼音，都是小小的进步！</p></div><div class="heading-sticker">${icon('sprout')}<span>今天也要<br><b>快乐生长</b></span></div></section>
    ${modePicker()}
    <div class="learning-layout"><div class="learning-main" role="region" aria-label="${mode.name}">
      ${controls()}
      ${studyModes.includes(state.mode) ? studyCard(value) : state.mode === 'tones' && !state.tonePractice ? tonesCard() : state.mode === 'match' ? matchCard(value) : quizCard(value)}
      ${studyModes.includes(state.mode) ? studyGrid(value) : '<div class="gentle-note">' + icon('leaf') + '答错也没关系，再听一次、再试一次，就是进步。</div>'}
    </div><aside class="learning-aside">${progressCard()}${mapCard()}<div class="help-note">${icon('headphones')}<div><strong>小耳朵，准备好了吗？</strong><p>点击 ${icon('sound')} 就能听读音<br>听完以后，也试着读一读吧。</p></div></div></aside></div>`;
}

function modePicker() {
  return navigation.render({ id: 'pinyin-modes', label: '拼音玩法', groups: modeSections.map(section => ({ id: section, name: section, items: playModes.filter(mode => mode.group === section) })), selected: state.mode, memories: state.navigationSelections, action: 'mode', className: 'play-selector mode-navigation' });
}

function personalLinks(className = '') {
  return `${className === 'garden-links' ? sectionRewardPanel() : ''}<div class="personal-links ${className}">${personalButtons(className === 'garden-links' ? 'garden' : 'menu')}${button('reward-collection', '奖励收藏册', 'star', 'outline-button')}</div>`;
}

function sectionRewardPanel() {
  const topic = activeTopic();
  const sectionId = state.subject === 'english' ? `english/${state.phonics.lessonId}`
    : topic ? `${topic.id}/${state.topics[topic.id].category}`
    : state.features.chinese === 'hanzi-structure' ? `hanzi-structure/${state.hanzi.category}` : null;
  const section = rewardSections.get(sectionId);
  if (!section) return '';
  const progress = sectionProgress(state.rewards, section);
  return `<div class="section-reward-panel"><strong>${progress.complete ? '本小节完成啦 ✓' : '本小节成长目标'}</strong><p>学习确认 ${progress.learned} / ${progress.total}<br>独立练习：${progress.passed ? '已达标 ✓' : '等待达标'}</p>${button('section-assessment', '小节达标练习 · 最多5题', 'pen', 'outline-button', `data-id="${section.id}"`)}<small>全部学习确认＋一次练习至少80%独立答对</small></div>`;
}

function personalButtons(context = 'garden') {
  if (state.subject === 'english') return phonics.personalButtons();
  const topic = activeTopic();
  if (topic) {
    const count = state.topics[topic.id].mistakes.length;
    return `${button(context === 'garden' ? 'ct-start' : 'topic-review', `${topic.name}错题本（${count}）`, 'notebook', 'outline-button', `data-id="${context === 'garden' ? 'review' : topic.id}" ${count ? '' : 'disabled'}`)}${button(context === 'garden' ? 'topic-records' : topic.subject === 'math' ? 'math-records' : 'records', '学习记录', 'book', 'outline-button')}`;
  }
  if (state.subject === 'chinese' && state.features.chinese === 'hanzi-structure') {
    const count = state.hanzi.mistakes.length;
    return `${button(context === 'garden' ? 'hz-start' : 'hanzi-review', `汉字错题本（${count}）`, 'notebook', 'outline-button', `data-id="review" ${count ? '' : 'disabled'}`)}${button('records', '学习记录', 'book', 'outline-button')}`;
  }
  return `${button('mode', `拼音错题本（${state.mistakes.length}）`, 'notebook', 'outline-button', `data-id="mistakes" ${state.mistakes.length ? '' : 'disabled'}`)}${button('mode', `我的收藏（${state.favorites.length}）`, 'heart', 'outline-button', 'data-id="favorites"')}${button('records', '学习记录', 'book', 'outline-button')}`;
}

function equippedRewards() {
  return Object.entries(state.rewards.equipped).map(([type, id]) => {
    const reward = rewardCatalog.find(item => item.id === id);
    return reward ? button('equipped-reward-preview', `${rewardArt(reward.art, '', reward.icon)}<span>${reward.name}</span>`, '', `equipped-item ${type}`, `data-id="${reward.id}" aria-label="查看${reward.name}动效"`) : '';
  }).join('');
}

function controls() {
  const supportsGroup = ['sequence', 'random', 'listen', 'audio', 'challenge'].includes(state.mode);
  const availableGroups = learningGroups(state.mode);
  return `<div class="controls">${supportsGroup ? `<label>${state.mode === 'challenge' ? '听辨范围' : '学习范围'} <select id="group-select" data-setting="group"><option value="all">全部拼音</option>${availableGroups.map(group => `<option value="${group.id}" ${state.group === group.id ? 'selected' : ''}>${group.name}</option>`).join('')}</select></label>` : ''}
    ${availableWordScopes().length ? `<label>字词范围 <select data-setting="wordScope">${availableWordScopes().map(scope => `<option value="${scope.id}" ${state.wordScope === scope.id ? 'selected' : ''}>${scope.name}</option>`).join('')}</select></label>` : ''}
    ${state.mode === 'confusing' ? `<label>专项 <select data-setting="confusion">${Object.entries(confusionSets).map(([id, item]) => `<option value="${id}" ${state.confusion === id ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label>` : ''}
    ${!studyModes.includes(state.mode) && state.mode !== 'match' && (state.mode !== 'tones' || state.tonePractice) ? `<label>每组 <select data-setting="length">${[5, 10, 20].map(length => `<option value="${length}" ${state.length === length ? 'selected' : ''}>${length} 题</option>`).join('')}</select></label>` : ''}
    ${state.mode === 'tones' ? button('toggle-tones', state.tonePractice ? '回到声调学习' : '听音选声调', state.tonePractice ? 'book' : 'headphones', 'text-button') : ''}
    ${state.mode === 'favorites' ? button('shuffle-favorites', '打乱顺序复习', 'shuffle', 'text-button') : ''}
    <div class="control-right">${button('slow', state.settings.slow ? '慢速播放' : '标准语速', 'wave', `text-button ${state.settings.slow ? 'on' : ''}`, `aria-pressed="${state.settings.slow}"`)}${button('restart', '', 'refresh', 'icon-button small', 'aria-label="重新开始本轮" title="重新开始本轮"')}</div></div>`;
}

function audioNote(item) {
  if (item.type === 'word') return item.sounds.length > 1 && !hasAudio({ word: item.text }) ? '这个词一个字一个字读，跟着一起拼一拼。' : '听完再读一遍，把字和声音记在一起。';
  if (item.text === 'ong') return '例音 dōng：注意听后半段 ong（独立读音待补充）。';
  if (item.group === 'initial') return `借助 ${marked(item.sound)} 练习呼读音；拼读时声母要读得轻、短。`;
  if (item.sound.replace(/[1-5]/, '') !== item.text.replace('ü', 'v')) return `借助音节 ${marked(item.sound)} 听读音，注意字母与音节的写法不同。`;
  return '点一下喇叭，让小耳朵也认识它。';
}

function studyCard(value) {
  const item = currentItem();
  if (!item) return emptyCard(state.mode === 'favorites' ? '收藏夹还在等新朋友' : '这个范围里还没有内容', state.mode === 'favorites' ? '在学习卡片上点一下爱心，就能把它收藏在这里。' : '试着选择“全部拼音”吧。', 'heart');
  const favorite = state.favorites.includes(item.id);
  const known = state.known.includes(item.id);
  const isLast = value.index === value.ids.length - 1;
  return `<section class="study-card ${item.type === 'word' ? 'word-card' : ''}"><div class="card-topline"><span class="category-badge">${icon('flower')}${item.type === 'word' ? '常见字词' : groupName(item.group)}</span>${learningPosition(value.index, value.ids.length)}${button('favorite', '', 'heart', `favorite-button ${favorite ? 'favorited' : ''}`, `aria-label="${favorite ? '取消收藏' : '收藏当前拼音'}" aria-pressed="${favorite}"`)}</div>
    <div class="pinyin-stage"><span class="stage-spark spark-one">✦</span><span class="stage-spark spark-two">✧</span><div class="writing-lines"></div><button class="pinyin-display ${item.text.length > 4 ? 'long' : ''}" data-action="play-current" aria-label="听 ${escape(item.text)} 的读音">${escape(item.type === 'word' ? item.pinyin : item.text)}</button>${item.type === 'word' ? `<div class="word-under">${item.text}</div>` : ''}</div>
    <div class="sound-row">${button('play-current', '<span>听一听</span>', 'sound', 'sound-button primary-audio')}${button('continuous', state.settings.continuous ? '停止连播' : '连续听读', state.settings.continuous ? 'pause' : 'play', 'continuous-button', `aria-pressed="${state.settings.continuous}"`)}</div>
    <p class="audio-hint">${audioNote(item)}</p>
    <div class="memory-tip"><span class="tip-icon">${icon('sprout')}</span><div><span class="tip-label">${item.type === 'word' ? '读一读，记一记' : '小兔的记忆提示'}</span><p>${escape(item.tip || `${item.text}，读作 ${item.pinyin}。`)}</p></div>${item.type === 'basic' && item.group !== 'initial' && !['e', 'ü', 'ang', 'eng'].includes(item.text) ? `<span class="example-tag">${item.example}</span>` : ''}</div>
    <div class="mastery-actions">${button('practice-later', '还要练一练', 'refresh', 'soft-button')}${button('known', known ? '已经认识啦' : '我认识啦', 'check', `soft-button mint ${known ? 'is-known' : ''}`, `aria-pressed="${known}"`)}</div>
    <div class="card-navigation">${button('previous', '上一个', 'chevron', 'outline-button previous', value.index === 0 ? 'disabled' : '')}${button(isLast ? 'finish-study' : 'next', isLast ? '完成这一轮' : '下一个', 'chevron', 'solid-button next')}</div>
  </section>`;
}

function studyGrid(value) {
  if (!value.ids.length) return '';
  return `<section class="pinyin-map"><div class="section-title"><h2>${icon('grid')}这一站的拼音朋友</h2><span>点一个，跳转学习</span></div><div class="letter-grid">${value.ids.map((id, index) => { const item = allItems.find(entry => entry.id === id); return `<button data-action="jump" data-index="${index}" class="letter-tile ${index === value.index ? 'active' : ''} ${state.known.includes(id) ? 'learned' : ''}" aria-label="学习 ${escape(item.text)}" ${index === value.index ? 'aria-current="true"' : ''}>${escape(item.text)}${state.known.includes(id) ? '<span>✓</span>' : ''}</button>`; }).join('')}</div><div class="grid-legend"><span><i class="legend-current"></i>正在学</span><span><i class="legend-learned"></i>自评认识</span><span><i></i>等你认识</span></div></section>`;
}

function progressCard() {
  const topic = activeTopic();
  const progress = state.subject === 'english' ? phonics.gardenData()
    : topic ? { learned: state.topics[topic.id].known.length, total: topic.lessons.length, label: '项学习内容自评认识' }
    : state.features.chinese === 'hanzi-structure' ? { learned: state.hanzi.known.length, total: hanziLessons.length, label: '项汉字内容自评认识' }
    : { learned: state.known.filter(id => basics.some(item => item.id === id)).length, total: basics.length, label: '个拼音自评认识', seen: state.seen.filter(id => basics.some(item => item.id === id)).length };
  return `<section class="growth-card"><div class="growth-top">${icon('sprout')}我的成长花园<span>慢慢来，也很棒</span></div>${bunny()}<h3>${escape(state.nickname)}，又长大一点</h3><p>每一次认真尝试，都值得被看见。</p>${equippedRewards() ? `<div class="garden-display">${equippedRewards()}</div>` : ''}<div class="growth-stat"><strong>${progress.learned}<small> / ${progress.total}</small></strong><span>${progress.label}</span></div><div class="progress-track" role="progressbar" aria-label="${progress.label}" aria-valuenow="${progress.learned}" aria-valuemin="0" aria-valuemax="${progress.total}"><span style="width:${progress.learned / progress.total * 100}%"></span></div><div class="growth-bottom">${progress.seen !== undefined ? `<span>已浏览 ${progress.seen} 个</span>` : ''}${button('profile', '我的成长空间', 'chevron', 'text-button')}</div>${personalLinks('garden-links')}</section>`;
}

function mapCard() {
  const availableGroups = learningGroups(state.mode);
  const availableWords = availableWordScopes();
  if (!availableGroups.length && !availableWords.length) return '';
  const sections = [];
  const rows = entries => entries.map((entry, index) => `<button class="map-stop ${entry.active ? 'active' : ''}" data-action="${entry.action}" data-id="${entry.id}" ${entry.active ? 'aria-current="true"' : ''}><span class="stop-number ${entry.color}">${String(index + 1).padStart(2, '0')}</span><span class="stop-info"><b>${escape(entry.name)}</b><small>${escape(entry.short)}</small></span></button>`).join('');
  const section = (title, entries) => `<div class="map-section"><h3>${escape(title)}</h3><div class="map-stops">${rows(entries)}</div></div>`;
  if (availableGroups.length) {
    sections.push(section(state.mode === 'challenge' ? '听辨范围' : '学习范围', availableGroups.map(group => ({ ...group, action: 'map-group', active: state.group === group.id }))));
  }
  if (availableWords.length) {
    sections.push(section('字词范围', availableWords.map(scope => ({ ...scope, action: 'map-word-scope', active: state.wordScope === scope.id }))));
  }
  return `<section class="learning-map"><div class="section-title"><h2>${icon('flag')}学习小地图</h2><span>${currentMode().name}</span></div>${sections.join('')}</section>`;
}

function tonesCard() {
  const examples = toneExamples.map(group => `<section class="tone-example" aria-label="${group.syllable} 的四声示例"><h4>${group.items.map(item => item.text).join(' · ')}</h4><p class="muted">${group.tip}</p><div class="tone-grid">${group.items.map((item, index) => `<button class="tone-tile tone-${index}" data-action="sound" data-sound="${item.sound}" aria-label="${item.text} · ${item.character} · ${item.label}"><span class="tone-contour">${['→', '↗', '∨', '↘'][index]}</span><b>${item.text}</b><span class="tone-character">${item.character}</span><span>${item.label}</span>${icon('sound')}</button>`).join('')}</div></section>`).join('');
  return `<section class="quiz-card tones-card"><span class="category-badge">${icon('wave')}声音也会走楼梯</span><h3>跟着 mā má mǎ mà，听四声</h3><p class="muted">点一点，听四组示例。每组从一声读到四声，对比同一个音节的高低变化。</p>${examples}<div class="tone-note"><h4>轻声：轻轻地、短短地</h4><p>“妈妈”的第二个“妈”不标声调，读得轻而短。听一听下面词语里读轻声的第二个字。</p><div class="neutral-tone-examples">${neutralToneExamples.map(item => button('word-sound', `${item.pinyin} · ${item.text}`, 'sound', 'soft-button', `data-word="${item.text}"`)).join('')}</div></div><details class="lesson-details"><summary>再学一点：变调的小秘密</summary><p>两个三声音节连在一起时，前一个通常读成接近二声，例如“你好”。书面拼音仍标作 nǐ hǎo。</p><p>“一”单读时读 yī，在四声前通常读 yí（如“一定”），在一、二、三声前通常读 yì（如“一天”）。</p><p>“不”单读时读 bù，在四声前通常读 bú（如“不是”）。变调是实际读音的变化，要放进词语和句子里学习。</p></details>${button('mode', '去练标调与拼写', 'pen', 'solid-button', 'data-id="rules"')}</section>`;
}

function quizCard(round) {
  if (!round.questions.length) return emptyCard(state.mode === 'mistakes' ? '这里还没有错题，真棒！' : '这个范围暂时没有题目', state.mode === 'mistakes' ? '练习中需要再试一次的题，会来到这里。' : '换个范围，继续探索吧。', 'sprout');
  if (round.finished) return resultCard(round);
  const question = round.questions[round.index];
  const wrong = round.selected !== null && round.selected !== question.answer;
  const answered = round.revealed;
  return `<section class="quiz-card"><div class="quiz-top"><span class="category-badge">${icon('flag')}一点点小挑战</span>${learningPosition(round.index, round.questions.length, { practice: true })}</div><div class="quiz-progress">${round.questions.map((item, index) => `<i class="${round.responses[index]?.correct ? 'correct' : round.responses[index] ? 'miss' : ''} ${index === round.index ? 'current' : ''}"></i>`).join('')}</div>${round.available < state.length ? `<p class="small-note">这个范围共有 ${round.available} 题，这轮全部练一遍。</p>` : ''}<h3 class="question-prompt">${escape(question.prompt)}</h3>
    ${question.display ? `<div class="question-display ${question.kind === 'hanzi' ? 'hanzi' : ''}">${escape(question.display)}</div>` : ''}
    ${question.kind === 'listen' ? button('play-question', '再听一遍', 'sound', 'sound-button question-audio primary-audio') : ''}
    ${question.kind === 'blend' ? `<div class="blend-controls">${button('play-parts', '听分解', 'sound', 'soft-button')}${answered ? button('play-question', '听完整拼读', 'sound', 'soft-button') : ''}</div>` : ''}
    <div class="answer-grid ${question.kind === 'audio' ? 'audio-answers' : ''}" role="group" aria-label="答案选项">${question.options.map((option, index) => {
      const text = typeof option === 'string' ? option : option.value;
      const status = answered && text === question.answer ? 'correct-answer' : round.selected === text && wrong ? 'wrong-answer' : '';
      return typeof option === 'string' ? `<button class="answer-option${learningTokenClass(text)} ${status}" data-action="answer" data-value="${escape(text)}" ${answered ? 'disabled' : ''}><span class="option-letter">${'ABCD'[index]}</span><span>${escape(text)}</span>${status === 'correct-answer' ? icon('check') : ''}</button>` : `<div class="audio-option ${status}">${button('sound', `试听 ${'ABCD'[index]}`, 'sound', 'audio-choice-play', `data-sound="${escape(option.sound)}"`)}${button('answer', `选 ${'ABCD'[index]}`, '', 'audio-choice-pick', `data-value="${escape(text)}" ${answered ? 'disabled' : ''}`)}</div>`;
    }).join('')}</div>
    <div class="answer-feedback ${answered ? round.selected === null ? 'warning' : 'success' : wrong ? 'retry warning' : ''}" role="status">${answered ? `${icon(round.selected === null ? 'leaf' : 'check')}<div><strong>${round.selected === null ? '先认识答案，下次再试试' : '答对啦，你做得很棒！'}</strong><p>${escape(question.explanation)}</p></div>` : wrong ? `${icon('refresh')}<div><strong>差一点点，再试一次吧！</strong><p>可以再听一听，或者点“看看答案”。首次作答已经记下啦。</p></div>` : `${icon('leaf')}<span>想一想，再选出你的答案。</span>`}</div>
    ${answered && question.audio?.word && !hasAudio({ word: question.audio.word }) && question.audio.sounds?.length > 1 ? '<p class="small-note">这个词一个字一个字读，跟着一起拼一拼。</p>' : ''}
    <div class="quiz-actions">${button('favorite-question', state.favorites.includes(question.itemId) ? '已收藏' : '收藏知识点', 'heart', 'text-button', question.itemId ? '' : 'hidden')}${answered ? button('play-question', '听正确读音', 'sound', 'text-button') : button('skip', wrong ? '看看答案' : '先跳过', '', 'text-button')}${button('next-question', nextUnfinishedQuestion(round) < 0 ? '看看本轮收获' : '下一题', 'chevron', 'solid-button next', answered ? '' : 'disabled')}</div>
  </section>`;
}

function resultCard(round) {
  const stats = roundStats(round);
  return `<section class="quiz-card result-card"><div class="result-star">${icon('star')}</div><span class="eyebrow">又完成了一次小小的冒险</span><h3>认真练习的你，真棒！</h3><p>休息一下，或者带着新收获继续出发。</p><div class="result-stats"><div><b>${stats.total}</b><span>本轮题目</span></div><div><b>${stats.correct}</b><span>首次答对</span></div><div><b>${stats.skipped}</b><span>跳过题目</span></div></div><div class="review-summary">${stats.correct === stats.total ? '这一轮全部首次答对，给自己一个大大的赞！' : `还有 ${stats.total - stats.correct} 道题值得再练一次，已经放进错题本。`}</div><div class="result-actions">${button('restart-now', '再来一轮', 'refresh', 'solid-button')}${button('mode', '拼音错题本', 'notebook', 'outline-button', `data-id="mistakes" ${state.mistakes.length ? '' : 'disabled'}`)}</div></section>`;
}

function matchCard(value) {
  if (value.matched.length === value.pairs.length) return `<section class="quiz-card result-card"><div class="result-star">${icon('link')}</div><h3>拼音朋友都找到伙伴啦！</h3><p>完成了 ${value.pairs.length} 组配对，共尝试 ${value.attempts} 次。</p>${button('restart-now', '再配一组', 'refresh', 'solid-button')}</section>`;
  return `<section class="quiz-card match-card"><div class="quiz-top"><span class="category-badge">${icon('link')}牵起拼音的小手</span><span>${value.matched.length} / ${value.pairs.length} 对</span></div><h3>先点汉字，再点它的拼音</h3><p class="muted">不用拖动，轻轻点两下就能配对。</p><div class="match-columns"><div>${value.pairs.map(id => { const item = allItems.find(entry => entry.id === id); return button('match-left', item.text, value.matched.includes(id) ? 'check' : '', `match-tile ${value.left === id ? 'selected' : ''} ${value.matched.includes(id) ? 'matched' : ''}`, `data-id="${id}" ${value.matched.includes(id) ? 'disabled' : ''}`); }).join('')}</div><div>${value.right.map(id => { const item = allItems.find(entry => entry.id === id); return button('match-right', item.pinyin, value.matched.includes(id) ? 'check' : '', `match-tile pinyin ${value.matched.includes(id) ? 'matched' : ''}`, `data-id="${id}" ${value.matched.includes(id) ? 'disabled' : ''}`); }).join('')}</div></div><div class="gentle-note">${icon('leaf')}${value.left ? '选好了汉字，现在找找右边的拼音。' : '从左边选一个你认识的字词吧。'}</div></section>`;
}

function emptyCard(title, description, symbol) {
  return `<section class="quiz-card empty-card"><span class="empty-symbol">${icon(symbol)}</span><h3>${title}</h3><p>${description}</p>${button('mode', '去认识拼音朋友', 'book', 'solid-button', 'data-id="sequence"')}</section>`;
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
  restoreDialogFocus();
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
    ${settingsToggle('slow', '慢速读音', '放慢一点听，保持声音的音高')}
    ${settingsToggle('effects', '答对时的小音效', '关闭后仍可点读拼音')}
    ${settingsToggle('animations', '奖励庆祝动效', '关闭后仍显示奖励文字，也支持系统减少动态效果')}
  </section>
  <section class="settings-group" aria-labelledby="backup-heading"><h3 id="backup-heading">数据备份</h3>
    <p>备份包含全部配置、昵称、各科学习记录、错题、收藏、草稿和奖励。文件仅在本机处理，不会上传。</p>
    ${settingsAction('export-backup', '导出全部数据')}
    ${settingsAction('choose-backup', '导入备份文件')}
    <input id="backup-file" type="file" accept=".json,application/json" hidden><p id="backup-error" class="storage-warning" role="alert"></p>
    <p>导入会替换当前数据，不会合并。建议先导出一份；旧备份缺少的新设置会使用默认值。</p>
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
    link.download = `小兔学习乐园-完整备份-${date.toISOString().replace(/[:.]/g, '-')}.json`;
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
    openDialog('导入并替换本机数据？', `<p class="dialog-intro">将导入语文、数学、英语的全部学习记录、配置、昵称和奖励，并替换当前数据，不会合并。建议先取消并导出当前数据，保留恢复机会。</p><p>备份昵称：<b>${escape(backup.data.nickname)}</b></p><div class="dialog-actions">${button('settings', '取消，返回设置', '', 'outline-button')}${button('confirm-import', '确认导入并替换', '', 'danger-button')}</div><p id="backup-error" class="storage-warning" role="alert"></p>`);
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
  openDialog('我的成长空间', `<div class="profile-heading"><img src="/bunny.svg" alt="" width="76" height="76"><div><h3>${escape(state.nickname)}</h3><p>${badge ? badge.name : '每一天，都可以有新的发现'}</p>${button('edit-nickname', '修改昵称', 'pen', 'text-button')}</div></div><div class="profile-totals"><div><b>${stats.stars}</b><span>成长星星</span></div><div><b>${Object.keys(state.rewards.unlocks).length}</b><span>已解锁奖励</span></div><div><b>${stats.days}</b><span>累计练习天数</span></div></div><div class="profile-display">${equippedRewards() || '<p>解锁奖励后，可以在这里展示喜欢的贴纸、徽章和摆件。</p>'}</div>${personalLinks()}${button('reward-rules', '星星从哪里来？查看规则与明细', 'info', 'reward-rules-link')}<p class="personal-footnote">按自己的节奏长大，不比较、不扣星；休息几天也不会失去收获。</p>`, 'profile-dialog');
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
    return `<article class="reward-card ${unlocked ? 'unlocked' : 'locked'} ${equipped ? 'equipped' : ''}" data-reward="${reward.id}">${unlocked ? rewardStamp() : ''}<span class="reward-kind">${names[reward.type]}${equipped ? ' · 展示中' : ''}</span>${button('reward-detail', rewardArt(reward.art, '', reward.icon), '', 'reward-preview-trigger', `data-id="${reward.id}" aria-label="放大查看${reward.name}"`)}<h3><span>${reward.name}</span>${reward.help ? rewardHelpButton(reward.help, reward.id) : ''}</h3><p>${reward.rule}</p>${unlocked ? `<span class="unlock-date">${new Date(state.rewards.unlocks[reward.id]).toLocaleDateString('zh-CN')} 获得${state.rewards.unlockDetails[reward.id]?.retroactive ? ' · 历史补发' : ''}</span><div class="reward-card-actions">${button('equip-reward', equipped ? '取消展示' : reward.type === 'badge' ? '佩戴徽章' : reward.type === 'medal' ? '展示奖牌' : reward.type === 'decoration' ? '摆进花园' : '展示贴纸', equipped ? 'check' : '', 'reward-equip', `data-id="${reward.id}" aria-pressed="${equipped}"`)}</div>` : `<span class="reward-progress-text">${Math.min(condition.value, condition.target)} / ${condition.target}</span><progress value="${Math.min(condition.value, condition.target)}" max="${condition.target}" aria-label="${reward.name}解锁进度"></progress>`}</article>`;
  }).join('')}</div><p class="personal-footnote">已获得的奖励一直属于你。星星只累计，不消费；更换展示不花星星。</p>`, 'collection-dialog');
}

function showRewardDetail(id) {
  const reward = rewardCatalog.find(item => item.id === id);
  if (!reward) return;
  if (!dialog.open || !dialog.classList.contains('reward-help-dialog')) {
    const origin = dialog.open && dialog.classList.contains('collection-dialog') ? 'collection' : dialog.open && dialog.classList.contains('profile-dialog') ? 'profile' : 'page';
    rewardDetailReturn = { origin, scroll: dialog.scrollTop, id };
  }
  const unlocked = Boolean(state.rewards.unlocks[id]);
  const condition = rewardProgress(state.rewards, reward, curriculumProgress(state.rewards), rewardStats(state.rewards));
  openDialog(`<span id="reward-detail-name">${reward.name}</span>${reward.help ? rewardHelpButton(reward.help, reward.id) : ''}`, `<div class="reward-detail">${rewardViewer(reward)}<span class="reward-preview-status ${unlocked ? 'obtained' : ''}">${unlocked ? `已获得 · ${new Date(state.rewards.unlocks[id]).toLocaleDateString('zh-CN')}` : '尚未获得 · 可以先看看它的样子'}</span><h3>${reward.description}</h3><p>${reward.rule}</p>${unlocked ? '' : `<span class="reward-detail-progress">当前进度 ${Math.min(condition.value, condition.target)} / ${condition.target}</span>`}${unlocked ? `<div class="dialog-actions">${button('replay-reward', '再庆祝一下', 'star', 'outline-button', `data-id="${id}"`)}</div>` : ''}</div>`, 'reward-detail-dialog');
  dialog.setAttribute('aria-labelledby', 'reward-detail-name');
  disposeRewardViewer = mountRewardViewer(dialog, { animations: state.settings.animations });
  dialog.scrollTop = 0;
  dialog.querySelector('.reward-viewer-stage').focus({ preventScroll: true });
}

function returnFromRewardDetail() {
  const previous = rewardDetailReturn;
  rewardDetailReturn = null;
  if (previous?.origin === 'page') { closeDialog(false); return; }
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

function showRecords() {
  const history = state.history.slice(-6).reverse();
  openDialog('每一步，都算数', `<h3>拼音学习</h3><div class="records-grid"><div><b>${state.seen.length}</b><span>浏览过的项目</span></div><div><b>${state.known.length}</b><span>自评认识</span></div><div><b>${state.mistakes.length}</b><span>待复习错题</span></div><div><b>${state.favorites.length}</b><span>收藏的朋友</span></div></div><h3>汉字笔画与结构</h3><p>自评认识 ${state.hanzi.known.length} 个学习项目，待复习错题 ${state.hanzi.mistakes.length} 道。</p><p class="small-note">浏览过、自评认识和测验答对，是三种不同的学习记录。</p><h3>最近完成的练习</h3>${history.length ? `<ul class="history-list">${history.map(item => `<li><span>${escape(item.name)}<small>${new Date(item.time).toLocaleDateString('zh-CN')}</small></span><b>${item.correct} / ${item.total}<small>首次答对</small></b></li>`).join('')}</ul>` : '<p class="muted">完成一轮答题后，这里就会留下你的足迹。</p>'}<div class="dialog-actions">${personalButtons('menu')}</div>`);
}

function showTopicRecords() {
  const current = activeTopic();
  const topics = current ? [current] : state.subject === 'math' ? mathTopics : chineseTopics;
  openDialog(`${state.subject === 'math' ? '数学' : '语文'}主题学习记录`, `<p>自评认识与首次答对分别统计；各主题错题互不混用。</p>${topics.map(topic => `<section class="ct-record"><h3>${topic.name}</h3><p>自评认识 ${state.topics[topic.id].known.length} / ${topic.lessons.length} 项 · 待复习错题 ${state.topics[topic.id].mistakes.length} 道</p>${button('topic-review', `${topic.name}错题本`, 'notebook', 'outline-button', `data-id="${topic.id}" ${state.topics[topic.id].mistakes.length ? '' : 'disabled'}`)}</section>`).join('')}${button('records', '查看最近完成的练习', 'book', 'text-button')}`);
}

function showAbout() {
  openDialog('关于小兔学习乐园', `<p class="dialog-intro">专为小学生准备的一方学习小天地。没有广告，不需要注册，按照自己的节奏慢慢学。</p><h3>关于拼音和读音</h3><p>内容包含 23 个声母、24 个韵母和 16 个整体认读音节，采用小学常见分类。</p><p>真人录音来自 audio-cmn：音节由 Chen Wang 录制，词语由 Yue Tan 录制，Hugo Lopez 与 Nicolas Vion 参与整理和技术支持，采用上游声明的 CC BY-SA 许可。</p><p>部分韵母借助完整音节示范，ong 使用 dōng 的例音，学习卡片上会明确提示。录音尚待普通话教师逐项试听审核。</p><p><a href="/audio/ATTRIBUTION.md" target="_blank" rel="noopener">查看音频来源与署名说明</a></p><h3>使用小提醒</h3><p>首次听音需要点击喇叭。跟着录音自己读一读即可，本应用不会录音，也不会自动评价你的发音。</p><p>页面风格参考 Bunny Math，插画与练习界面为本项目绘制。</p>`);
}

function changeMode(id) {
  if (!modes.some(mode => mode.id === id)) return;
  if (id === 'mistakes' && !state.mistakes.length) return;
  halt();
  state.modeGroups ||= {};
  state.modeGroups[state.mode] = state.group;
  state.mode = id;
  state.subject = 'chinese';
  state.features.chinese = 'pinyin';
  state.group = state.modeGroups[id] || 'all';
  state.settings.continuous = false;
  if (id === 'mistakes' && state.sessions[key()]?.finished) delete state.sessions[key()];
  closeDialog();
  render();
}

function requestFor(item) {
  return item.type === 'word' ? { word: item.text, sounds: item.sounds } : { sound: item.sound };
}

async function playCurrent(continuous = false) {
  const item = currentItem();
  if (!item) return;
  const token = ++continuousToken;
  const success = await playAudio(requestFor(item), state.settings.slow);
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
  if (value.index === value.ids.length - 1) { finishStudy(); return; }
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
  if (action === 'ct-draft') return;
  if (['ct-poem-play', 'ct-poem-slow', 'ct-poem-stop'].includes(action)) {
    const topic = activeTopic();
    const topicState = topic && state.topics[topic.id];
    const lesson = topic?.lessons.find(item => item.id === topicState.lessonId);
    halt();
    if (topicState?.view === 'learn' && lesson?.poem && action !== 'ct-poem-stop') {
      void poetryAudio.play(lesson.poem.audioId, action === 'ct-poem-slow');
    }
    return;
  }
  if (action.startsWith('ct-')) {
    const topic = activeTopic();
    if (!topic) return;
    halt();
    const result = handleTopicAction(state, topic, action, target.dataset);
    render(); if (result.correct) chime(state.settings.effects); celebrateReward(result.reward); return;
  }
  if (['topic-records', 'math-records'].includes(action)) { showTopicRecords(); return; }
  if (action === 'topic-review') {
    const topic = topicById(target.dataset.id);
    if (!topic) return;
    halt(); state.settings.continuous = false; state.subject = topic.subject || 'chinese'; state.features[state.subject] = topic.id;
    if (!startTopicRound(topic, state.topics[topic.id], 'review')) { state.topics[topic.id].view = 'learn'; toast('这个主题还没有错题，可以先自由学习。'); }
    closeDialog(); render(); return;
  }
  if (action.startsWith('hz-')) {
    if (state.subject !== 'chinese' || state.features.chinese !== 'hanzi-structure') return;
    halt();
    const result = handleHanziAction(state, action, target.dataset);
    render();
    if (result.correct) chime(state.settings.effects);
    celebrateReward(result.reward);
    return;
  }
  if (action.startsWith('ph-') && state.subject === 'english') { if (dialog.open) closeDialog(); phonics.handle(target); return; }
  if (action === 'close-dialog') { dismissDialog(); return; }
  if (action === 'settings' || action === 'menu-settings') { showSettings(); return; }
  if (action === 'export-backup') { exportBackup(); return; }
  if (action === 'choose-backup') { dialog.querySelector('#backup-file')?.click(); return; }
  if (action === 'confirm-import') { importBackup(); return; }
  if (action === 'about') { showAbout(); return; }
  if (action === 'records') { if (state.subject === 'english') { closeDialog(); phonics.handle({ dataset: { action: 'ph-mode', id: 'records' } }); } else showRecords(); return; }
  if (action === 'profile') { showProfile(); return; }
  if (action === 'edit-nickname') { showNickname(); return; }
  if (action === 'nickname-back') { returnFromNickname(); return; }
  if (action === 'reward-rules') { showRewardRules(); return; }
  if (action === 'reward-collection') { showRewardCollection(); return; }
  if (action === 'reward-filter') { if (['all', 'sticker', 'badge', 'medal', 'decoration'].includes(target.dataset.id)) rewardFilter = target.dataset.id; showRewardCollection(); return; }
  if (action === 'reward-help') { showRewardHelp(target.dataset.id, target.dataset.rewardId); return; }
  if (action === 'reward-help-back') { returnFromRewardHelp(); return; }
  if (action === 'reward-help-previous') { returnToPreviousRewardHelp(); return; }
  if (action === 'section-assessment') {
    const section = rewardSections.get(target.dataset.id);
    if (!section) return;
    halt();
    if (section.subject === 'english') phonics.assess();
    else if (section.topicId === 'hanzi-structure') { startHanziRound(state.hanzi, state.hanzi.category, 5); render(); }
    else { const topic = topicById(section.topicId); startTopicRound(topic, state.topics[topic.id], state.topics[topic.id].category, 5); render(); }
    return;
  }
  if (action === 'reward-detail') { showRewardDetail(target.dataset.id); return; }
  if (action === 'equipped-reward-preview') { if (state.rewards.unlocks[target.dataset.id]) showRewardDetail(target.dataset.id); return; }
  if (action === 'equip-reward') { if (equipReward(state.rewards, target.dataset.id)) { render(); const scroll = dialog.scrollTop; showRewardCollection(); dialog.scrollTop = scroll; } return; }
  if (action === 'replay-reward') { const reward = rewardCatalog.find(item => item.id === target.dataset.id && state.rewards.unlocks[item.id]); if (reward) celebrateReward({ stars: 0, unlocked: [reward.id], reasons: [], replay: true }); return; }
  if (action === 'dismiss-reward') { celebrations.dismiss(); return; }
  if (action === 'mode') { changeMode(target.dataset.id); return; }
  if (action === 'hanzi-review') {
    halt(); state.settings.continuous = false;
    state.subject = 'chinese'; state.features.chinese = 'hanzi-structure';
    if (state.hanzi.mistakes.length) handleHanziAction(state, 'hz-start', { id: 'review' });
    else { state.hanzi.view = 'learn'; toast('还没有汉字错题，可以先认识几个汉字朋友。'); }
    closeDialog(); render(); return;
  }
  if (action === 'toggle-tones') { halt(); state.tonePractice = !state.tonePractice; render(); return; }
  if (action === 'shuffle-favorites') { halt(); const value = session(); value.ids = shuffle(value.ids); value.index = 0; render(); toast('顺序打乱啦，来看看还认识谁。'); return; }
  if (action === 'subject') {
    if (!subjects.some(subject => subject.id === target.dataset.id)) return;
    halt(); state.subject = target.dataset.id; mobileMenu = false; state.settings.continuous = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return;
  }
  if (action === 'collapse') {
    if (window.matchMedia('(max-width: 760px)').matches) mobileMenu = false;
    else state.collapsed = !state.collapsed;
    render(); return;
  }
  if (action === 'mobile-menu') { mobileMenu = !mobileMenu; render(); return; }
  if (action === 'feature') { state.features[state.subject] = target.dataset.id; halt(); state.settings.continuous = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
  if (action === 'map-group') { if (learningGroups(state.mode).some(group => group.id === target.dataset.id)) changeScope('group', target.dataset.id); return; }
  if (action === 'map-word-scope') { if (availableWordScopes().some(scope => scope.id === target.dataset.id)) changeScope('wordScope', target.dataset.id); return; }
  if (action === 'next-section') {
    const nextGroup = nextStudyGroup(state.mode, state.group);
    if (!nextGroup) return;
    halt(); state.group = nextGroup.id; state.settings.continuous = false;
    delete state.sessions[key()];
    closeDialog(); render(); return;
  }
  if (action === 'slow') { halt(); state.settings.slow = !state.settings.slow; state.settings.continuous = false; render(); return; }
  if (action === 'restart') { openDialog('重新开始这一轮？', `<p>当前这一轮的进度会重置，收藏、错题和以前的学习记录都会保留。</p><div class="dialog-actions">${button('close-dialog', '继续当前练习', '', 'outline-button')}${button('restart-now', '重新开始', 'refresh', 'solid-button')}</div>`); return; }
  if (action === 'restart-now') { restart(); return; }
  if (action === 'reset-confirm') { showResetConfirmation(); return; }
  if (action === 'reset-all') { halt(); celebrations.reset(); state = defaultState(); phonics.reset(state.phonics); state.features.english = 'phonics'; initializeRewards(state); closeDialog(); render(); toast('记录已清空，可以重新出发啦。'); return; }
  if (action === 'sound') { continuousToken++; playAudio({ sound: target.dataset.sound }, state.settings.slow); return; }
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
    if (action === 'match-left') { value.left = target.dataset.id; render(); return; }
    if (action === 'match-right') {
      if (!value.left) { toast('先点左边的汉字，再选拼音哦。'); return; }
      value.attempts++;
      let reward = null;
      if (value.left === target.dataset.id) {
        const item = allItems.find(entry => entry.id === value.left);
        reward = grantRewards(state, { type: 'answer', question: { id: `match:${item.id}`, display: item.text } });
        value.matched.push(value.left); chime(state.settings.effects);
      }
      else {
        if (!value.wrong.includes(value.left)) value.wrong.push(value.left);
        const item = allItems.find(entry => entry.id === value.left);
        const options = value.right.map(id => allItems.find(entry => entry.id === id).pinyin);
        addMistake({ id: `match:${item.id}`, kind: 'hanzi', prompt: '给这个字词找到正确的拼音', display: item.text, answer: item.pinyin, options, explanation: `${item.text}，读作 ${item.pinyin}。`, itemId: item.id, audio: requestFor(item) });
        toast('这两个还不是一对，再找找看。');
      }
      value.left = null;
      if (value.matched.length === value.pairs.length && !value.finished) {
        value.finished = true;
        state.history.push({ time: Date.now(), name: '拼音配对', total: value.pairs.length, correct: value.pairs.length - value.wrong.length });
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
    if (action === 'play-question') { continuousToken++; playAudio(question.audio, state.settings.slow); return; }
    if (action === 'play-parts') {
      const items = question.parts.map(part => basics.find(item => item.text === part));
      if (items.every(Boolean)) playAudio({ sounds: items.map(item => item.sound) }, state.settings.slow);
      else {
        const finalParts = { ua: ['u', 'a'], uo: ['u', 'o'], iong: ['i', 'ong'] };
        const parts = [question.parts[0], ...(finalParts[question.parts[1]] || [question.parts[1]])];
        const sounds = parts.map(part => basics.find(item => item.text === part)?.sound);
        if (parts.includes('ong')) { toast('这个组合先试着自己拼，答完可以听完整音节。'); return; }
        playAudio({ sounds }, state.settings.slow);
      }
      return;
    }
    if (action === 'favorite-question') { if (question.itemId && !state.favorites.includes(question.itemId)) state.favorites.push(question.itemId); render(); return; }
    if (action === 'next-question' && round.revealed) {
      halt();
      const nextIndex = nextUnfinishedQuestion(round);
      let reward = null;
      if (nextIndex < 0) {
        round.finished = true;
        const stats = roundStats(round);
        state.history.push({ time: Date.now(), name: currentMode().name, total: stats.total, correct: stats.correct });
        state.history = state.history.slice(-100);
        reward = grantRewards(state, { type: 'round', mode: state.mode === 'tones' ? 'tones' : state.mode, name: currentMode().name, total: stats.total, answered: round.responses.filter(response => response && !response.skipped).length });
      } else visitQuestion(round, nextIndex);
      render(); celebrateReward(reward); return;
    }
  }
}

document.addEventListener('click', event => {
  if (!event.target.closest('.my-menu')) app.querySelector('.my-menu')?.removeAttribute('open');
  else if (event.target.closest('[data-action]')) app.querySelector('.my-menu')?.removeAttribute('open');
  if (!navigation.click(event)) handleAction(event);
});

document.addEventListener('input', event => {
  if (navigation.input(event)) return;
  if (event.target.dataset.action !== 'ct-draft') return;
  const topic = state.subject === 'chinese' ? topicById(state.features.chinese) : null;
  if (!topic) return;
  updateTopicActivity(topic, state.topics[topic.id], 'draft', event.target.value);
  persist();
});

document.addEventListener('change', event => {
  if (event.target.id === 'backup-file') { void readBackupFile(event.target); return; }
  if (state.subject === 'english' && phonics.change(event.target)) return;
  const field = event.target.dataset.setting;
  if (!field) return;
  halt();
  state.settings.continuous = false;
  if (['slow', 'effects', 'animations'].includes(field)) state.settings[field] = event.target.checked;
  else if (field === 'length') state.length = Number(event.target.value);
  else if (['group', 'wordScope', 'confusion'].includes(field)) state[field] = event.target.value;
  render();
});

document.addEventListener('submit', event => {
  if (event.target.id === 'ph-spelling-form' && state.subject === 'english') { phonics.submitForm(event); return; }
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

document.addEventListener('input', event => { if (state.subject === 'english') phonics.input(event.target); });

document.addEventListener('keydown', event => {
  if (navigation.keydown(event)) return;
  if (event.key === 'Escape' && app.querySelector('.my-menu[open]')) { app.querySelector('.my-menu').removeAttribute('open'); app.querySelector('.my-menu-toggle').focus(); return; }
  if (event.key === 'Escape' && mobileMenu && !dialog.open) { mobileMenu = false; render(); }
  const tab = event.target.closest('[role="tab"]');
  if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const tabs = [...app.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(tab);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
    return;
  }
  if (dialog.open || event.target.closest('input, select, textarea, button, a, summary')) return;
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
