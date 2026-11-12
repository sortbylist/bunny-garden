import { defineMathTopic, section, question, numericQuestion } from './math-content.js';

const values = [1203, 2040, 3050, 4006, 5070, 6081, 7009, 8090, 9012, 9999, 1000, 5608];
const readings = ['一千二百零三', '二千零四十', '三千零五十', '四千零六', '五千零七十', '六千零八十一', '七千零九', '八千零九十', '九千零一十二', '九千九百九十九', '一千', '五千六百零八'];
const readQuestions = values.map((value, index) => question(`read-${index}`, 'read', index % 2 ? '这个数怎样写？' : '这个数怎样读？', index % 2 ? value : readings[index],
  index % 2 ? [value + 100, value + 10, value - 1] : [readings[(index + 1) % readings.length], readings[(index + 2) % readings.length], readings[(index + 3) % readings.length]],
  `${value} 读作“${readings[index]}”。中间连续的 0 只读一个“零”，末尾的 0 不读。`, index % 2 ? readings[index] : String(value)));
const places = values.map((value, index) => {
  const place = [1, 10, 100, 1000][index % 4];
  const digit = Math.floor(value / place) % 10;
  return numericQuestion(`place-${index}`, 'place', `${value} 的${{ 1: '个', 10: '十', 100: '百', 1000: '千' }[place]}位上是几？`, digit, `${place} 对应的数位上是 ${digit}，表示 ${digit} 个 ${place}。`);
});
const compares = values.map((value, index) => {
  const other = value + (index % 3 === 0 ? 0 : index % 2 ? 10 : -10);
  return question(`compare-${index}`, 'compare', '在 ○ 里填上合适的符号。', value === other ? '=' : value > other ? '>' : '<', ['>', '<', '='].filter(symbol => symbol !== (value === other ? '=' : value > other ? '>' : '<')), '先比位数；位数相同时，从最高位起逐位比较，相同再看下一位。', `${value} ○ ${other}`);
});
const sorts = values.map((value, index) => {
  const descending = index % 2 === 1;
  const numbers = [value - 20, value - 10, value];
  const answer = (descending ? [...numbers].reverse() : numbers).join('、');
  return question(`sort-${index}`, 'sort', descending ? '从大到小排列，哪一项正确？' : '从小到大排列，哪一项正确？', answer,
    [[numbers[1], numbers[0], numbers[2]].join('、'), [numbers[0], numbers[2], numbers[1]].join('、')],
    `从小到大是 ${numbers.join(' < ')}。${descending ? '从大到小要把顺序反过来。' : '从小到大要先写最小的数。'}`, `${numbers[1]}、${numbers[2]}、${numbers[0]}`);
});
const roundValues = [1234, 1250, 2368, 3449, 3450, 4567, 5621, 6750, 7899, 8049, 8050, 9949];
const approximations = roundValues.map((value, index) => {
  const rounded = Math.round(value / 100) * 100;
  return numericQuestion(`approximate-${index}`, 'approximate', '四舍五入到整百数，约是多少？', rounded, `看十位：${Math.floor(value / 10) % 10} ${Math.floor(value / 10) % 10 >= 5 ? '大于或等于 5，向前进一百' : '小于 5，舍去后面的零头'}，${value} 约是 ${rounded}。`, String(value), { operation: 'round-hundred', operands: [value] });
});

export const numberTopic = defineMathTopic({
  id: 'math-numbers', name: '数的认识', icon: 'grid', description: '读一读、摆一摆、比一比，发现万以内数的组成和顺序。',
  sections: [
    section('read', '读数与写数', '从高位读起，按数位写数。中间有 0 时要留住数位，不能把它丢掉。', ['3050 读作三千零五十。', '四千零六写作 4006。'], '“二千零三十”怎样写？说说两个 0 分别在哪一位。', '写作 2030，百位和个位都是 0。', readQuestions),
    section('place', '数位与组成', '从右往左依次是个位、十位、百位、千位。同一个数字，在不同数位表示的大小不同。', ['3524 = 3000 + 500 + 20 + 4。', '3050 由 3 个千和 5 个十组成。'], '3524 的百位是几？它表示多少？', '百位是 5，表示 5 个百，也就是 500。', places, { type: 'places', value: 3524 }),
    section('compare', '大小比较', '位数多的数通常大；位数相同时，从最高位开始比较。> 表示大于，< 表示小于。', ['999 < 1000，因为三位数小于四位数。', '3524 > 3508，千位、百位相同，再比较十位。'], '比较 4080 和 4008，说说先看哪个数位。', '4080 > 4008。千位、百位相同，十位的 8 大于 0。', compares),
    section('sort', '数的排序', '先比较大小，再按要求从小到大或从大到小排列。排好以后，检查是否漏数或重复。', ['从小到大：2010 < 2100 < 2101。', '从大到小：5600 > 5060 > 5006。'], '把 3020、3200、3002 从小到大排列。', '3002 < 3020 < 3200。', sorts),
    section('approximate', '认识近似数', '近似数表示“大约”。本节把数四舍五入到整百数：看十位，满 5 进一百，不满 5 舍去零头。', ['1234 约是 1200。', '1250 约是 1300。'], '图书馆有 2368 本书，四舍五入到整百数约是多少本？', '十位是 6，向前进一百，约有 2400 本。近似数不能当成精确数量。', approximations),
  ],
});
