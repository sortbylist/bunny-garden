import './chinese.css';
import { dictionaryLookup, dictionaryEntries } from './dictionary-data.js';
import { startTopicRound, answerTopic, advanceTopic, updateTopicActivity } from './chinese-engine.js';
import { roundStats } from './engine.js';
import { grantRewards } from './rewards.js';
import { readingText } from './chinese-reading.js';
import { lessonVisual, dictionaryDiagram } from './chinese-visuals.js';
import { mathVisual } from './math-visuals.js';
import { icon, bunny } from './icons.js';
import { literacySupplement } from './chinese-literacy.js';
import { readingPassage } from './reading-view.js';
import { learningAnswerLabel, learningBook, learningCardFooter, learningPosition, learningTokenClass, learningTools, reviewShortcut } from './learning-ui.js';
import { renderCurriculum } from './navigation.js';
import { englishLessonBody, englishActivity, englishQuizAudio, englishChoice, englishText } from './english-learning.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const control = (action, label, attributes = '', style = 'outline-button') => `<button type="button" class="${style}" data-action="ct-${action}" ${attributes}>${label}</button>`;
const isLiteracyTopic = topic => topic.stage.startsWith('第三阶段');
const isMathTopic = topic => topic.subject === 'math';
const topicText = (topic, state) => topic.subject === 'chinese' || !topic.subject ? text => readingText(text, state.showPinyin) : escape;

function activityCard(lesson, state) {
  const activity = lesson.activity;
  if (!activity) return '<p class="hz-caption">这是开放表达练习，可以说给家人听或写在纸上，不自动评分。</p>';
  const saved = state.activities[lesson.id] || { text: '', order: [], checked: false, showExample: false };
  if (activity.type === 'math') return `${control('activity-example', saved.showExample ? '收起参考思路' : '看看参考思路', `aria-expanded="${saved.showExample}"`)}
    ${saved.showExample ? `<p class="ct-sample" role="status">${escape(activity.sample)}</p>` : '<p class="hz-caption">先自己想一想，再展开思路检查。</p>'}`;
  if (activity.type === 'write') return `<label class="ct-draft-label" for="ct-draft">${escape(activity.label || '我的句子（最多 500 字）')}</label><textarea id="ct-draft" data-action="ct-draft" maxlength="500" rows="4" placeholder="把你的想法写在这里，也可以先说给家人听。">${escape(saved.text)}</textarea>
    <p class="hz-caption">草稿随学习进度保存在当前浏览器。开放表达不自动评分，也不以是否写得和例句一样来判断对错。</p>
    <ul>${activity.checklist.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
    ${control('activity-example', saved.showExample ? '收起参考表达' : '看看参考表达', `aria-expanded="${saved.showExample}"`)}
    ${saved.showExample ? `<p class="ct-sample">参考表达：${escape(activity.sample)}</p>` : ''}`;
  const sentence = saved.order.map(index => activity.tokens[index]).join('');
  const paragraphOrder = activity.unit === '句段';
  const unit = paragraphOrder ? '句段' : '词块';
  return `<p>依次点击${unit}，不用拖动；可以撤回或重排。</p>
    <div class="hz-item-list ${paragraphOrder ? 'ct-reading-order' : ''}" aria-label="待选${unit}">${activity.tokens.map((token, index) => control('activity-pick', escape(token), `data-value="${index}" ${saved.order.includes(index) ? 'disabled' : ''}`, `hz-chip${learningTokenClass(token)}`)).join('')}</div>
    <p class="ct-built" aria-label="${paragraphOrder ? '排好的句段' : '拼出的句子'}">${escape(sentence || `还没有选择${unit}`)}${sentence ? activity.ending : ''}</p>
    <div class="hz-actions">${control('activity-undo', '撤回一个', saved.order.length ? '' : 'disabled')}${control('activity-clear', '重新排列')}${control('activity-check', '检查排列', saved.order.length === activity.tokens.length ? '' : 'disabled', 'solid-button')}${control('activity-example', saved.showExample ? '收起参考排列' : '看看参考排列', `aria-expanded="${saved.showExample}"`)}</div>
    <p class="ct-order-feedback" role="status">${saved.checked ? activity.answers.includes(sentence) ? paragraphOrder ? '顺序理清啦！再说说你找到了哪些线索。' : '这句话通顺啦！再完整读一遍。' : paragraphOrder ? '再看看时间和事情发展的线索，可以撤回再排。' : '再想一想谁做什么、词语怎样搭配，可以撤回再排。' : `每个${unit}用一次，再检查${paragraphOrder ? '前后顺序' : '句子的意思'}。`}</p>
    ${saved.showExample ? `<p class="ct-sample">参考排列：${activity.answers.map(answer => escape(answer + activity.ending)).join(' / ')}</p>` : ''}<p class="hz-caption">这是学习尝试，不计入首次答题成绩。${paragraphOrder ? '按这篇短文的时间或事情发展顺序排列。' : '时间词有时可以放在不同位置。'}</p>`;
}

