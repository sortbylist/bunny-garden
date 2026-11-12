const paths = {
  book: '<path d="M12 6c-3-3-7-3-9-2v15c3-1 6 0 9 2 3-2 6-3 9-2V4c-2-1-6-1-9 2Zm0 0v15"/>',
  notebook: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M3 7h4M3 12h4M3 17h4m6-9h4m-4 4h4"/>',
  quote: '<path d="M4 6h6v6H4V6Zm10 0h6v6h-6V6Zm-4 6c0 4-2 6-5 7m15-7c0 4-2 6-5 7"/>',
  math: '<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M8 8h8M8 13h2m4 0h2m-8 4h2m4 0h2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m7-12-4 4 4 4"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3L3.2 9.7l6.4-.9Z"/>',
  heart: '<path d="M20.5 4.5a5.5 5.5 0 0 0-8.5 1 5.5 5.5 0 0 0-8.5-1c-5 5 2 11 8.5 16 6.5-5 13.5-11 8.5-16Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="currentColor"/><circle cx="16" cy="17" r="3" fill="currentColor"/>',
  shuffle: '<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3m-4-4 4 4-4 4"/>',
  sprout: '<path d="M12 21v-8C2 14 2 5 2 5s10-2 10 8c0-10 10-10 10-10s1 11-10 10"/>',
  flower: '<path d="M12 8c-7-9-12 2-5 4-7 4 0 12 5 5 5 7 12-1 5-5 7-2 2-13-5-4Z"/><circle cx="12" cy="12" r="2"/>',
  layers: '<path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
  wave: '<path d="M3 12h2l3-8 4 16 4-16 3 8h2"/>',
  headphones: '<path d="M3 15v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
  puzzle: '<path d="M4 4h6a3 3 0 1 1 4 0h6v6a3 3 0 1 0 0 4v6h-6a3 3 0 1 1-4 0H4v-6a3 3 0 1 0 0-4Z"/>',
  type: '<path d="M4 5h16M12 5v15M8 20h8M4 5v3m16-3v3"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  compare: '<path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/>',
  pen: '<path d="m4 16 12-12a3 3 0 0 1 4 4L8 20l-5 1 1-5Zm9-9 4 4"/>',
  link: '<path d="m9 15 6-6m-5-3 2-2a5 5 0 0 1 7 7l-3 3m-2 4-2 2a5 5 0 0 1-7-7l3-3"/>',
  flag: '<path d="M5 22V3c5-5 9 5 15 0v10c-6 5-10-5-15 0"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  leaf: '<path d="M20 3C2 2 1 14 7 18 18 24 22 11 20 3ZM4 21l12-12"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
};
export function icon(name, extra = '') {
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
}

export function bunny() {
  return `<svg class="bunny-scene" viewBox="0 0 260 180" fill="none" aria-hidden="true">
    <ellipse cx="134" cy="161" rx="82" ry="9" fill="#d5dfc1"/>
    <path d="M49 158c-6-17-4-30 2-35 5 8 4 19 1 25 7-10 13-13 18-11-2 10-9 17-18 21" fill="#8bb695"/>
    <path d="M204 161c-5-12-5-23 1-29 4 5 4 14 1 20 7-9 13-10 16-7-3 8-9 13-16 16" fill="#8bb695"/>
    <g stroke="#66515b" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M98 90C79 51 85 15 97 17c12 2 19 41 18 64M140 83c-1-30 7-69 21-65 14 5 4 49-7 73" fill="#fffdf6"/>
    <path d="M99 62c-7-19-7-31-3-34 5 4 10 23 11 35M147 63c2-18 6-32 11-34 4 5-1 26-5 35" stroke="#edb7bd" stroke-width="7"/>
    <path d="M94 127c-8 10-9 29 3 32h64c12-7 3-26-4-33" fill="#fffdf6"/>
    <path d="M86 88c9-22 69-29 84 0 10 20 6 45-39 47-42 1-54-21-45-47Z" fill="#fffdf6"/>
    <path d="m112 129 18 9 19-9 5 31h-47Z" fill="#ebc5db"/>
    <path d="M98 144c12-9 20-6 22 2M146 145c10-9 15-4 16 1"/>
    <path d="m109 108 3-3m37 3-3-3"/>
    <path d="m124 113 5 3 5-3m-5 4v4m0 0c-4 4-7 1-7-1m7 1c4 4 7 1 7-1"/>
    <path d="m105 149 23 5 27-6v18l-26 7-24-6Z" fill="#b3d5c2"/>
    <path d="m129 154 1 18"/>
    </g>
    <ellipse cx="104" cy="117" rx="8" ry="4" fill="#f3c0c5"/><ellipse cx="153" cy="117" rx="8" ry="4" fill="#f3c0c5"/>
    <path d="m61 56 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="#eac774"/><path d="m190 86 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#eac774"/>
    <path d="M191 38c-12-10-17 5 0 13 17-8 12-23 0-13" fill="#e9b7c4"/>
  </svg>`;
}
