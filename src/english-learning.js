import './english-learning.css';
import { icon } from './icons.js';
import { englishAudioClips } from './english-topics.js';
import { publicAsset } from './public-asset.js';

const clips = new Set(englishAudioClips.map(clip => clip.id));
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const englishText = text => `<span lang="en">${escape(text)}</span>`;

const drawings = {
  pen: '<rect x="6" y="24" width="42" height="8" rx="3"/><path d="M48 24l9 4-9 4M10 24v8m5-8v-4h12"/>',
  pencil: '<path d="M7 24h40l10 4-10 4H7a4 4 0 0 1 0-8Zm8 0v8m32-8v8m6-6v4M19 27h26"/>',
  book: '<path d="M13 8h37v44H13a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Zm0 0v44m0-8h37M21 18h20m-20 7h12"/>',
  bag: '<path d="M24 14V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5M13 32H9v15h6m36-15h4v15h-6"/><rect x="14" y="13" width="36" height="40" rx="12"/><rect x="21" y="34" width="22" height="13" rx="4"/><path d="M22 27h20"/>',
  desk: '<path d="M9 23h46v9H9zm4 9v20m38-20v20M19 32v11h26V32m-19 5h12"/>',
  chair: '<rect x="15" y="8" width="34" height="22" rx="4"/><path d="M18 30v8m28-8v8M12 38h40v7H12zm5 7v11m30-11v11"/>',
  ruler: '<rect x="6" y="21" width="52" height="16" rx="3"/><path d="M14 21v9m9-9v6m9-6v9m9-9v6m9-6v9"/>',
  eraser: '<path d="m11 35 16-20a5 5 0 0 1 7-1l16 13a5 5 0 0 1 1 7L38 50H25L12 42a5 5 0 0 1-1-7Zm10-13 26 19m-9 9h17"/>',
  'open-book': '<path d="M32 17c-8-6-17-7-25-5v35c10-2 18-1 25 4 7-5 15-6 25-4V12c-8-2-17-1-25 5v34m-19-28c5-1 10 0 13 2m-13 6c5-1 10 0 13 2m12-8c3-2 8-3 13-2m-13 10c3-2 8-3 13-2"/>',
};
const shapes = {
  'closed-book': ['book'],
  'pen-up': ['pen', 'raised'],
  'pen-down': ['pen', 'lowered'],
  'pen-on-book': ['book', 'pen', 'on'],
  'pen-under-book': ['book', 'pen', 'under'],
  'pen-by-book': ['book', 'pen', 'beside'],
  'bag-on-chair': ['chair', 'bag', 'on'],
  'bag-under-chair': ['chair', 'bag', 'under'],
  'bag-by-chair': ['chair', 'bag', 'beside'],
};

function illustration(name) {
  const [object, second, position] = shapes[name] || [name];
  const group = (item, transform = '') => `<g class="en-drawing-${item}" ${transform ? `transform="${transform}"` : ''}>${drawings[item]}</g>`;
  const base = position ? 'translate(4 5) scale(.82)' : '';
  const marker = position === 'beside' ? 'translate(43 36) scale(.48)' : position === 'on'
    ? `translate(${object === 'chair' ? '19 19' : '17 0'}) scale(.48)`
    : `translate(${object === 'chair' ? '21 44' : '17 47'}) scale(.42)`;
  let content = typeof position === 'string' ? group(object, base) + group(second, marker) : group(object);
  if (second === 'raised' || second === 'lowered') {
    const raised = second === 'raised';
    content = `${group(object, raised ? 'translate(1 -12)' : 'translate(1 13)')}<path d="M8 44h55M34 25v14m-4 ${raised ? '-10 4-4 4 4' : '6 4 4 4-4'}" class="en-motion"/>`;
  }
  return `<svg class="en-illustration" viewBox="0 0 76 74" aria-hidden="true" focusable="false">${content}</svg>`;
}

const play = (clip, label = '听一听') => `<button type="button" class="outline-button" data-action="en-play" data-id="${clip.id}">${icon('sound')}${label}</button>`;
const stop = `<button type="button" class="outline-button" data-action="en-stop" disabled>${icon('pause')}停止</button>`;
const status = `<p class="audio-hint en-audio-status" data-en-audio-status role="status"></p>`;
const audioControls = (clip, label) => `<div class="hz-actions en-audio-actions">${play(clip, label)}${stop}</div>`;