export function topicLearningCard(topic, state) {
  const read = topicText(topic, state);
  const lessons = topic.lessons.filter(item => item.category === state.category);
  const lesson = lessons.find(item => item.id === state.lessonId);
  const index = lessons.indexOf(lesson);
  const literacy = isLiteracyTopic(topic);
  const category = topic.categories.find(item => item.id === state.category);
  const english = topic.subject === 'english';
  const title = item => english && !item.lines ? englishText(item.title) : read(item.title);
  const picker = `<div class="hz-item-list ct-lesson-list" aria-label="选择学习内容">${lessons.map(item => control('lesson', `${title(item)}${state.known.includes(item.id) ? ' ✓' : ''}`, `data-id="${item.id}" ${english && !item.lines ? 'lang="en"' : ''} aria-label="${escape(item.title)}" aria-pressed="${state.lessonId === item.id}"`, `hz-chip${learningTokenClass(item.title)}`)).join('')}</div>`;
  const heading = `<div class="card-topline"><h2 class="category-badge" data-activity-heading tabindex="-1">${icon(category.icon || 'flower')}学习 · ${escape(category.name)}</h2>${learningPosition(index, lessons.length)}${state.cardFavorite('lesson', lesson.id)}</div>`;
  if (english) return `<section class="hz-card ct-lesson study-card ct-sentence-card" aria-label="${topic.name}学习卡">${heading}
    <div class="ct-lesson-intro"><h3 class="${learningTokenClass(lesson.title).trim()}">${title(lesson)}</h3><p>${read(lesson.body)}</p></div>
    ${englishLessonBody(lesson)}${englishActivity(lesson)}
    ${state.preview ? '' : learningCardFooter('ct', { known: state.known.includes(lesson.id), category: state.category, index, total: lessons.length, hasPractice: topic.questions.some(question => question.category === state.category),
      ...(lesson.lines ? { knownLabel: '我能说啦', confirmedLabel: '已自评能说 ✓' } : lesson.clip ? { knownLabel: '我能听懂啦', confirmedLabel: '已自评听懂 ✓' } : {}) })}</section>
    ${state.preview ? '' : `<section class="pinyin-map ct-sentence-lessons learning-lesson-map" aria-label="本节学习卡"><div class="section-title"><h2>${icon('grid')}本节学习卡</h2></div>${picker}</section>`}`;
  return `<section class="hz-card ct-lesson study-card ct-sentence-card" aria-label="${topic.name}学习卡">${heading}
    <div class="ct-lesson-intro"><h3 class="${learningTokenClass(lesson.title).trim()}" aria-label="${escape(lesson.title)}">${read(lesson.title)}</h3>${literacySupplement(lesson, state)}<p>${read(lesson.body)}</p></div>
    ${topic.subject === 'math' ? mathVisual(lesson.visual) : lessonVisual(topic, lesson, state.showPinyin)}
    ${!literacy ? `<div class="section-title ct-example-heading"><h4>${icon('book')}${isMathTopic(topic) ? '看一看算例' : '读一读例句'}</h4><span>${isMathTopic(topic) ? '想清方法，再动笔算' : '读出意思，也读出语气'}</span></div>` : ''}
    <ul class="ct-examples">${lesson.examples.map(example => `<li>${read(example)}</li>`).join('')}</ul>
    <div class="hz-note ct-activity"><strong class="ct-activity-heading">${icon('pen')}说一说，试一试</strong><p>${read(lesson.task)}</p>${activityCard(lesson, state)}</div>
    ${state.preview ? '' : learningCardFooter('ct', { known: state.known.includes(lesson.id), category: state.category, index, total: lessons.length, hasPractice: topic.questions.some(question => question.category === state.category) })}</section>
    ${state.preview ? '' : `<section class="pinyin-map ct-sentence-lessons learning-lesson-map" aria-label="本节学习卡"><div class="section-title"><h2>${icon('grid')}本节学习卡</h2><span>每一张都可以直接开始</span></div>${picker}</section>`}`;
}

