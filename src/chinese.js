import './chinese.css';
import { dictionaryLookup, dictionaryEntries } from './dictionary-data.js';
import { startTopicRound, answerTopic, advanceTopic } from './chinese-engine.js';
import { roundStats } from './engine.js';
import { grantRewards } from './rewards.js';
import { readingText } from './chinese-reading.js';
import { lessonVisual, dictionaryDiagram } from './chinese-visuals.js';
import { practiceLengths } from './chinese-practice.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const control = (action, label, attributes = '', style = 'outline-button') => `<button type="button" class="${style}" data-action="ct-${action}" ${attributes}>${label}</button>`;

function learningCard(topic, state) {
  const read = text => readingText(text, state.showPinyin);
  const lessons = topic.lessons.filter(item => item.category === state.category);
  const lesson = lessons.find(item => item.id === state.lessonId);
  const index = lessons.indexOf(lesson);
  return `<section class="hz-card ct-lesson" aria-label="${topic.name}学习卡"><div class="hz-card-heading"><h2>${topic.categories.find(item => item.id === state.category).name}</h2><span>第 ${index + 1} / ${lessons.length} 项</span></div>
    <div class="hz-item-list ct-lesson-list" aria-label="选择学习内容">${lessons.map(item => control('lesson', `${read(item.title)}${state.known.includes(item.id) ? ' ✓' : ''}`, `data-id="${item.id}" aria-label="${escape(item.title)}" aria-pressed="${state.lessonId === item.id}"`, 'hz-chip')).join('')}</div>
    <h3 aria-label="${escape(lesson.title)}">${read(lesson.title)}</h3><p>${read(lesson.body)}</p>
    ${lessonVisual(topic, lesson, state.showPinyin)}
    <ul class="ct-examples">${lesson.examples.map(example => `<li>${read(example)}</li>`).join('')}</ul>
    <div class="hz-note"><strong>说一说，试一试</strong><p>${read(lesson.task)}</p><p class="hz-caption">这是开放表达练习，可以说给家人听或写在纸上，不自动评分。</p></div>
    <div class="hz-actions hz-card-footer">${control('previous', '上一个', index === 0 ? 'disabled' : '')}${control('known', state.known.includes(lesson.id) ? '已经认识啦 ✓' : '我认识啦', `aria-pressed="${state.known.includes(lesson.id)}"`, 'soft-button mint')}${control('next', '下一个', index === lessons.length - 1 ? 'disabled' : '')}</div>
    <div class="hz-actions">${control('start', '练练这一节', `data-id="${state.category}"`, 'solid-button')}</div></section>`;
}

function quizCard(topic, state) {
  const read = text => readingText(text, state.showPinyin);
  const round = state.round;
  if (round.finished) {
    const stats = roundStats(round);
    return `<section class="hz-card ct-result"><h2>这一轮完成啦！</h2><p>共 ${stats.total} 题，首次答对 ${stats.correct} 题，首次跳过 ${stats.skipped} 题。</p><p>重试不覆盖首次成绩；错题需要在新一轮复习中独立答对才移出。</p><div class="hz-actions">${control('learn', '回到学习')}${control('start', '再练一轮', `data-id="${round.scope}" ${round.scope === 'review' && !state.mistakes.length ? 'disabled' : ''}`, 'solid-button')}</div></section>`;
  }
  const question = round.questions[round.index];
  return `<section class="hz-card ct-quiz" aria-label="${topic.name}练习"><div class="hz-card-heading"><h2>${round.scope === 'review' ? '错题复习' : '动脑小练习'}</h2><span>第 ${round.index + 1} / ${round.questions.length} 题</span></div>
    ${question.display ? `<p class="ct-context">${read(question.display)}</p>` : ''}<h3 class="ct-prompt">${read(question.prompt)}</h3>
    <div class="hz-options">${question.options.map(option => control('answer', read(option), `data-value="${escape(option)}" aria-label="${escape(option)}" ${round.revealed ? 'disabled' : ''}`, `hz-option ${round.revealed && option === question.answer ? 'is-correct' : round.selected === option ? 'is-wrong' : ''}`)).join('')}</div>
    <div class="hz-feedback" role="status">${round.revealed ? `<strong>${round.selected === question.answer ? '答对啦！' : '先认识答案，再来练一练。'}</strong><p>${read(question.explanation)}</p>` : round.responses[round.index] ? '<strong>再试一次。读一读题目，也可以先看答案。</strong>' : '仔细观察，选一个答案。'}</div>
    <div class="hz-actions">${control('learn', '回到学习')}${round.revealed ? control('advance', round.index === round.questions.length - 1 ? '查看本轮结果' : '下一题', '', 'solid-button') : control('skip', '先看答案')}</div></section>`;
}

