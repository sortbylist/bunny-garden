import { defineTopic, choice } from './chinese-content.js';

export const measureWords = [
  { text: '匹马', noun: '马', tip: '“匹”常用来数马。' },
  { text: '头牛', noun: '牛', tip: '“头”常用来数牛。' },
  { text: '只鸟', noun: '鸟', tip: '“只”常用来数鸟。' },
  { text: '条鱼', noun: '鱼', tip: '“条”常用来数鱼。' },
  { text: '朵花', noun: '花', tip: '“朵”常用来数花。' },
  { text: '棵树', noun: '树', tip: '“棵”常用来数树。' },
  { text: '本书', noun: '书', tip: '“本”常用来数书。' },
  { text: '张纸', noun: '纸', tip: '“张”常用来数纸。' },
  { text: '支笔', noun: '笔', tip: '“支”常用来数笔。' },
  { text: '座桥', noun: '桥', tip: '“座”常用来数桥。' },
  { text: '片云', noun: '云', tip: '“片”常用来数云。' },
  { text: '阵风', noun: '风', tip: '“阵”常用来数一阵风。' },
];

export const verbPairs = [
  { verb: '撑', action: '雨伞', sentence: '下雨了，姐姐撑起雨伞挡雨。', note: '撑起雨伞表示把伞张开。', distractors: ['穿', '戴'] },
  { verb: '穿', action: '外套', sentence: '天气转凉，我穿上了厚外套。', note: '衣服、鞋袜等常和“穿”搭配。', distractors: ['戴', '提'] },
  { verb: '戴', action: '帽子', sentence: '出门前，弟弟戴上了帽子。', note: '帽子、眼镜等常和“戴”搭配。', distractors: ['穿', '踩'] },
  { verb: '观察', action: '叶脉', sentence: '我们用放大镜仔细观察叶脉的纹路。', note: '“观察”表示仔细查看，“仔细”说明动作细心。', distractors: ['倾听', '品尝'] },
  { verb: '倾听', action: '鸟鸣', sentence: '我们闭上眼睛，静静地倾听树林里的鸟鸣。', note: '“倾听”表示细心听；“静静地”说明听的样子。', distractors: ['观看', '触摸'] },
  { verb: '品尝', action: '水果', sentence: '洗净水果后，大家一起品尝香甜的果肉。', note: '“品尝”是仔细体会食物的滋味。', distractors: ['倾听', '朗读'] },
  { verb: '提高', action: '水平', sentence: '每天坚持练习，可以逐步提高写字水平。', note: '“提高”常和水平、能力等搭配，表示向更好的方向发展。', distractors: ['增加', '加重'] },
  { verb: '养成', action: '习惯', sentence: '坚持每天读书，能养成阅读的好习惯。', note: '“养成”表示经过长期培养，形成习惯。', distractors: ['提高', '抬起'] },
];

export const deSamples = [
  { id: 'de-adjective', marker: '的', title: '的 + 事物', body: '“的”常连接修饰语和名词，说明“什么样的人或事物”。', examples: ['美丽的蝴蝶', '明亮的教室', '弟弟的书包'], ask: '“的”后面通常接着表示人或事物的词。' },
  { id: 'de-adverb', marker: '地', title: '地 + 动作', body: '“地”常连接修饰语和表示动作的词，说明“怎样做”。', examples: ['轻轻地走', '认真地读', '飞快地跑'], ask: '先找表示动作的词，再看前面的修饰语。' },
  { id: 'de-result', marker: '得', title: '得 + 程度', body: '“得”常放在动作或状态后面，补充说明程度或结果。', examples: ['跑得飞快', '笑得开心', '写得工整'], ask: '看到动作后面补充“怎么样”，常会用到“得”。' },
  { id: 'de-context', marker: '的 地 得', title: '三个字要放回句子里', body: '不要只背一句口诀。先判断后面的词是事物、动作，还是对前面动作的补充，再结合句子读一读。', examples: ['清澈的小河静静地流过村子。', '妹妹跑得满头大汗。', '老师满意地笑了。'], ask: '同一个句子里可能同时出现三个字，要分别判断。' },
];