export function englishLessonBody(lesson) {
  if (lesson.lines) {
    return `<ol class="ct-examples en-dialogue" aria-label="示范对话">${lesson.lines.map(({ speaker, clip }, index) => `<li><div><small>${speaker}</small><p>${englishText(clip.text)}</p></div>${play(clip, `听第 ${index + 1} 句`)}</li>`).join('')}</ol>
      <div class="hz-actions en-audio-actions">${stop}</div>${status}`;
  }
  if (lesson.word) {
    return `<div class="en-study-visual">${illustration(lesson.visual)}${play(lesson.word, '听单词')}</div>
      <div class="ct-examples en-example"><p>${englishText(lesson.phrase.text)} <small>${lesson.translation}</small></p>${play(lesson.phrase, '听短语')}</div>
      <div class="hz-actions en-audio-actions">${stop}</div>${status}`;
  }
  return `<div class="en-study-visual">${illustration(lesson.visual)}</div>
    ${audioControls(lesson.clip, '听指令')}${status}<p class="ct-sample">${lesson.tip}</p>`;
}

export function englishActivity(lesson) {
  if (!lesson.task) return '';
  return `<div class="hz-note ct-activity"><strong class="ct-activity-heading">${icon('pen')}${lesson.lines ? '换你说一说' : '动手试一试'}</strong><p>${lesson.task}</p>
    ${lesson.variation ? `<div class="en-example"><p>${englishText(lesson.variation.text)}</p>${play(lesson.variation, '听替换句')}</div>` : ''}
    ${lesson.checklist ? `<ul>${lesson.checklist.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}</div>`;
}

export function englishQuizAudio(question, revealed, heard) {
  if (!question.clip) return '';
  return `<div class="en-listen" data-en-listen="${question.clip.id}">${audioControls(question.clip, heard || revealed ? '再听一次' : '播放题目')}
    ${status}${revealed ? `<p class="ct-sample">听力原文 ${englishText(question.clip.text)}</p>` : '<p class="hz-caption">音频播完后就能选图。</p><button type="button" data-action="en-study-text" class="text-button">看文字去学习</button>'}</div>`;
}

export function englishChoice(choice) {
  return choice.visual ? `<span class="en-option-picture">${illustration(choice.visual)}<span>${escape(choice.label)}</span></span>` : englishText(choice.label);
}

export function createEnglishAudio() {
  let active;
  let heardRound;
  let heardIndex;

  function update(message, busy = false) {
    const page = document.querySelector('.en-topic');
    page?.querySelectorAll('[data-en-audio-status]').forEach(element => { element.textContent = message; });
    page?.querySelectorAll('[data-action="en-stop"]').forEach(element => { element.disabled = !busy; });
  }

  function stop() {
    const playing = active;
    active = null;
    if (playing) {
      clearTimeout(playing.timer);
      playing.audio.pause();
    }
    update('');
  }

  function heard(round) { return Boolean(round && round === heardRound && round.index === heardIndex); }

  function forget() { heardRound = null; }

  function playClip(id, slow, round, onHeard) {
    if (!clips.has(id)) return;
    stop();
    const audio = new Audio(publicAsset(`/audio/english/${id}.mp3`));
    const playing = { audio };
    active = playing;
    audio.playbackRate = slow ? 0.8 : 1;
    const fail = () => {
      if (active !== playing) return;
      stop();
      update('语音暂时无法播放。请重试，或返回学习看文字。');
    };
    playing.timer = setTimeout(fail, 30000);
    audio.onplaying = () => { if (active === playing) update('正在播放……', true); };
    audio.onerror = fail;
    audio.onended = () => {
      if (active !== playing) return;
      stop();
      if (round && !heard(round)) {
        heardRound = round;
        heardIndex = round.index;
        onHeard();
      }
      update('播放完毕。');
    };
    update('正在准备音频……', true);
    audio.play().catch(fail);
  }

  return { stop, play: playClip, heard, forget };
}
