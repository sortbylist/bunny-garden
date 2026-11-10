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
  { text: '江', pinyin: 'jiāng', syllable: 'jiang', initial: 'J', radical: '氵', radicalStrokes: 3, strokes: 6, meanings: [['大河', '轮船在江面上行驶。']] },
  { text: '池', pinyin: 'chí', syllable: 'chi', initial: 'C', radical: '氵', radicalStrokes: 3, strokes: 6, meanings: [['水塘；蓄水的地方', '小鱼在池里游来游去。']] },
  { text: '海', pinyin: 'hǎi', syllable: 'hai', initial: 'H', radical: '氵', radicalStrokes: 3, strokes: 10, meanings: [['靠近大陆、与大洋相连的大片水域', '我们在海边捡贝壳。'], ['比喻大量同类事物聚集的地方', '广场成了花的海洋。']] },
  { text: '桥', pinyin: 'qiáo', syllable: 'qiao', initial: 'Q', radical: '木', radicalStrokes: 4, strokes: 10, meanings: [['架在水面或空中、供通行的建筑物', '一座石桥连接着小河两岸。']] },
  { text: '林', pinyin: 'lín', syllable: 'lin', initial: 'L', radical: '木', radicalStrokes: 4, strokes: 8, meanings: [['成片的树木', '鸟儿在树林里唱歌。']] },
  { text: '枝', pinyin: 'zhī', syllable: 'zhi', initial: 'Z', radical: '木', radicalStrokes: 4, strokes: 8, meanings: [['从植物主干上分出来的部分', '小鸟停在树枝上。']] },
  { text: '叶', pinyin: 'yè', syllable: 'ye', initial: 'Y', radical: '口', radicalStrokes: 3, strokes: 5, meanings: [['植物的叶子', '一片绿叶落在窗台上。']] },
  { text: '芽', pinyin: 'yá', syllable: 'ya', initial: 'Y', radical: '艹', radicalStrokes: 3, strokes: 7, meanings: [['植物刚长出来、能发育成茎叶或花的部分', '春天，柳树长出了嫩芽。']] },
  { text: '苗', pinyin: 'miáo', syllable: 'miao', initial: 'M', radical: '艹', radicalStrokes: 3, strokes: 8, meanings: [['初生的植物', '农民给田里的禾苗浇水。'], ['事物初露的迹象', '发现问题的苗头，要及时处理。']] },
  { text: '晴', pinyin: 'qíng', syllable: 'qing', initial: 'Q', radical: '日', radicalStrokes: 4, strokes: 12, meanings: [['天空没有云或云很少', '雨停了，天空放晴了。']] },
  { text: '请', pinyin: 'qǐng', syllable: 'qing', initial: 'Q', radical: '讠', radicalStrokes: 2, strokes: 10, meanings: [['请求', '我请老师再讲一遍。'], ['表示礼貌地让对方做某事', '请坐，这里有空位。']] },
  { text: '情', pinyin: 'qíng', syllable: 'qing', initial: 'Q', radical: '忄', radicalStrokes: 3, strokes: 11, meanings: [['感情；情意', '同学之间的友情十分珍贵。'], ['情况；状况', '出发前，我们先了解路面的情况。']] },
  { text: '清', pinyin: 'qīng', syllable: 'qing', initial: 'Q', radical: '氵', radicalStrokes: 3, strokes: 11, meanings: [['液体或气体纯净，没有混杂的东西', '山里的泉水很清。'], ['明白；清楚', '请把事情说清。']] },
  { text: '房', pinyin: 'fáng', syllable: 'fang', initial: 'F', radical: '户', radicalStrokes: 4, strokes: 8, meanings: [['房屋', '村边新盖了几座房子。'], ['房间', '我的书放在书房里。']] },
  { text: '跑', pinyin: 'pǎo', syllable: 'pao', initial: 'P', radical: '足', radicalStrokes: 7, strokes: 12, meanings: [['两脚迅速向前移动', '运动员在跑道上奔跑。'], ['泄漏；逸出', '车胎跑气了，需要修补。']] },
  { text: '近', pinyin: 'jìn', syllable: 'jin', initial: 'J', radical: '辶', radicalStrokes: 3, strokes: 7, meanings: [['距离短', '我家离学校很近。'], ['时间相隔不久', '最近几天都有雨。']] },
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
    { id: 'sound-shared', category: 'sound', title: '同一音节里找不同的字', body: '晴、请、情、清都在 Q 下的 qing 音节里。查到正文后，还要对照字形和声调。', examples: ['晴 qíng：天气晴朗。', '请 qǐng：请你帮忙。', '清 qīng：泉水清清。'], task: '用查字小实验打开 Q → qing，找出“请”。' },
    { id: 'sound-double', category: 'sound', title: 'zh、ch、sh 的音序', body: '音序看音节的第一个字母。音节开头是 zh、ch、sh 时，音序分别是 Z、C、S。', examples: ['枝 zhī → Z → zhi', '池 chí → C → chi', '深 shēn → S → shen'], task: '“树 shù”应该先查 S 还是 SH？说明理由。' },
    { id: 'sound-route', category: 'sound', title: '选一条合适的查字路线', body: '知道读音却不确定写法，可以先按音序查。看到一个不认识读音的字，可以试着按部首查。', examples: ['知道 qiáo 的读音：Q → qiao → 桥。', '看到“苗”不会读：先观察上面的艹。'], task: '说一说你遇到的生字，准备怎样查。' },
    { id: 'radical-position', category: 'radical', title: '部首也会在上面和外面', body: '不要只盯着字的左边。观察整个字，确定部首之后再数笔画。', examples: ['芽：上面的艹，3 画。', '房：外面的户，4 画。', '问：外面的门，3 画。'], task: '把“芽、房、问”的部首指给家人看。' },
    { id: 'radical-same-count', category: 'radical', title: '笔画相同，还要认准字形', body: '同一个部首下，剩余笔画相同的字可能不止一个。找到这一组后，还要逐个核对字形。', examples: ['深：氵 + 8 画。', '清：氵 + 8 画。', '林、枝都是木部，部首外各 4 画。'], task: '沿 3 画 → 氵 → 8 画，分别找到“清”和“深”。' },
    { id: 'radical-counting', category: 'radical', title: '折笔算一笔', body: '数笔画时，从落笔到抬笔算一笔，中间转折不另算。数完部首，再数剩下的部分。', examples: ['“口”的横折算一笔，口共 3 画。', '叶：口 3 画，右边十 2 画。'], task: '先在纸上按笔顺写“叶”，再查它的部首和剩余笔画。' },
    ...dictionaryEntries.map(entry => ({ id: `meaning-${entry.text}`, category: 'meaning', title: `“${entry.text}”在句子中的意思`, body: '先读完整句子，再看词语中的用法。把候选解释放回句子，选择能讲通的意思。这里是适龄简释，不是完整字典条目。', examples: entry.meanings.map(([meaning, sentence]) => `${sentence} → ${meaning}`), task: `读一读例句，说说“${entry.text}”在这里是什么意思。` })),
  ],
  questions: dictionaryEntries.flatMap(entry => [
    choice(`initial-${entry.text}`, 'sound', `查“${entry.text}（${entry.pinyin}）”，先找哪个音序？`, entry.initial, ['A', 'B', 'Z', 'S'].filter(value => value !== entry.initial).slice(0, 3), `音序是音节第一个字母的大写形式：${entry.syllable} → ${entry.initial}。`),
    choice(`syllable-${entry.text}`, 'sound', `查“${entry.text}（${entry.pinyin}）”，在 ${entry.initial} 下找哪个不带声调的音节？`, entry.syllable, ['ma', 'ni', 'le'], `先找 ${entry.initial}，再找 ${entry.syllable}，然后按索引查正文中的“${entry.text}”。`),
    choice(`radical-${entry.text}`, 'radical', `用部首查字法查“${entry.text}”，查哪个部首？`, entry.radical, ['亻', '木', '土', '口'].filter(value => value !== entry.radical).slice(0, 3), `“${entry.text}”的部首是${entry.radical}，部首共 ${entry.radicalStrokes} 画。`),
    choice(`rest-${entry.text}`, 'radical', `“${entry.text}”共 ${entry.strokes} 画，除去 ${entry.radicalStrokes} 画的“${entry.radical}”，还剩几画？`, `${entry.strokes - entry.radicalStrokes} 画`, [1, 2, 3].map(offset => `${entry.strokes - entry.radicalStrokes + offset} 画`), `${entry.strokes} − ${entry.radicalStrokes} = ${entry.strokes - entry.radicalStrokes}，在部首对应的检字表中按剩余笔画找字。`),
    choice(`route-${entry.text}`, 'sound', `已知“${entry.text}”读 ${entry.pinyin}，哪条音序查字路线正确？`, `${entry.initial} → ${entry.syllable} → ${entry.text}`, [`${entry.syllable} → ${entry.initial} → ${entry.text}`, `${entry.initial} → ma → ${entry.text}`], '音序查字先找大写音序，再找不带声调的音节，最后核对正文中的字。'),
    choice(`radical-count-${entry.text}`, 'radical', `查“${entry.text}”时，它的部首“${entry.radical}”有几画？`, `${entry.radicalStrokes} 画`, [1, 2, 3].map(offset => `${entry.radicalStrokes + offset} 画`), `先在部首目录的 ${entry.radicalStrokes} 画部分找到${entry.radical}，再去检字表查剩余笔画。`),
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
