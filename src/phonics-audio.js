import { availablePhonicsAudio } from './phonics-engine.js';

export function createPhonicsAudio(onStatus) {
  let manifest = { files: {} };
  let generation = 0;
  let active;
  let settle;
  const ready = fetch('/audio/phonics/manifest.json').then(response => response.ok ? response.json() : null).then(data => {
    if (data?.locale === 'en-GB' && data.files && typeof data.files === 'object') manifest = data;
  }).catch(() => {});

  function stop() {
    generation++;
    if (active) { active.pause(); active.removeAttribute('src'); active.load(); active = null; }
    if (settle) { settle(false); settle = null; }
    onStatus('idle');
  }

  function available(id) { return availablePhonicsAudio(manifest.files[id]) && manifest.files[id].path === `/audio/phonics/${id}.mp3`; }

  async function play(id, slow = false) {
    stop();
    const token = generation;
    onStatus('loading');
    await ready;
    if (generation !== token) return false;
    if (!available(id)) { onStatus('error', '暂时无法播放，请先选择其他内容。'); return false; }
    const audio = new Audio(manifest.files[id].path);
    active = audio;
    audio.playbackRate = slow ? 0.8 : 1;
    audio.preservesPitch = true;
    return new Promise(resolve => {
      let finished = false;
      const finish = success => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (settle === finish) settle = null;
        if (generation === token) {
          if (!success) audio.pause();
          active = null;
          onStatus(success ? 'idle' : 'error', success ? '' : '语音播放失败。请重试，或换成文字练习；不会记录为知识错误。');
        }
        resolve(success);
      };
      const timer = setTimeout(() => finish(false), 45000);
      settle = finish;
      audio.onplaying = () => { if (token === generation) onStatus('playing'); };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.play().catch(() => finish(false));
    });
  }

  return { ready, stop, play, available, count: () => Object.keys(manifest.files).filter(available).length };
}
