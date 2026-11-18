import { practiceLengths } from './chinese-practice.js';
import { icon } from './icons.js';

export function learningCardFooter(prefix, { known, category, index, total }) {
  return `<div class="hz-actions mastery-actions"><button type="button" data-action="${prefix}-known" class="soft-button mint" aria-pressed="${known}">${icon('check')}${known ? '已经认识啦 ✓' : '我认识啦'}</button><button type="button" data-action="${prefix}-start" data-id="${category}" class="soft-button">${icon('pen')}练练这一节</button></div>
    <div class="hz-actions hz-card-footer card-navigation"><button type="button" data-action="${prefix}-previous" class="outline-button previous" ${index === 0 ? 'disabled' : ''}>${icon('chevron')}上一个</button><button type="button" data-action="${prefix}-next" class="outline-button" ${index === total - 1 ? 'disabled' : ''}>下一个${icon('chevron')}</button></div>`;
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

export function pinyinToggle(prefix, state) {
  return `<button type="button" data-action="${prefix}-reading" class="reading-toggle" role="switch" aria-label="拼音辅助" aria-checked="${state.showPinyin}"><span>拼音</span><span class="reading-toggle-track" aria-hidden="true"></span></button>`;
}

export function learningTools(prefix, state, { polished = false } = {}) {
  const lengths = state.view === 'quiz' ? `<span>新一轮题数：</span><div class="ct-lengths">${practiceLengths.map(length => `<button type="button" data-action="${prefix}-length" class="hz-chip" data-value="${length}" aria-pressed="${state.practiceLength === length}">${length} 题</button>`).join('')}</div><small>切换题数用于下一轮，当前题目会保留。</small>` : '';
  if (!lengths) return '';
  return `<div class="ct-tools ${polished ? 'controls' : ''}" aria-label="学习辅助">${lengths}</div>`;
}