function lookupCard(state) {
  const read = text => readingText(text, state.showPinyin);
  const { method, selections } = state.lookup;
  const lookup = dictionaryLookup(method, selections);
  const labels = { initial: '先选大写音序', syllable: '再选不带声调的音节', text: '找到汉字，点击查看释义', radicalStrokes: '先数部首笔画', radical: '在部首目录中找到部首', remaining: '再数除去部首后的笔画' };
  return `<section class="hz-card ct-lookup"><h2>查字小实验</h2><p>这是含 ${dictionaryEntries.length} 个示例字的小型索引，不是完整字典。纸质字典还需要按索引页码翻到正文，各版本页码不同，这里不编造页码。</p>
    ${dictionaryDiagram(method, state.showPinyin)}
    <div class="hz-actions">${control('lookup-method', '音序查字法', `data-id="sound" aria-pressed="${method === 'sound'}"`, 'hz-chip')}${control('lookup-method', '部首查字法', `data-id="radical" aria-pressed="${method === 'radical'}"`, 'hz-chip')}</div>
    <p class="ct-lookup-path" role="status">已选：${lookup.selections.map(escape).join(' → ') || '还没有选择'}</p>
    ${lookup.entry ? `<article class="ct-entry"><h3>${lookup.entry.text} <small>${lookup.entry.pinyin}</small></h3><p>部首：${lookup.entry.radical}（${lookup.entry.radicalStrokes} 画） · 总笔画：${lookup.entry.strokes}</p><ol>${lookup.entry.meanings.map(([meaning, sentence]) => `<li><strong>${read(meaning)}</strong><p>${read(sentence)}</p></li>`).join('')}</ol><p class="hz-caption">适龄简释，不包含全部读音和义项。</p></article>` : `<h3 class="ct-prompt">${labels[lookup.field]}</h3><div class="hz-item-list">${lookup.options.map(option => control('lookup-pick', `${escape(option)}${['radicalStrokes', 'remaining'].includes(lookup.field) ? ' 画' : ''}`, `data-value="${escape(option)}"`, 'hz-chip')).join('')}</div>`}
    <div class="hz-actions">${control('lookup-back', '退回一步', !selections.length ? 'disabled' : '')}${control('lookup-reset', '重新查找')}${control('learn', '回到学习')}</div></section>`;
}