export const deQuestions = [
  { display: '美丽____蝴蝶', answer: '的', explanation: '“蝴蝶”是事物，用“美丽的蝴蝶”。' },
  { display: '轻轻____走', answer: '地', explanation: '“走”是动作，用“轻轻地走”。' },
  { display: '跑____飞快', answer: '得', explanation: '“飞快”补充说明跑得怎么样，用“跑得飞快”。' },
  { display: '明亮____教室', answer: '的', explanation: '“教室”是事物，用“明亮的教室”。' },
  { display: '认真____读', answer: '地', explanation: '“读”是动作，用“认真地读”。' },
  { display: '笑____开心', answer: '得', explanation: '“开心”补充说明笑得怎么样，用“笑得开心”。' },
  { display: '弟弟____书包', answer: '的', explanation: '“书包”是事物，用“弟弟的书包”。' },
  { display: '飞快____跑', answer: '地', explanation: '“跑”是动作，用“飞快地跑”。' },
  { display: '写____工整', answer: '得', explanation: '“工整”补充说明写得怎么样，用“写得工整”。' },
  { display: '清澈____小河静静地流过村子。', answer: '的', explanation: '“清澈的小河”中，“小河”是事物，用“的”。' },
  { display: '妹妹跑____满头大汗。', answer: '得', explanation: '“满头大汗”补充说明跑的结果，用“得”。' },
  { display: '老师满意____笑了。', answer: '地', explanation: '“笑”是动作，用“满意地笑了”。' },
];

export const collocationTopic = defineTopic({
  id: 'collocations', name: '词语搭配与辨析', description: '量词要合适，动作和修饰语要搭得上，“的、地、得”要放回句子里判断。',
  categories: [{ id: 'measure', name: '量词搭配' }, { id: 'verb', name: '动词与修饰' }, { id: 'de', name: '区分“的、地、得”' }],
  lessons: [
    ...measureWords.map(item => ({ id: `measure-${item.noun}`, category: 'measure', title: `一${item.text}`, body: `${item.tip}同一事物在不同语境中也可能使用其他量词，这里学习常见搭配。`, examples: [`一${item.text}、两${item.text}、三${item.text}`, `“${item.text[0]}”是量词，“${item.noun}”是所数的事物。`], task: `找一找能用“${item.text[0]}”来数的东西，说给家人听。` })),
    ...verbPairs.map((item, index) => ({ id: `verb-${index}`, category: 'verb', title: `${item.verb}${item.action}`, body: `${item.note}动词要和后面的对象搭配得自然。`, examples: [item.sentence, `动作：${item.verb}；对象：${item.action}`], task: `用“${item.verb}${item.action}”说一句完整的话，还可以加上合适的修饰语。` })),
    ...deSamples.map(item => ({ id: item.id, category: 'de', title: item.title, body: item.body, examples: item.examples, task: item.ask })),
  ],
  questions: [
    ...measureWords.map(item => choice(`measure-${item.noun}`, 'measure', '选出常用、合适的量词。', item.text[0], ['本', '张', '匹', '棵', '座'].filter(word => word !== item.text[0]).slice(0, 3), `应说“一${item.text}”。${item.tip}`, `一____${item.noun}`)),
    ...verbPairs.map((item, index) => choice(`verb-${index}`, 'verb', '选出与句子搭配的动词。', item.verb, item.distractors, `${item.sentence}${item.note}`, item.sentence.replace(item.verb, '____'))),
    ...deQuestions.map((item, index) => choice(`de-${index}`, 'de', '横线处应填哪个字？', item.answer, ['的', '地', '得'].filter(marker => marker !== item.answer), `${item.explanation}正确写法：${item.display.replace('____', item.answer)}`, item.display)),
  ],
});
