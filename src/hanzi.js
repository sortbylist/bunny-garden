import './hanzi.css';
import { hanziCategories, hanziLessons, hanziQuestions, strokes } from './hanzi-data.js';
import { startHanziRound, answerHanzi, advanceHanziRound } from './hanzi-engine.js';
import { roundStats } from './engine.js';
import { grantRewards } from './rewards.js';
import { readingText } from './chinese-reading.js';
import { practiceLengths } from './chinese-practice.js';
import { icon } from './icons.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const control = (action, label, attributes = '', className = 'outline-button') => `<button type="button" data-action="hz-${action}" class="${className}" ${attributes}>${label}</button>`;
const currentLesson = state => hanziLessons.find(item => item.id === state.lessonId);

function writingGrid(paths, step, label) {
  return `<svg class="hz-writing-grid" viewBox="0 0 100 100" role="img" aria-label="${escape(label)}">
    <rect x="1" y="1" width="98" height="98" rx="3" fill="#fffdf9" stroke="#d8bdcb"/>
    <path d="M50 1 V99 M1 50 H99 M1 1 L99 99 M99 1 L1 99" fill="none" stroke="#ecdee5" stroke-dasharray="2 2"/>
    <g fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      ${paths.map(item => `<path d="${item.path}" stroke="#e9e2e5"/>`).join('')}
      ${paths.slice(0, step).map((item, index) => `<path class="${index === step - 1 ? 'hz-current-stroke' : ''}" d="${item.path}" pathLength="1" stroke="${index === step - 1 ? '#9b476f' : '#504450'}"/>`).join('')}
    </g>
    ${step > 0 ? (() => { const [, horizontal, vertical] = paths[step - 1].path.match(/^M(\d+) (\d+)/); return `<circle cx="${horizontal}" cy="${vertical}" r="2" fill="#4d7a5b"/>`; })() : ''}
  </svg>`;
}

function lessonContent(state, lesson) {
  const read = text => readingText(text, state.showPinyin);
  if (lesson.category === 'strokes') return `
    <div class="hz-demo">${writingGrid([lesson], 1, `${lesson.name}的写法`)}<div><h3>${read(lesson.name)}</h3><p>${read(lesson.tip)}</p><p>${read(lesson.example)}</p><p class="hz-caption">绿色小点是起笔位置。试着用手指在空中写一写。</p></div></div>`;
  if (lesson.category === 'order') return `
    <div class="hz-demo">${writingGrid(lesson.strokes, state.strokeStep, `“${lesson.text}”的笔顺示意，已写 ${state.strokeStep} / ${lesson.strokes.length} 笔`)}<div><h3>${lesson.text} <small>${lesson.strokes.length} 笔</small></h3><p><strong>${read(lesson.rule)}</strong></p><p>${read(lesson.tip)}</p><p class="hz-caption">绿色小点表示当前一笔的起点，紫色表示当前一笔。</p></div></div>
    <p class="hz-step-status" role="status">${state.strokeStep ? `第 ${state.strokeStep} / ${lesson.strokes.length} 笔：${lesson.strokes[state.strokeStep - 1].name}` : '准备好了吗？点“下一笔”开始。'}</p>
    <div class="hz-actions">${control('stroke-reset', '从头看', state.strokeStep === 0 ? 'disabled' : '')}${control('stroke-previous', '上一笔', state.strokeStep === 0 ? 'disabled' : '')}${control('stroke-next', '下一笔', state.strokeStep === lesson.strokes.length ? 'disabled' : '', 'solid-button')}</div>
    <div class="hz-stroke-list" aria-label="逐笔选择">${lesson.strokes.map((item, index) => control('stroke-jump', `${index + 1}. ${item.name}`, `data-index="${index + 1}" aria-pressed="${state.strokeStep === index + 1}"`, 'hz-chip')).join('')}</div>
    <p class="hz-caption">按笔顺观察的线条示意。看完后，可以拿纸和笔试写一次。</p>`;
  if (lesson.category === 'radicals') return `
    <div class="hz-demo"><div class="hz-character">${lesson.text}</div><div><h3>${read(lesson.name)}</h3><p>${read(lesson.tip)}</p><p>读一读：${read(lesson.word)}</p></div></div>
    <div class="hz-examples">${lesson.examples.map(text => `<span>${text}</span>`).join('')}</div>
    <div class="hz-note"><strong>偏旁和部首，有什么不同？</strong><p>偏旁是合体字的组成部分。部首是字典给汉字归类、方便查找的标目，二者不完全相同。</p><p>在这里，${lesson.text}既是这些例字的偏旁，也是它们的部首。偏旁可以帮助猜字义，还要结合词语确认。</p></div>`;
  const category = hanziCategories.find(item => item.id === lesson.category);
  const positions = lesson.category === 'left-right' ? ['左边', '右边'] : ['上面', '下面'];
  return `<div class="hz-demo"><div class="hz-character">${lesson.text}</div><div><h3>${category.name}</h3><p>${lesson.category === 'single' ? `“${lesson.text}”是独体字，由笔画构成一个整体。` : `“${lesson.text}”可以按${lesson.category === 'left-right' ? '左右' : '上下'}分成两个部分。`}</p><p>${category.description}。</p></div></div>
    ${lesson.category === 'single' ? '<div class="hz-note">观察整个字的笔画位置。独体字的笔画有多有少，不能只靠笔画数量判断结构。</div>' : `<div class="hz-parts ${lesson.category}">${lesson.parts.map((part, index) => `<div><span>${positions[index]}</span><b>${part}</b></div>`).join('')}</div><p class="hz-caption">部件图表示位置关系，写字时还要注意各部分的大小和穿插。</p>`}
    <div class="hz-note">想一想：还能找到一个${category.name}的字吗？说给身边的人听。</div>`;
}

