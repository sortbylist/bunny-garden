export const hanziCategories = [
  { id: 'strokes', name: '认识笔画', icon: 'pen', description: '一笔从哪里起，到哪里停' },
  { id: 'order', name: '汉字笔顺', icon: 'stroke-order', description: '放进田字格，一笔一笔看' },
  { id: 'radicals', name: '偏旁部首', icon: 'character-radical', description: '认识组成汉字的小伙伴' },
  { id: 'single', name: '独体字', icon: 'character-single', description: '整体观察，不拆成两个部件' },
  { id: 'left-right', name: '左右结构', icon: 'character-left-right', description: '左边和右边，合起来成字' },
  { id: 'top-bottom', name: '上下结构', icon: 'character-top-bottom', description: '上面和下面，合起来成字' },
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
  { id: 'horizontal-hook', name: '横钩', path: 'M20 35 L80 35 L70 46', tip: '先横，末尾向左下钩出，中间不抬笔。', example: '“字”中宝盖头的最后一笔是横钩。' },
  { id: 'vertical-turn', name: '竖折', path: 'M27 20 L27 76 L78 76', tip: '先竖，再向右折写横，中间不抬笔。', example: '“山”的第二笔是竖折。' },
  { id: 'left-turn', name: '撇折', path: 'M62 20 L27 65 L72 53', tip: '先写撇，再向右上折，中间不抬笔。', example: '“云”的第三笔是撇折。' },
  { id: 'horizontal-left', name: '横撇', path: 'M22 28 L76 28 Q63 60 28 80', tip: '先写横，再向左下撇出，中间不抬笔。', example: '“又”的第一笔是横撇。' },
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
  { text: '土', rule: '先横后竖', tip: '横、竖、横，下面的横写得长一些。', strokes: [stroke('横', 'M28 38 L72 38'), stroke('竖', 'M50 19 L50 78'), stroke('横', 'M18 78 L82 78')] },
  { text: '王', rule: '从上到下，竖后写底横', tip: '先写上面两横，再写竖，最后写底横。', strokes: [stroke('横', 'M24 22 L76 22'), stroke('横', 'M30 48 L70 48'), stroke('竖', 'M50 22 L50 78'), stroke('横', 'M18 78 L82 78')] },
  { text: '上', rule: '先竖，再写两横', tip: '竖、横、横，最后一笔是长横。', strokes: [stroke('竖', 'M49 18 L49 78'), stroke('横', 'M49 42 L75 42'), stroke('横', 'M18 78 L82 78')] },
  { text: '下', rule: '先横后竖', tip: '横、竖、点，最后的点写在竖的右边。', strokes: [stroke('横', 'M18 23 L82 23'), stroke('竖', 'M46 23 L46 82'), stroke('点', 'M57 44 Q70 52 76 61')] },
  { text: '天', rule: '先横，再撇捺', tip: '横、横、撇、捺，第二横稍长。', strokes: [stroke('横', 'M30 20 L70 20'), stroke('横', 'M21 39 L79 39'), stroke('撇', 'M51 21 Q50 60 20 81'), stroke('捺', 'M50 43 Q64 70 82 81')] },
  { text: '禾', rule: '先撇，再写木', tip: '撇、横、竖、撇、捺，第一撇在字的上部。', strokes: [stroke('撇', 'M69 16 L32 27'), stroke('横', 'M20 40 L80 40'), stroke('竖', 'M50 24 L50 84'), stroke('撇', 'M47 44 Q33 65 17 77'), stroke('捺', 'M53 44 Q68 67 83 77')] },
  { text: '山', rule: '先中间，再两边', tip: '竖、竖折、竖，竖折算一笔。', strokes: [stroke('竖', 'M50 18 L50 78'), stroke('竖折', 'M23 39 L23 78 L78 78'), stroke('竖', 'M78 39 L78 78')] },
  { text: '田', rule: '先外后内，最后封口', tip: '竖、横折、横、竖、横，共五笔。', strokes: [stroke('竖', 'M23 22 L23 79'), stroke('横折', 'M23 22 L77 22 L77 79'), stroke('横', 'M23 50 L77 50'), stroke('竖', 'M50 22 L50 79'), stroke('横', 'M23 79 L77 79')] },
  { text: '目', rule: '先外后内，最后封口', tip: '竖、横折、横、横、横，共五笔。', strokes: [stroke('竖', 'M30 16 L30 84'), stroke('横折', 'M30 16 L70 16 L70 84'), stroke('横', 'M30 39 L70 39'), stroke('横', 'M30 61 L70 61'), stroke('横', 'M30 84 L70 84')] },
  { text: '又', rule: '先横撇后捺', tip: '横撇、捺，共两笔，横撇中间不抬笔。', strokes: [stroke('横撇', 'M25 23 L73 23 Q65 61 23 81'), stroke('捺', 'M28 41 Q50 69 82 81')] },
];

