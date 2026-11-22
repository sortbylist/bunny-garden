import { escapeText } from './chinese-reading.js';
import { poemLines } from './chinese-literacy.js';
import { englishActivity, englishChoice, englishLessonBody, englishText } from './english-learning.js';
import { icon } from './icons.js';
import { learningAnswerLabel, learningTokenClass } from './learning-ui.js';
import { pinyinCardContent } from './pinyin-card.js';
import { reviewStatuses } from './audio-review-data.js';

const escape = escapeText;

function playbackButtons(audio) {
  return audio.map(clip => `
    <button type="button" class="outline-button" data-audit-play="${escape(clip.id)}"${clip.clips.some(item => !item.path) ? ' disabled' : ''}>${icon('sound')}${escape(clip.label)}</button>`).join('');
}

function quizPreview({ question, audio, kind }) {
  const options = question.choices || question.options;
  return `<section class="quiz-card audit-preview">
    <h3 class="question-prompt">${escape(question.prompt)}</h3>
    ${question.display ? `<p class="question-display">${escape(question.display)}</p>` : ''}
    <div class="blend-controls">${playbackButtons(audio)}</div>
    ${kind === 'english-quiz' ? `<p class="ct-sample">听力原文 ${englishText(question.clip.text)}</p>` : ''}
    <div class="answer-grid" aria-label="答案选项">${options.map((option, index) => {
      const value = typeof option === 'string' ? option : option.id;
      const label = typeof option === 'string' ? escape(option) : englishChoice(option);
      const correct = value === question.answer;
      return `<div class="answer-option${learningTokenClass(value)} ${correct ? 'correct-answer' : ''}">${learningAnswerLabel(index, label)}${correct ? `<span aria-label="正确答案">${icon('check')}</span>` : ''}</div>`;
    }).join('')}</div>
    <p class="answer-feedback success">${escape(question.explanation)}</p>
  </section>`;
}

function preview(row) {
  const { kind, title, item, audio, poem, lesson, word, story } = row;
  if (kind === 'pinyin-card') {
    return `<section class="study-card audit-preview${item.type === 'word' ? ' word-card' : ''}">
      ${pinyinCardContent(item, { wholeWord: row.wholeWord, playAction: 'audit-main', playLabel: audio[0].label })}
      ${audio.length > 1 ? `<div class="audit-reference">${playbackButtons(audio.slice(1))}</div>` : ''}
    </section>`;
  }
  if (kind === 'quiz' || kind === 'english-quiz') return quizPreview(row);
  if (kind === 'poem') {
    return `<section class="hz-card audit-preview ct-poem" aria-label="古诗原文">
      <h3>${escape(title)}</h3><p class="ct-poem-author">${escape(poem.dynasty)} · ${escape(poem.author)}</p>
      <div class="hz-actions ct-poem-audio">${playbackButtons(audio)}</div>
      <div class="ct-poem-lines">${poemLines(poem.lines, true)}</div>
    </section>`;
  }
  if (kind === 'tone') {
    return `<section class="quiz-card audit-preview tones-card">
      <p class="question-display">${escape(item.text)}${item.character ? ` · ${escape(item.character)}` : ''}</p>
      <p>${escape(item.label)}</p><div class="blend-controls">${playbackButtons(audio)}</div>
    </section>`;
  }
  if (kind === 'english-lesson') {
    return `<div class="ct-topic en-topic"><section class="hz-card audit-preview">
      <h3>${lesson.lines ? escape(title) : englishText(title)}</h3><p>${escape(lesson.body)}</p>
      ${englishLessonBody(lesson)}${englishActivity(lesson)}
    </section></div>`;
  }
  return `<section class="ph-card audit-preview">
    ${word ? `<div class="ph-word" lang="en-GB">${escape(word.text)}</div><p class="ph-meaning">${escape(word.meaning)}</p>`
      : `<h3 lang="en-GB">${escape(story.title)}</h3><p class="ph-story-text" lang="en-GB">${escape(story.text)}</p>`}
    <div class="ph-actions">${playbackButtons(audio)}</div>
  </section>`;
}

export function reviewCard(row, index) {
  const name = `audit-choice-${index}`;
  const sources = [...new Set(row.audio.flatMap(playback => playback.clips.map(clip => clip.source)))];
  const missing = row.audio.some(playback => playback.clips.some(clip => !clip.path));
  return `<article class="audit-row" data-audit-row="${escape(row.id)}" aria-labelledby="${name}-title">
    <header>
      <p class="audit-location">${[row.stage, row.topic, row.category].map(part => escape(part.name)).join(' / ')}</p>
      <h3 id="${name}-title">${escape(row.title)}</h3>
    </header>
    <div class="audit-row-grid">
      <div>
        ${preview(row)}
        <div class="audit-playback">
          ${row.kind === 'english-lesson' ? '' : '<button type="button" class="text-button" data-audit-stop disabled>停止播放</button>'}
          <p class="audit-audio-status" role="status"></p>
        </div>
      </div>
      <div class="audit-decision">
        <p><strong>预期内容</strong><span class="audit-expected">${escape(row.expected)}</span></p>
        ${row.guide || row.context ? `<p>${escape(row.guide || row.context)}</p>` : ''}
        <p class="audit-source">音频来源 · ${sources.map(escape).join('；')}</p>
        ${missing ? '<p class="audit-error">有音频路径缺失，可记录为需修改。</p>' : ''}
        <fieldset>
          <legend>审核结果</legend>
          ${reviewStatuses.map(([value, label]) => `<label><input type="radio" name="${name}" value="${value}" data-audit-status>${label}</label>`).join('')}
        </fieldset>
        <label class="audit-note">问题与备注<textarea rows="3" maxlength="3000" data-audit-note placeholder="如：第二个字太重，建议复听。"></textarea></label>
        <p class="audit-error" data-audit-note-error hidden>标记为「需修改」时，请写明问题。</p>
      </div>
    </div>
  </article>`;
}
