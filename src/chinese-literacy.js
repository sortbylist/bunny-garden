import { escapeText, readingText } from './chinese-reading.js';
import { readingLesson } from './reading-view.js';

function poemLine([text, pinyin], showPinyin) {
  if (!showPinyin) return escapeText(text);
  const syllables = pinyin.split(' ');
  let index = 0;
  return [...text].map(character => /\p{Script=Han}/u.test(character)
    ? `<ruby>${escapeText(character)}<rp>（</rp><rt>${escapeText(syllables[index++])}</rt><rp>）</rp></ruby>`
    : escapeText(character)).join('');
}

export function literacySupplement(lesson, state) {
  if (lesson.reading) return readingLesson(lesson, state);
  if (lesson.comparison) return `<section class="ct-comparison" aria-label="字形与读音对照">${lesson.comparison.map(item => `<article>
    <strong class="ct-compare-character">${state.showPinyin ? `<ruby>${escapeText(item.text)}<rp>（</rp><rt>${escapeText(item.pinyin)}</rt><rp>）</rp></ruby>` : escapeText(item.text)}</strong>
    <h4>${readingText(item.word, state.showPinyin)}</h4><p>${escapeText(item.clue)}</p>
    </article>`).join('')}</section>`;
  if (!lesson.poem) return '';
  const hidden = state.activities[lesson.id]?.hidePoem === true;
  return `<section class="ct-poem" aria-label="古诗原文">
    <p class="ct-poem-author">${escapeText(lesson.poem.dynasty)} · ${escapeText(lesson.poem.author)}</p>
    <div class="hz-actions ct-poem-audio" aria-label="古诗示范朗读">
      <button type="button" class="solid-button" data-action="ct-poem-play">听示范朗读</button>
      <button type="button" class="outline-button" data-action="ct-poem-slow">慢速听一听</button>
      <button type="button" class="outline-button" data-action="ct-poem-stop" disabled>停止朗读</button>
    </div>
    <p class="hz-caption ct-poem-audio-status" role="status" aria-live="polite">普通话合成语音，点击后播放。</p>
    <div class="ct-poem-lines" id="ct-poem-lines">${hidden
      ? '<p class="ct-recite-hint" role="status">原文已遮住，试着背给自己或家人听。想不起来时，随时打开再读。</p>'
      : lesson.poem.lines.map(line => `<p>${poemLine(line, state.showPinyin)}</p>`).join('')}</div>
    <button type="button" class="outline-button" data-action="ct-activity-recite" aria-controls="ct-poem-lines" aria-pressed="${hidden}">${hidden ? '打开原文再读读' : '遮住原文试着背'}</button>
    <p class="hz-caption">先听一听，再自己读一读，也可以请家人领读。背诵是自己的尝试，不自动评分。</p>
    </section>`;
}
