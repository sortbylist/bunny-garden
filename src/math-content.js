import { defineTopic } from './chinese-content.js';

const categoryIcons = {
  'math-numbers': { read: 'number-write', place: 'place-value', compare: 'number-compare', sort: 'number-sort', approximate: 'number-round' },
  'math-addition': { mental: 'mental-math', plain: 'add-subtract', carry: 'carry', borrow: 'borrow', continuous: 'carry-chain', check: 'estimate-check' },
  'math-multiplication': { meaning: 'equal-groups', tables: 'times-table', multiples: 'multiples', tens: 'tens-multiply', single: 'column-multiply', double: 'area-multiply', zero: 'zero-multiply', check: 'estimate-check' },
  'math-division': { meaning: 'share', tables: 'divide-table', remainder: 'remainder', tens: 'tens-divide', 'two-digit': 'two-digit-divide', 'three-digit': 'three-digit-divide', zero: 'zero-divide', check: 'divide-check' },
  'math-mixed': { 'add-subtract': 'add-subtract', 'multiply-divide': 'multiply-divide', precedence: 'operation-order', brackets: 'brackets', unknown: 'unknown' },
};

export function question(id, category, prompt, answer, distractors, explanation, display = '', calculation = null) {
  const answerText = String(answer);
  const options = [...new Set([answerText, ...distractors.map(String)])];
  return { id, category, prompt, answer: answerText, options, explanation, display, calculation };
}

export function numericQuestion(id, category, prompt, answer, explanation, display = '', calculation = null) {
  const offsets = calculation && ['round-hundred', 'estimate-add', 'estimate-multiply'].includes(calculation.operation) ? [100, -100, 200, -200, 1000] : [1, -1, 10, -10, 2, 100];
  const distractors = [...new Set(offsets.map(offset => answer + offset).filter(value => value >= 0 && value !== answer))].slice(0, 3);
  return question(id, category, prompt, answer, distractors, explanation, display, calculation);
}

export function calculations(category, operation, pairs) {
  return pairs.map(([left, right], index) => {
    const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷', remainder: '÷' };
    const answer = operation === 'add' ? left + right : operation === 'subtract' ? left - right : operation === 'multiply' ? left * right : operation === 'remainder' ? left % right : Math.floor(left / right);
    const expression = `${left} ${symbols[operation]} ${right}`;
    const remainder = left % right;
    const explanation = operation === 'divide' || operation === 'remainder'
      ? `${left} ÷ ${right} = ${Math.floor(left / right)}${remainder ? ` …… ${remainder}` : ''}。${right} × ${Math.floor(left / right)}${remainder ? ` + ${remainder}` : ''} = ${left}，余数必须小于 ${right}。`
      : `${expression} = ${answer}。${operation === 'add' ? '相同数位对齐，满十向前一位进 1。' : operation === 'subtract' ? '相同数位对齐，不够减时向前一位退 1 作十。' : '按数位相乘，进位要加上；两位数相乘时，十位上的积表示几个十。'}`;
    return numericQuestion(`${category}-${index}`, category, operation === 'remainder' ? '余数是多少？' : operation === 'divide' && remainder ? '商是多少？（只选商）' : '算一算，结果是多少？', answer, explanation, expression, { operation, operands: [left, right] });
  });
}

export function section(id, name, body, examples, task, solution, questions, visual = null) {
  return { id, name, body, examples, task, solution, questions, visual };
}

export function defineMathTopic({ id, name, description, icon, sections }) {
  const topic = defineTopic({
    id, name, description, stage: '第一阶段 · 数与运算',
    categories: sections.map(entry => ({ id: entry.id, name: entry.name, icon: categoryIcons[id]?.[entry.id] })),
    lessons: sections.flatMap(entry => {
      const practice = entry.questions.at(-1);
      return [
        { id: `${entry.id}-learn`, category: entry.id, title: entry.name, body: entry.body, examples: entry.examples, task: entry.task, visual: entry.visual, activity: { type: 'math', sample: entry.solution } },
        { id: `${entry.id}-try`, category: entry.id, title: `举一反三 · ${entry.name}`, body: '先自己想一想，可以用小棒、画图或在纸上列式，再展开思路检查。', examples: [practice.display, practice.prompt].filter(Boolean), task: '说说你是怎样想的，再看看参考思路。', activity: { type: 'math', sample: `答案：${practice.answer}。${practice.explanation}` } },
      ];
    }),
    questions: sections.flatMap(entry => entry.questions),
  });
  return { ...topic, subject: 'math', icon };
}