export function topicQuizCard(topic, state) {
  const round = state.round;
  if (round.finished) {
    const stats = roundStats(round);
    return `<section class="hz-card ct-result result-card ct-sentence-card">${bunny()}<h2 data-activity-heading tabindex="-1">这一轮完成啦！</h2><p>共 ${stats.total} 题，首次答对 ${stats.correct} 题，首次跳过 ${stats.skipped} 题。</p><p>重试不覆盖首次成绩；错题需要在新一轮复习中独立答对才移出。</p><div class="hz-actions">${control('learn', '回到学习')}${control('start', '再练一轮', `data-id="${round.scope}" ${round.scope === 'review' && !state.mistakes.length ? 'disabled' : ''}`, 'solid-button')}${reviewShortcut(topic.id, topic.categories.find(category => category.id === round.scope)?.id)}</div></section>`;
  }
  const question = round.questions[round.index];
  const read = topic.id === 'character-readings' && question.category === 'polyphones' && !round.revealed
    ? escape : topicText(topic, state);
  const english = topic.subject === 'english';
  const waitingForAudio = english && question.clip && !state.heard && !round.revealed;
  const title = state.label || (round.scope === 'review' ? '错题复习' : topic.categories.find(category => category.id === round.scope)?.name || '综合');
  return `<section class="hz-card ct-quiz quiz-card ct-sentence-card" aria-label="${topic.name}练习"><div class="hz-card-heading quiz-top"><h2 class="category-badge" data-activity-heading tabindex="-1">${icon('pen')}练习 · ${escape(title)}</h2>${learningPosition(round.index, round.questions.length, { practice: true })}${state.cardFavorite('question', question.id)}</div>
    ${question.passage ? readingPassage(question.passage, state.showPinyin, round.revealed ? question.evidence : []) : ''}
    ${question.display ? `<p class="ct-context">${english ? englishText(question.display) : read(question.display)}</p>` : ''}<h3 class="ct-prompt">${read(question.prompt)}</h3>
    ${english ? englishQuizAudio(question, round.revealed, state.heard, state.preview) : ''}
    <div class="hz-options answer-grid">${question.options.map((option, index) => {
      const choice = question.choices?.find(item => item.id === option);
      return control('answer', learningAnswerLabel(index, choice ? englishChoice(choice) : read(option)),
        `data-value="${escape(option)}" ${choice?.language ? `lang="${choice.language}" ` : ''}aria-label="${escape(choice?.label || option)}" ${round.revealed || waitingForAudio || state.passive ? 'disabled' : ''}`,
        `hz-option answer-option${choice ? '' : learningTokenClass(option)} ${round.revealed && option === question.answer ? 'is-correct correct-answer' : round.selected === option ? 'is-wrong wrong-answer' : ''}`);
    }).join('')}</div>
    <div class="hz-feedback answer-feedback ${round.revealed && round.selected === question.answer ? 'success' : round.revealed || round.responses[round.index] ? 'warning' : ''}" role="status">${round.revealed ? `<strong>${round.selected === question.answer ? '答对啦！' : '先认识答案，再来练一练。'}</strong><p>${read(question.explanation)}</p>` : round.responses[round.index] ? `<strong>${question.clip ? '再听一次或先看答案。' : '再试一次。读一读题目，也可以先看答案。'}</strong>` : waitingForAudio ? '先听完题目，再选一个答案。' : '仔细观察，选一个答案。'}</div>
    ${state.preview ? '' : `<div class="hz-actions quiz-actions">${control('learn', '回到学习')}${round.revealed ? control('advance', round.index === round.questions.length - 1 ? '查看本轮结果' : '下一题', '', 'solid-button') : control('skip', '先看答案', waitingForAudio ? 'disabled' : '')}</div>`}</section>`;
}

