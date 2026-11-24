import { basics, marked } from './data.js';

export function pinyinCardAudio(item) {
  if (item.type === 'word') return { word: item.text, sounds: item.sounds };
  return item.group === 'whole' ? { sound: item.sound, recording: `card:${item.id}` } : { sound: item.sound };
}

export function pinyinQuestionAudio(question) {
  const { audio, id, itemId } = question;
  if (id.startsWith('confusing:')) return { ...audio, recording: `question:${id}` };
  if (itemId?.startsWith('whole-')) return { ...audio, recording: `card:${itemId}` };
  return audio;
}

export function pinyinOptionAudio(option) {
  const item = basics.find(entry => entry.text === option.value && entry.sound === option.sound);
  return item ? pinyinCardAudio(item) : option;
}

export function pinyinAudioPaths(files, request) {
  const dedicated = files[request.recording] || (request.word && files[`word:${request.word}`]);
  return dedicated ? [dedicated] : (request.sounds || [request.sound]).map(sound => files[`syllable:${sound}`]);
}

export function pinyinAudioNote(item, hasWholeWord) {
  if (item.type === 'word') return item.sounds.length > 1 && !hasWholeWord ? '这个词一个字一个字读，跟着一起拼一拼。' : '听完再读一遍，把字和声音记在一起。';
  if (item.group === 'initial') return `借助 ${marked(item.sound)} 练习呼读音；拼读时声母要读得轻、短。`;
  if (borrowsSyllable(item)) return `借助音节 ${marked(item.sound)} 听读音，注意字母与音节的写法不同。`;
  return '点一下喇叭，让小耳朵也认识它。';
}

export function borrowsSyllable(item) {
  return item.sound.replace(/[1-5]/, '') !== item.text.replace('ü', 'v');
}

export const splitFinals = { ua: ['u', 'a'], uo: ['u', 'o'], iong: ['i', 'ong'] };

export function pinyinBlendAudio([initial, final]) {
  const wholeParts = [initial, final].map(part => basics.find(item => item.text === part));
  if (wholeParts.every(Boolean)) return { sounds: wholeParts.map(item => item.sound) };
  const parts = [initial, ...(splitFinals[final] || [final])];
  return { sounds: parts.map(part => basics.find(item => item.text === part)?.sound) };
}
