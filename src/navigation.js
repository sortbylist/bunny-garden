import './navigation.css';
import { icon } from './icons.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function renderNavPicker({ className, summary, summaryLabel, summaryId, panelClass, panelLabel, content }) {
  return `<details class="nav-picker ${className}">
    <summary class="nav-select" aria-label="${escape(summaryLabel)}"${summaryId ? ` id="${escape(summaryId)}"` : ''}>${summary}${icon('down')}</summary>
    <div class="nav-panel ${panelClass}" role="region" aria-label="${escape(panelLabel)}">${content}</div>
  </details>`;
}

export function createNavigation(select) {
  const configurations = new Map();
  const positions = new Map();
  const selections = new Map();
  const widths = new WeakMap();
  let observer;

  function render({ id, label, groupLabel, groups, selected, memories = {}, action, className = '', leadingPicker = '', catalogName }) {
    if (!groups.length) return `<div class="feature-bar"><span class="feature-placeholder">新的学习冒险，正在准备中</span></div>`;
    const isStage = action === 'feature';
    const activeGroup = groups.find(group => group.items.some(item => item.id === selected))
      || groups.find(group => group.id === memories[`${id}:group`]) || groups[0];
    const activeItem = activeGroup.items.find(item => item.id === selected);
    if (activeItem) {
      memories[`${id}:group`] = activeGroup.id;
      memories[`${id}:${activeGroup.id}`] = selected;
    }
    configurations.set(id, { groups, activeGroup, selected, memories, action });
    const single = !isStage && groups.length > 1 && activeGroup.items.length === 1 && activeGroup.name === activeGroup.items[0].name;
    const groupBadge = group => {
      const index = groups.indexOf(group);
      const number = group.number ?? index + 1;
      return `<span class="nav-group-index nav-group-color-${index % 5 + 1}" data-number="${String(number).padStart(2, '0')}" aria-hidden="true"></span>`;
    };
    const itemButton = (item, catalog = false) => `<button type="button" class="${catalog ? 'nav-catalog-item' : isStage ? 'feature-tab' : 'play-mode'} ${!catalog && item.id === selected ? isStage ? 'active' : 'selected' : ''}" data-action="${item.action || action}" data-id="${escape(item.id)}" ${catalog ? item.id === selected ? 'aria-current="true"' : '' : isStage ? `role="tab" aria-selected="${item.id === selected}"` : `aria-pressed="${item.id === selected}"`} title="${escape(item.description || item.name)}">${item.icon ? icon(item.icon) : ''}<span>${escape(item.name)}</span>${catalog && item.id === selected ? icon('check') : ''}</button>`;
    const groupPicker = isStage || groups.length > 1 ? renderNavPicker({
      className: 'nav-group-picker',
      summary: `<span class="nav-group-label">${groupBadge(activeGroup)}<span class="nav-group-name">${escape(activeGroup.name)}</span></span>`,
      summaryLabel: `选择${groupLabel}，当前：${[activeGroup.stage, activeGroup.name].filter(Boolean).join(' · ')}`,
      panelClass: 'nav-groups',
      panelLabel: groupLabel,
      content: `<div class="nav-panel-heading"><strong>选择${isStage ? '阶段' : '分类'}</strong></div>${groups.map(group => `<button type="button" class="nav-group-item" data-action="nav-group" data-id="${escape(group.id)}" ${group.id === activeGroup.id ? 'aria-current="true"' : ''}><span class="nav-group-label">${groupBadge(group)}<span class="nav-group-info"><strong>${escape(group.name)}</strong><small>${group.stage ? `${escape(group.stage)} · ` : ''}${group.items.length} ${isStage ? '个主题' : '种玩法'}</small></span></span>${group.id === activeGroup.id ? icon('check') : icon('chevron')}</button>`).join('')}`,
    }) : '';
    const catalogLabel = catalogName || (isStage ? '主题目录' : '分类目录');
    const catalogPicker = !single && (isStage || activeGroup.items.length > 0) ? renderNavPicker({
      className: 'nav-catalog-picker',
      summary: `<span class="nav-desktop-label">${escape(catalogLabel)}${isStage ? ` <small>${activeGroup.items.length}</small>` : ''}</span><span class="nav-mobile-label">${escape(isStage ? activeItem?.name || '选择' + label : catalogLabel)}</span>`,
      summaryLabel: `选择${catalogName || label}，当前：${activeItem?.name || '请选择'}`,
      panelClass: 'nav-catalog',
      panelLabel: isStage ? `${activeGroup.name}目录` : catalogLabel,
      content: `<div class="nav-panel-heading"><strong>${escape(isStage ? activeGroup.name : catalogLabel)}</strong>${isStage ? `<span>${activeGroup.items.length} 个主题</span>` : ''}</div>
        <label class="nav-search">${icon('search')}<input type="search" placeholder="搜索${isStage ? label : '分类'}" aria-label="${isStage ? `搜索本阶段${label}` : '搜索分类'}" autocomplete="off"></label>
        <div class="nav-catalog-list">${activeGroup.items.map(item => itemButton(item, true)).join('')}</div>
        <p class="nav-no-results" role="status" hidden>没有找到匹配的内容，试试其他关键词。</p>`,
    }) : '';
    return `<nav class="learning-navigation ${className} ${single ? 'nav-single' : ''}" data-navigation="${id}" aria-label="${label}">
      ${groupPicker}
      ${leadingPicker}
      <div class="nav-rail" ${single ? 'hidden' : ''}>
        ${isStage ? `<button type="button" class="nav-scroll nav-previous" data-action="nav-scroll" data-direction="-1" aria-label="向左查看${label}" disabled>${icon('chevron')}</button>` : ''}
        <div class="nav-tabs ${isStage ? 'feature-tabs' : 'play-mode-buttons'}" role="${isStage ? 'tablist' : 'group'}" aria-label="${label}" data-scroll-key="${escape(`${id}:${activeGroup.id}`)}">${activeGroup.items.map(item => itemButton(item)).join('')}</div>
        ${isStage ? `<button type="button" class="nav-scroll" data-action="nav-scroll" data-direction="1" aria-label="向右查看${label}" disabled>${icon('chevron')}</button>` : ''}
      </div>
      ${catalogPicker}
    </nav>`;
  }

  function capture() {
    document.querySelectorAll('.feature-navigation .nav-tabs').forEach(element => {
      if (element.clientWidth) positions.set(element.dataset.scrollKey, element.scrollLeft);
    });
  }

  function updateEdges(rail) {
    const tabs = rail.querySelector('.nav-tabs');
    const buttons = rail.querySelectorAll('.nav-scroll');
    buttons[0].disabled = tabs.scrollLeft <= 1;
    buttons[1].disabled = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 1;
    rail.classList.toggle('nav-fits', buttons[0].disabled && buttons[1].disabled);
  }

  function revealSelection(tabs) {
    if (!tabs.clientWidth) return;
    const selected = tabs.querySelector('[aria-selected="true"], [aria-pressed="true"]');
    if (!selected) return;
    const bounds = selected.getBoundingClientRect();
    const viewport = tabs.getBoundingClientRect();
    if (bounds.left < viewport.left) tabs.scrollLeft += bounds.left - viewport.left;
    else if (bounds.right > viewport.right) tabs.scrollLeft += bounds.right - viewport.right;
  }

  function bind() {
    observer?.disconnect();
    observer = new ResizeObserver(entries => entries.forEach(({ target }) => {
      if (widths.get(target) !== target.clientWidth) {
        widths.set(target, target.clientWidth);
        revealSelection(target);
      }
      updateEdges(target.closest('.nav-rail'));
    }));
    document.querySelectorAll('.feature-navigation').forEach(root => {
      const config = configurations.get(root.dataset.navigation);
      const tabs = root.querySelector('.nav-tabs');
      if (!tabs || tabs.closest('[hidden]')) return;
      tabs.scrollLeft = positions.get(tabs.dataset.scrollKey) || 0;
      const previous = selections.get(tabs.dataset.scrollKey);
      if (previous !== config.selected || !positions.has(tabs.dataset.scrollKey)) revealSelection(tabs);
      selections.set(tabs.dataset.scrollKey, config.selected);
      updateEdges(root.querySelector('.nav-rail'));
      tabs.addEventListener('scroll', () => {
        if (tabs.clientWidth) positions.set(tabs.dataset.scrollKey, tabs.scrollLeft);
        updateEdges(root.querySelector('.nav-rail'));
      }, { passive: true });
      widths.set(tabs, tabs.clientWidth);
      observer.observe(tabs);
    });
  }

  function click(event) {
    const picker = event.target.closest('.nav-picker');
    document.querySelectorAll('.nav-picker[open]').forEach(element => {
      if (element !== picker) element.open = false;
    });
    const target = event.target.closest('[data-action]');
    const root = target?.closest('.learning-navigation');
    if (!root) return false;
    const config = configurations.get(root.dataset.navigation);
    if (target.dataset.action === 'nav-scroll') {
      const tabs = root.querySelector('.nav-tabs');
      tabs.scrollBy({ left: Number(target.dataset.direction) * Math.max(tabs.clientWidth * .75, 150), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      return true;
    }
    if (target.dataset.action === 'nav-group') {
      const group = config.groups.find(item => item.id === target.dataset.id);
      const remembered = config.memories[`${root.dataset.navigation}:${group.id}`];
      select(config.action, group.items.find(item => item.id === remembered)?.id || group.items[0].id);
      return true;
    }
    return false;
  }

  function input(event) {
    if (!event.target.matches('.nav-search input')) return false;
    const query = event.target.value.trim().toLocaleLowerCase();
    const panel = event.target.closest('.nav-panel');
    let count = 0;
    panel.querySelectorAll('.nav-catalog-item').forEach(element => {
      element.hidden = !element.textContent.toLocaleLowerCase().includes(query);
      if (!element.hidden) count++;
    });
    panel.querySelector('.nav-no-results').hidden = count > 0;
    return true;
  }

  function keydown(event) {
    if (event.key !== 'Escape') return false;
    const picker = document.querySelector('.nav-picker[open]');
    if (!picker) return false;
    event.preventDefault();
    picker.open = false;
    picker.querySelector('summary').focus({ preventScroll: true });
    return true;
  }

  return { render, capture, bind, click, input, keydown };
}

export function renderCurriculum(navigation, { id, selected, learning = [], practice = [], leadingPicker, catalogName }) {
  return navigation.render({
    id, label: '课程分类', selected, leadingPicker, catalogName, className: 'play-selector mode-navigation curriculum-navigation',
    groups: [{ id: 'curriculum', name: '分类目录', items: [...learning, ...practice] }],
  });
}

export function renderCoursePicker({ name, active = false, panelLabel = '学习分类', content }) {
  return renderNavPicker({
    className: `course-picker${active ? ' active' : ''}`,
    summary: `<span title="${escape(name)}">${escape(name)}</span>`,
    summaryLabel: name,
    panelClass: 'course-picker-panel',
    panelLabel,
    content,
  });
}
