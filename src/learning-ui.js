import { practiceLengths } from './chinese-practice.js';

export function learningTokenClass(value) {
  const text = String(value ?? '').trim();
  if (!text || /[。！？；，：、,.!?;:\n]/u.test(text)) return '';
  if ([...text].length > 8 && !/^[a-z]+(?:['’-][a-z]+)?$/iu.test(text)) return '';
  return [...text].length === 1 ? ' learning-token learning-glyph' : ' learning-token';
}

export function learningTools(prefix, state, { math = false, polished = false } = {}) {
  const reading = math ? '' : `<button type="button" data-action="${prefix}-reading" class="outline-button reading-toggle" aria-pressed="${state.showPinyin}">拼音辅助：${state.showPinyin ? '开' : '关'}</button>`;
  const lengths = state.view === 'quiz' ? `<span>新一轮题数：</span><div class="ct-lengths">${practiceLengths.map(length => `<button type="button" data-action="${prefix}-length" class="hz-chip" data-value="${length}" aria-pressed="${state.practiceLength === length}">${length} 题</button>`).join('')}</div><small>切换题数用于下一轮，当前题目会保留。</small>` : '';
  if (!reading && !lengths) return '';
  return `<div class="ct-tools ${polished ? 'controls' : ''}" aria-label="学习辅助">${reading}${lengths}</div>`;
}