function learningCard(state) {
  const lesson = currentLesson(state);
  const items = hanziLessons.filter(item => item.category === state.category);
  const index = items.indexOf(lesson);
  return `<section class="hz-card" aria-label="汉字学习卡">
    <div class="hz-card-heading"><h2>${hanziCategories.find(item => item.id === state.category).name}</h2><span>第 ${index + 1} / ${items.length} 个</span></div>
    <div class="hz-item-list" aria-label="选择学习内容">${items.map(item => control('lesson', `${escape(item.title)}${state.known.includes(item.id) ? ' ✓' : ''}`, `data-id="${item.id}" aria-pressed="${item.id === lesson.id}"`, 'hz-chip')).join('')}</div>
    ${lessonContent(state, lesson)}
    <div class="hz-actions hz-card-footer">${control('previous', '上一个', index === 0 ? 'disabled' : '')}${control('known', state.known.includes(lesson.id) ? '已经认识啦 ✓' : '我认识啦', `aria-pressed="${state.known.includes(lesson.id)}"`, 'soft-button mint')}${control('next', '下一个', index === items.length - 1 ? 'disabled' : '')}</div>
    <div class="hz-actions">${control('start', '练练这一节', `data-id="${state.category}"`, 'solid-button')}</div>
  </section>`;
}

function quizCard(state) {
  const read = text => readingText(text, state.showPinyin);
  const round = state.round;
  if (round.finished) {
    const stats = roundStats(round);
    return `<section class="hz-card hz-result" aria-label="汉字练习结果"><h2>这一轮完成啦！</h2><p class="hz-result-score">${stats.correct} / ${stats.total}</p><p>首次答对 ${stats.correct} 题，首次跳过 ${stats.skipped} 题。</p><p>答错后再试也是进步。错题会留在汉字错题本中，独立答对后移出。</p><div class="hz-actions">${control('learn', '回到学习')}${control('start', '再练一轮', `data-id="${round.scope}" ${round.scope === 'review' && !state.mistakes.length ? 'disabled' : ''}`, 'solid-button')}${control('start', `${icon('notebook')}汉字错题本（${state.mistakes.length}）`, `data-id="review" ${state.mistakes.length ? '' : 'disabled'}`)}</div></section>`;
  }
  const question = round.questions[round.index];
  const response = round.responses[round.index];
  const sample = strokes.find(item => item.id === question.strokeId);
  return `<section class="hz-card hz-quiz" aria-label="汉字练习"><div class="hz-card-heading"><h2>${round.scope === 'review' ? '汉字错题本' : '汉字小练习'}</h2><span>第 ${round.index + 1} / ${round.questions.length} 题</span></div>
    <h3 class="question-prompt">${read(question.prompt)}</h3>
    ${sample ? writingGrid([sample], 1, '待辨认的笔画，请观察形状') : `<div class="hz-question-character">${question.display}</div>`}
    <div class="hz-options">${question.options.map(option => control('answer', read(option), `data-value="${escape(option)}" aria-label="${escape(option)}" ${round.revealed ? 'disabled' : ''}`, `hz-option ${round.revealed && option === question.answer ? 'is-correct' : round.selected === option ? 'is-wrong' : ''}`)).join('')}</div>
    <div class="hz-feedback" role="status">${round.revealed ? `<strong>${round.selected === question.answer ? '答对啦！' : '先认识答案，再来练一练。'}</strong><p>${read(question.explanation)}</p>` : response ? '<strong>再试一次，你可以的。</strong><p>也可以先看答案，再回到学习卡观察。</p>' : '仔细观察，选一个答案。'}</div>
    <div class="hz-actions">${control('learn', '回到学习')}${round.revealed ? control('advance', round.index === round.questions.length - 1 ? '查看本轮结果' : '下一题', '', 'solid-button') : control('skip', '先看答案')}</div>
  </section>`;
}

