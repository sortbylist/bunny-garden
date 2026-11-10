import { defineTopic, choice } from './chinese-content.js';

export const dictionaryEntries = [
  { text: '河', pinyin: 'hé', syllable: 'he', initial: 'H', radical: '氵', radicalStrokes: 3, strokes: 8, meanings: [['天然的大水道', '小河从村边流过。']] },
  { text: '湖', pinyin: 'hú', syllable: 'hu', initial: 'H', radical: '氵', radicalStrokes: 3, strokes: 12, meanings: [['陆地上聚集大片水的地方', '湖水倒映着青山。']] },
  { text: '花', pinyin: 'huā', syllable: 'hua', initial: 'H', radical: '艹', radicalStrokes: 3, strokes: 7, meanings: [['植物开出的花朵', '公园里的花开了。'], ['耗费时间或钱等', '我花了十分钟整理书包。']] },
  { text: '草', pinyin: 'cǎo', syllable: 'cao', initial: 'C', radical: '艹', radicalStrokes: 3, strokes: 9, meanings: [['草本植物的统称', '小草从泥土里钻出来。'], ['不细致、不认真', '做事不能草率。']] },
  { text: '语', pinyin: 'yǔ', syllable: 'yu', initial: 'Y', radical: '讠', radicalStrokes: 2, strokes: 9, meanings: [['话；语言', '我们正在学习汉语。']] },
  { text: '问', pinyin: 'wèn', syllable: 'wen', initial: 'W', radical: '门', radicalStrokes: 3, strokes: 6, meanings: [['提出问题，请人回答', '不懂的地方可以问老师。'], ['表示关切', '请代我向奶奶问好。']] },
  { text: '深', pinyin: 'shēn', syllable: 'shen', initial: 'S', radical: '氵', radicalStrokes: 3, strokes: 11, meanings: [['从表面到底的距离大', '这里的水很深，不要下去。'], ['时间已经很晚', '夜深了，大家都睡了。']] },
  { text: '打', pinyin: 'dǎ', syllable: 'da', initial: 'D', radical: '扌', radicalStrokes: 3, strokes: 5, meanings: [['击；敲', '雨点打在窗户上。'], ['举着；撑着', '她打着伞走过来。']] },
];

