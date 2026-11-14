const paths = {
  book: '<path d="M12 6c-3-3-7-3-9-2v15c3-1 6 0 9 2 3-2 6-3 9-2V4c-2-1-6-1-9 2Zm0 0v15"/>',
  notebook: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M3 7h4M3 12h4M3 17h4m6-9h4m-4 4h4"/>',
  quote: '<path d="M4 6h6v6H4V6Zm10 0h6v6h-6V6Zm-4 6c0 4-2 6-5 7m15-7c0 4-2 6-5 7"/>',
  math: '<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M8 8h8M8 13h2m4 0h2m-8 4h2m4 0h2"/>',
  'number-write': '<path d="M4 5h7M4 10h5M4 15h3m4 2 8-12 3 2-8 12-4 2 1-4Zm6-9 3 2"/>',
  'place-value': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16M3 9h18M6 13v3m6-3v3m6-3v3"/>',
  'number-compare': '<path d="m9 6-6 6 6 6m6-12 6 6-6 6"/>',
  'number-sort': '<path d="M4 19v-5m6 5V9m6 10V4m3 10 2 2 2-2m-2 2V3"/>',
  'number-round': '<path d="M3 17h18M5 15v4m7-4v4m7-4v4M7 11c2-7 9-8 12-3m-4 0h4V4"/><circle cx="7" cy="11" r="1"/>',
  'mental-math': '<path d="M9 21v-4H6v-5H3l3-6a8 8 0 0 1 15 3c0 4-3 6-4 8v4M14 5l-3 5h5l-3 5"/>',
  'add-subtract': '<path d="M3 7h8M7 3v8m6 6h8M4 21 20 3"/>',
  'carry': '<path d="M3 15h8M7 11v8m7-11 4-4 4 4m-4-4v15"/>',
  'borrow': '<path d="M3 15h8m3 0 4 4 4-4m-4 4V4"/>',
  'carry-chain': '<path d="M3 19v-5h6V9h6V4h6M3 8V3m-2 2h4m12 14h5m-4-7 3 3-3 3"/>',
  'estimate-check': '<rect x="3" y="3" width="13" height="18" rx="2"/><path d="M6 7h7M6 12h2m4 0h1m-7 5h2m3 1 3 3 7-8"/>',
  'equal-groups': '<rect x="2" y="5" width="8" height="14" rx="3"/><rect x="14" y="5" width="8" height="14" rx="3"/><circle cx="6" cy="9" r="1"/><circle cx="6" cy="15" r="1"/><circle cx="18" cy="9" r="1"/><circle cx="18" cy="15" r="1"/>',
  'times-table': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M9 15h12M15 9v12M5 5l2 2m0-2L5 7"/>',
  multiples: '<path d="M3 18h18M3 15v6m6-6v6m6-6v6m6-6v6M3 11c1-5 5-5 6 0 1-5 5-5 6 0 1-5 5-5 6 0"/>',
  'tens-multiply': '<path d="m2 9 2-2v10m12-8 6 6m0-6-6 6"/><rect x="8" y="7" width="4" height="10" rx="2"/>',
  'column-multiply': '<path d="M10 3v2m5-2v2m5-2v2M3 9l4 4m0-4-4 4m7-3v2m5-2v2m5-2v2M3 16h18m-11 3v2m5-2v2m5-2v2"/>',
  'area-multiply': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M10 3v18M3 10h18m10 3 5 5m0-5-5 5"/>',
  'zero-multiply': '<rect x="3" y="5" width="8" height="14" rx="4"/><path d="m15 8 6 8m0-8-6 8"/>',
  share: '<path d="M12 3v5M5 12V8h14v4"/><rect x="2" y="15" width="6" height="6" rx="2"/><rect x="16" y="15" width="6" height="6" rx="2"/><circle cx="12" cy="3" r="1"/>',
  'divide-table': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18m3-6h6"/><circle cx="15" cy="12" r=".5"/><circle cx="15" cy="18" r=".5"/>',
  remainder: '<rect x="2" y="4" width="13" height="16" rx="3"/><circle cx="6" cy="9" r="1"/><circle cx="11" cy="9" r="1"/><circle cx="6" cy="15" r="1"/><circle cx="11" cy="15" r="1"/><circle cx="20" cy="12" r="2"/>',
  'tens-divide': '<path d="m2 9 2-2v10m12-5h6"/><rect x="8" y="7" width="4" height="10" rx="2"/><circle cx="19" cy="7" r=".5"/><circle cx="19" cy="17" r=".5"/>',
  'two-digit-divide': '<path d="M7 4h14M5 6c3 4 3 9 0 14m7-11v3m6-3v3M10 16h11"/>',
  'three-digit-divide': '<path d="M7 4h14M5 6c3 4 3 9 0 14m6-11v3m4-3v3m4-3v3m-9 4h11"/>',
  'zero-divide': '<rect x="3" y="5" width="8" height="14" rx="4"/><path d="M15 12h7"/><circle cx="18.5" cy="7" r=".5"/><circle cx="18.5" cy="17" r=".5"/>',
  'divide-check': '<path d="M3 9h9m-7 9 3 3 6-7m2-10 5 5m0-5-5 5"/><circle cx="7.5" cy="4" r=".5"/><circle cx="7.5" cy="14" r=".5"/>',
  'multiply-divide': '<path d="m3 3 7 7m0-7-7 7m10 7h8"/><circle cx="17" cy="12" r=".5"/><circle cx="17" cy="22" r=".5"/>',
  'operation-order': '<path d="m3 3 6 6m0-6L3 9m12 9h6m-3-3v6M4 14c0 4 3 5 7 5m-3-3 3 3-3 3m5-17h8"/>',
  brackets: '<path d="M7 3c-5 4-5 14 0 18M17 3c5 4 5 14 0 18M9 12h6m-3-3v6"/>',
  unknown: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v1"/>',
  person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  paw: '<ellipse cx="12" cy="16" rx="6" ry="5"/><ellipse cx="4" cy="10" rx="2" ry="3"/><ellipse cx="9" cy="5" rx="2" ry="3"/><ellipse cx="15" cy="5" rx="2" ry="3"/><ellipse cx="20" cy="10" rx="2" ry="3"/>',
  running: '<circle cx="15" cy="4" r="2"/><path d="m4 9 5-2 5 3 4 2 3-2M14 10l-4 5 5 3v4m-5-7-4 5H2m7-13-2 5"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 9v1m8-1v1m-9 4c2 4 8 4 10 0"/>',
  seasons: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  ruler: '<path d="m3 16 13-13 5 5L8 21l-5-5Zm3-3 3 3m0-6 2 2m1-5 3 3m0-6 2 2"/>',
  'pattern-abb': '<circle cx="5" cy="12" r="3"/><rect x="11" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/>',
  'pattern-aabb': '<circle cx="3" cy="12" r="2"/><circle cx="9" cy="12" r="2"/><rect x="13" y="10" width="4" height="4" rx=".5"/><rect x="19" y="10" width="4" height="4" rx=".5"/>',
  'pattern-abab': '<circle cx="3" cy="12" r="2"/><rect x="7" y="10" width="4" height="4" rx=".5"/><circle cx="15" cy="12" r="2"/><rect x="19" y="10" width="4" height="4" rx=".5"/>',
  'four-words': '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7.5 8v8M12 8v8m4.5-8v8"/>',
  scroll: '<path d="M5 3h14v14H5V3ZM5 3a2 2 0 0 0-2 2v2h2m14 6h2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2m4-10h6m-6 4h6"/>',
  'word-order': '<rect x="2" y="3" width="7" height="7" rx="2"/><rect x="15" y="14" width="7" height="7" rx="2"/><path d="M12 6h6v5m-3-3 3 3 3-3M3 18h8m-3-3 3 3-3 3"/>',
  'sentence-complete': '<path d="M3 4h18v13H9l-5 4v-4H3V4Zm4 5h10m-10 4h5m3-1v3m-1.5-1.5h3"/>',
  'punctuation-period': '<circle cx="12" cy="14" r="4"/>',
  'punctuation-comma': '<path d="M14 11c1 5-1 8-5 9"/><circle cx="12" cy="11" r="2"/>',
  'punctuation-question': '<path d="M7 8a5 5 0 1 1 8 4c-3 1-3 2-3 4m0 4v1"/>',
  'punctuation-exclamation': '<path d="M12 3v12m0 5v1"/>',
  'punctuation-colon': '<circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="17" r="1.5"/>',
  parallel: '<path d="M3 7h18m-4-4 4 4-4 4M3 17h18m-4-4 4 4-4 4"/>',
  'arrow-right': '<path d="M3 12h18m-7-7 7 7-7 7"/>',
  branches: '<path d="M4 12h7m0 0V5h10m-4-4 4 4-4 4m-6 3v7h10m-4-4 4 4-4 4"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5m4-4h5m-5 5h5"/>',
  expand: '<path d="M8 3H3v5m0-5 6 6m7-6h5v5m0-5-6 6M3 16v5h5m-5 0 6-6m12 1v5h-5m5 0-6-6"/>',
  eraser: '<path d="m3 14 10-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3L11 22H7l-4-5a2 2 0 0 1 0-3Zm4-4 9 9m-5 3h10"/>',
  'character-radical': '<rect x="3" y="3" width="6" height="18" rx="1"/><path d="M13 5h8m-4-2v18m-5-10h10m-10 6h10"/>',
  'stroke-order': '<path d="M4 7h16M12 3v18m-8-5 3 3 3-3m-3 3v-8m10 4 3 3-3 3"/>',
  'character-single': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 9h10m-5-3c0 7-1 9-5 12m5-8c0 4 2 6 5 8"/>',
  'character-left-right': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M6 8h3m-3 4h3m6-4h3m-3 8h3"/>',
  'character-top-bottom': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M8 7h8m-8 10h8"/>',
  lantern: '<ellipse cx="12" cy="11" rx="8" ry="7"/><path d="M9 4V2h6v2M4 11h16m-8-7c-4 4-4 10 0 14 4-4 4-10 0-14Zm-3 14v3m3-3v4m3-4v3"/>',
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
