import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, isAbsolute } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setDefaultResultOrder } from 'node:dns';
import { phonicsLessons, phonicsWords } from '../src/phonics-data.js';

const root = fileURLToPath(new URL('../public/audio/phonics/candidates/', import.meta.url));
setDefaultResultOrder('ipv4first');
const api = 'https://commons.wikimedia.org/w/api.php';
const limitOption = process.argv.find(argument => argument.startsWith('--limit='));
const limit = limitOption ? Number(limitOption.split('=')[1]) : 48;
if (!Number.isInteger(limit) || limit < 1 || limit > phonicsWords.length) throw new Error('Invalid --limit');
const representatives = phonicsLessons.map(lesson => lesson.parts.join(''));
const selected = [...new Set([...representatives, ...phonicsWords.map(word => word.text.toLowerCase())])].slice(0, limit);
const agent = 'BunnyLearningGarden/1.0 (educational audio source audit; local development)';
const headers = { 'User-Agent': agent, 'Api-User-Agent': agent };
const execute = promisify(execFile);
const usePowerShell = process.argv.includes('--powershell');
const metadataOnly = process.argv.includes('--metadata-only');
if (usePowerShell && process.platform !== 'win32') throw new Error('--powershell requires Windows');
const result = { locale: 'en-GB', collectedAt: new Date().toISOString(), status: 'pending-human-review', candidates: [], missing: [], errors: [] };
let stopDownloads = false;
await mkdir(root, { recursive: true });

function plain(value = '') { return value.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').trim(); }

async function requestBytes(url) {
  if (!['commons.wikimedia.org', 'upload.wikimedia.org'].includes(new URL(url).hostname)) throw new Error('Unexpected source host');
  if (usePowerShell) {
    try {
      const { stdout } = await execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '$ErrorActionPreference="Stop"; $ProgressPreference="SilentlyContinue"; try { $response=Invoke-WebRequest -Uri $env:BUNNY_AUDIO_SOURCE_URL -UseBasicParsing -TimeoutSec 30 -UserAgent "BunnyLearningGarden/1.0"; [Convert]::ToBase64String($response.RawContentStream.ToArray()) } catch { if ($_.Exception.Response) { [Console]::Error.WriteLine("HTTP " + [int]$_.Exception.Response.StatusCode) } else { [Console]::Error.WriteLine("Network request failed") }; exit 1 }'], {
        windowsHide: true, timeout: 45000, maxBuffer: 20 * 1024 * 1024, env: { ...process.env, BUNNY_AUDIO_SOURCE_URL: String(url) },
      });
      return Buffer.from(stdout.trim(), 'base64');
    } catch (error) { throw new Error(error.stderr?.match(/HTTP \d{3}/)?.[0] || 'Network request failed'); }
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

for (let offset = 0; offset < selected.length; offset += 20) {
  const words = selected.slice(offset, offset + 20);
  const titles = words.flatMap(word => [`File:En-uk-${word}.ogg`, `File:En-UK-${word}.ogg`]);
  const request = new URL(api);
  request.search = new URLSearchParams({ action: 'query', format: 'json', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', redirects: '1' });
  let body;
  try {
    body = JSON.parse((await requestBytes(request)).toString('utf8'));
  } catch (error) {
    result.errors.push({ batch: offset / 20 + 1, reason: error.message.match(/(?:HTTP |returned )\d{3}/)?.[0] || 'Source API unavailable; retry this batch later' });
    await writeFile(resolve(root, 'review-queue.json'), `${JSON.stringify(result, null, 2)}\n`);
    console.error('Source API unavailable. Partial source records saved; no unreviewed audio was published.');
    process.exitCode = 1;
    break;
  }
  if (body.error) throw new Error(`Source API error: ${body.error.code}`);
  const pages = Object.values(body.query?.pages || {});
  for (const word of words) {
    const page = pages.find(entry => entry.imageinfo && entry.title.toLowerCase() === `file:en-uk-${word}.ogg`);
    const info = page?.imageinfo?.[0];
    if (!info) { result.missing.push(word); continue; }
    const metadata = info.extmetadata || {};
    const license = plain(metadata.LicenseShortName?.value);
    const licenseUrl = metadata.LicenseUrl?.value || '';
    if (!/^(CC BY(?:-SA)? [1-4]\.\d|CC0|Public domain)/i.test(license)) {
      result.errors.push({ word, reason: `License requires separate review: ${license}` }); continue;
    }
    if (new URL(info.url).hostname !== 'upload.wikimedia.org') {
      result.errors.push({ word, reason: 'Unexpected download host' }); continue;
    }
    const destination = resolve(root, `${word}.ogg`);
    const rel = relative(root, destination);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Unexpected output path');
    const candidate = {
      word, id: `word-${word}`, path: null, downloaded: false, locale: 'en-GB',
      status: 'pending-human-review', source: info.descriptionurl, download: info.url,
      license, licenseUrl, author: plain(metadata.Artist?.value), credit: plain(metadata.Credit?.value),
      description: plain(metadata.ImageDescription?.value), restrictions: plain(metadata.Restrictions?.value),
      warning: 'Filename suggests UK English; actual accent, word content and teaching suitability require human listening.',
    };
    result.candidates.push(candidate);
    if (metadataOnly || stopDownloads) continue;
    try {
      let exists = false;
      try { const data = await readFile(destination); exists = data.subarray(0, 4).toString() === 'OggS'; } catch {}
      if (!exists) {
        const bytes = await requestBytes(info.url);
        if (bytes.subarray(0, 4).toString() !== 'OggS') throw new Error('Invalid Ogg file');
        await writeFile(destination, bytes);
      }
      candidate.path = `/audio/phonics/candidates/${word}.ogg`;
      candidate.downloaded = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      const reason = error.message.match(/(?:HTTP |returned )\d{3}/)?.[0] || 'Download or format verification failed';
      result.errors.push({ word, reason });
      if (reason.includes('429')) { stopDownloads = true; console.log('Download host rate limited this request; no further downloads will be attempted.'); }
    }
  }
  await writeFile(resolve(root, 'review-queue.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Checked ${Math.min(offset + 20, selected.length)}/${selected.length}; source candidates ${result.candidates.length}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
}
console.log(JSON.stringify({ candidates: result.candidates.length, downloaded: result.candidates.filter(candidate => candidate.downloaded).length, missing: result.missing.length, errors: result.errors.length, published: 0 }));
