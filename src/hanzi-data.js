export const hanziCategories = [
  { id: 'strokes', name: '认识笔画', description: '一笔从哪里起，到哪里停' },
  { id: 'order', name: '汉字笔顺', description: '放进田字格，一笔一笔看' },
  { id: 'radicals', name: '偏旁部首', description: '认识组成汉字的小伙伴' },
  { id: 'single', name: '独体字', description: '整体观察，不拆成两个部件' },
  { id: 'left-right', name: '左右结构', description: '左边和右边，合起来成字' },
  { id: 'top-bottom', name: '上下结构', description: '上面和下面，合起来成字' },
];

export const strokes = [
  { id: 'horizontal', name: '横', path: 'M22 50 L78 50', tip: '从左向右写。', example: '“三”的三笔都是横。' },
  { id: 'vertical', name: '竖', path: 'M50 20 L50 80', tip: '从上向下写。', example: '“十”的第二笔是竖。' },
  { id: 'left-falling', name: '撇', path: 'M67 23 Q56 58 27 78', tip: '从右上向左下写。', example: '“人”的第一笔是撇。' },
  { id: 'right-falling', name: '捺', path: 'M30 23 Q48 62 78 78', tip: '从左上向右下写，收笔时轻轻提起。', example: '“人”的第二笔是捺。' },
  { id: 'dot', name: '点', path: 'M40 36 Q51 43 57 56', tip: '从左上向右下轻落笔、稍按下。', example: '“小”的第三笔是点。' },
  { id: 'rising', name: '提', path: 'M27 70 L73 34', tip: '从左下向右上写。', example: '三点水“氵”的最后一笔是提。' },
  { id: 'horizontal-turn', name: '横折', path: 'M23 25 L75 25 L75 78', tip: '先横再向下折，中间不抬笔。', example: '“口”的第二笔是横折，只算一笔。' },
  { id: 'vertical-hook', name: '竖钩', path: 'M55 20 L55 75 Q55 85 41 72', tip: '先写竖，到末尾向左上钩出，中间不抬笔。', example: '“小”的第一笔是竖钩。' },
];

const stroke = (name, path) => ({ name, path });
export const strokeCharacters = [
  { text: '三', rule: '从上到下', tip: '先写上面的横，再写中间的横，最后写下面的横。', strokes: [stroke('横', 'M27 25 L73 25'), stroke('横', 'M33 49 L67 49'), stroke('横', 'M20 76 L80 76')] },
  { text: '十', rule: '先横后竖', tip: '先写横，再从上到下写竖。', strokes: [stroke('横', 'M20 43 L80 43'), stroke('竖', 'M50 18 L50 82')] },
  { text: '人', rule: '先撇后捺', tip: '先写撇，再写捺，两笔向两侧舒展。', strokes: [stroke('撇', 'M53 18 Q50 57 20 81'), stroke('捺', 'M50 37 Q61 67 82 81')] },
  { text: '大', rule: '先横后撇捺', tip: '先横，再撇，最后捺。', strokes: [stroke('横', 'M21 40 L79 40'), stroke('撇', 'M52 17 Q50 60 21 82'), stroke('捺', 'M48 43 Q61 68 80 82')] },
  { text: '小', rule: '先中间后两边', tip: '先写中间的竖钩，再写左边的撇，最后写右边的点。', strokes: [stroke('竖钩', 'M51 17 L51 76 Q51 85 39 76'), stroke('撇', 'M31 40 Q27 57 17 68'), stroke('点', 'M69 40 Q78 51 83 66')] },
  { text: '木', rule: '先横后竖', tip: '横、竖、撇、捺，共四笔。', strokes: [stroke('横', 'M22 38 L78 38'), stroke('竖', 'M50 17 L50 84'), stroke('撇', 'M47 42 Q34 65 17 76'), stroke('捺', 'M53 42 Q67 65 83 76')] },
  { text: '口', rule: '最后封口', tip: '先竖，再横折，最后写下面的横封口。横折是一笔。', strokes: [stroke('竖', 'M27 24 L27 78'), stroke('横折', 'M27 24 L75 24 L75 78'), stroke('横', 'M27 78 L75 78')] },
  { text: '日', rule: '先外后内，最后封口', tip: '先竖、横折，再写里面的横，最后写底横封口。', strokes: [stroke('竖', 'M29 19 L29 81'), stroke('横折', 'M29 19 L72 19 L72 81'), stroke('横', 'M29 49 L72 49'), stroke('横', 'M29 81 L72 81')] },
  { text: '林', rule: '从左到右', tip: '先写左边的木字旁，再写右边的木。左边木字旁的最后一笔是点。', strokes: [stroke('横', 'M12 37 L43 37'), stroke('竖', 'M29 17 L29 83'), stroke('撇', 'M28 39 Q22 60 10 72'), stroke('点', 'M33 46 L43 58'), stroke('横', 'M49 37 L84 37'), stroke('竖', 'M65 17 L65 83'), stroke('撇', 'M64 40 Q53 65 41 77'), stroke('捺', 'M67 40 Q76 65 90 77')] },
];

