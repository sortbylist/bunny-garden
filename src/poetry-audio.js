export function createPoetryAudio(onStatus) {
  let manifest = { files: {} };
  let generation = 0;
  let active = null;
  let settle = null;
  const ready = fetch('/audio/poetry/manifest.json')
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (data?.locale === 'zh-CN' && data.files && typeof data.files === 'object') manifest = data;
    }).catch(() => {});

  function stop() {
    generation++;
    if (active) {
      active.pause();
      active.removeAttribute('src');
      active.load();
      active = null;
    }
    if (settle) { settle(false); settle = null; }
    onStatus('idle');
  }

  async function play(id, slow = false) {
    stop();
    const request = generation;
    onStatus('loading');
    await ready;
    if (request !== generation) return false;
    const entry = manifest.files[id];
    if (!/^[a-z-]+$/.test(id) || entry?.status !== 'ready' || entry.path !== `/audio/poetry/${id}.wav`) {
      onStatus('error', '这首诗的朗读暂时无法播放，请稍后重试。');
      return false;
    }
    const audio = new Audio(entry.path);
    active = audio;
    audio.playbackRate = slow ? 0.8 : 1;
    audio.preservesPitch = true;
    return new Promise(resolve => {
      let finished = false;
      const finish = success => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        audio.onplaying = null;
        audio.onended = null;
        audio.onerror = null;
        if (settle === finish) settle = null;
        if (request === generation) {
          if (!success) audio.pause();
          active = null;
          onStatus(success ? 'idle' : 'error', success ? '' : '朗读播放失败，请重试；也可以先看原文，不影响学习记录。');
        }
        resolve(success);
      };
      const timer = setTimeout(() => finish(false), 90000);
      settle = finish;
      audio.onplaying = () => { if (request === generation) onStatus('playing'); };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.play().catch(() => finish(false));
    });
  }

  return { ready, play, stop };
}
