import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { poems } from '../src/poetry-data.js';

const workspace = fileURLToPath(new URL('../', import.meta.url));
const readings = {
  'little-pond': { phrase: '小荷才露尖尖角', character: '露', phonemes: 'lu 4', rate: '-25%' },
  'quiet-night': { phrase: '疑是地上霜', character: '地', alias: '帝', pause: '65ms' },
  'village-spring': { phrase: '草长莺飞二月天', character: '长', phonemes: 'zhang 3' },
  orioles: { phrase: '一行白鹭上青天', character: '行', phonemes: 'hang 2' },
};
const xmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const escapeXml = text => text.replace(/[&<>]/g, character => xmlEntities[character]);

function poetryAudioTask(poem) {
  const text = `${poem.title}。${poem.dynasty}，${poem.author}。${poem.lines.map(([line]) => line).join('')}`;
  const reading = readings[poem.id];
  if (!reading) return { id: poem.id, text };
  const { phrase, character, phonemes, rate, alias, pause } = reading;
  const start = text.indexOf(phrase);
  if (start < 0 || start !== text.lastIndexOf(phrase) || !phrase.includes(character)) {
    throw new Error(`无法定位 ${poem.id} 的指定读音：${phrase} / ${character}`);
  }
  const index = start + phrase.indexOf(character);
  const pronunciation = alias
    ? `<sub alias="${alias}">${character}</sub>`
    : `<phoneme alphabet="sapi" ph="${phonemes}">${character}</phoneme>`;
  const spokenCharacter = rate ? `<prosody rate="${rate}">${pronunciation}</prosody>` : pronunciation;
  const boundary = pause ? `<break time="${pause}"/>` : '';
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">${escapeXml(text.slice(0, index))}${boundary}${spokenCharacter}${boundary}${escapeXml(text.slice(index + character.length))}</speak>`;
  return { id: poem.id, text, ssml };
}

if (process.argv.includes('--help')) {
  console.log('用法：node scripts/generate-poetry-audio.mjs\n在 Windows 上使用已安装的 Microsoft Huihui Desktop 普通话语音，离线生成全部古诗 WAV 和校验清单。');
} else {
  if (process.platform !== 'win32') throw new Error('音频生成需要 Windows 和 Microsoft Huihui Desktop；站点播放不依赖 Windows。');
  const tasks = new URL('../artifacts/poetry-audio-tasks.json', import.meta.url);
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  await writeFile(tasks, JSON.stringify(poems.map(poetryAudioTask), null, 2), 'utf8');
  const child = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'RemoteSigned', '-File',
    fileURLToPath(new URL('./generate-poetry-audio.ps1', import.meta.url)),
    '-Workspace', workspace, '-Tasks', fileURLToPath(tasks),
  ], { cwd: workspace, stdio: 'inherit', windowsHide: true });
  child.on('error', () => { console.error('无法启动 Windows PowerShell 音频生成器。'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
