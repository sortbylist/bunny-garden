export function observeReadingRows(root) {
  const containers = [...root.querySelectorAll('.hz-item-list, .hz-options')];
  let disposed = false;
  const widths = new WeakMap();
  const alignRows = container => {
    const cards = [...container.children];
    for (const card of cards) card.classList.remove('has-reading-row');
    const rows = new Map();
    for (const card of cards) {
      const top = card.offsetTop;
      if (!rows.has(top)) rows.set(top, []);
      rows.get(top).push(card);
    }
    for (const row of rows.values()) {
      if (row.some(card => card.querySelector('ruby'))) {
        for (const card of row) card.classList.add('has-reading-row');
      }
    }
  };
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      if (widths.get(entry.target) === width) continue;
      widths.set(entry.target, width);
      alignRows(entry.target);
    }
  });
  for (const container of containers) {
    alignRows(container);
    observer.observe(container);
  }
  root.ownerDocument.fonts.ready.then(() => {
    if (!disposed) containers.forEach(alignRows);
  });
  return () => {
    disposed = true;
    observer.disconnect();
  };
}