export function renderTopic(topic, state) {
  return `<section class="chinese-topic" data-topic="${topic.id}"><div class="page-heading"><div><div class="eyebrow"><span></span>第一阶段 · 字词基础</div><h1>${topic.name}<span class="heading-flower">✿</span></h1><p>${topic.description}</p></div></div>
    <nav class="hz-categories" aria-label="${topic.name}小节">${topic.categories.map(category => control('category', `<strong>${category.name}</strong>`, `data-id="${category.id}" aria-pressed="${state.view === 'learn' && state.category === category.id}"`, 'hz-category')).join('')}</nav>
    <div class="ct-tools" aria-label="学习辅助">${control('reading', state.showPinyin ? '拼音辅助：开' : '拼音辅助：关', `aria-pressed="${state.showPinyin}"`)}<span>新一轮题数：</span>${practiceLengths.map(length => control('length', `${length} 题`, `data-value="${length}" aria-pressed="${state.practiceLength === length}"`, 'hz-chip')).join('')}<small>切换题数用于下一轮，当前题目会保留。</small></div>
    <div class="hz-layout"><div>${state.view === 'quiz' ? quizCard(topic, state) : state.view === 'lookup' ? lookupCard(state) : learningCard(topic, state)}</div><aside class="hz-sidebar">
    <section class="hz-card"><h2>我的学习足迹</h2><p>自评认识 ${state.known.length} / ${topic.lessons.length} 项</p><progress value="${state.known.length}" max="${topic.lessons.length}" aria-label="自评认识进度"></progress><p>本主题题库 ${topic.questions.length} 题<br>当前小节 ${topic.questions.filter(item => item.category === state.category).length} 题</p><p>自评认识与首次答对分开记录，开始新一轮时优先抽取未练题。</p><div class="hz-sidebar-actions">
      ${topic.id === 'dictionary' ? control('lookup', '查字小实验', '', 'solid-button') : ''}${control('start', `综合练习 · 最多 ${state.practiceLength} 题`, 'data-id="all"', 'solid-button')}${control('start', `本主题错题（${state.mistakes.length}）`, `data-id="review" ${state.mistakes.length ? '' : 'disabled'}`)}${state.round && !state.round.finished && state.view !== 'quiz' ? control('resume', '继续上次练习') : ''}<button type="button" class="outline-button" data-action="topic-records">字词学习记录</button></div>
      ${state.round && !state.round.finished ? '<p class="hz-caption">开始新练习会替换未完成的一轮；想保留当前题目，可继续上次练习。</p>' : ''}</section>
    <section class="hz-card hz-note"><h2>按自己的节奏学</h2><p>每一小节都能直接开始，不必依次通关。</p><p>也可以穿插读古诗、朗读、说一句话或写下今天的小发现。</p><p>进度保存在当前浏览器，清空本机记录会一并清除。</p></section></aside></div></section>`;
}

export function handleTopicAction(root, topic, action, data) {
  const state = root.topics[topic.id];
  const outcome = {};
  const lesson = topic.lessons.find(item => item.id === state.lessonId);
  if (action === 'ct-reading') state.showPinyin = !state.showPinyin;
  if (action === 'ct-length' && practiceLengths.includes(Number(data.value))) state.practiceLength = Number(data.value);
  if (action === 'ct-category' && topic.categories.some(item => item.id === data.id)) { state.category = data.id; state.lessonId = topic.lessons.find(item => item.category === data.id).id; state.view = 'learn'; }
  if (action === 'ct-lesson' && topic.lessons.some(item => item.id === data.id && item.category === state.category)) state.lessonId = data.id;
  if (['ct-previous', 'ct-next'].includes(action)) {
    const lessons = topic.lessons.filter(item => item.category === state.category);
    const next = lessons[lessons.indexOf(lesson) + (action === 'ct-next' ? 1 : -1)];
    if (next) state.lessonId = next.id;
  }
  if (action === 'ct-known') {
    if (!state.known.includes(lesson.id)) state.known.push(lesson.id);
    outcome.reward = grantRewards(root, { type: 'recognize', item: { id: lesson.id, text: `${topic.name} · ${lesson.title}` } });
  }
  if (action === 'ct-start') startTopicRound(topic, state, data.id);
  if (action === 'ct-learn') state.view = 'learn';
  if (action === 'ct-resume' && state.round && !state.round.finished) state.view = 'quiz';
  if (['ct-answer', 'ct-skip'].includes(action)) {
    const result = answerTopic(state, action === 'ct-skip' ? null : data.value);
    if (result?.correct) { outcome.correct = true; outcome.reward = grantRewards(root, { type: 'answer', question: result.question, reviewed: result.reviewed }); }
  }
  if (action === 'ct-advance') {
    const history = advanceTopic(topic, state);
    if (history) {
      root.history.push(history); root.history = root.history.slice(-100);
      outcome.reward = grantRewards(root, { type: 'round', mode: topic.id, name: topic.name, total: history.total, answered: state.round.responses.filter(response => response && !response.skipped).length });
    }
  }
  if (topic.id === 'dictionary') {
    if (action === 'ct-lookup') state.view = 'lookup';
    if (action === 'ct-lookup-method' && ['sound', 'radical'].includes(data.id)) state.lookup = { method: data.id, selections: [] };
    if (action === 'ct-lookup-reset') state.lookup.selections = [];
    if (action === 'ct-lookup-back') state.lookup.selections.pop();
    if (action === 'ct-lookup-pick' && dictionaryLookup(state.lookup.method, state.lookup.selections).options.includes(data.value)) state.lookup.selections.push(data.value);
  }
  return outcome;
}
