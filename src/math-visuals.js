import './math.css';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function mathVisual(visual) {
  if (!visual) return '';
  if (visual.type === 'places') return `<figure class="ct-visual math-visual"><figcaption><strong>数位上的数字各有含义</strong></figcaption><table class="math-places"><thead><tr>${['千位', '百位', '十位', '个位'].map(name => `<th scope="col">${name}</th>`).join('')}</tr></thead><tbody><tr>${String(visual.value).padStart(4, '0').split('').map(digit => `<td>${digit}</td>`).join('')}</tr></tbody></table><p>${visual.value} = ${String(visual.value).padStart(4, '0').split('').map((digit, index) => Number(digit) * 10 ** (3 - index)).filter(Boolean).join(' + ')}</p></figure>`;
  if (visual.type === 'groups') return `<figure class="ct-visual math-visual"><figcaption><strong>${visual.groups} 组，每组 ${visual.each} 个</strong></figcaption><div class="math-groups">${Array.from({ length: visual.groups }, (_, index) => `<div class="math-dot-group" role="img" aria-label="第 ${index + 1} 组，${visual.each} 个圆点">${'<span aria-hidden="true">●</span>'.repeat(visual.each)}</div>`).join('')}</div><p>${visual.each} × ${visual.groups} = ${visual.each * visual.groups}；${visual.each * visual.groups} ÷ ${visual.groups} = ${visual.each}。</p></figure>`;
  if (visual.type === 'partial-products') {
    const ones = visual.right % 10;
    const tens = Math.floor(visual.right / 10) * 10;
    return `<figure class="ct-visual math-visual"><figcaption><strong>把两位数拆开乘</strong></figcaption><div class="math-products"><p>${visual.left} × ${ones} = <b>${visual.left * ones}</b></p><p>${visual.left} × ${tens} = <b>${visual.left * tens}</b></p><p>${visual.left * ones} + ${visual.left * tens} = <b>${visual.left * visual.right}</b></p></div><p>个位部分与十位部分相加，十位上的积要表示几个十。</p></figure>`;
  }
  if (visual.type === 'column') return `<figure class="ct-visual math-visual"><figcaption><strong>相同数位对齐</strong></figcaption><div class="math-column" role="img" aria-label="${escape(`${visual.left} ${visual.operator} ${visual.right} = ${visual.result}。${visual.note}`)}"><div>${visual.left}</div><div class="math-column-operand"><span>${escape(visual.operator)}</span>${visual.right}</div><div class="math-column-result">${visual.result}</div></div><p>${escape(visual.note)}</p></figure>`;
  return '';
}
