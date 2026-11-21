import { practiceLengths } from './chinese-practice.js';
import { icon } from './icons.js';

export function learningCardFooter(prefix, { known, category, index, total, knownLabel = '我认识啦', confirmedLabel = '已经认识啦 ✓' }) {
  return `<div class="hz-actions mastery-actions"><button type="button" data-action="${prefix}-known" class="soft-button mint" aria-pressed="${known}">${icon('check')}${known ? confirmedLabel : knownLabel}</button></div>
    <div class="hz-actions hz-card-footer card-navigation"><button type="button" data-action="${prefix}-previous" class="outline-button previous" ${index === 0 ? 'disabled' : ''}>${icon('chevron')}上一个</button>${index === total - 1 ? sectionPracticeButton(`${prefix}-start`, category, true) : `<button type="button" data-action="${prefix}-next" class="outline-button">下一个${icon('chevron')}</button>`}</div>`;
}

export function sectionPracticeButton(action, category, primary = false) {
  return `<button type="button" data-action="${action}" data-id="${category}" class="${primary ? 'solid-button next' : 'soft-button section-practice-shortcut'}">${primary ? `本节练习${icon('chevron')}` : `${icon('pen')}本节练习`}</button>`;
}

export function practiceMenu() {
  return '<section class="study-card"><h2 class="category-badge" data-activity-heading tabindex="-1">选择练习分类</h2></section>';
}

export function learningAnswerLabel(index, content) {
  const label = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index] ?? index + 1;
  return `<span class="option-letter" aria-hidden="true">${label}</span><span class="option-content">${content}</span>`;
}

export function learningPosition(index, total, { practice = false } = {}) {
  if (!total) return '';
  return `<span class="card-position learning-position" aria-label="当前${practice ? '练习' : '学习'}位置">第 <b>${index + 1}</b> / ${total} ${practice ? '题' : '项'}</span>`;
}

export function reviewShortcut(feature, section = '') {
  return `<button type="button" data-action="library-open" data-id="mistakes" data-feature="${feature}" ${section ? `data-section="${section}"` : ''} class="outline-button">${icon('notebook')}复习${section ? '本节' : '本主题'}错题</button>`;
}

export function focusLearningActivity() {
  document.querySelector('#main-content [data-activity-heading]')?.focus();
}

export function learningTokenClass(value) {
  const text = String(value ?? '').trim();
  if (!text || /[。！？；，：、,.!?;:\n]/u.test(text)) return '';
  if ([...text].length > 8 && !/^[a-z]+(?:['’-][a-z]+)?$/iu.test(text)) return '';
  return [...text].length === 1 ? ' learning-token learning-glyph' : ' learning-token';
}

export function favoriteButton(action, saved, ref = '') {
  return `<button type="button" data-action="${action}" ${ref ? `data-ref="${encodeURIComponent(ref)}" ` : ''}class="soft-button learning-favorite" aria-label="收藏" aria-pressed="${saved}">${icon('heart')}${saved ? '已收藏' : '收藏'}</button>`;
}

export function roundSettings(field, length, choices, resumeLength) {
  return `<details class="lesson-details round-settings"><summary>练习设置</summary><label>每轮题数<select data-round-length="${field}">${choices.map(value => `<option value="${value}" ${value === length ? 'selected' : ''}>${value} 题</option>`).join('')}</select></label><small>切换题数会切换到对应题量的练习。</small>${resumeLength ? `<button type="button" class="outline-button" data-action="resume-round-length" data-length="${resumeLength}">继续上次练习 · ${resumeLength} 题</button>` : ''}</details>`;
}

export function learningTools(prefix, state) {
  if (state.view !== 'quiz') return '';
  const resumeLength = practiceLengths.find(length => {
    const round = state.rounds?.[`${state.round?.scope}:${length}`];
    return length !== state.practiceLength && round && !round.finished && round.responses.some(Boolean);
  });
  return roundSettings(prefix, state.practiceLength, practiceLengths, resumeLength);
}