export const radicals = [
  { text: '氵', name: '三点水', examples: ['河', '海', '湖'], tip: '这些字的意思都和水有关。', word: '河水' },
  { text: '亻', name: '单人旁', examples: ['你', '他', '们'], tip: '这些字都与人有关。', word: '你们' },
  { text: '扌', name: '提手旁', examples: ['打', '拍', '拉'], tip: '这些字常表示手的动作。', word: '拍手' },
  { text: '木', name: '木字旁', examples: ['林', '树', '枝'], tip: '这些字的意思都和树木有关。', word: '树枝' },
  { text: '艹', name: '草字头', examples: ['草', '花', '苗'], tip: '这些字的意思都和植物有关。', word: '花草' },
  { text: '讠', name: '言字旁', examples: ['说', '话', '语'], tip: '这些字的意思都和语言有关。', word: '说话' },
];

export const structureCharacters = [
  ...['人', '大', '小', '木', '日', '月'].map(text => ({ text, category: 'single', parts: [text] })),
  ...[['明', '日', '月'], ['林', '木', '木'], ['休', '亻', '木'], ['河', '氵', '可'], ['语', '讠', '吾'], ['打', '扌', '丁']].map(([text, ...parts]) => ({ text, category: 'left-right', parts })),
  ...[['早', '日', '十'], ['草', '艹', '早'], ['苗', '艹', '田'], ['尖', '小', '大'], ['尘', '小', '土'], ['星', '日', '生']].map(([text, ...parts]) => ({ text, category: 'top-bottom', parts })),
];

export const hanziLessons = [
  ...strokes.map(item => ({ ...item, id: `stroke-${item.id}`, category: 'strokes', title: item.name })),
  ...strokeCharacters.map(item => ({ ...item, id: `order-${item.text}`, category: 'order', title: item.text })),
  ...radicals.map(item => ({ ...item, id: `radical-${item.text}`, category: 'radicals', title: item.text })),
  ...structureCharacters.map(item => ({ ...item, id: `structure-${item.text}`, title: item.text })),
];

const question = (id, category, prompt, display, answer, options, explanation, extra = {}) => ({ id: `hanzi:${id}`, category, prompt, display, answer, options, explanation, ...extra });
const structureNames = ['独体字', '左右结构', '上下结构'];
export const hanziQuestions = [
  ...strokes.map((item, index) => question(`stroke-${item.id}`, 'strokes', '这是什么笔画？', '', item.name, [item.name, ...strokes.filter(other => other.id !== item.id).slice(index % 4, index % 4 + 3).map(other => other.name)], `${item.name}：${item.tip}${item.example}`, { strokeId: item.id })),
  ...strokeCharacters.flatMap(item => [
    question(`first-${item.text}`, 'order', `“${item.text}”的第一笔是什么？`, item.text, item.strokes[0].name, [...new Set([item.strokes[0].name, '横', '竖', '撇', '竖钩'])].slice(0, 4), `${item.text}：${item.strokes.map(entry => entry.name).join('、')}。${item.tip}`),
    question(`count-${item.text}`, 'order', `“${item.text}”一共有几笔？`, item.text, `${item.strokes.length} 笔`, [item.strokes.length - 1, item.strokes.length, item.strokes.length + 1, item.strokes.length + 2].map(count => `${count} 笔`), `${item.text}共${item.strokes.length}笔：${item.strokes.map(entry => entry.name).join('、')}。`),
  ]),
  ...radicals.flatMap(item => [
    question(`radical-${item.text}`, 'radicals', `“${item.examples[0]}”的部首是哪个？`, item.examples[0], item.text, [item.text, ...radicals.filter(other => other.text !== item.text).slice(0, 3).map(other => other.text)], `“${item.examples[0]}”的部首是${item.text}（${item.name}）。${item.tip}`),
    question(`radical-name-${item.text}`, 'radicals', '这个偏旁叫什么？', item.text, item.name, [item.name, ...radicals.filter(other => other.text !== item.text).slice(0, 3).map(other => other.name)], `${item.text}叫${item.name}，例如：${item.examples.join('、')}。`),
  ]),
  ...structureCharacters.map(item => {
    const name = hanziCategories.find(category => category.id === item.category).name;
    return question(`structure-${item.text}`, item.category, `“${item.text}”属于哪一种结构？`, item.text, name, structureNames, item.category === 'single' ? `“${item.text}”是独体字，作为一个整体来观察。` : `“${item.text}”是${name}，${item.category === 'left-right' ? '左边、右边' : '上面、下面'}分别是${item.parts.join('、')}。`);
  }),
];

export const hanziQuestionById = new Map(hanziQuestions.map(item => [item.id, item]));
