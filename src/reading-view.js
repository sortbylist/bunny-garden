import { escapeText, readingText } from './chinese-reading.js';

export function readingPassage(passage, showPinyin, evidence = []) {
  return `<section class="ct-reading-passage" aria-label="阅读原文">
    <h4>${escapeText(passage.title)}</h4>
    <ol>${passage.paragraphs.map((paragraph, index) => `<li class="${evidence.includes(index) ? 'ct-reading-evidence' : ''}">
      <span class="ct-paragraph-number" aria-label="第${index + 1}段">${index + 1}</span>
      <p>${readingText(paragraph, showPinyin)}</p>${evidence.includes(index) ? '<span class="ct-evidence-label">依据段落</span>' : ''}
    </li>`).join('')}</ol>
    </section>`;
}

export function readingLesson(lesson, state) {
  const revealed = state.activities[lesson.id]?.showEvidence === true;
  return `${readingPassage(lesson.reading.passage, state.showPinyin, revealed ? lesson.reading.focus : [])}
    <div class="ct-reading-tools">
      <button type="button" class="outline-button" data-action="ct-activity-evidence" aria-expanded="${revealed}" aria-controls="ct-reading-guide">${revealed ? '收起阅读线索' : '看看阅读线索'}</button>
      <p class="hz-caption">先自己找一找，再展开线索核对。</p>
    </div>
    <div id="ct-reading-guide">${revealed ? `<p class="ct-reading-guide" role="status">${escapeText(lesson.reading.guide)}</p>` : ''}</div>`;
}
