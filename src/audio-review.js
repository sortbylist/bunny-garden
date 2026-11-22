import './style.css';
import './learning-ui.css';
import './chinese.css';
import './phonics.css';
import './ui-theme.css';
import './audio-review.css';
import { audioReviewCatalog, createAudioReviewExport, reviewBatches, reviewStatuses } from './audio-review-data.js';
import { reviewCard } from './audio-review-cards.js';
import { publishedReviewDecision } from './audio-review-decisions.js';
import { subjects } from './data.js';
import { publicAsset } from './public-asset.js';

const reviewRoot = document.querySelector('#audio-review');
const panel = reviewRoot.querySelector('#audit-panel');
const items = reviewRoot.querySelector('#audit-items');
const guide = reviewRoot.querySelector('#audit-guide');
const progress = reviewRoot.querySelector('#audit-progress');
const errorMessage = reviewRoot.querySelector('#audit-export-error');
const range = reviewRoot.querySelector('#audit-range');
const listTitle = reviewRoot.querySelector('#audit-list-title');
const pagers = Array.from(reviewRoot.querySelectorAll('.audit-pages'), nav => ({
  nav,
  previous: nav.querySelector('[data-audit-previous]'),
  next: nav.querySelector('[data-audit-next]'),
  number: nav.querySelector('[data-audit-page-number]'),
}));
const sizeSelect = reviewRoot.querySelector('#audit-page-size');
const bulkPanel = reviewRoot.querySelector('#audit-bulk');
const bulkForm = reviewRoot.querySelector('#audit-bulk-form');
const bulkStatus = reviewRoot.querySelector('#audit-bulk-status');
const bulkUnreviewed = reviewRoot.querySelector('#audit-bulk-unreviewed');
const bulkNote = reviewRoot.querySelector('#audit-bulk-note');
const bulkApply = reviewRoot.querySelector('#audit-bulk-apply');
const bulkFeedback = reviewRoot.querySelector('#audit-bulk-feedback');
const download = reviewRoot.querySelector('#audit-download');
const subjectButtons = reviewRoot.querySelector('.audit-subjects');
const batchSelect = reviewRoot.querySelector('#audit-batch');
const filters = ['stage', 'topic', 'category'];
const filterSelects = filters.map(filter => reviewRoot.querySelector(`#audit-${filter}`));
const bulkStatuses = reviewStatuses.filter(([id]) => id !== 'unreviewed').map(([id, name]) => ({ id, name }));

async function loadManifest(path) {
  const response = await fetch(publicAsset(path));
  if (!response.ok) throw new Error(path);
  const manifest = await response.json();
  if (!manifest?.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) throw new Error(path);
  return manifest;
}

async function loadCatalog() {
  const [pinyin, poetry, phonics, borrowedSamples] = await Promise.all([
    '/audio/manifest.json',
    '/audio/poetry/manifest.json',
    '/audio/phonics/manifest.json',
    '/audio/review/huihui-borrowed/manifest.json',
  ].map(loadManifest));
  return audioReviewCatalog({ pinyin, poetry, phonics, borrowedSamples });
}

