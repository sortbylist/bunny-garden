import { practiceLengths } from './chinese-practice.js';

export function learningTokenClass(value) {
  const text = String(value ?? '').trim();
  if (!text || /[。！？；，：、,.!?;:\n]/u.test(text)) return '';
  if ([...text].length > 8 && !/^[a-z]+(?:['’-][a-z]+)?$/iu.test(text)) return '';
  return [...text].length === 1 ? ' learning-token learning-glyph' : ' learning-token';
}

export function pinyinToggle(prefix, state) {
  return `<button type="button" data-action="${prefix}-reading" class="reading-toggle" role="switch" aria-label="拼音辅助" aria-checked="${state.showPinyin}"><span>拼音</span><span class="reading-toggle-track" aria-hidden="true"></span></button>`;
}

export function learningTools(prefix, state, { polished = false } = {}) {
  const lengths = state.view === 'quiz' ? `<span>新一轮题数：</span><div class="ct-lengths">${practiceLengths.map(length => `<button type="button" data-action="${prefix}-length" class="hz-chip" data-value="${length}" aria-pressed="${state.practiceLength === length}">${length} 题</button>`).join('')}</div><small>切换题数用于下一轮，当前题目会保留。</small>` : '';
  if (!lengths) return '';
  return `<div class="ct-tools ${polished ? 'controls' : ''}" aria-label="学习辅助">${lengths}</div>`;
}
