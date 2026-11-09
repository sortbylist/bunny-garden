import './phonics.css';
import { alphabet, phonicsModules, phonicsLessons, phonicsWords, phonicsStories, phonicsSentences, phonicsModes, phonicsWordById, phonicsLessonById } from './phonics-data.js';
import { phonicsStorageKey, phonicsDefaults, readPhonicsState, shufflePhonics, questionPool, createPhonicsRound, answerPhonics, advancePhonicsRound, phonicsStats, phonicsQuestionById } from './phonics-engine.js';
import { createPhonicsAudio } from './phonics-audio.js';
import { icon } from './icons.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const control = (action, label, attributes = '', style = 'ph-button') => `<button type="button" data-action="ph-${action}" class="${style}" ${attributes}>${label}</button>`;
const quizModes = ['meaning', 'spelling', 'rules', 'listen', 'review', 'alphabet', 'diagnostic'];

export function createPhonicsView({ redraw, notify, haltOtherAudio }) {
  const loaded = readPhonicsState({ getItem: key => localStorage.getItem(key) });
  let state = loaded.state;
  let storageAvailable = loaded.available;
  let storageWarned = false;
  let draft = '';
  let playedQuestion = null;
  let confirmRestart = false;
  let storyId = null;
  let storyResponse = null;
  let currentStoryHint = false;
  const audio = createPhonicsAudio((status, message) => {
    const statusElement = document.querySelector('#ph-audio-status');
    if (statusElement) statusElement.textContent = status === 'loading' ? '正在加载英式录音…' : status === 'playing' ? '正在播放英式录音…' : status === 'error' ? message : '';
    document.querySelectorAll('[data-action="ph-play"]').forEach(element => element.setAttribute('aria-busy', String(status === 'loading')));
    if (status === 'error') notify(message);
  });
  audio.ready.then(() => { if (document.querySelector('.phonics-page')) redraw(); });

  function persist() {
    try { localStorage.setItem(phonicsStorageKey, JSON.stringify(state)); }
    catch { storageAvailable = false; }
    if (!storageAvailable && !storageWarned) { storageWarned = true; notify('英语学习记录暂时无法保存或恢复，仍可临时练习。'); }
  }

  function sessionKey() { return `${state.mode}:${state.scope}:${state.lessonId}:${state.length}`; }
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
    if (!value) value = createPhonicsRound(questionPool(state, audio.available), state.mode === 'diagnostic' ? 10 : state.length);
    if (value.ids.some(id => { const question = phonicsQuestionById.get(id); return question.kind === 'listen' && !audio.available(question.wordId); })) {
      value = createPhonicsRound(questionPool(state, audio.available), state.length);
    }
    state.sessions[key] = value;
    return value;
  }

  function empty(title, text) {
    return `<section class="ph-card ph-empty"><span class="ph-empty-symbol">✿</span><h2>${title}</h2><p>${text}</p>${control('mode', '回到课程学习', 'data-id="learn"', 'ph-button primary')}</section>`;
  }

  function playButton(id, label = '听英式读音') {
    return audio.available(id)
      ? control('play', `${icon('sound')}${label}`, `data-id="${escape(id)}"`, 'ph-button audio')
      : `<span class="ph-pending">${icon('headphones')}英式录音待审核</span>`;
  }

  function courseMap() {
    return `<aside class="ph-map" aria-label="自然拼读课程地图"><div class="ph-map-heading"><h2>我的拼读路线</h2><span>12 站 · 48 课</span></div>${phonicsModules.map(module => {
      const entries = phonicsLessons.filter(entry => entry.moduleId === module.id);
      return `<details ${module.id === lesson().moduleId ? 'open' : ''}><summary>${module.name}<small>${module.advanced ? '进阶' : `${entries.length} 课`}</small></summary><p>${module.description}</p>${entries.map(entry => control('lesson', `<span>${String(entry.number).padStart(2, '0')}</span><b>${entry.title}</b>`, `data-id="${entry.id}" ${entry.id === state.lessonId ? 'aria-current="step"' : ''}`, `ph-lesson ${entry.id === state.lessonId ? 'selected' : ''}`)).join('')}</details>`;
    }).join('')}<div class="ph-map-note">按自己的节奏学习，也可以跳到熟悉的内容。没有强制倒计时。</div></aside>`;
  }

  function learningCard() {
    const position = learningSession();
    const word = phonicsWordById.get(position.ids[position.index]);
    if (!word) return empty('还没有收藏的单词', '在词卡上点“收藏”，下次就能集中复习。');
    if (!state.seen.includes(word.id)) state.seen.push(word.id);
    if (position.finished) {
      return `<section class="ph-card ph-finish"><span class="ph-empty-symbol">✿</span><h2>这一轮，认真走完啦！</h2><p>浏览了 ${position.ids.length} 个词。自评与客观测验分开记录，听过不等于已经会读。</p><div class="ph-actions">${control('restart', '再学一轮')}${control('mode', '试试本课规律题', 'data-id="rules"', 'ph-button primary')}${state.mode === 'learn' && lesson().number < phonicsLessons.length ? control('lesson', '前往下一课 →', `data-id="lesson-${lesson().number + 1}"`) : ''}</div></section>`;
    }
    const favorite = state.favorites.includes(word.id);
    return `<section class="ph-card ph-word-card"><div class="ph-card-top"><span class="ph-badge">${state.mode === 'favorites' ? '收藏复习' : state.mode === 'random' ? '随机词卡' : `第 ${lesson().number} 课`}</span><span>${position.index + 1} / ${position.ids.length}</span>${control('favorite', `${icon('heart')}${favorite ? '已收藏' : '收藏'}`, `aria-pressed="${favorite}"`, `ph-button compact ${favorite ? 'saved' : ''}`)}</div><div class="ph-word" lang="en-GB">${escape(word.text)}</div><p class="ph-meaning">${escape(word.meaning)}</p><div class="ph-actions">${playButton(word.id)}${control('slow', state.slow ? '慢速 0.8×' : '标准语速', `aria-pressed="${state.slow}"`)}</div><p class="ph-small">先自己试着读，再听完整示范。不用汉字谐音给英语注音。</p><div class="ph-actions ph-mastery">${control('later', '还要练一练')}${control('known', '我会读了，下一词 →', '', 'ph-button mint')}</div><div class="ph-word-navigation">${control('previous', '← 上一个', position.index === 0 ? 'disabled' : '')}${control('next', position.index === position.ids.length - 1 ? '完成这一轮 ✓' : '下一个 →', '', 'ph-button primary')}</div></section><section class="ph-card"><h3>本轮单词 · 点一个继续</h3><div class="ph-word-grid">${position.ids.map((id, index) => control('jump', `${escape(phonicsWordById.get(id).text)}${state.known.includes(id) ? '<small>✓ 自评</small>' : ''}`, `data-index="${index}" ${index === position.index ? 'aria-current="true"' : ''}`, `ph-word-tile ${index === position.index ? 'selected' : ''}`)).join('')}</div></section>`;
  }

  function lessonIntro() {
    const entry = lesson();
    return `<section class="ph-rule"><span class="ph-badge">本课发现</span><h2>${entry.title}</h2><p>${entry.tip}</p><div class="ph-pattern" aria-label="示例字形拆看，不代表音素个数">${entry.parts.map(part => `<span lang="en-GB">${escape(part)}</span>`).join('')}<span class="ph-pattern-arrow">→</span><b lang="en-GB">${escape(entry.parts.join(''))}</b></div><p class="ph-small">字形拆看与音素分解不是一回事；一个字母可以对应多个音。</p><details><summary>家长提示与目标音</summary><p>示例声音：/${escape(entry.sounds.join(' / /'))}/。仅作文字辅助，不代替经审核的录音。${entry.prerequisite}</p><p>本课例词包含扩展词和词义学习，不代表每个词都只包含当前规律。请结合孩子已有知识选学。</p></details>${entry.number <= 3 ? `<div class="ph-actions">${control('mode', '字母大小写配对', 'data-id="alphabet"')}${control('mode', '文字起点检查', 'data-id="diagnostic"')}</div>` : ''}</section>`;
  }

  function quizCard() {
    const value = round();
    if (!value.ids.length) {
      if (state.mode === 'listen') return empty('先把英式声音准备好', '正式听辨只使用已审核的英国口音录音。目前本范围没有可用题，不用美音或不确定的系统语音替代。你可以先学词卡、规律和拼写。');
      if (state.mode === 'review') return empty('暂时没有可练的错题', '正确率只记录首次提交。需要待审音频的错题，会在录音就绪后重新开放。');
      return empty('这个范围暂无题目', '可以切换到“全部课程”查看其他已编写的训练。');
    }
    if (value.finished) {
      const stats = phonicsStats(value);
      return `<section class="ph-card ph-finish"><span class="ph-empty-symbol">✦</span><h2>练习完成，每一步都算数</h2><div class="ph-stats"><div><b>${stats.correct} / ${stats.total}</b><span>首次答对</span></div><div><b>${stats.skipped}</b><span>首次跳过</span></div></div><p>重试不会覆盖第一次的结果。${state.mode === 'diagnostic' ? '这是文字起点参考，不测听觉合音或发音水平。可按错题对应课次复习，不自动判断孩子的能力。' : '去错题中看看哪些规律还需要再练。'}</p><div class="ph-actions">${control('restart', '再练一轮', '', 'ph-button primary')}${control('mode', '查看错题', 'data-id="review"')}${control('mode', '学习记录', 'data-id="records"')}</div></section>`;
    }
    const question = phonicsQuestionById.get(value.ids[value.index]);
    draft = value.drafts[question.id] || '';
    const view = value.views[question.id];
    const resolved = view?.resolved;
    const answerAvailable = question.kind !== 'listen' || playedQuestion === question.id;
    let body;
    if (question.kind === 'spelling') {
      const letters = [...question.letters].sort();
      body = `<p class="ph-small">使用给定的 ${letters.length} 个字母拼出目标词；可点字母，也可直接输入。本题不是音频听写。</p><div class="ph-letter-bank" aria-label="可用字母">${letters.map((letter, index) => control('letter', letter, `data-value="${letter}" data-index="${index}" ${resolved || [...draft].filter(value => value === letter).length >= letters.filter(value => value === letter).length ? 'disabled' : ''}`, 'ph-letter')).join('')}</div><form id="ph-spelling-form"><label for="ph-spelling-input">你的拼写</label><input id="ph-spelling-input" name="spelling" lang="en-GB" value="${escape(draft)}" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" ${resolved ? 'disabled' : ''}><div class="ph-actions">${control('erase', '删除一格', resolved || !draft ? 'disabled' : '')}<button type="submit" class="ph-button primary" ${resolved ? 'disabled' : ''}>检查拼写</button></div></form>`;
    } else body = `<div class="ph-options">${value.options[question.id].map((option, index) => control('answer', `<span>${index + 1}</span>${escape(option)}`, `data-value="${escape(option)}" ${resolved || !answerAvailable ? 'disabled' : ''}`, `ph-option ${resolved && option === question.answer ? 'correct' : view?.answer === option && !view.correct ? 'incorrect' : ''}`)).join('')}</div>`;
    const story = question.storyId && phonicsStories.find(entry => entry.id === question.storyId);
    return `<section class="ph-card ph-quiz"><div class="ph-card-top"><span class="ph-badge">${state.mode === 'review' ? '错题再练' : '小小练习'}</span><span>第 ${value.index + 1} / ${value.ids.length} 题</span></div>${value.ids.length < state.length && state.mode !== 'diagnostic' ? `<p class="ph-small">本范围有 ${value.ids.length} 道可用题，按实际数量练习，不重复凑数。</p>` : ''}<h2>${escape(question.prompt)}</h2>${question.display ? `<div class="ph-question-word" lang="en-GB">${escape(question.display)}</div>` : ''}${story ? `<p class="ph-story-text" lang="en-GB">${escape(story.text)}</p>` : ''}${question.kind === 'listen' ? `<div class="ph-actions">${control('play', `${icon('sound')}播放题目`, 'data-id="question"', 'ph-button audio')}${control('slow', state.slow ? '慢速 0.8×' : '标准语速', `aria-pressed="${state.slow}"`)}</div><p class="ph-small">请先完整听一次。播放失败不会记为知识错误。</p>` : ''}${body}<div class="ph-feedback ${view?.correct ? 'good' : ''}" role="status">${view ? `<strong>${view.correct ? '答对啦！' : view.skipped ? '先看看答案，下次再试' : '还差一点，可以再试一次'}</strong>${resolved ? `<p>答案：${escape(question.answer)}</p><p>${escape(question.explanation)}</p>` : '<p>别着急，重新想一想。首次作答已经保留。</p>'}` : ''}</div><div class="ph-actions">${control('skip', '跳过并看答案', resolved || !answerAvailable ? 'disabled' : '')}${control('next-question', '继续 →', !resolved ? 'disabled' : '', 'ph-button primary')}${question.kind === 'listen' ? control('replace-audio', '音频有问题，换文字练习') : ''}</div><div class="ph-question-map" aria-label="本轮题目">${value.ids.map((id, index) => control('question', `${index + 1}${value.views[id]?.resolved ? ' ✓' : ''}`, `data-index="${index}" aria-label="第 ${index + 1} 题${value.views[id]?.resolved ? '，已完成' : ''}" ${value.index === index ? 'aria-current="true"' : ''}`, 'ph-question-dot')).join('')}</div></section>`;
  }

  function readingCard() {
    const stories = state.scope === 'all' ? phonicsStories : phonicsStories.filter(story => story.lessonId === state.lessonId);
    if (!stories.length) return empty('先从声音和小词出发', '故事共读从第 13 课开始。也可以把范围切换为“全部课程”，由家长陪读。');
    const story = stories.find(entry => entry.id === storyId) || stories[0];
    storyId = story.id;
    return `<section class="ph-card ph-reading"><label for="ph-story-select">选择故事</label><select id="ph-story-select" data-ph-setting="story">${stories.map(entry => `<option value="${entry.id}" ${entry.id === story.id ? 'selected' : ''}>${escape(entry.title)}</option>`).join('')}</select><span class="ph-badge">原创 · 家长共读</span><h2 lang="en-GB">${escape(story.title)}</h2><p class="ph-small">需预教：${escape(story.prerequisites)}。尚未逐词确认先修覆盖，不计作独立可解码阅读测验。</p><p class="ph-story-text" lang="en-GB">${escape(story.text)}</p><div class="ph-actions">${playButton(story.id, '听完整故事')}</div><h3>${escape(story.question.prompt)}</h3><div class="ph-options">${shuffleStableOptions(story.question).map(option => control('story-answer', escape(option), `data-value="${escape(option)}" ${storyResponse === story.question.answer ? 'disabled' : ''}`, `ph-option ${storyResponse === option ? option === story.question.answer ? 'correct' : 'incorrect' : ''}`)).join('')}</div><p class="ph-feedback" role="status">${storyResponse ? storyResponse === story.question.answer ? '理解正确！再试着用自己的话讲讲这个故事。共读结果不并入独立测验正确率。' : '回到故事里找找线索，再试一次。' : ''}</p>${control('story-hint', currentStoryHint ? '收起答案' : '需要帮助？查看答案', `aria-expanded="${currentStoryHint}"`)}${currentStoryHint ? `<p>答案：${escape(story.question.answer)}。查看过答案的活动不计为独立作答。</p>` : ''}</section>`;
  }

  function shuffleStableOptions(question) {
    const offset = Number(question.id.replace(/\D/g, '')) % question.options.length;
    return [...question.options.slice(offset), ...question.options.slice(0, offset)];
  }

  function recordsCard() {
    const due = Object.entries(state.reviews).filter(([, entry]) => entry.due <= Date.now()).length;
    return `<section class="ph-card"><h2>一点一点，看见成长</h2><div class="ph-stats"><div><b>${state.seen.length}</b><span>浏览过的词</span></div><div><b>${state.known.length}</b><span>自评会读</span></div><div><b>${state.mistakes.length}</b><span>待复习错题</span></div><div><b>${due}</b><span>到期复习题</span></div></div><p>浏览、自评和客观题表现分别记录。没有启用麦克风，也不推断发音是否合格。</p><div class="ph-actions">${control('due', '复习到期题目', due ? '' : 'disabled')}${control('mode', '错题再练', 'data-id="review"')}</div><h3>最近练习</h3>${state.history.length ? `<ol class="ph-history">${state.history.slice(-20).reverse().map(entry => `<li><div><b>${escape(entry.name)}</b><small>${escape(new Date(entry.time).toLocaleString('zh-CN'))}</small></div><span>首次答对 ${entry.correct}/${entry.total}<small>首次跳过 ${entry.skipped}</small></span></li>`).join('')}</ol>` : '<p class="ph-small">完成一轮客观练习后，这里会出现记录。</p>'}<p class="ph-small">复习参考间隔为 1、3、7 天；仅是学习安排，不是掌握诊断。清理浏览器数据可能丢失记录。</p></section>`;
  }

  function render() {
    const mode = phonicsModes.find(entry => entry.id === state.mode)?.name || (state.mode === 'alphabet' ? '字母大小写' : '文字起点检查');
    const body = quizModes.includes(state.mode) ? quizCard() : state.mode === 'reading' ? readingCard() : state.mode === 'records' ? recordsCard() : learningCard();
    persist();
    return `<div class="phonics-page"><section class="ph-hero"><div><div class="eyebrow">ENGLISH GARDEN · BRITISH ENGLISH</div><h1>让字母，变成会读的词<span>✿</span></h1><p>听见声音，发现规律。从一个小词，走进一个小故事。</p><div class="ph-tags"><span>纯英音 · en-GB</span><span>独立拼读路线</span><span>适合 Power Up 1 学习者选学</span></div></div><div class="ph-hero-letters" aria-hidden="true"><span>sh</span><span>ee</span><span>p</span><small>small steps, big discoveries</small></div></section><details class="ph-quality"><summary>内容预览版 · ${audio.count()} 段英式录音已审核 · 查看资源状态</summary><p>已编写 ${phonicsLessons.length} 课、${phonicsWords.length} 个去重词形、${phonicsStories.length} 篇原创共读文本（${phonicsSentences.length} 条不同句子）。内容仍需教学复核；不声称与 Cambridge 官方课程合作或逐单元同步。</p><p>正式听辨只开放已审核的英式录音。未审核内容不会改用美音或系统合成音。共读故事有前置词提示，暂不标为独立可解码读物。</p><a href="/audio/phonics/ATTRIBUTION.md" target="_blank" rel="noopener">音频来源、授权与审核说明</a></details><nav class="ph-modes" aria-label="自然拼读学习方式">${phonicsModes.map(entry => control('mode', entry.name, `data-id="${entry.id}" aria-pressed="${state.mode === entry.id}"`, `ph-mode ${state.mode === entry.id ? 'selected' : ''}`)).join('')}</nav><div class="ph-layout"><div class="ph-main"><div class="ph-controls"><label for="ph-lesson-select">学习课次<select id="ph-lesson-select" data-ph-setting="lesson">${phonicsLessons.map(entry => `<option value="${entry.id}" ${entry.id === state.lessonId ? 'selected' : ''}>${entry.number}. ${entry.title}</option>`).join('')}</select></label>${!['learn', 'favorites', 'records', 'diagnostic'].includes(state.mode) ? `<label for="ph-scope-select">范围<select id="ph-scope-select" data-ph-setting="scope"><option value="lesson" ${state.scope === 'lesson' ? 'selected' : ''}>当前课</option><option value="all" ${state.scope === 'all' ? 'selected' : ''}>全部课程</option></select></label>` : ''}${quizModes.includes(state.mode) && state.mode !== 'diagnostic' ? `<label for="ph-length-select">每轮<select id="ph-length-select" data-ph-setting="length">${[5, 10, 20].map(length => `<option ${state.length === length ? 'selected' : ''}>${length}</option>`).join('')}</select></label>` : ''}${control('restart', `${icon('refresh')}重新开始`, '', 'ph-button compact')}</div><div class="ph-section-title"><h2>${mode}</h2><span>自评会读 ${state.known.length} 个</span></div><div id="ph-audio-status" class="ph-audio-status" role="status"></div>${confirmRestart ? `<section class="ph-confirm" role="group" aria-label="确认重新开始"><p>重新开始当前轮次？收藏、错题和以往记录会保留。</p><div class="ph-actions">${control('cancel-restart', '保留当前进度')}${control('confirm-restart', '确认重新开始', '', 'ph-button primary')}</div></section>` : ''}${state.mode === 'learn' ? lessonIntro() : ''}${body}${lesson().number <= 3 && state.mode === 'learn' ? `<details class="ph-card ph-alphabet"><summary>26 个字母 · 名称参考</summary><p class="ph-small">这里是字母名，不是独立音素录音。英式 Z 读 zed。</p><div class="ph-alphabet-grid">${alphabet.map(letter => `<div><b lang="en-GB">${letter.upper} ${letter.letter}</b><small>/${letter.name}/</small></div>`).join('')}</div></details>` : ''}<p class="ph-footnote">学习记录仅在本机保存 · 不采集孩子的声音 · 答错也没关系</p></div>${courseMap()}</div></div>`;
  }

  function stop() { audio.stop(); }
  function changeMode(id) {
    if (![...phonicsModes.map(entry => entry.id), 'alphabet', 'diagnostic'].includes(id)) return;
    stop(); state.mode = id; draft = ''; playedQuestion = null; confirmRestart = false; storyResponse = null; currentStoryHint = false;
    if (id === 'review' && state.sessions[sessionKey()]?.finished) delete state.sessions[sessionKey()];
    if (id === 'alphabet') state.scope = 'all';
  }

  function submit(answer) {
    const value = round();
    const question = phonicsQuestionById.get(value.ids[value.index]);
    if (question?.kind === 'listen' && playedQuestion !== question.id) return;
    answerPhonics(state, value, answer);
    stop();
  }

  function handle(target) {
    if (!target.dataset.action?.startsWith('ph-')) return false;
    const action = target.dataset.action.slice(3);
    if (action === 'play') {
      haltOtherAudio();
      let id = target.dataset.id;
      const key = sessionKey();
      const question = id === 'question' ? phonicsQuestionById.get(round().ids[round().index]) : null;
      if (question) id = question.wordId;
      audio.play(id, state.slow).then(success => {
        if (success && question && key === sessionKey() && round().ids[round().index] === question.id && document.querySelector('.phonics-page')) { playedQuestion = question.id; redraw(); }
      });
      return true;
    }
    stop();
    if (action === 'mode') changeMode(target.dataset.id);
    else if (action === 'lesson') {
      if (!phonicsLessonById.has(target.dataset.id)) return true;
      state.lessonId = target.dataset.id; state.mode = 'learn'; state.scope = 'lesson'; draft = ''; playedQuestion = null; confirmRestart = false; storyResponse = null; currentStoryHint = false;
    } else if (action === 'slow') state.slow = !state.slow;
    else if (action === 'restart') confirmRestart = true;
    else if (action === 'cancel-restart') confirmRestart = false;
    else if (action === 'confirm-restart') {
      delete state.sessions[sessionKey()]; delete state.positions[`${state.mode}:${state.scope}:${state.lessonId}`];
      draft = ''; playedQuestion = null; confirmRestart = false; storyResponse = null; currentStoryHint = false;
    } else if (action === 'story-answer') storyResponse = target.dataset.value;
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
      if (action === 'replace-audio') { changeMode('rules'); notify('已切换到文字练习，音频问题未记为知识错误。'); }
      if (action === 'letter') {
        draft = document.querySelector('#ph-spelling-input')?.value.toLowerCase().replace(/[^a-z]/g, '') ?? draft;
        if ([...draft].filter(letter => letter === target.dataset.value).length < question.letters.filter(letter => letter === target.dataset.value).length) draft += target.dataset.value;
        value.drafts[question.id] = draft;
      }
      if (action === 'erase') { draft = (document.querySelector('#ph-spelling-input')?.value ?? draft).slice(0, -1); value.drafts[question.id] = draft; }
      if (action === 'next-question') { advancePhonicsRound(state, value, phonicsModes.find(entry => entry.id === state.mode)?.name || '起点/字母检查'); draft = ''; playedQuestion = null; }
      if (action === 'question') { const index = Number(target.dataset.index); if (Number.isInteger(index) && index >= 0 && index < value.ids.length) { value.index = index; draft = ''; playedQuestion = null; } }
    } else if (['learn', 'random', 'favorites'].includes(state.mode)) {
      const position = learningSession();
      const word = phonicsWordById.get(position.ids[position.index]);
      if (!word) return true;
      if (action === 'favorite') state.favorites = state.favorites.includes(word.id) ? state.favorites.filter(id => id !== word.id) : [...state.favorites, word.id];
      if (action === 'known' && !state.known.includes(word.id)) state.known.push(word.id);
      if (action === 'later') { state.known = state.known.filter(id => id !== word.id); if (!state.favorites.includes(word.id)) state.favorites.push(word.id); }
      if (['known', 'later', 'next'].includes(action)) { if (position.index < position.ids.length - 1) position.index++; else position.finished = true; }
      if (action === 'previous') position.index = Math.max(0, position.index - 1);
      if (action === 'jump') { const index = Number(target.dataset.index); if (Number.isInteger(index) && index >= 0 && index < position.ids.length) { position.index = index; position.finished = false; } }
    }
    persist(); redraw();
    if (action === 'lesson' || action === 'mode') {
      const heading = document.querySelector('.ph-section-title h2');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }
    return true;
  }

  function change(target) {
    const field = target.dataset.phSetting;
    if (!field) return false;
    stop(); draft = ''; playedQuestion = null; confirmRestart = false; storyResponse = null; currentStoryHint = false;
    if (field === 'lesson' && phonicsLessonById.has(target.value)) state.lessonId = target.value;
    if (field === 'scope' && ['all', 'lesson'].includes(target.value)) state.scope = target.value;
    if (field === 'length' && [5, 10, 20].includes(Number(target.value))) state.length = Number(target.value);
    if (field === 'story') { storyId = target.value; storyResponse = null; currentStoryHint = false; }
    persist(); redraw(); return true;
  }

  function submitForm(event) {
    if (event.target.id !== 'ph-spelling-form') return;
    event.preventDefault();
    draft = new FormData(event.target).get('spelling').trim().toLowerCase();
    const value = round();
    value.drafts[value.ids[value.index]] = draft;
    if (!draft) { notify('先点选字母或输入拼写，再检查。'); return; }
    submit(draft); persist(); redraw();
  }

  function input(target) {
    if (target.id !== 'ph-spelling-input' || state.mode !== 'spelling' && state.mode !== 'review') return;
    const value = round();
    draft = target.value.slice(0, 40);
    value.drafts[value.ids[value.index]] = draft;
    persist();
  }

  function reset() { stop(); state = phonicsDefaults(); draft = ''; playedQuestion = null; storyId = null; storyResponse = null; currentStoryHint = false; confirmRestart = false; persist(); }
  return { render, handle, change, submitForm, input, stop, reset, knownCount: () => state.known.length };
}