export const radicals = [
  { text: '氵', name: '三点水', examples: ['河', '海', '湖'], tip: '这些字的意思都和水有关。', word: '河水' },
  { text: '亻', name: '单人旁', examples: ['你', '他', '们'], tip: '这些字都与人有关。', word: '你们' },
  { text: '扌', name: '提手旁', examples: ['打', '拍', '拉'], tip: '这些字常表示手的动作。', word: '拍手' },
  { text: '木', name: '木字旁', examples: ['林', '树', '枝'], tip: '这些字的意思都和树木有关。', word: '树枝' },
  { text: '艹', name: '草字头', examples: ['草', '花', '苗'], tip: '这些字的意思都和植物有关。', word: '花草' },
  { text: '讠', name: '言字旁', examples: ['说', '话', '语'], tip: '这些字的意思都和语言有关。', word: '说话' },
  { text: '口', name: '口字旁', examples: ['吃', '叫', '喝'], tip: '这些字常与口的动作有关。', word: '吃喝' },
  { text: '日', name: '日字旁', examples: ['晴', '晚', '晒'], tip: '这些字常与太阳、时间或天气有关。', word: '晴天' },
  { text: '女', name: '女字旁', examples: ['妈', '姐', '妹'], tip: '这些例字表示女性亲属。', word: '姐妹' },
  { text: '土', name: '提土旁', examples: ['地', '坡', '城'], tip: '这些字常与土地或建筑有关。', word: '山坡' },
  { text: '忄', name: '竖心旁', examples: ['情', '快', '怕'], tip: '这些字常与内心感受有关。', word: '心情' },
  { text: '宀', name: '宝盖头', examples: ['家', '安', '宁'], tip: '这些例字可以联系房屋或安定的生活来记。', word: '安宁' },
  { text: '辶', name: '走之', examples: ['近', '远', '这'], tip: '不少走之的字与行走、道路或距离有关，但不能只靠部首猜字义。', word: '远近' },
  { text: '足', name: '足字旁', examples: ['跑', '跳', '路'], tip: '这些字常与脚、行走或道路有关。', word: '跑跳' },
];

export const structureCharacters = [
  ...['人', '大', '小', '木', '日', '月', '牛', '水', '火', '山', '田', '土', '王', '禾', '上', '下'].map(text => ({ text, category: 'single', parts: [text] })),
  ...[['明', '日', '月'], ['林', '木', '木'], ['休', '亻', '木'], ['河', '氵', '可'], ['语', '讠', '吾'], ['打', '扌', '丁'], ['清', '氵', '青'], ['晴', '日', '青'], ['情', '忄', '青'], ['请', '讠', '青'], ['妈', '女', '马'], ['好', '女', '子'], ['姐', '女', '且'], ['坡', '土', '皮'], ['桥', '木', '乔'], ['枝', '木', '支']].map(([text, ...parts]) => ({ text, category: 'left-right', parts })),
  ...[['早', '日', '十'], ['草', '艹', '早'], ['苗', '艹', '田'], ['尖', '小', '大'], ['尘', '小', '土'], ['星', '日', '生'], ['字', '宀', '子'], ['安', '宀', '女'], ['李', '木', '子'], ['杏', '木', '口'], ['男', '田', '力'], ['思', '田', '心'], ['音', '立', '日'], ['岩', '山', '石'], ['香', '禾', '日'], ['笑', '⺮', '夭']].map(([text, ...parts]) => ({ text, category: 'top-bottom', parts })),
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
    ...item.strokes.slice(1).map((entry, index) => question(`step-${item.text}-${index + 2}`, 'order', `“${item.text}”的第 ${index + 2} 笔是什么？`, item.text, entry.name, [...new Set([entry.name, '横', '竖', '撇', '捺'])].slice(0, 4), `${item.text}的笔顺：${item.strokes.map(part => part.name).join('、')}。`)),
  ]),
  ...radicals.flatMap(item => [
    question(`radical-${item.text}`, 'radicals', `“${item.examples[0]}”的部首是哪个？`, item.examples[0], item.text, [item.text, ...radicals.filter(other => other.text !== item.text).slice(0, 3).map(other => other.text)], `“${item.examples[0]}”的部首是${item.text}（${item.name}）。${item.tip}`),
    question(`radical-name-${item.text}`, 'radicals', '这个偏旁叫什么？', item.text, item.name, [item.name, ...radicals.filter(other => other.text !== item.text).slice(0, 3).map(other => other.name)], `${item.text}叫${item.name}，例如：${item.examples.join('、')}。`),
    ...item.examples.slice(1).map(text => question(`radical-extra-${text}`, 'radicals', `“${text}”的部首是什么？`, text, item.text, [item.text, ...radicals.filter(other => other.text !== item.text).slice(0, 3).map(other => other.text)], `${text}的部首是${item.text}（${item.name}）。${item.tip}`)),
  ]),
  ...structureCharacters.map(item => {
    const name = hanziCategories.find(category => category.id === item.category).name;
    return question(`structure-${item.text}`, item.category, `“${item.text}”属于哪一种结构？`, item.text, name, structureNames, item.category === 'single' ? `“${item.text}”是独体字，作为一个整体来观察。` : `“${item.text}”是${name}，${item.category === 'left-right' ? '左边、右边' : '上面、下面'}分别是${item.parts.join('、')}。`);
  }),
];

export const hanziQuestionById = new Map(hanziQuestions.map(item => [item.id, item]));
