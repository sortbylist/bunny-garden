import { defineMathTopic, section, question, numericQuestion, calculations } from './math-content.js';

const meaning = Array.from({ length: 12 }, (_, index) => {
  const groups = index % 4 + 2;
  const each = index % 3 + 3;
  return numericQuestion(`meaning-${index}`, 'meaning', `有 ${groups} 盘苹果，每盘 ${each} 个，一共有多少个？`, groups * each, `${groups} 个 ${each} 相加，可以写成 ${each} × ${groups} = ${groups * each}。`, '', { operation: 'multiply', operands: [groups, each] });
});
const tables = calculations('tables', 'multiply', [[2, 6], [3, 7], [4, 8], [5, 9], [6, 7], [7, 8], [8, 9], [9, 9], [6, 8], [7, 7], [4, 9], [6, 9]]);
const multiples = Array.from({ length: 12 }, (_, index) => {
  const base = index % 5 + 2;
  const times = index % 4 + 2;
  return index % 2
    ? numericQuestion(`multiple-${index}`, 'multiples', `红花有 ${base * times} 朵，黄花有 ${base} 朵，红花的朵数是黄花的几倍？`, times, `把 ${base} 朵看作一份，${base * times} 里有 ${times} 份，${base * times} ÷ ${base} = ${times}。`, '', { operation: 'divide', operands: [base * times, base] })
    : numericQuestion(`multiple-${index}`, 'multiples', `黄花有 ${base} 朵，红花是黄花的 ${times} 倍，红花有多少朵？`, base * times, `${base} 的 ${times} 倍就是 ${times} 个 ${base}，${base} × ${times} = ${base * times}。`, '', { operation: 'multiply', operands: [base, times] });
});
const tens = calculations('tens', 'multiply', [[20, 3], [30, 4], [40, 5], [60, 2], [70, 6], [80, 4], [200, 3], [300, 4], [400, 2], [500, 6], [600, 5], [700, 3]]);
const single = calculations('single', 'multiply', [[123, 3], [212, 4], [132, 3], [213, 3], [124, 2], [312, 3], [136, 4], [247, 3], [158, 6], [269, 3], [378, 2], [486, 2]]);
const double = calculations('double', 'multiply', [[23, 12], [12, 14], [21, 23], [32, 12], [24, 13], [31, 22], [25, 16], [36, 24], [47, 15], [58, 12], [64, 23], [76, 14]]);
const zero = calculations('zero', 'multiply', [[0, 8], [105, 3], [206, 4], [304, 2], [402, 3], [503, 2], [120, 3], [230, 4], [340, 2], [250, 4], [160, 5], [408, 2]]);
const estimates = [[198, 4], [302, 3], [497, 2], [603, 5], [799, 3], [901, 4]].map(([left, right], index) => {
  const rounded = Math.round(left / 100) * 100;
  return numericQuestion(`estimate-${index}`, 'check', '先把三位数四舍五入到整百数，再估算积。', rounded * right, `${left} 约是 ${rounded}，${rounded} × ${right} = ${rounded * right}。`, `${left} × ${right}`, { operation: 'estimate-multiply', operands: [left, right] });
});
const checks = [[23, 12], [12, 14], [21, 23], [32, 12], [24, 13], [31, 22]].map(([left, right], index) => question(`check-${index}`, 'check', `哪一个算式可以通过交换乘数验算 ${left} × ${right}？`, `${right} × ${left}`, [`${left} + ${right}`, `${left} − ${right}`], '交换两个乘数的位置，积不变，重新计算可以帮助检查。'));

export const multiplicationTopic = defineMathTopic({
  id: 'math-multiplication', name: '乘法', icon: 'layers', description: '从几个相同的数相加出发，学口诀、找倍数，再练习竖式。',
  sections: [
    section('meaning', '乘法的意义', '几个相同的数相加，可以用乘法表示。先看有几组，再看每组有几个。', ['4 + 4 + 4 = 4 × 3 = 12。', '3 组，每组 4 个，一共有 12 个。'], '画 3 组圆点，每组 4 个，说出加法和乘法算式。', '4 + 4 + 4 = 12，也可以写成 4 × 3 = 12。', meaning, { type: 'groups', groups: 3, each: 4 }),
    section('tables', '乘法口诀', '用乘法口诀口算表内乘法。交换两个乘数，积不变，可以使用同一句口诀。', ['7 × 8 = 56，用“七八五十六”。', '8 × 7 = 56，也用“七八五十六”。'], '6 × 9 和 9 × 6 用哪一句口诀？', '六九五十四，两个算式的积都是 54。', tables),
    section('multiples', '倍的认识', '把一个数量看作一份，另一个数量有这样的几份，就是它的几倍。求几倍用除法，求一个数的几倍用乘法。', ['黄花 3 朵，红花 12 朵，12 ÷ 3 = 4，红花是黄花的 4 倍。', '3 的 4 倍是 3 × 4 = 12。'], '蓝球 5 个，红球 15 个，红球是蓝球的几倍？', '15 ÷ 5 = 3，红球是蓝球的 3 倍。“倍”不是个数单位。', multiples),
    section('tens', '整十整百数乘一位数', '可以先把整十数看作几个十、整百数看作几个百，再乘一位数。', ['20 × 3：2 个十乘 3 是 6 个十，等于 60。', '200 × 3：2 个百乘 3 是 6 个百，等于 600。'], '口算 300 × 4，说说积有几个百。', '3 个百乘 4 是 12 个百，等于 1200。', tens),
    section('single', '多位数乘一位数', '从个位起，用一位数依次乘各数位上的数。哪一位的积满几十，就向前一位进几。', ['123 × 3 = 369。', '136 × 4 = 544，个位和十位都需要进位。'], '计算 136 × 4，个位 6 × 4 = 24，怎样写？', '个位写 4，向十位进 2；十位 3 × 4 + 2 = 14，写 4 进 1；百位 1 × 4 + 1 = 5。', single, { type: 'column', left: 136, right: 4, operator: '×', result: 544, note: '先乘个位，再乘十位和百位，每一步都要加上进位。' }),
    section('double', '两位数乘两位数', '先用第二个乘数的个位去乘，再用十位去乘，最后把两部分的积相加。十位上的 1 表示一个十。', ['23 × 12 = 23 × 2 + 23 × 10。', '46 + 230 = 276。'], '23 × 12 的第二部分为什么是 230，而不是 23？', '12 的十位 1 表示 10，23 × 10 = 230。个位部分 46，加上十位部分 230，得到 276。', double, { type: 'partial-products', left: 23, right: 12 }),
    section('zero', '乘数中间或末尾有 0', '0 和任何数相乘都得 0。中间的 0 要占住数位；末尾有 0 时，可以先理解几个十或几个百。', ['206 × 4 = 824，十位要加上个位进来的 2。', '120 × 3 = 360。'], '计算 105 × 3，十位上为什么不是 0？', '个位 5 × 3 = 15，进 1；十位 0 × 3 + 1 = 1，所以积是 315。', zero),
    section('check', '估算与验算', '估算先判断积大约有多大。验算可以交换两个乘数再算，也可以把乘数拆开，比较两种计算的结果。', ['198 × 4，先按 200 × 4 估算，积约是 800。', '23 × 12 可以用 12 × 23 再算一次。'], '302 × 3 约是几百？精确结果是多少？', '约是 900，精确结果是 906。估算与精确计算各有用途。', [...estimates, ...checks]),
  ],
});