export function dictionaryEntryCard(entry, read) {
  return `<article class="ct-entry"><h3>${entry.text} <small>${entry.pinyin}</small></h3><p>部首：${entry.radical}（${entry.radicalStrokes} 画） · 总笔画：${entry.strokes}</p><ol>${entry.meanings.map(([meaning, sentence]) => `<li><strong>${read(meaning)}</strong><p>${read(sentence)}</p></li>`).join('')}</ol><p class="hz-caption">适龄简释，不包含全部读音和义项。</p></article>`;
}

export function topicClassName(topic) {
  const classes = ['chinese-topic', 'ct-sentence-topic'];
  if (isLiteracyTopic(topic)) classes.push('ct-literacy-topic');
  if (isMathTopic(topic)) classes.push('math-topic');
  if (topic.subject === 'english') classes.push('en-topic');
  return classes.join(' ');
}

function lookupCard(state) {
  const read = text => readingText(text, state.showPinyin);
  const { method, selections } = state.lookup;
  const lookup = dictionaryLookup(method, selections);
  const labels = { initial: '先选大写音序', syllable: '再选不带声调的音节', text: '找到汉字，点击查看释义', radicalStrokes: '先数部首笔画', radical: '在部首目录中找到部首', remaining: '再数除去部首后的笔画' };
  return `<section class="hz-card ct-lookup"><div class="card-topline"><h2 data-activity-heading tabindex="-1">学习 · 查字小实验</h2>${lookup.entry ? state.cardFavorite('entry', lookup.entry.text) : ''}</div><p>这是含 ${dictionaryEntries.length} 个示例字的小型索引，不是完整字典。纸质字典还需要按索引页码翻到正文，各版本页码不同，这里不编造页码。</p>
    ${dictionaryDiagram(method, state.showPinyin)}
    <div class="hz-actions">${control('lookup-method', '音序查字法', `data-id="sound" aria-pressed="${method === 'sound'}"`, 'hz-chip')}${control('lookup-method', '部首查字法', `data-id="radical" aria-pressed="${method === 'radical'}"`, 'hz-chip')}</div>
    <p class="ct-lookup-path" role="status">已选：${lookup.selections.map(escape).join(' → ') || '还没有选择'}</p>
    ${lookup.entry ? dictionaryEntryCard(lookup.entry, read) : `<h3 class="ct-prompt">${labels[lookup.field]}</h3><div class="hz-item-list">${lookup.options.map(option => control('lookup-pick', `${escape(option)}${['radicalStrokes', 'remaining'].includes(lookup.field) ? ' 画' : ''}`, `data-value="${escape(option)}"`, `hz-chip${learningTokenClass(option)}`)).join('')}</div>`}
    <div class="hz-actions">${control('lookup-back', '退回一步', !selections.length ? 'disabled' : '')}${control('lookup-reset', '重新查找')}${control('learn', '回到学习')}</div></section>`;
}