export function renderHanzi(state, garden) {
  return `<section class="hanzi-page"><div class="page-heading"><div><div class="eyebrow"><span></span>字词基础 · 汉字小天地</div><h1>汉字笔画与结构<span class="heading-flower">✿</span></h1><p>认一笔，拆一拆，发现汉字的样子。每个小节都可以直接开始。</p></div></div>
    <nav class="play-selector" aria-label="汉字学习小节"><div class="play-mode-buttons">${hanziCategories.map(category => control('category', `${icon(category.icon)}${category.name}`, `data-id="${category.id}" title="${category.description}" aria-pressed="${state.category === category.id && state.view === 'learn'}"`, `hz-category play-mode ${state.category === category.id && state.view === 'learn' ? 'selected' : ''}`)).join('')}</div></nav>
    <div class="ct-tools" aria-label="学习辅助">${control('reading', state.showPinyin ? '拼音辅助：开' : '拼音辅助：关', `aria-pressed="${state.showPinyin}"`)}<span>新一轮题数：</span>${practiceLengths.map(length => control('length', `${length} 题`, `data-value="${length}" aria-pressed="${state.practiceLength === length}"`, 'hz-chip')).join('')}<small>切换题数用于下一轮，当前题目会保留。</small></div>
    <div class="hz-layout"><div>${state.view === 'quiz' && state.round ? quizCard(state) : learningCard(state)}</div><aside class="hz-sidebar">
      ${garden}<section class="hz-card"><h2>我的汉字足迹</h2><p>自评认识 <strong>${state.known.length} / ${hanziLessons.length}</strong> 个学习项目</p><progress value="${state.known.length}" max="${hanziLessons.length}" aria-label="汉字自评认识进度"></progress><p>本主题题库 ${hanziQuestions.length} 题<br>当前小节 ${hanziQuestions.filter(item => item.category === state.category).length} 题</p><p>自评认识和练习首次答对分开记录，新一轮优先抽取未练题。</p><div class="hz-sidebar-actions">${control('start', `综合练习 · 最多 ${state.practiceLength} 题`, 'data-id="all"', 'solid-button')}${state.round && !state.round.finished && state.view === 'learn' ? control('resume', '继续上次练习') : ''}</div>${state.round && !state.round.finished ? '<p class="hz-caption">开始新练习会替换未完成的一轮；想保留当前题目，可继续上次练习。</p>' : ''}</section>
      <section class="hz-card hz-note"><h2>按自己的节奏学</h2><p>不用先学完拼音，也不用依次通关。可以随时换一节，回头再看看。</p><p>认识字的同时，也可以读一首古诗、说一句话，或写下今天的小发现。</p><p>学习记录保存在当前浏览器。</p></section>
    </aside></div></section>`;
}

export function handleHanziAction(root, action, data) {
  const state = root.hanzi;
  const lesson = currentLesson(state);
  const outcome = {};
  if (action === 'hz-reading') state.showPinyin = !state.showPinyin;
  if (action === 'hz-length' && practiceLengths.includes(Number(data.value))) state.practiceLength = Number(data.value);
  if (action === 'hz-category' && hanziCategories.some(item => item.id === data.id)) {
    state.category = data.id;
    state.lessonId = hanziLessons.find(item => item.category === data.id).id;
    state.strokeStep = 0;
    state.view = 'learn';
  }
  if (action === 'hz-lesson') {
    const next = hanziLessons.find(item => item.id === data.id && item.category === state.category);
    if (next) { state.lessonId = next.id; state.strokeStep = 0; }
  }
  if (['hz-previous', 'hz-next'].includes(action)) {
    const items = hanziLessons.filter(item => item.category === state.category);
    const next = items[items.indexOf(lesson) + (action === 'hz-next' ? 1 : -1)];
    if (next) { state.lessonId = next.id; state.strokeStep = 0; }
  }
  if (action.startsWith('hz-stroke-') && lesson.strokes) {
    const next = action === 'hz-stroke-next' ? state.strokeStep + 1 : action === 'hz-stroke-previous' ? state.strokeStep - 1 : action === 'hz-stroke-jump' ? Number(data.index) : 0;
    if (Number.isInteger(next)) state.strokeStep = Math.max(0, Math.min(lesson.strokes.length, next));
  }
  if (action === 'hz-known') {
    if (!state.known.includes(lesson.id)) state.known.push(lesson.id);
    outcome.reward = grantRewards(root, { type: 'recognize', item: { id: `hanzi:${lesson.id}`, text: `汉字学习 · ${lesson.title}` } });
  }
  if (action === 'hz-start') startHanziRound(state, data.id);
  if (action === 'hz-learn') state.view = 'learn';
  if (action === 'hz-resume' && state.round && !state.round.finished) state.view = 'quiz';
  if (['hz-answer', 'hz-skip'].includes(action)) {
    const result = answerHanzi(state, action === 'hz-skip' ? null : data.value);
    if (result?.correct) {
      outcome.correct = true;
      outcome.reward = grantRewards(root, { type: 'answer', question: result.question, reviewed: result.reviewed });
    }
  }
  if (action === 'hz-advance') {
    const history = advanceHanziRound(state);
    if (history) {
      root.history.push(history);
      root.history = root.history.slice(-100);
      outcome.reward = grantRewards(root, { type: 'round', topicId: 'hanzi-structure', questions: state.round.questions, responses: state.round.responses, mode: 'hanzi-structure', name: history.name, total: history.total, answered: state.round.responses.filter(response => response && !response.skipped).length });
    }
  }
  return outcome;
}
