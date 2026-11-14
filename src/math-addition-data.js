import { defineMathTopic, section, calculations, numericQuestion, question } from './math-content.js';

const mentalPairs = [[20, 30], [80, 60], [300, 400], [700, 200], [36, 12], [45, 23], [90, 40], [500, 300], [68, 24], [72, 36], [600, 250], [94, 27]];
const mental = mentalPairs.map((pair, index) => calculations('mental', index < 6 ? 'add' : 'subtract', [pair])[0]).map((entry, index) => ({ ...entry, id: `mental-${index}` }));
const plain = [...calculations('plain', 'add', [[123, 214], [302, 145], [431, 258], [510, 208], [242, 316], [620, 173]]), ...calculations('plain', 'subtract', [[567, 234], [896, 452], [745, 321], [608, 205], [973, 642], [864, 153]]).map(entry => ({ ...entry, id: `${entry.id}-subtract` }))];
const carry = calculations('carry', 'add', [[126, 247], [235, 148], [352, 164], [463, 128], [514, 267], [625, 156], [132, 284], [246, 328], [357, 216], [428, 145], [531, 249], [642, 137]]);
const borrow = calculations('borrow', 'subtract', [[352, 128], [463, 245], [574, 326], [685, 147], [796, 258], [847, 429], [361, 142], [472, 253], [583, 364], [694, 475], [725, 316], [836, 427]]);
const continuous = [...calculations('continuous', 'add', [[278, 346], [468, 257], [587, 168], [396, 487], [659, 178], [758, 169]]), ...calculations('continuous', 'subtract', [[600, 248], [703, 456], [802, 375], [900, 568], [701, 286], [1000, 467]]).map(entry => ({ ...entry, id: `${entry.id}-subtract` }))];
const estimates = [[298, 203], [397, 202], [486, 312], [604, 198], [703, 189], [512, 284]].map(([left, right], index) => {
  const answer = Math.round(left / 100) * 100 + Math.round(right / 100) * 100;
  return numericQuestion(`estimate-${index}`, 'check', '先把两个数分别四舍五入到整百数，再估算它们的和。', answer, `${left} 约是 ${Math.round(left / 100) * 100}，${right} 约是 ${Math.round(right / 100) * 100}，估算的和是 ${answer}。`, `${left} + ${right}`, { operation: 'estimate-add', operands: [left, right] });
});
const checks = [[352, 128], [463, 245], [574, 326], [685, 147], [796, 258], [847, 429]].map(([left, right], index) => question(`check-${index}`, 'check', `哪一个算式可以验算 ${left} − ${right} = ${left - right}？`, `${left - right} + ${right} = ${left}`, [`${left} + ${right} = ${left + right}`, `${left - right} − ${right} = ${left - right * 2}`], '差加减数等于被减数，可以用加法验算减法。'));

export const additionTopic = defineMathTopic({
  id: 'math-addition', name: '加减法', icon: 'math', description: '把数位对齐，理解进位与退位，学会估算和检查。',
  sections: [
    section('mental', '加减法口算', '整十、整百数可以先按几个十、几个百来算。两位数口算可以拆成整十数和个位数。', ['300 + 400：3 个百加 4 个百是 7 个百。', '68 − 24 = 68 − 20 − 4 = 44。'], '口算 36 + 12，说说你怎样把 12 拆开。', '36 + 10 + 2 = 48。', mental),
    section('plain', '不进位加法与不退位减法', '列竖式时相同数位对齐，从个位算起。每一位都能直接相加或相减。', ['123 + 214 = 337。', '567 − 234 = 333。'], '计算 123 + 214，再指出个位、十位和百位。', '个位 3 + 4 = 7，十位 2 + 1 = 3，百位 1 + 2 = 3，结果 337。', plain, { type: 'column', left: 123, right: 214, operator: '+', result: 337, note: '个位对个位，十位对十位，百位对百位。' }),
    section('carry', '进位加法', '某一位相加满十，就向前一位进 1。算前一位时，别忘记加上进来的 1。', ['126 + 247 = 373。', '个位 6 + 7 = 13，写 3，向十位进 1。'], '计算 235 + 148，看看是哪一位需要进位。', '个位 5 + 8 = 13，写 3 进 1；十位 3 + 4 + 1 = 8，结果 383。', carry, { type: 'column', left: 126, right: 247, operator: '+', result: 373, note: '个位满十进 1：十位要算 2 + 4 + 1 = 7。' }),
    section('borrow', '退位减法', '某一位不够减，就向前一位退 1，在本位加上十。前一位被退走的 1 也要记住。', ['352 − 128 = 224。', '个位 2 不够减 8，从十位退 1，12 − 8 = 4。'], '计算 463 − 245，十位退走 1 后还剩多少？', '个位 13 − 5 = 8，十位剩 5，再算 5 − 4 = 1，百位 4 − 2 = 2，结果 218。', borrow, { type: 'column', left: 352, right: 128, operator: '−', result: 224, note: '个位向十位退 1，十位从 5 变成 4。' }),
    section('continuous', '连续进位与连续退位', '连续几位满十时要逐位进位；遇到中间是 0 的退位减法，可以先把一个百换成十个十。', ['278 + 346 = 624。', '600 − 248 = 352。'], '600 的个位不够减 8，怎样把一个百换开？', '600 = 500 + 90 + 10。个位 10 − 8 = 2，十位 9 − 4 = 5，百位 5 − 2 = 3。', continuous, { type: 'column', left: 600, right: 248, operator: '−', result: 352, note: '把一个百换成十个十，再从十位给个位一个十。' }),
    section('check', '估算与验算', '估算可以先判断结果大约多大；验算用来检查精确答案。加法可以交换加数再算，减法可以用差加减数来验算。', ['298 + 203，分别约成 300 和 200，和约是 500。', '352 − 128 = 224，可用 224 + 128 = 352 验算。'], '298 + 203 的估算结果是 500，精确结果是多少？', '精确结果是 501。估算帮助判断范围，不能代替精确计算。', [...estimates, ...checks]),
  ],
});