export function renderTopic(topic, state, garden, navigation) {
  const math = isMathTopic(topic);
  const english = topic.subject === 'english';
  const tools = learningTools('ct', state);
  const practicing = state.view === 'quiz';
  const category = practicing ? state.round.scope : state.category;
  const paired = state.view !== 'lookup' && topic.questions.some(question => question.category === category);
  const content = practicing ? topicQuizCard(topic, state) : state.view === 'lookup' ? lookupCard(state) : topicLearningCard(topic, state);
  const book = learningBook({ action: 'ct-page', category, page: practicing ? 'practice' : 'learn', paired, content });
  const sticker = `<div class="heading-sticker">${icon('sprout')}<span>今天也要<br><b>快乐生长</b></span></div>`;
  return `<section class="${topicClassName(topic)}" data-topic="${topic.id}"><div class="page-heading ${math ? '' : 'learning-heading'}"><div class="${math ? '' : 'learning-heading-copy'}"><div class="eyebrow"><span></span>${escape(topic.stage)}</div><h1>${topic.name}<span class="heading-flower">✿</span></h1><p>${topic.description}</p></div>${math ? sticker : `<div class="learning-heading-actions">${sticker}</div>`}</div>
    ${renderCurriculum(navigation, { id: `curriculum-${topic.id}`,
      selected: category === 'review' ? null : category,
      learning: topic.categories.map(category => ({ ...category, action: 'ct-category' })),
      practice: topic.questions.length ? [{ id: 'all', name: topic.categories.length > 1 ? '综合练习' : `${topic.name}练习`, icon: 'pen', action: 'ct-start' }] : [],
    })}
    <div class="learning-layout"><div class="learning-main" role="region" aria-label="${escape(topic.name)}">${book}${tools}
    ${topic.id === 'dictionary' && state.view === 'learn' ? `<div class="hz-actions">${control('lookup', '查字小实验')}</div>` : ''}</div><aside class="learning-aside">
    ${garden}
    <section class="hz-card hz-note"><h2>按自己的节奏学</h2><p>每一小节都能直接开始，不必依次通关。</p><p>${math ? '可以摆小棒、画图或在纸上列竖式，也试着说说自己的计算方法。' : english ? '找出身边的物品做一做，也可以和家人轮流说。' : '也可以穿插读古诗、朗读、说一句话或写下今天的小发现。'}</p><p>进度保存在当前浏览器，清空本机记录会一并清除。</p></section></aside></div></section>`;
}

export function handleTopicAction(root, topic, action, data) {
  const state = root.topics[topic.id];
  const outcome = {};
  const lesson = topic.lessons.find(item => item.id === state.lessonId);
  if (action.startsWith('ct-activity-')) updateTopicActivity(topic, state, action.slice('ct-activity-'.length), data.value);
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
  if (action === 'ct-page' && data.id === 'learn') state.view = 'learn';
  if (action === 'ct-page' && data.id === 'practice') startTopicRound(topic, state, data.category, state.practiceLength, false);
  if (action === 'ct-start') startTopicRound(topic, state, data.id, state.practiceLength, state.view === 'quiz' && state.round.scope === data.id && state.round.finished);
  if (action === 'ct-learn') state.view = 'learn';
  if (['ct-answer', 'ct-skip'].includes(action)) {
    const result = answerTopic(state, action === 'ct-skip' ? null : data.value);
    if (result?.correct) { outcome.correct = true; outcome.reward = grantRewards(root, { type: 'answer', question: result.question, reviewed: result.reviewed }); }
  }
  if (action === 'ct-advance') {
    const history = advanceTopic(topic, state);
    if (history) {
      root.history.push(history); root.history = root.history.slice(-100);
      outcome.reward = grantRewards(root, { type: 'round', topicId: topic.id, questions: state.round.questions, responses: state.round.responses, mode: topic.id, name: topic.name, total: history.total, answered: state.round.responses.filter(response => response && !response.skipped).length });
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
