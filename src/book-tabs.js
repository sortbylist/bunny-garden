import { icon } from './icons.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function renderBookTabs({ id, category, action, label, tabs, selected, content }) {
  const panelId = `${id}-panel`;
  const tabId = item => `${id}-tab-${item}`;
  const buttons = tabs.map(({ id: item, label: text }) => {
    const active = item === selected;
    return `<button type="button" id="${escape(tabId(item))}" role="tab" aria-selected="${active}" aria-controls="${escape(panelId)}" tabindex="${active ? 0 : -1}" data-action="${escape(action)}" data-id="${escape(item)}" data-category="${escape(category)}">
      <svg class="book-tab-outline" viewBox="0 0 94 46" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M .5 45.5 V 15 C .5 7 6 .5 15 .5 H 56 C 71 .5 82 10 82 23 C 82 38 85 45.5 94 45.5"/></svg>
      <span>${escape(text)}</span></button>`;
  }).join('');
  return `<div class="learning-book" id="${escape(id)}" data-category="${escape(category)}" data-page="${escape(selected)}">
    <div class="book-tab-shelf">
      <div class="book-tab-track" role="tablist" aria-label="${escape(label)}"><div class="book-tab-row">${buttons}</div></div>
      <div class="book-tab-scroll" hidden>
        <button type="button" data-book-scroll="-1" aria-label="向前浏览标签">${icon('chevron')}</button>
        <button type="button" data-book-scroll="1" aria-label="向后浏览标签">${icon('chevron')}</button>
      </div>
    </div>
    <div class="learning-book-panel" id="${escape(panelId)}" role="tabpanel" aria-labelledby="${escape(tabId(selected))}">${content}</div>
  </div>`;
}

export function createBookTabs(root) {
  const currentBook = () => root.querySelector('.learning-book');
  const selectedTab = book => book?.querySelector('[role="tab"][aria-selected="true"]');
  let resizeObserver;
  let transition;

  function capture() {
    const book = currentBook();
    if (!book) return null;
    return { id: book.id, category: book.dataset.category, offset: book.querySelector('.book-tab-track').scrollLeft };
  }

  function bind(previous) {
    resizeObserver?.disconnect();
    const book = currentBook();
    if (!book) return;
    const shelf = book.querySelector('.book-tab-shelf');
    const track = shelf.querySelector('.book-tab-track');
    const row = track.firstElementChild;
    const scroll = shelf.querySelector('.book-tab-scroll');
    const [back, forward] = scroll.querySelectorAll('button');
    const revealSelected = () => {
      const tab = selectedTab(book);
      if (!tab) return;
      const bounds = track.getBoundingClientRect();
      const target = tab.getBoundingClientRect();
      if (target.left < bounds.left) track.scrollLeft += target.left - bounds.left;
      else if (target.right > bounds.right) track.scrollLeft += target.right - bounds.right;
    };
    const updateControls = () => {
      back.disabled = track.scrollLeft <= 1;
      forward.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    };
    const layout = offset => {
      scroll.hidden = row.offsetWidth <= shelf.clientWidth;
      if (offset !== undefined) track.scrollLeft = offset;
      revealSelected();
      updateControls();
    };
    layout(previous?.id === book.id && previous.category === book.dataset.category ? previous.offset : undefined);
    track.addEventListener('scroll', updateControls, { passive: true });
    scroll.addEventListener('click', event => {
      const button = event.target.closest('[data-book-scroll]');
      if (button) track.scrollLeft += Number(button.dataset.bookScroll) * track.clientWidth;
    });
    if (!window.ResizeObserver) return;
    resizeObserver = new ResizeObserver(() => layout());
    resizeObserver.observe(shelf);
    resizeObserver.observe(row);
  }

  function cancel() {
    if (!transition) return;
    transition.skipTransition();
    transition = null;
    document.documentElement.classList.remove('switching-book');
  }

  function turn(book, { animate, update, focusTab }) {
    cancel();
    const apply = () => {
      update();
      if (focusTab) selectedTab(currentBook())?.focus({ preventScroll: true });
    };
    if (!animate || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply();
      return;
    }
    document.documentElement.classList.add('switching-book');
    const pending = document.startViewTransition(() => {
      const current = currentBook();
      if (transition === pending && current?.id === book.id &&
        current.dataset.category === book.dataset.category && current.dataset.page === book.dataset.page) apply();
    });
    transition = pending;
    const finish = () => {
      if (transition !== pending) return;
      transition = null;
      document.documentElement.classList.remove('switching-book');
    };
    pending.finished.then(finish, finish);
  }

  function keydown(event) {
    const tab = event.target.closest('.book-tab-track [role="tab"]');
    if (!tab || !root.contains(tab) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return false;
    event.preventDefault();
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(tab);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex].focus({ preventScroll: true });
    tabs[nextIndex].click();
    return true;
  }

  return { capture, bind, cancel, turn, keydown };
}
