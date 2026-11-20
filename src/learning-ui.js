import { practiceLengths } from './chinese-practice.js';
import { icon } from './icons.js';

export function learningCardFooter(prefix, { known, category, index, total }) {
  return `<div class="hz-actions mastery-actions"><button type="button" data-action="${prefix}-known" class="soft-button mint" aria-pressed="${known}">${icon('check')}${known ? '已经认识啦 ✓' : '我认识啦'}</button><button type="button" data-action="${prefix}-start" data-id="${category}" class="soft-button">${icon('pen')}练练这一节</button></div>
    <div class="hz-actions hz-card-footer card-navigation"><button type="button" data-action="${prefix}-previous" class="outline-button previous" ${index === 0 ? 'disabled' : ''}>${icon('chevron')}上一个</button><button type="button" data-action="${prefix}-next" class="outline-button" ${index === total - 1 ? 'disabled' : ''}>下一个${icon('chevron')}</button></div>`;
}

export function learningAnswerLabel(index, content) {
  const label = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index] ?? index + 1;
  return `<span class="option-letter" aria-hidden="true">${label}</span><span class="option-content">${content}</span>`;
}

export function learningPosition(index, total, { practice = false } = {}) {
  if (!total) return '';
  return `<span class="card-position learning-position" aria-label="当前${practice ? '练习' : '学习'}位置">第 <b>${index + 1}</b> / ${total} ${practice ? '题' : '项'}</span>`;
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

export function roundSettings(field, length, choices, nextRound = false) {
  const hint = nextRound ? '题数用于下一轮，当前题目会保留。' : '切换题数会切换到对应题量的练习。';
  return `<details class="lesson-details round-settings"><summary>练习设置</summary><label>每轮题数<select data-round-length="${field}">${choices.map(value => `<option value="${value}" ${value === length ? 'selected' : ''}>${value} 题</option>`).join('')}</select></label><small>${hint}</small></details>`;
}

export function learningTools(prefix, state) {
  return state.view === 'quiz' ? roundSettings(prefix, state.practiceLength, practiceLengths, true) : '';
}
