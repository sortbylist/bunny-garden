import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173');
  const report = await page.evaluate(async () => {
    const manifest = await fetch('/audio/manifest.json').then(response => response.json());
    const context = new AudioContext();
    const queue = Object.entries(manifest.files);
    let cursor = 0;
    const failures = [];
    const results = [];
    async function worker() {
      while (cursor < queue.length) {
        const [key, path] = queue[cursor++];
        try {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const decoded = await context.decodeAudioData(await response.arrayBuffer());
          const channel = decoded.getChannelData(0);
          let peak = 0;
          for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
          if (decoded.duration < 0.1 || peak < 0.01) throw new Error('Audio is empty or near silent');
          results.push({ key, duration: Number(decoded.duration.toFixed(3)), peak: Number(peak.toFixed(3)) });
        } catch (error) { failures.push({ key, error: error.message }); }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    await context.close();
    return { total: queue.length, decoded: results.length, failures, results };
  });
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/audio-verification.json', JSON.stringify(report, null, 2));
  console.log(`Audio decode checks: ${report.decoded}/${report.total} passed.`);
  if (report.failures.length) { console.error(report.failures); process.exitCode = 1; }
} finally { await browser.close(); }
