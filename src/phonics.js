import './phonics.css';
import { alphabet, phonicsModules, phonicsLessons, phonicsWords, phonicsStories, phonicsModes, phonicsWordById, phonicsLessonById } from './phonics-data.js';
import { shufflePhonics, questionPool, createPhonicsRound, answerPhonics, advancePhonicsRound, phonicsStats, phonicsQuestionById, editPhonicsDraft } from './phonics-engine.js';
import { createPhonicsAudio } from './phonics-audio.js';
import { icon } from './icons.js';
import { favoriteButton, learningAnswerLabel, learningBook, learningPosition, learningTokenClass, roundSettings, reviewShortcut, focusLearningActivity, sectionPracticeButton } from './learning-ui.js';
import { phonicsPracticeLesson } from './learning-data.js';
import { renderCoursePicker } from './navigation.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const control = (action, label, attributes = '', style = 'ph-button') => `<button type="button" data-action="ph-${action}" class="${style}" ${attributes}>${label}</button>`;
const quizModes = ['mixed', 'meaning', 'spelling', 'listen', 'review', 'alphabet', 'diagnostic'];
const fixedPractice = ['mixed', 'meaning', 'spelling', 'listen'];
const lessonModes = ['learn', 'random', 'reading'];

export function createPhonicsView({ state, persist, redraw, redrawPreview = () => {}, notify, haltOtherAudio, renderGarden, renderNavigation, cardFavorite, slowPlayback, rewardAction = () => {} }) {
  let draft = '';
  let playedQuestion = null;
  let confirmRestart = false;
  let storyResponse = null;
  let currentStoryHint = false;
  let mapExpanded = false;
  let audioReady = false;
  const audio = createPhonicsAudio((status, message) => {
    document.querySelectorAll('[data-action="ph-play"]').forEach(element => {
      element.classList.toggle('playing', status === 'playing');
      element.setAttribute('aria-busy', String(status === 'loading'));
    });
    if (status === 'error') notify(message);
  });
  audio.ready.then(() => {
    audioReady = true;
    if (document.querySelector('#app .phonics-page')) redraw();
    redrawPreview();
  });

  function sessionKey(length = state.length) {
    const lessonId = state.scope === 'all' && fixedPractice.includes(state.mode) ? phonicsLessons[0].id : state.lessonId;
    return `${state.mode}:${state.scope}:${lessonId}:${length}`;
  }
  function lesson() { return phonicsLessonById.get(state.lessonId); }
  function learningSession() {
    const key = `${state.mode}:${state.scope}:${state.lessonId}`;
    const pool = state.mode === 'favorites' ? phonicsWords.filter(word => state.favorites.includes(word.id)) : state.scope === 'all' && state.mode !== 'learn' ? phonicsWords : lesson().words;
    const ids = new Set(pool.map(word => word.id));
    let position = state.positions[key];
    if (!position) position = { ids: (state.mode === 'random' ? shufflePhonics(pool) : pool).map(word => word.id), index: 0, finished: false };
    position.ids = position.ids.filter(id => ids.has(id));
    for (const word of pool) if (!position.ids.includes(word.id)) position.ids.push(word.id);
    position.index = Math.min(Math.max(0, position.index), Math.max(0, position.ids.length - 1));
    state.positions[key] = position;
    return position;
  }

  function round() {
    const key = sessionKey();
    let value = state.sessions[key];
    if (!value && state.scope === 'all' && fixedPractice.includes(state.mode)) {
      value = state.sessions[`${state.mode}:all:${state.lessonId}:${state.length}`];
    }
    if (!value?.ids.length) value = newRound();
    if (audioReady && value.ids.some(id => { const question = phonicsQuestionById.get(id); return question.kind === 'listen' && !audio.available(question.wordId); })) {
      value = createPhonicsRound(questionPool(state, audio.available), state.length);
    }
    state.sessions[key] = value;
    return value;
  }

  function newRound() {
    const pool = questionPool(state, audio.available);
    if (state.mode !== 'mixed' || state.scope !== 'lesson') {
      const length = state.mode === 'diagnostic' ? 10 : state.length;
      return createPhonicsRound(pool, length);
    }
    const seen = new Set(Object.keys(state.reviews));
    const rule = pool.find(question => question.kind === 'rule' && !seen.has(question.id));
    const ordered = shufflePhonics(pool.filter(question => question !== rule))
      .sort((first, second) => Number(seen.has(first.id)) - Number(seen.has(second.id)));
    const selected = rule ? [rule, ...ordered.slice(0, state.length - 1)] : ordered.slice(0, state.length);
    return createPhonicsRound(selected, state.length);
  }

  function previousLength() {
    return [5, 10, 20].find(length => {
      const saved = state.sessions[sessionKey(length)];
      return length !== state.length && saved && !saved.finished && Object.keys(saved.responses).length;
    });
  }

  function empty(title, text) {
    return `<section class="ph-card ph-empty"><span class="ph-empty-symbol">✿</span><h2 data-activity-heading tabindex="-1">${title}</h2><p>${text}</p>${control('mode', '回到课程学习', 'data-id="learn"', 'ph-button primary')}</section>`;
  }

  function playButton(id, label = '听一听') {
    return audio.available(id)
      ? control('play', `${icon('sound')}${label}`, `data-id="${escape(id)}"`, 'ph-button audio')
      : `<span class="ph-pending">${icon('headphones')}暂时无法播放</span>`;
  }

  function reviewButton() {
    return control('mode', `${icon('notebook')}错题本`, `data-id="review" ${state.mistakes.length ? '' : 'disabled'}`);
  }

  function gardenData() {
    return { learned: state.known.length, total: phonicsWords.length, label: '个单词自评会读', seen: state.seen.length };
  }

  function courseModules(active, showDescriptions = false) {
    const reading = state.mode === 'reading';
    return phonicsModules.map(module => {
      const entries = phonicsLessons.filter(entry => entry.moduleId === module.id && (!reading || phonicsStories.some(story => story.lessonId === entry.id)));
      if (!entries.length) return '';
      const lessons = entries.map(entry => {
        const selected = active && entry.id === state.lessonId;
        const story = reading && phonicsStories.find(item => item.lessonId === entry.id);
        const title = story ? story.title : entry.title;
        return control('lesson', `<span>${String(entry.number).padStart(2, '0')}</span><b>${escape(title)}${story ? `<small>${escape(entry.title)}</small>` : ''}</b>`, `data-id="${entry.id}" ${selected ? 'aria-current="step"' : ''}`, `ph-lesson ${selected ? 'selected' : ''}`);
      }).join('');
      return `<details ${module.id === lesson().moduleId ? 'open' : ''}><summary>${escape(module.name)}<small>${entries.length} 节</small></summary>${showDescriptions ? `<p>${escape(module.description)}</p>` : ''}${lessons}</details>`;
    }).join('');
  }

  function coursePicker(active) {
    const directory = state.mode === 'reading' ? '故事目录' : '课程目录';
    return renderCoursePicker({
      name: active ? `第 ${lesson().number} 课 · ${lesson().title}` : directory,
      active,
      panelLabel: directory,
      content: `<div class="ph-course-list">${courseModules(active)}</div>`,
    });
  }

  function courseMap() {
    return `<section class="ph-learning-map ${mapExpanded ? 'is-open' : ''}" aria-label="自然拼读学习小地图">
      <h2>${icon('flag')}学习小地图</h2>
      ${control('toggle-map', `${icon('flag')}学习小地图${icon('down')}`, `aria-expanded="${mapExpanded}" aria-controls="ph-course-map"`, 'outline-button ph-map-toggle')}
      <div id="ph-course-map" class="ph-course-list">${courseModules(true, true)}</div>
    </section>`;
  }

  function learningCard() {
    const position = learningSession();
    const word = phonicsWordById.get(position.ids[position.index]);
    if (!word) return empty('还没有收藏的单词', '在词卡上点“收藏”，下次就能集中复习。');
    if (!state.seen.includes(word.id)) state.seen.push(word.id);
    if (position.finished) {
      return `<section class="ph-card ph-finish"><span class="ph-empty-symbol">✿</span><h2>这一轮，认真走完啦！</h2><p>浏览了 ${position.ids.length} 个词。自评与客观测验分开记录，听过不等于已经会读。</p><div class="ph-actions">${control('restart', '再学一轮')}${sectionPracticeButton('ph-section-practice', lesson().id, true)}${state.mode === 'learn' && lesson().number < phonicsLessons.length ? control('lesson', '前往下一课 →', `data-id="lesson-${lesson().number + 1}"`) : ''}</div></section>`;
    }
    return `${wordCard(word, position)}<section class="ph-card learning-lesson-map"><h3>本轮单词 · 点一个继续</h3><div class="ph-word-grid">${position.ids.map((id, index) => control('jump', `${escape(phonicsWordById.get(id).text)}${state.known.includes(id) ? '<small>✓ 自评</small>' : ''}`, `data-index="${index}" ${index === position.index ? 'aria-current="true"' : ''}`, `ph-word-tile ${index === position.index ? 'selected' : ''}`)).join('')}</div></section>`;
  }

  function wordCard(word, position, preview = null) {
    const heading = preview ? '词卡' : state.mode === 'favorites' ? '收藏复习' : state.mode === 'random' ? '随机词卡' : `第 ${lesson().number} 课`;
    const last = !preview && position.index === position.ids.length - 1;
    const next = last && state.mode === 'learn' ? sectionPracticeButton('ph-section-practice', lesson().id, true)
      : control('next', `${last ? '完成这一轮' : '下一个'}${icon(last ? 'check' : 'chevron')}`, '', 'outline-button');
    return `<section class="ph-card ph-word-card"><div class="ph-card-top"><h2 class="ph-badge" data-activity-heading tabindex="-1">学习 · ${heading}</h2>${preview ? preview.favorite : learningPosition(position.index, position.ids.length) + favoriteButton('ph-favorite', state.favorites.includes(word.id))}</div><div class="ph-word" lang="en-GB">${escape(word.text)}</div><p class="ph-meaning">${escape(word.meaning)}</p><div class="ph-actions">${playButton(word.id)}</div><p class="ph-small">先自己试着读，再听完整示范。不用汉字谐音给英语注音。</p>${preview ? '' : `<div class="ph-actions ph-mastery mastery-actions">${control('later', `${icon('refresh')}还要练一练`, '', 'soft-button')}${control('known', `${icon('check')}${last ? '我会读了' : '我会读了，下一词'}`, '', 'soft-button mint')}</div><div class="ph-word-navigation card-navigation">${control('previous', `${icon('chevron')}上一个`, position.index === 0 ? 'disabled' : '', 'outline-button previous')}${next}</div>`}</section>`;
  }

  function lessonIntro(entry = lesson(), preview = null) {
    return `<section class="ph-rule"><div class="ph-card-top"><span class="ph-badge">学习 · 本课发现</span>${preview ? preview.favorite : cardFavorite('lesson', entry.id)}</div>
      <h2 data-activity-heading tabindex="-1">${entry.title}</h2><p>${entry.tip}</p><div class="ph-pattern" aria-label="单词的字母组合">${entry.parts.map(part => `<span lang="en">${escape(part)}</span>`).join('')}<span class="ph-pattern-arrow">→</span><b lang="en">${escape(entry.parts.join(''))}</b></div><p class="ph-small">看看字母怎样组成单词，再听一听它的声音。</p><details><summary>读音小提示</summary><p>试着读一读：/${escape(entry.sounds.join(' / /'))}/。</p><p>${entry.prerequisite}</p></details>
      ${preview ? '' : `<div class="ph-actions">${control('mode', '随机词卡', 'data-id="random"')}${control('mode', '故事共读', 'data-id="reading"')}${entry.number <= 3 ? control('mode', '字母大小写配对', 'data-id="alphabet"') + control('mode', '文字起点检查', 'data-id="diagnostic"') : ''}</div>`}</section>`;
  }

  function answerChoice(action, option, index, { disabled, correct, incorrect }) {
    return control(action, learningAnswerLabel(index, escape(option)), `data-value="${escape(option)}" aria-label="${escape(option)}" ${disabled ? 'disabled' : ''}`, `ph-option answer-option${learningTokenClass(option)} ${correct ? 'correct correct-answer' : incorrect ? 'incorrect wrong-answer' : ''}`);
  }

  function quizCard() {
    if (!audioReady && ['listen', 'review'].includes(state.mode)) {
      return `<section class="ph-card ph-quiz" aria-busy="true"><h2 role="status" data-activity-heading tabindex="-1">正在准备练习…</h2><div class="ph-actions">${returnToLearning()}</div></section>`;
    }
    const value = round();
    if (!value.ids.length) {
      if (state.mode === 'listen') return empty('先来读一读吧', '这里暂时不能听词练习，可以先学词卡、规律和拼写。');
      if (state.mode === 'review') return empty('暂时没有可练的错题', '正确率只记录首次提交。需要语音的错题，会在语音就绪后重新开放。');
      return empty('这个范围暂无题目', '可以切换到“全部课程”查看其他已编写的训练。');
    }
    if (value.finished) {
      const stats = phonicsStats(value);
      return `<section class="ph-card ph-finish"><span class="ph-empty-symbol">✦</span><h2 data-activity-heading tabindex="-1">练习完成，每一步都算数</h2><div class="ph-stats"><div><b>${stats.correct} / ${stats.total}</b><span>首次答对</span></div><div><b>${stats.skipped}</b><span>首次跳过</span></div></div><p>重试不会覆盖第一次的结果。${state.mode === 'diagnostic' ? '这是文字起点参考，不测听觉合音或发音水平。可按错题对应课次复习，不自动判断孩子的能力。' : '去错题中看看哪些规律还需要再练。'}</p><div class="ph-actions">${returnToLearning()}${control('restart', '再练一轮', '', 'ph-button primary')}${reviewShortcut('phonics', phonicsPracticeLesson(state))}<button type="button" class="outline-button" data-action="library-open" data-id="records">学习记录</button></div></section>`;
    }
    draft = value.drafts[value.ids[value.index]] || '';
    return questionCard(value);
  }

  function questionCard(value, preview = null) {
    const question = phonicsQuestionById.get(value.ids[value.index]);
    const typed = value.drafts[question.id] || '';
    const view = value.views[question.id];
    const resolved = view?.resolved;
    const answerAvailable = question.kind !== 'listen' || (preview ? preview.heard : playedQuestion === question.id);
    const locked = resolved || preview?.passive;
    let body;
    if (question.kind === 'spelling') {
      const letters = [...question.letters].sort();
      const field = preview ? 'review-spelling' : 'ph-spelling';
      body = `<p class="ph-small">用这 ${letters.length} 个字母拼出单词；可以点字母，也可以直接输入。</p><div class="ph-letter-bank" aria-label="可用字母">${letters.map((letter, index) => control('letter', letter, `data-value="${letter}" data-index="${index}" ${locked || [...typed].filter(value => value === letter).length >= letters.filter(value => value === letter).length ? 'disabled' : ''}`, 'ph-letter')).join('')}</div><form id="${field}-form"><label for="${field}-input">你的拼写</label><input id="${field}-input" name="spelling" lang="en" value="${escape(typed)}" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" ${locked ? 'disabled' : ''}><div class="ph-actions">${control('erase', '删除一格', locked || !typed ? 'disabled' : '')}<button type="submit" class="ph-button primary" ${locked ? 'disabled' : ''}>检查拼写</button></div></form>`;
    } else body = `<div class="ph-options answer-grid">${value.options[question.id].map((option, index) => answerChoice('answer', option, index, { disabled: locked || !answerAvailable, correct: resolved && option === question.answer, incorrect: view?.answer === option && !view.correct })).join('')}</div>`;
    const story = question.storyId && phonicsStories.find(entry => entry.id === question.storyId);
    const audioPrompt = question.kind === 'listen' ? `<div class="ph-actions">${preview ? playButton(question.wordId, '播放题目') : control('play', `${icon('sound')}播放题目`, 'data-id="question"', 'ph-button audio')}</div><p class="ph-small">请先完整听一次。播放失败不会记为知识错误。</p>` : '';
    const title = preview?.label || (state.mode === 'review' ? '错题复习' : modeName());
    return `<section class="ph-card ph-quiz"><div class="ph-card-top"><span class="ph-badge">练习 · ${escape(title)}</span>${learningPosition(value.index, value.ids.length, { practice: true })}${preview ? preview.favorite : cardFavorite('question', question.id)}</div>
      <h2 data-activity-heading tabindex="-1">${escape(question.prompt)}</h2>${question.display ? `<div class="ph-question-word" lang="en-GB">${escape(question.display)}</div>` : ''}${story ? `<p class="ph-story-text" lang="en-GB">${escape(story.text)}</p>` : ''}${audioPrompt}${body}<div class="ph-feedback answer-feedback ${view?.correct ? 'good success' : view ? 'warning' : ''}" role="status">${view ? `<strong>${view.correct ? '答对啦！' : view.skipped ? '先看看答案，下次再试' : '还差一点，可以再试一次'}</strong>${resolved ? `<p>答案：${escape(question.answer)}</p><p>${escape(question.explanation)}</p>` : '<p>别着急，重新想一想。首次作答已经保留。</p>'}` : question.kind === 'listen' && !answerAvailable ? '先听完整题目，再选择答案。' : question.kind === 'spelling' ? '拼好单词，再检查答案。' : '想一想，再选出你的答案。'}</div>
      ${preview ? '' : `<div class="ph-actions">${returnToLearning()}${control('skip', '跳过并看答案', resolved || !answerAvailable ? 'disabled' : '')}${control('next-question', `继续${icon('chevron')}`, !resolved ? 'disabled' : '', 'ph-button primary')}${question.kind === 'listen' ? control('replace-audio', '音频有问题，换文字练习') : ''}</div><div class="ph-question-map" aria-label="本轮题目">${value.ids.map((id, index) => control('question', `${index + 1}${value.views[id]?.resolved ? ' ✓' : ''}`, `data-index="${index}" aria-label="第 ${index + 1} 题${value.views[id]?.resolved ? '，已完成' : ''}" ${value.index === index ? 'aria-current="true"' : ''}`, 'ph-question-dot')).join('')}</div>`}</section>`;
  }

  function readingCard(story = phonicsStories.find(entry => entry.lessonId === state.lessonId), preview = null) {
    const response = preview ? preview.storyResponse : storyResponse;
    const hint = preview ? preview.storyHint : currentStoryHint;
    const correct = response === story.question.answer;
    const options = shuffleStableOptions(story.question).map((option, index) => answerChoice('story-answer', option, index, { disabled: correct, correct: correct && response === option, incorrect: !correct && response === option }));
    return `<section class="ph-card ph-reading"><div class="ph-card-top"><span class="ph-badge">学习 · 一起读故事</span>${preview ? preview.favorite : cardFavorite('story', story.id)}</div>
      <h2 lang="en" data-activity-heading tabindex="-1">${escape(story.title)}</h2><p class="ph-small">先认识这些词和读法：${escape(story.prerequisites)}。</p><p class="ph-story-text" lang="en">${escape(story.text)}</p><div class="ph-actions">${playButton(story.id, '听完整故事')}</div><h3>${escape(story.question.prompt)}</h3><div class="ph-options answer-grid">${options.join('')}</div><p class="ph-feedback answer-feedback ${response ? correct ? 'success' : 'warning' : ''}" role="status">${response ? correct ? '理解正确！再试着用自己的话讲讲这个故事。' : '回到故事里找找线索，再试一次。' : '读一读故事，再选择答案。'}</p>${control('story-hint', hint ? '收起答案' : '需要帮助？查看答案', `aria-expanded="${hint}"`)}${hint ? `<p>答案：${escape(story.question.answer)}。</p>` : ''}</section>`;
  }

  function shuffleStableOptions(question) {
    const offset = Number(question.id.replace(/\D/g, '')) % question.options.length;
    return [...question.options.slice(offset), ...question.options.slice(0, offset)];
  }

  function recordsCard() {
    const due = Object.entries(state.reviews).filter(([, entry]) => entry.due <= Date.now()).length;
    return `<section class="ph-card"><h2>一点一点，看见成长</h2><div class="ph-stats"><div><b>${state.seen.length}</b><span>浏览过的词</span></div><div><b>${state.known.length}</b><span>自评会读</span></div><div><b>${state.mistakes.length}</b><span>待复习错题</span></div><div><b>${due}</b><span>到期复习题</span></div></div><p>浏览、自评和客观题表现分别记录。没有启用麦克风，也不推断发音是否合格。</p><div class="ph-actions">${control('due', '复习到期题目', due ? '' : 'disabled')}${reviewButton()}</div><h3>最近练习</h3>${state.history.length ? `<ol class="ph-history">${state.history.slice(-20).reverse().map(entry => `<li><div><b>${escape(entry.name)}</b><small>${escape(new Date(entry.time).toLocaleString('zh-CN'))}</small></div><span>首次答对 ${entry.correct}/${entry.total}<small>首次跳过 ${entry.skipped}</small></span></li>`).join('')}</ol>` : '<p class="ph-small">完成一轮客观练习后，这里会出现记录。</p>'}<p class="ph-small">复习参考间隔为 1、3、7 天；仅是学习安排，不是掌握诊断。清理浏览器数据可能丢失记录。</p></section>`;
  }

  function returnToLearning() {
    return control('mode', '回到课程学习', 'data-id="learn"');
  }

  function modeName() {
    if (state.mode === 'mixed' && state.scope === 'lesson') return `本节练习 · ${lesson().title}`;
    return phonicsModes.find(entry => entry.id === state.mode)?.name || (state.mode === 'alphabet' ? '字母大小写' : '文字起点检查');
  }

  function render() {
    if (state.mode === 'reading') {
      if (!phonicsStories.some(story => story.lessonId === state.lessonId)) state.lessonId = phonicsStories[0].lessonId;
      state.scope = 'lesson';
    }
    const mode = modeName();
    const canChooseLength = quizModes.includes(state.mode) && state.mode !== 'diagnostic';
    const practice = quizModes.includes(state.mode);
    const hasLessonPage = lessonModes.includes(state.mode) || state.mode === 'mixed' && state.scope === 'lesson';
    const body = practice ? quizCard() : state.mode === 'reading' ? readingCard() : state.mode === 'records' ? recordsCard() : learningCard();
    const book = learningBook({
      action: 'ph-page',
      category: hasLessonPage ? lesson().id : state.mode,
      page: practice ? 'practice' : 'learn',
      paired: hasLessonPage,
      content: (state.mode === 'learn' ? lessonIntro() : '') + body
        + (lesson().number <= 3 && state.mode === 'learn' ? `<details class="ph-card ph-alphabet"><summary>26 个字母 · 名称参考</summary><p class="ph-small">认识字母的名字，再学它们在单词里的声音。</p><div class="ph-alphabet-grid">${alphabet.map(letter => `<div><b lang="en">${letter.upper} ${letter.letter}</b><small>/${letter.name}/</small></div>`).join('')}</div></details>` : ''),
    });
    const modeNavigation = renderNavigation({
      id: 'phonics-categories',
      selected: practice && state.scope === 'all' ? state.mode : null,
      leadingPicker: coursePicker(hasLessonPage),
      catalogName: '练习目录',
      practice: fixedPractice.map(id => ({ ...phonicsModes.find(entry => entry.id === id), action: 'ph-practice' })),
    });
    return `<div class="phonics-page"><section class="ph-hero"><div><div class="eyebrow">ENGLISH GARDEN</div><h1>让字母，变成会读的词<span>✿</span></h1><p>听见声音，发现规律。从一个小词，走进一个小故事。</p><div class="ph-tags"><span>听一听</span><span>拼一拼</span><span>读故事</span></div></div><div class="ph-hero-letters" aria-hidden="true"><span>sh</span><span>ee</span><span>p</span><small>small steps, big discoveries</small></div></section>
      ${modeNavigation}
      <div class="ph-layout"><div class="ph-main" role="region" tabindex="-1" aria-label="${mode}">
      ${book}
      ${['random', 'reading'].includes(state.mode) ? `<div class="ph-actions">${returnToLearning()}</div>` : ''}
      ${confirmRestart ? `<section class="ph-confirm" role="group" aria-label="确认重新开始"><p>重新开始当前轮次？收藏、错题和以往记录会保留。</p><div class="ph-actions">${control('cancel-restart', '保留当前进度')}${control('confirm-restart', '确认重新开始', '', 'ph-button primary')}</div></section>` : ''}
      ${canChooseLength ? roundSettings('phonics', state.length, [5, 10, 20], previousLength()) : ''}
      <p class="ph-footnote">每天学一点，答错也没关系</p></div><aside class="ph-sidebar">${renderGarden()}${courseMap()}</aside></div></div>`;
  }

  function stop() { audio.stop(); }
  function changeMode(id) {
    if (id === 'rules' || ![...phonicsModes.map(entry => entry.id), 'alphabet', 'diagnostic'].includes(id)) return;
    stop(); state.mode = id; draft = ''; playedQuestion = null; confirmRestart = false; storyResponse = null; currentStoryHint = false;
    if (id === 'review' && state.sessions[sessionKey()]?.finished) delete state.sessions[sessionKey()];
    if (id === 'alphabet') state.scope = 'all';
    if (lessonModes.includes(id)) state.scope = 'lesson';
  }

  function submit(answer) {
    const value = round();
    const question = phonicsQuestionById.get(value.ids[value.index]);
    if (question?.kind === 'listen' && playedQuestion !== question.id) return;
    const wasMistake = state.mistakes.includes(question.id);
    const result = answerPhonics(state, value, answer);
    if (result?.correct) rewardAction({ type: 'answer', question: { ...question, id: `english:${question.id}` }, reviewed: state.mode === 'review' && wasMistake && result.first });
    stop();
  }

  function handle(target) {
    if (!target.dataset.action?.startsWith('ph-')) return false;
    const action = target.dataset.action.slice(3);
    if (action === 'toggle-map') {
      mapExpanded = !mapExpanded;
      target.closest('.ph-learning-map').classList.toggle('is-open', mapExpanded);
      target.setAttribute('aria-expanded', String(mapExpanded));
      return true;
    }
    if (action === 'play') {
      haltOtherAudio();
      let id = target.dataset.id;
      const key = sessionKey();
      const question = id === 'question' ? phonicsQuestionById.get(round().ids[round().index]) : null;
      if (question) id = question.wordId;
      audio.play(id, slowPlayback()).then(success => {
        if (success && question && key === sessionKey() && document.querySelector('#app .phonics-page') && round().ids[round().index] === question.id) { playedQuestion = question.id; redraw(); }
      });
      return true;
    }
    stop();
    if (action === 'page') {
      if (target.dataset.id === 'learn') changeMode('learn');
      else if (target.dataset.id === 'practice') { changeMode('mixed'); state.lessonId = target.dataset.category; state.scope = 'lesson'; }
    } else if (action === 'practice' && fixedPractice.includes(target.dataset.id)) {
      changeMode(target.dataset.id);
      state.scope = 'all';
    } else if (action === 'section-practice' && phonicsLessonById.has(target.dataset.id)) {
      changeMode('mixed');
      state.lessonId = target.dataset.id;
      state.scope = 'lesson';
    } else if (action === 'mode') changeMode(target.dataset.id);
    else if (action === 'lesson') {
      if (!phonicsLessonById.has(target.dataset.id)) return true;
      if (state.mode === 'reading' && !phonicsStories.some(story => story.lessonId === target.dataset.id)) return true;
      changeMode(lessonModes.includes(state.mode) ? state.mode : 'learn');
      state.lessonId = target.dataset.id;
      mapExpanded = false;
    } else if (action === 'restart') confirmRestart = true;
    else if (action === 'cancel-restart') confirmRestart = false;
    else if (action === 'confirm-restart') {
      if (state.mode === 'mixed') state.sessions[sessionKey()] = newRound();
      else delete state.sessions[sessionKey()];
      delete state.positions[`${state.mode}:${state.scope}:${state.lessonId}`];
      draft = ''; playedQuestion = null; confirmRestart = false; storyResponse = null; currentStoryHint = false;
    } else if (action === 'story-answer') {
      storyResponse = target.dataset.value;
      const story = phonicsStories.find(entry => entry.lessonId === state.lessonId);
      if (storyResponse === story?.question.answer) rewardAction({ type: 'answer', question: { ...story.question, id: `english:${story.question.id}` } });
    }
    else if (action === 'story-hint') currentStoryHint = !currentStoryHint;
    else if (action === 'due') {
      const ids = Object.entries(state.reviews).filter(([, entry]) => entry.due <= Date.now()).map(([id]) => id);
      changeMode('review');
      state.sessions[sessionKey()] = createPhonicsRound(ids.map(id => phonicsQuestionById.get(id)).filter(question => question.kind !== 'listen' || audio.available(question.wordId)), state.length);
    } else if (quizModes.includes(state.mode)) {
      const value = round();
      const question = phonicsQuestionById.get(value.ids[value.index]);
      if (!question) return true;
      if (action === 'answer') submit(target.dataset.value);
      if (action === 'skip') submit(null);
      if (action === 'replace-audio') { changeMode('spelling'); state.scope = 'lesson'; notify('已切换到文字练习，音频问题未记为知识错误。'); }
      if (action === 'letter' || action === 'erase') {
        draft = editPhonicsDraft(question, document.querySelector('#ph-spelling-input')?.value ?? draft, action, target.dataset.value);
        value.drafts[question.id] = draft;
      }
      if (action === 'next-question') {
        const finished = value.finished;
        advancePhonicsRound(state, value, phonicsModes.find(entry => entry.id === state.mode)?.name || '小节练习', Date.now(), phonicsPracticeLesson(state));
        if (!finished && value.finished) rewardAction({
          type: 'round', mode: `english:${state.mode}`, name: '英语练习', topicId: 'phonics',
          sectionId: state.scope === 'lesson' ? `english/${state.lessonId}` : null, total: value.ids.length,
          answered: Object.values(value.responses).filter(response => !response.skipped).length,
          questions: value.ids.map(id => ({ id: `english:${id}` })), responses: value.ids.map(id => value.responses[id]),
        });
        draft = ''; playedQuestion = null;
      }
      if (action === 'question') { const index = Number(target.dataset.index); if (Number.isInteger(index) && index >= 0 && index < value.ids.length) { value.index = index; draft = ''; playedQuestion = null; } }
    } else if (['learn', 'random', 'favorites'].includes(state.mode)) {
      const position = learningSession();
      const word = phonicsWordById.get(position.ids[position.index]);
      if (!word) return true;
      if (action === 'favorite') state.favorites = state.favorites.includes(word.id) ? state.favorites.filter(id => id !== word.id) : [...state.favorites, word.id];
      if (action === 'known') {
        if (!state.known.includes(word.id)) state.known.push(word.id);
        rewardAction({ type: 'recognize', item: { id: `english:${word.id}`, text: word.text } });
      }
      if (action === 'later') { state.known = state.known.filter(id => id !== word.id); if (!state.favorites.includes(word.id)) state.favorites.push(word.id); }
      if (['known', 'later', 'next'].includes(action)) { if (position.index < position.ids.length - 1) position.index++; else position.finished = true; }
      if (action === 'previous') position.index = Math.max(0, position.index - 1);
      if (action === 'jump') { const index = Number(target.dataset.index); if (Number.isInteger(index) && index >= 0 && index < position.ids.length) { position.index = index; position.finished = false; } }
    }
    redraw();
    if (['mode', 'practice', 'section-practice'].includes(action)) focusLearningActivity();
    else if (action === 'restart') document.querySelector('[data-action="ph-cancel-restart"]')?.focus();
    else if (action === 'lesson') document.querySelector('.ph-main')?.focus({ preventScroll: true });
    return true;
  }

  function change(target) {
    if (target.dataset.roundLength !== 'phonics') return false;
    stop(); draft = ''; playedQuestion = null; confirmRestart = false; storyResponse = null; currentStoryHint = false;
    if ([5, 10, 20].includes(Number(target.value))) state.length = Number(target.value);
    redraw(); return true;
  }

  function submitForm(event) {
    if (event.target.id !== 'ph-spelling-form') return;
    event.preventDefault();
    draft = new FormData(event.target).get('spelling').trim().toLowerCase();
    const value = round();
    value.drafts[value.ids[value.index]] = draft;
    if (!draft) { notify('先点选字母或输入拼写，再检查。'); return; }
    submit(draft); redraw();
  }

  function input(target) {
    if (target.id !== 'ph-spelling-input' || !['mixed', 'spelling', 'review'].includes(state.mode)) return;
    const value = round();
    draft = target.value.slice(0, 40);
    value.drafts[value.ids[value.index]] = draft;
    persist();
  }

  function reset(nextState) { stop(); state = nextState; draft = ''; playedQuestion = null; storyResponse = null; currentStoryHint = false; confirmRestart = false; mapExpanded = false; }
  function openLesson(mode, lessonId, wordId) {
    changeMode(mode);
    state.lessonId = lessonId;
    state.scope = 'lesson';
    if (wordId) {
      const position = learningSession();
      const index = position.ids.indexOf(wordId);
      if (index >= 0) { position.index = index; position.finished = false; }
    }
    redraw();
  }
  function previewCard(item, preview) {
    if (item.question) return questionCard(preview.round, preview);
    if (item.word) return wordCard(item.word, null, preview);
    if (item.story) return readingCard(item.story, preview);
    return lessonIntro(item.lesson, preview);
  }
  return { render, handle, change, submitForm, input, stop, reset, openLesson, gardenData, previewCard,
    playSaved: id => audio.play(id, slowPlayback()), knownCount: () => state.known.length };
}
