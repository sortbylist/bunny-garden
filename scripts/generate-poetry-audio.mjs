import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { poems } from '../src/poetry-data.js';

const workspace = fileURLToPath(new URL('../', import.meta.url));
if (process.argv.includes('--help')) {
  console.log('用法：node scripts/generate-poetry-audio.mjs\n在 Windows 上使用已安装的 Microsoft Huihui Desktop 普通话语音，离线生成全部古诗 WAV 和校验清单。');
} else {
  if (process.platform !== 'win32') throw new Error('音频生成需要 Windows 和 Microsoft Huihui Desktop；站点播放不依赖 Windows。');
  const tasks = new URL('../artifacts/poetry-audio-tasks.json', import.meta.url);
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  await writeFile(tasks, JSON.stringify(poems.map(poem => ({
    id: poem.id,
    text: `${poem.title}。${poem.dynasty}，${poem.author}。${poem.lines.map(([line]) => line).join('')}`,
  })), null, 2), 'utf8');
  const child = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'RemoteSigned', '-File',
    fileURLToPath(new URL('./generate-poetry-audio.ps1', import.meta.url)),
    '-Workspace', workspace, '-Tasks', fileURLToPath(tasks),
  ], { cwd: workspace, stdio: 'inherit', windowsHide: true });
  child.on('error', () => { console.error('无法启动 Windows PowerShell 音频生成器。'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
