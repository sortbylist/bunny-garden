import { defineMathTopic, section, question, numericQuestion, calculations } from './math-content.js';

const meaning = Array.from({ length: 12 }, (_, index) => {
  const groups = index % 4 + 2;
  const each = index % 3 + 3;
  const total = groups * each;
  return numericQuestion(`meaning-${index}`, 'meaning', index % 2 ? `${total} 块饼干，每 ${each} 块装一袋，可以装几袋？` : `${total} 块饼干，平均分给 ${groups} 人，每人几块？`, index % 2 ? groups : each, index % 2 ? `${total} 里面有 ${groups} 个 ${each}，${total} ÷ ${each} = ${groups}。` : `每人分得同样多，${total} ÷ ${groups} = ${each}。`, '', { operation: 'divide', operands: [total, index % 2 ? each : groups] });
});
const tables = calculations('tables', 'divide', [[12, 2], [21, 3], [32, 4], [45, 5], [42, 6], [56, 7], [72, 8], [81, 9], [48, 6], [49, 7], [36, 4], [54, 9]]);
const remainder = calculations('remainder', 'remainder', [[14, 3], [19, 4], [23, 5], [29, 6], [31, 7], [35, 8], [41, 9], [17, 3], [22, 4], [28, 5], [33, 6], [38, 7]]);
const tens = calculations('tens', 'divide', [[60, 3], [80, 4], [90, 3], [120, 6], [180, 9], [240, 4], [600, 3], [800, 4], [900, 3], [1200, 6], [1800, 9], [2400, 4]]);
const twoDigits = calculations('two-digit', 'divide', [[48, 2], [69, 3], [84, 4], [96, 3], [72, 6], [75, 5], [52, 4], [65, 5], [78, 6], [87, 4], [95, 3], [71, 2]]);
const threeDigits = calculations('three-digit', 'divide', [[246, 2], [369, 3], [484, 4], [555, 5], [672, 6], [896, 7], [248, 4], [378, 6], [456, 3], [567, 4], [725, 6], [958, 7]]);
const zero = calculations('zero', 'divide', [[0, 3], [306, 3], [408, 4], [505, 5], [606, 6], [707, 7], [420, 4], [630, 3], [840, 4], [615, 3], [804, 4], [609, 3]]);
const checks = [[14, 3], [19, 4], [23, 5], [29, 6], [31, 7], [35, 8], [48, 2], [69, 3], [84, 4], [96, 3], [72, 6], [75, 5]].map(([left, right], index) => {
  const quotient = Math.floor(left / right);
  const rest = left % right;
  return question(`check-${index}`, 'check', `哪个算式可以验算 ${left} ÷ ${right} = ${quotient}${rest ? ` …… ${rest}` : ''}？`,
    `${right} × ${quotient}${rest ? ` + ${rest}` : ''} = ${left}`,
    [`${right} + ${quotient} = ${right + quotient}`, `${right} × ${quotient + 1} = ${right * (quotient + 1)}`],
    `除数 × 商 + 余数 = 被除数；没有余数时，除数 × 商 = 被除数。${rest ? `余数 ${rest} 小于除数 ${right}。` : ''}`);
});

export const divisionTopic = defineMathTopic({
  id: 'math-division', name: '除法', icon: 'compare', description: '分得同样多，理解商和余数，再学会从高位开始除。',
  sections: [
    section('meaning', '平均分与除法意义', '每份同样多叫平均分。除法可以求“每份有几个”，也可以求“能分成几份”。除数不能是 0。', ['12 个圆点平均分成 3 组，每组 4 个，12 ÷ 3 = 4。', '12 个圆点，每 4 个一组，能分成 3 组，12 ÷ 4 = 3。'], '把 12 根小棒平均分给 3 人，再试试每人 4 根可以分给几人。', '每人 4 根；每人 4 根时可以分给 3 人。两种问题都可以用除法。', meaning, { type: 'groups', groups: 3, each: 4 }),
    section('tables', '表内除法', '想除数乘几等于被除数，用对应的乘法口诀求商。乘法和除法可以互相帮助。', ['56 ÷ 7，想 7 × 8 = 56，所以商是 8。', '56 ÷ 8 = 7。'], '计算 54 ÷ 6，用哪一句口诀？', '六九五十四，所以 54 ÷ 6 = 9。', tables),
    section('remainder', '有余数的除法', '分到不够再分一份时，剩下的数量叫余数。余数一定要小于除数，否则还可以继续分。', ['14 ÷ 3 = 4 …… 2。', '3 × 4 + 2 = 14，余数 2 小于除数 3。'], '把 14 根小棒每 3 根分一组，可以分几组，还剩几根？', '可以分 4 组，还剩 2 根。如果余数是 3，就还能再分一组。', remainder),
    section('tens', '整十整百数除以一位数', '先把整十数看作几个十、整百数看作几个百，平均分后再写回实际的数。', ['60 ÷ 3：6 个十平均分成 3 份，每份 2 个十，就是 20。', '600 ÷ 3 = 200。'], '800 ÷ 4 的商是几个百？', '8 个百平均分成 4 份，每份 2 个百，商是 200。', tens),
    section('two-digit', '两位数除以一位数', '从最高位除起，每次余下的数都要和下一位落下的数合起来继续除。商写在对应的数位上。', ['48 ÷ 2 = 24。先分 4 个十，再分 8 个一。', '52 ÷ 4 = 13。十位余下 1 个十，与 2 合成 12 再除。'], '计算 52 ÷ 4，先除十位余下的 1 表示多少？', '表示 1 个十。和个位的 2 合成 12，12 ÷ 4 = 3，商是 13。', twoDigits),
    section('three-digit', '三位数除以一位数', '从百位开始除；百位不够商 1 时，就看前两位。每一步都先商、再乘、再减，余数和下一位合起来继续除。', ['246 ÷ 2 = 123。', '248 ÷ 4 = 62，因为百位 2 不够除以 4，先看 24 个十。'], '248 ÷ 4 为什么商是两位数？', '最高位的 2 小于 4，先用前两位 24 除以 4，商的最高位在十位上，结果是 62。', threeDigits),
    section('zero', '商中间或末尾有 0', '除到某一位不够商 1，就在这一位写 0 占位，再把下一位落下来。0 除以任何非 0 数都得 0。', ['306 ÷ 3 = 102，十位要写 0。', '630 ÷ 3 = 210，个位要写 0。'], '计算 408 ÷ 4，商的十位能不能省略？', '不能。商是 102，十位的 0 用来占位，写成 12 就改变了大小。', zero),
    section('check', '除法验算', '没有余数时，用商乘除数；有余数时，还要加上余数。算回被除数，并检查余数小于除数。', ['48 ÷ 2 = 24，用 24 × 2 = 48 验算。', '14 ÷ 3 = 4 …… 2，用 4 × 3 + 2 = 14 验算。'], '19 ÷ 4 = 4 …… 3，怎样检查？', '4 × 4 + 3 = 19，而且 3 < 4，所以符合有余数除法的要求。', checks),
  ],
});