export const dictionaryTopic = defineTopic({
  id: 'dictionary', name: '查字典', description: '会读的字按音序找，不会读的字试着按部首找，再把字义放回句子。',
  categories: [{ id: 'sound', name: '音序查字法' }, { id: 'radical', name: '部首查字法' }, { id: 'meaning', name: '根据词句选字义' }],
  lessons: [
    { id: 'sound-order', category: 'sound', title: '先找大写音序', body: '已经知道字的读音，可以用音序查字法。音序是音节第一个字母的大写形式，不是声母的完整写法。', examples: ['深 shēn：先找 S，不是 SH。', '语 yǔ：先找 Y。'], task: '按字母表读一读：A B C D E F G H I J K L M N O P Q R S T U V W X Y Z。' },
    { id: 'sound-syllable', category: 'sound', title: '再找音节与汉字', body: '在“汉语拼音音节索引”中，先找音序，再找不带声调的音节，按索引指向的正文页码找字，并核对读音。', examples: ['河 hé：H → he → 正文中的河。', '花 huā：H → hua → 正文中的花。'], task: '打开“查字小实验”，试着沿 H → hu → 湖找到“湖”。' },
    { id: 'sound-check', category: 'sound', title: '看清声调再确认', body: '音节索引不带声调，正文中的读音通常标有声调。同一个音节可以对应不同的汉字，找到后还要核对字形、声调和词语。', examples: ['查“问 wèn”，先找 W，再找 wen。', '知道字形但不知道读音，可以换用部首查字法。'], task: '拿一本纸质字典，找一找它的音节索引和正文分别在哪里。' },
    { id: 'radical-find', category: 'radical', title: '先确定部首和笔画数', body: '不认识读音时，可以先观察字形，确定部首，数清部首笔画，在“部首目录”里找它。', examples: ['河的部首是氵，共 3 画。', '语的部首是讠，共 2 画；讠的第二笔是横折提，算一笔。'], task: '指一指“花、打、问”的部首。' },
    { id: 'radical-rest', category: 'radical', title: '再数部首以外的笔画', body: '按部首目录指示找到检字表，在对应部首下面，按除去部首后的笔画数找到这个字，再按正文页码查字义。', examples: ['河：氵 3 画，剩下可 5 画。', '花：艹 3 画，剩下化 4 画。'], task: '在“查字小实验”中，沿 3 画 → 氵 → 8 画 → 深试一试。' },
    { id: 'radical-check', category: 'radical', title: '不同字典要看说明', body: '部首不一定都在左边。不同字典的部首归类、索引和页码可能不同，要以手中那本字典的说明为准。', examples: ['草的部首在上面，是艹。', '问的部首是门，不是里面的口。'], task: '找不到时先核对部首和笔画，也可以请老师帮忙。' },
    ...dictionaryEntries.map(entry => ({ id: `meaning-${entry.text}`, category: 'meaning', title: `“${entry.text}”在句子中的意思`, body: '先读完整句子，再看词语中的用法。把候选解释放回句子，选择能讲通的意思。这里是适龄简释，不是完整字典条目。', examples: entry.meanings.map(([meaning, sentence]) => `${sentence} → ${meaning}`), task: `读一读例句，说说“${entry.text}”在这里是什么意思。` })),
  ],
  questions: dictionaryEntries.flatMap(entry => [
    choice(`initial-${entry.text}`, 'sound', `查“${entry.text}（${entry.pinyin}）”，先找哪个音序？`, entry.initial, ['A', 'B', 'Z'], `音序是音节第一个字母的大写形式：${entry.syllable} → ${entry.initial}。`),
    choice(`syllable-${entry.text}`, 'sound', `查“${entry.text}（${entry.pinyin}）”，在 ${entry.initial} 下找哪个不带声调的音节？`, entry.syllable, ['ma', 'ni', 'le'], `先找 ${entry.initial}，再找 ${entry.syllable}，然后按索引查正文中的“${entry.text}”。`),
    choice(`radical-${entry.text}`, 'radical', `用部首查字法查“${entry.text}”，查哪个部首？`, entry.radical, ['亻', '木', '土'], `“${entry.text}”的部首是${entry.radical}，部首共 ${entry.radicalStrokes} 画。`),
    choice(`rest-${entry.text}`, 'radical', `“${entry.text}”共 ${entry.strokes} 画，除去 ${entry.radicalStrokes} 画的“${entry.radical}”，还剩几画？`, `${entry.strokes - entry.radicalStrokes} 画`, [1, 2, 3].map(offset => `${entry.strokes - entry.radicalStrokes + offset} 画`), `${entry.strokes} − ${entry.radicalStrokes} = ${entry.strokes - entry.radicalStrokes}，在部首对应的检字表中按剩余笔画找字。`),
    ...entry.meanings.map(([meaning, sentence], index) => choice(`meaning-${entry.text}-${index}`, 'meaning', `句子中“${entry.text}”的意思是什么？`, meaning, [...entry.meanings.filter(([other]) => other !== meaning).map(([other]) => other), '表示声音很响', '表示颜色很红'].slice(0, 3), `“${entry.text}”在“${sentence}”中表示“${meaning}”。要根据词句选义，不能总选第一条。`, sentence)),
  ]),
});

const lookupFields = { sound: ['initial', 'syllable', 'text'], radical: ['radicalStrokes', 'radical', 'remaining', 'text'] };
const fieldValue = (entry, field) => String(field === 'remaining' ? entry.strokes - entry.radicalStrokes : entry[field]);

export function dictionaryLookup(method, selections = []) {
  const fields = lookupFields[method] || lookupFields.sound;
  let entries = dictionaryEntries;
  const valid = [];
  for (const selection of Array.isArray(selections) ? selections.slice(0, fields.length) : []) {
    const next = entries.filter(entry => fieldValue(entry, fields[valid.length]) === selection);
    if (!next.length) break;
    valid.push(selection);
    entries = next;
  }
  const field = fields[valid.length];
  const options = field ? [...new Set(entries.map(entry => fieldValue(entry, field)))].sort((left, right) => /^\d+$/.test(left) ? Number(left) - Number(right) : left.localeCompare(right, 'en')) : [];
  return { selections: valid, field, options, entry: field ? null : entries[0] };
}
