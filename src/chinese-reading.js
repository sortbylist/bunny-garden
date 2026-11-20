import { contextualCharacters, difficultCharacters } from './prose-readings-data.js';

export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

const contexts = new Map(Object.entries(contextualCharacters).map(([character, readings]) => {
  const rules = [];
  for (const [pinyin, words] of Object.entries(readings)) {
    for (const word of words) {
      for (let offset = 0; offset < word.length; offset++) {
        if (word[offset] === character) rules.push({ word, offset, pinyin });
      }
    }
  }
  return [character, rules];
}));

export function readingText(value, enabled = true) {
  const text = String(value ?? '');
  if (!enabled) return escapeText(text);
  let html = '';
  let index = 0;
  for (const character of text) {
    const rule = contexts.get(character)?.find(({ word, offset }) => index >= offset && text.startsWith(word, index - offset));
    const reading = rule?.pinyin ?? difficultCharacters[character];
    html += reading
      ? `<ruby>${character}<rp>（</rp><rt>${reading}</rt><rp>）</rp></ruby>`
      : escapeText(character);
    index += character.length;
  }
  return html;
}