function mount(rows) {
  const decisions = new Map();
  for (const row of rows) {
    const saved = publishedReviewDecision(row);
    if (saved) {
      decisions.set(row.id, { status: saved.status, note: saved.note || '' });
    }
  }
  const catalog = rows.filter(row => decisions.get(row.id)?.status !== 'approved');
  const rowsById = new Map(catalog.map(row => [row.id, row]));
  const selected = { subject: 'chinese', batch: 'huihui', stage: '', topic: '', category: '' };
  let currentPage = 0;
  let pageSize = Number(sizeSelect.value);
  let displayed = [];
  let activePlayback;

  function batchRows() {
    return catalog.filter(row => row.subject.id === selected.subject && (!selected.batch || row.batch === selected.batch));
  }

  function updateProgress() {
    const rows = batchRows();
    const count = rows.filter(row => {
      const value = decisions.get(row.id)?.status;
      return value && value !== 'unreviewed';
    }).length;
    progress.textContent = `本批次已标记 ${count} / ${rows.length} 项`;
    download.disabled = !rows.length;
  }

  function fillSelect(select, options, allLabel, value) {
    select.replaceChildren(new Option(allLabel, ''), ...options.map(item => new Option(item.name, item.id)));
    select.value = value;
    select.disabled = !options.length;
  }

  function renderFilters() {
    subjectButtons.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.auditSubject === selected.subject)));
    const batches = reviewBatches.filter(batch => batch.subject === selected.subject);
    fillSelect(batchSelect, batches, '全部批次', selected.batch);
    guide.textContent = batches.find(batch => batch.id === selected.batch)?.guide || '';
    let candidates = batchRows();
    filters.forEach((filter, index) => {
      const options = [...new Map(candidates.map(row => [row[filter].id, row[filter]])).values()];
      const select = filterSelects[index];
      if (!options.some(option => option.id === selected[filter])) selected[filter] = '';
      fillSelect(select, options, ['全部阶段', '全部主题', '全部分类'][index], selected[filter]);
      if (selected[filter]) candidates = candidates.filter(row => row[filter].id === selected[filter]);
    });
    displayed = candidates;
    updateProgress();
  }

  function showError(message = '') {
    errorMessage.textContent = message;
    errorMessage.hidden = !message;
  }

  function currentRows() {
    const first = currentPage * pageSize;
    return displayed.slice(first, first + pageSize);
  }

  function bulkTargets() {
    return currentRows().filter(row => {
      const status = decisions.get(row.id)?.status || 'unreviewed';
      return !bulkUnreviewed.checked || status === 'unreviewed';
    });
  }

  function updateBulkAvailability() {
    const count = bulkTargets().length;
    bulkPanel.hidden = !displayed.length;
    bulkApply.disabled = !count;
    bulkApply.textContent = `应用到本页 ${count} 项`;
  }

  function showBulkFeedback(message = '', field) {
    bulkFeedback.textContent = message;
    bulkFeedback.classList.toggle('audit-error', Boolean(field));
    bulkStatus.setAttribute('aria-invalid', String(field === bulkStatus));
    bulkNote.setAttribute('aria-invalid', String(field === bulkNote));
    field?.focus();
  }

  function applyBulk(event) {
    event.preventDefault();
    const status = bulkStatuses.find(item => item.id === bulkStatus.value);
    const note = bulkNote.value.trim();
    if (!status) {
      showBulkFeedback('请选择批量审核结果。', bulkStatus);
      return;
    }
    if (status.id === 'needs-change' && !note) {
      showBulkFeedback('批量标为「需修改」时，请写明问题。', bulkNote);
      return;
    }
    const targets = bulkTargets();
    for (const { id } of targets) {
      const previousNote = decisions.get(id)?.note;
      decisions.set(id, { status: status.id, note: previousNote?.trim() ? previousNote : note });
    }
    updateCards();
    updateProgress();
    updateBulkAvailability();
    showError();
    bulkNote.value = '';
    showBulkFeedback(`已将本页 ${targets.length} 项标为「${status.name}」。`);
  }

  function updateCards() {
    items.querySelectorAll('[data-audit-row]').forEach(card => {
      const decision = decisions.get(card.dataset.auditRow);
      const radio = card.querySelector(`[data-audit-status][value="${decision?.status || 'unreviewed'}"]`);
      radio.checked = true;
      card.querySelector('[data-audit-note]').value = decision?.note || '';
      updateNoteValidity(card, decision);
    });
  }

  function renderPage() {
    stopPlayback();
    const first = currentPage * pageSize;
    const slice = currentRows();
    items.innerHTML = slice.map(reviewCard).join('');
    updateCards();
    range.textContent = slice.length ? `显示第 ${first + 1}–${first + slice.length} 项，共 ${displayed.length} 项` : '当前范围没有待审核的试听内容。';
    const totalPages = Math.ceil(displayed.length / pageSize);
    for (const { nav, previous, next, number } of pagers) {
      nav.hidden = totalPages <= 1;
      number.textContent = `第 ${currentPage + 1} / ${totalPages || 1} 页`;
      previous.disabled = !currentPage;
      next.disabled = currentPage + 1 >= totalPages;
    }
    showBulkFeedback();
    updateBulkAvailability();
  }

  function turnPage(offset, button) {
    currentPage += offset;
    renderPage();
    if (button.disabled || button.closest('.audit-pages-bottom')) listTitle.focus();
  }

  function changeScope() {
    currentPage = 0;
    showError();
    renderFilters();
    renderPage();
  }

  function updateNoteValidity(card, decision) {
    const required = decision?.status === 'needs-change';
    const missing = required && !decision.note.trim();
    const note = card.querySelector('[data-audit-note]');
    note.required = required;
    note.setAttribute('aria-invalid', String(missing));
    card.querySelector('[data-audit-note-error]').hidden = !missing;
  }

  function updateDecision(target, field, value) {
    const card = target.closest('[data-audit-row]');
    const id = card.dataset.auditRow;
    const decision = decisions.get(id) || { status: 'unreviewed', note: '' };
    decision[field] = value;
    decisions.set(id, decision);
    showError();
    updateNoteValidity(card, decision);
    if (field === 'status') {
      updateProgress();
      updateBulkAvailability();
    }
  }

  function stopPlayback(message = '') {
    if (!activePlayback) return;
    const playback = activePlayback;
    activePlayback = null;
    playback.cancel?.();
    playback.button.classList.remove('playing');
    playback.button.removeAttribute('aria-busy');
    playback.stops.forEach(button => { button.disabled = true; });
    playback.status.textContent = message;
  }

  function playClip(path, playback) {
    return new Promise(resolve => {
      const audio = new Audio(publicAsset(path));
      const finish = success => {
        clearTimeout(timer);
        audio.onended = audio.onerror = null;
        if (!success) audio.pause();
        resolve(success);
      };
      const timer = setTimeout(() => finish(false), 90000);
      playback.cancel = () => finish(false);
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.play().catch(() => finish(false));
    });
  }

  async function play(row, id, button, card) {
    const entry = row.audio.find(audio => audio.id === id);
    if (!entry) return;
    stopPlayback();
    const status = card.querySelector('.audit-audio-status');
    if (entry.clips.some(clip => !clip.path)) {
      status.textContent = '此项缺少音频文件。';
      return;
    }
    const stops = card.querySelectorAll('[data-audit-stop], [data-action="en-stop"]');
    const playback = { button, status, stops };
    activePlayback = playback;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('playing');
    stops.forEach(stop => { stop.disabled = false; });
    for (const [index, clip] of entry.clips.entries()) {
      status.textContent = entry.clips.length > 1 ? `正在播放 ${index + 1} / ${entry.clips.length}…` : '正在播放…';
      const completed = await playClip(clip.path, playback);
      if (activePlayback !== playback) return;
      if (!completed) {
        stopPlayback('音频播放失败，请重试。');
        return;
      }
    }
    stopPlayback('播放完毕。');
  }

  function exportReview() {
    const rows = batchRows();
    const invalid = rows.find(row => {
      const decision = decisions.get(row.id);
      return decision?.status === 'needs-change' && !decision.note.trim();
    });
    if (invalid) {
      for (const filter of filters) selected[filter] = invalid[filter].id;
      renderFilters();
      currentPage = Math.floor(displayed.indexOf(invalid) / pageSize);
      renderPage();
      showError(`请为「${invalid.title}」写明问题后再导出。`);
      items.querySelectorAll('[data-audit-row]').forEach(card => {
        if (card.dataset.auditRow === invalid.id) card.querySelector('[data-audit-note]').focus();
      });
      return;
    }
    const batch = reviewBatches.find(item => item.id === selected.batch);
    const data = createAudioReviewExport(rows, decisions, {
      subject: rows[0].subject,
      batch: batch ? { id: batch.id, name: batch.name } : null,
    });
    const file = new Blob([JSON.stringify(data) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audio-review-${selected.subject}-${selected.batch || 'all'}-${data.exportedAt.slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  subjectButtons.replaceChildren(...subjects.map(subject => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outline-button';
    button.dataset.auditSubject = subject.id;
    button.textContent = subject.name;
    return button;
  }));
  subjectButtons.addEventListener('click', event => {
    const button = event.target.closest('[data-audit-subject]');
    if (!button || selected.subject === button.dataset.auditSubject) return;
    selected.subject = button.dataset.auditSubject;
    selected.batch = reviewBatches.find(batch => batch.subject === selected.subject)?.id || '';
    filters.forEach(filter => { selected[filter] = ''; });
    changeScope();
  });
  batchSelect.addEventListener('change', () => {
    selected.batch = batchSelect.value;
    filters.forEach(filter => { selected[filter] = ''; });
    changeScope();
  });
  filterSelects.forEach((select, index) => select.addEventListener('change', () => {
    selected[filters[index]] = select.value;
    filters.slice(index + 1).forEach(filter => { selected[filter] = ''; });
    changeScope();
  }));
  sizeSelect.addEventListener('change', () => {
    const size = Number(sizeSelect.value);
    currentPage = Math.floor(currentPage * pageSize / size);
    pageSize = size;
    renderPage();
  });
  fillSelect(bulkStatus, bulkStatuses, '选择审核结果', '');
  bulkForm.addEventListener('submit', applyBulk);
  bulkStatus.addEventListener('change', () => {
    bulkNote.required = bulkStatus.value === 'needs-change';
    showBulkFeedback();
  });
  bulkNote.addEventListener('input', () => showBulkFeedback());
  bulkUnreviewed.addEventListener('change', () => {
    showBulkFeedback();
    updateBulkAvailability();
  });
  items.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-audit-stop') || button.dataset.action === 'en-stop') {
      stopPlayback('已停止。');
      return;
    }
    const id = button.dataset.auditPlay || { 'audit-main': 'main', 'en-play': button.dataset.id }[button.dataset.action];
    if (!id) return;
    const card = button.closest('[data-audit-row]');
    void play(rowsById.get(card.dataset.auditRow), id, button, card);
  });
  items.addEventListener('change', event => {
    if (event.target.hasAttribute('data-audit-status')) updateDecision(event.target, 'status', event.target.value);
  });
  items.addEventListener('input', event => {
    if (event.target.hasAttribute('data-audit-note')) updateDecision(event.target, 'note', event.target.value);
  });
  for (const { previous, next } of pagers) {
    previous.addEventListener('click', () => turnPage(-1, previous));
    next.addEventListener('click', () => turnPage(1, next));
  }
  download.addEventListener('click', exportReview);
  changeScope();
}

const loadStatus = reviewRoot.querySelector('#audit-load');
try {
  mount(await loadCatalog());
  loadStatus.hidden = true;
  panel.hidden = false;
} catch (error) {
  loadStatus.textContent = '试听清单载入失败，请刷新后重试。';
  console.error(error);
}
