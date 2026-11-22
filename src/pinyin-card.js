import { icon } from './icons.js';
import { escapeText } from './chinese-reading.js';
import { pinyinAudioNote } from './pinyin-audio-data.js';

export function pinyinCardContent(item, { playAction = 'play-current', wholeWord = false, extraControl = '', playLabel = '听一听' } = {}) {
  const isWord = item.type === 'word';
  return `<div class="pinyin-stage"><span class="stage-spark spark-one">✦</span><span class="stage-spark spark-two">✧</span><div class="writing-lines"></div><button type="button" class="pinyin-display ${item.text.length > 4 ? 'long' : ''}" data-action="${playAction}" aria-label="听 ${escapeText(item.text)} 的读音">${escapeText(isWord ? item.pinyin : item.text)}</button>${isWord ? `<div class="word-under">${escapeText(item.text)}</div>` : ''}</div>
    <div class="sound-row"><button type="button" class="sound-button primary-audio" data-action="${playAction}">${icon('sound')}<span>${escapeText(playLabel)}</span></button>${extraControl}</div>
    <p class="audio-hint">${pinyinAudioNote(item, wholeWord)}</p>
    <div class="memory-tip"><span class="tip-icon">${icon('sprout')}</span><div><span class="tip-label">${isWord ? '读一读，记一记' : '小兔的记忆提示'}</span><p>${escapeText(item.tip || `${item.text}，读作 ${item.pinyin}。`)}</p></div>${!isWord && item.group !== 'initial' && !['e', 'ü', 'ang', 'eng'].includes(item.text) ? `<span class="example-tag">${escapeText(item.example)}</span>` : ''}</div>`;
}
