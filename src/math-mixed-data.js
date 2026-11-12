import { defineMathTopic, section, numericQuestion } from './math-content.js';

function mixedQuestions(category, kind) {
  return Array.from({ length: 12 }, (_, index) => {
    const first = index + 12;
    const second = index % 4 + 2;
    const third = index % 3 + 2;
    let expression;
    let answer;
    let explanation;
    let operands;
    if (kind === 'add-subtract') {
      expression = `${first} + ${second} − ${third}`;
      answer = first + second - third;
      explanation = `只有加减法，从左往右算：先算 ${first} + ${second} = ${first + second}，再减 ${third}，得 ${answer}。`;
      operands = [first, second, third];
    } else if (kind === 'multiply-divide') {
      expression = index % 2 ? `${first} × ${second} ÷ ${second}` : `${first * second} ÷ ${second} × ${third}`;
      answer = index % 2 ? first : first * third;
      explanation = index % 2 ? `只有乘除法，从左往右算：${first} × ${second} = ${first * second}，再除以 ${second}，得 ${answer}。` : `只有乘除法，从左往右算：先算 ${first * second} ÷ ${second} = ${first}，再乘 ${third}，得 ${answer}。`;
      operands = index % 2 ? [first, second, second] : [first * second, second, third];
    } else if (kind === 'precedence') {
      expression = index % 2 ? `${first * second} − ${second * third} ÷ ${third}` : `${first} + ${second} × ${third}`;
      answer = index % 2 ? first * second - second : first + second * third;
      explanation = index % 2 ? `先除后减：${second * third} ÷ ${third} = ${second}，再算 ${first * second} − ${second} = ${answer}。` : `先乘后加：${second} × ${third} = ${second * third}，再算 ${first} + ${second * third} = ${answer}。`;
      operands = index % 2 ? [first * second, second * third, third] : [first, second, third];
    } else {
      expression = `(${first} + ${second}) × ${third}`;
      answer = (first + second) * third;
      explanation = `先算小括号里的 ${first} + ${second} = ${first + second}，再乘 ${third}，得 ${answer}。`;
      operands = [first, second, third];
    }
    return numericQuestion(`${category}-${index}`, category, '按运算顺序算一算。', answer, explanation, expression, { operation: kind, operands });
  });
}

const unknowns = Array.from({ length: 12 }, (_, index) => {
  const answer = index + 3;
  const known = index % 4 + 2;
  const kind = index % 4;
  const expressions = [`□ + ${known} = ${answer + known}`, `□ − ${known} = ${answer - known}`, `□ × ${known} = ${answer * known}`, `□ ÷ ${known} = ${answer}`];
  const result = kind === 3 ? answer * known : answer;
  const explanation = kind === 0 ? `和减去一个加数：${answer + known} − ${known} = ${result}。` : kind === 1 ? `差加减数：${answer - known} + ${known} = ${result}。` : kind === 2 ? `积除以一个乘数：${answer * known} ÷ ${known} = ${result}。` : `商乘除数：${answer} × ${known} = ${result}。`;
  return numericQuestion(`unknown-${index}`, 'unknown', '□ 里应该填几？', result, explanation, expressions[kind], { operation: 'unknown', operands: [kind, answer, known] });
});

export const mixedTopic = defineMathTopic({
  id: 'math-mixed', name: '混合运算', icon: 'puzzle', description: '看清符号和括号，安排计算顺序，再用运算关系填空。',
  sections: [
    section('add-subtract', '加减混合', '没有括号，只有加法和减法时，按从左到右的顺序计算。每一步的结果接着参与下一步计算。', ['30 + 18 − 12 = 48 − 12 = 36。', '50 − 20 + 6 = 30 + 6 = 36。'], '计算 24 + 8 − 6，先算哪一步？', '先算 24 + 8 = 32，再算 32 − 6 = 26。', mixedQuestions('add-subtract', 'add-subtract')),
    section('multiply-divide', '乘除混合', '没有括号，只有乘法和除法时，也要从左往右计算，不是所有乘法都要先于除法。', ['24 ÷ 3 × 2 = 8 × 2 = 16。', '6 × 4 ÷ 3 = 24 ÷ 3 = 8。'], '计算 24 ÷ 3 × 2，能不能先算 3 × 2？', '应先算左边的 24 ÷ 3 = 8，再乘 2，得到 16。', mixedQuestions('multiply-divide', 'multiply-divide')),
    section('precedence', '乘除与加减混合', '没有括号，同时有乘除法和加减法时，先算乘除法，再算加减法。', ['12 + 3 × 4 = 12 + 12 = 24。', '30 − 18 ÷ 3 = 30 − 6 = 24。'], '计算 20 − 4 × 3，先算哪一步？', '先算 4 × 3 = 12，再算 20 − 12 = 8。', mixedQuestions('precedence', 'precedence')),
    section('brackets', '带小括号的运算', '有小括号时，先算括号里的，再算括号外的。括号可以改变原来的计算顺序。', ['(12 + 3) × 4 = 15 × 4 = 60。', '12 + 3 × 4 = 24，对比看看括号的作用。'], '比较 (8 + 4) ÷ 2 和 8 + 4 ÷ 2 的结果。', '(8 + 4) ÷ 2 = 6；8 + 4 ÷ 2 = 10。括号改变了先算哪一步。', mixedQuestions('brackets', 'brackets')),
    section('unknown', '填写未知数', '把方框看作暂时不知道的数，利用加减法或乘除法的关系求出它，再代回原式检查。', ['□ + 8 = 20，□ = 20 − 8 = 12。', '□ ÷ 4 = 6，□ = 6 × 4 = 24。'], '□ × 3 = 27，方框里填几？代回去检查。', '27 ÷ 3 = 9；代回原式，9 × 3 = 27，所以填 9。', unknowns),
  ],
});
