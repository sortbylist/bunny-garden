import { publicAsset } from './public-asset.js';
import { pinyinAudioPaths } from './pinyin-audio-data.js';

let manifest = { files: {} };
const ready = fetch(publicAsset('/audio/manifest.json')).then(response => response.ok ? response.json() : manifest).then(data => { manifest = data; }).catch(() => {});
let generation = 0;
let active = null;
let finish = null;
let statusHandler = () => {};

export function onAudioStatus(handler) { statusHandler = handler; }

export function stopAudio() {
  generation++;
  if (active) { active.pause(); active.src = ''; active = null; }
  if (finish) { finish(false); finish = null; }
  statusHandler('idle');
}

export async function playAudio(request, slow = false) {
  stopAudio();
  const token = generation;
  statusHandler('loading');
  await ready;
  if (token !== generation) return false;
  const paths = pinyinAudioPaths(manifest.files, request);
  if (!paths.length || paths.some(path => !path)) {
    statusHandler('error', '这段读音暂时不可用，请换一个试试。');
    return false;
  }
  for (const path of paths) {
    if (token !== generation) return false;
    const success = await new Promise(resolve => {
      const audio = new Audio(publicAsset(path));
      active = audio;
      audio.playbackRate = slow ? 0.8 : 1;
      audio.preservesPitch = true;
      let settled = false;
      const settle = value => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (finish === settle) finish = null;
        resolve(value);
      };
      const timeout = setTimeout(() => { audio.pause(); settle(false); }, 15000);
      finish = settle;
      audio.onended = () => settle(true);
      audio.onerror = () => settle(false);
      audio.onplaying = () => { if (token === generation) statusHandler('playing'); };
      audio.play().catch(() => settle(false));
    });
    if (!success) {
      if (token === generation) statusHandler('error', '读音没有播放成功，点一下喇叭重试吧。');
      return false;
    }
  }
  if (token === generation) { active = null; statusHandler('idle'); return true; }
  return false;
}

export function hasAudio(request) {
  return Boolean(request.word && manifest.files[`word:${request.word}`]) || Boolean(request.sound && manifest.files[`syllable:${request.sound}`]);
}

export function chime(enabled) {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.23);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
    oscillator.onended = () => context.close();
  } catch {}
}
