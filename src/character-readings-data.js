import { defineTopic, choice } from './chinese-content.js';

export const homophoneGroups = [
  { id: 'dai', sound: 'dài', note: '“带”可表示带领、随身拿着；“戴”常用于把物品放在头、面、颈、手等处。', words: [['带', '带领', '老师____同学们走进博物馆。'], ['戴', '佩戴', '参加活动时，请把校徽____在胸前。']], distractor: '待' },
  { id: 'zai', sound: 'zài', note: '“在”常表示位置或正在进行；“再”常表示又一次或以后。', words: [['在', '正在', '妹妹正____书房看书。'], ['再', '再次', '这个故事真好听，请____讲一遍。']], distractor: '载' },
  { id: 'zuo', sound: 'zuò', note: '“坐”常与座位、姿势有关；“做”常与动作、活动有关。', words: [['坐', '坐下', '上课了，同学们端正地____在椅子上。'], ['做', '做事', '我们一起____手工。']], distractor: '座' },
  { id: 'jin', sound: 'jìn', note: '“进”常表示进入、前进；“近”常表示距离小。', words: [['进', '进入', '听到敲门声，老师说：“请____！”'], ['近', '远近', '书店就在家门口，离我家很____。']], distractor: '尽' },
  { id: 'sheng', sound: 'shēng', note: '“声”可表示声音；“生”常见于生命、生长等词语。', words: [['声', '声音', '远处传来一阵清脆的歌____。'], ['生', '生长', '春雨过后，小草____长得更快了。']], distractor: '升' },
  { id: 'shi', sound: 'shí', note: '“时”常与时间有关；“石”常与石头有关。', words: [['时', '时间', '请按____到校，不要迟到。'], ['石', '石头', '小河边有许多光滑的____头。']], distractor: '识' },
  { id: 'yuan', sound: 'yuán', note: '“园”常表示种植或游玩的场所；“圆”常与圆形有关。', words: [['园', '花园', '我们在花____里观察蝴蝶。'], ['圆', '圆形', '十五的月亮像一个____盘。']], distractor: '原' },
  { id: 'xiang', sound: 'xiàng', note: '“向”可表示方向；“像”可表示相似。', words: [['向', '方向', '小鸟飞____远方。'], ['像', '好像', '天上的白云____一只小绵羊。']], distractor: '象' },
  { id: 'ke', sound: 'kè', note: '“课”与课程有关；“刻”可用于时刻，也有雕刻的意思。', words: [['课', '上课', '今天第一节____是语文。'], ['刻', '刻苦', '他学习十分____苦，每天认真练习。']], distractor: '客' },
  { id: 'qing', sound: 'qīng', note: '“清”常有清澈、清楚等意思；“轻”可表示重量小或动作力度小。', words: [['清', '清澈', '这里的河水____澈见底。'], ['轻', '轻轻', '弟弟睡着了，我____轻地关上门。']], distractor: '青' },
];

export const polyphonicCharacters = [
  { id: 'chang', text: '长', note: '表示长度时常读 cháng；表示成长、长大时读 zhǎng。', readings: [['cháng', '长短', '这两根绳子的长短不同。'], ['zhǎng', '长大', '小树慢慢长大了。']] },
  { id: 'xing', text: '行', note: '表示行走时读 xíng；表示行业、行列等意思时常读 háng。', readings: [['xíng', '行走', '我们沿着小路行走。'], ['háng', '银行', '妈妈到银行办理业务。']] },
  { id: 'le', text: '乐', note: '表示快乐时读 lè；表示音乐时读 yuè。', readings: [['lè', '快乐', '我们度过了快乐的一天。'], ['yuè', '音乐', '教室里传来优美的音乐。']] },
  { id: 'zhong', text: '重', note: '表示重量时读 zhòng；表示重复、重新时读 chóng。', readings: [['zhòng', '重量', '这块石头的重量很大。'], ['chóng', '重新', '我们重新检查了一遍。']] },
  { id: 'hao', text: '好', note: '表示良好时读 hǎo；表示喜爱时读 hào。', readings: [['hǎo', '好人', '他是乐于助人的好人。'], ['hào', '爱好', '我的爱好是画画。']] },
  { id: 'gan', text: '干', note: '表示干燥时读 gān；表示做事时读 gàn。', readings: [['gān', '干燥', '秋天的空气很干燥。'], ['gàn', '干活', '大家一起在菜地里干活。']] },
  { id: 'kong', text: '空', note: '表示空荡、天空时常读 kōng；表示空闲、空出时常读 kòng。', readings: [['kōng', '天空', '蓝蓝的天空飘着白云。'], ['kòng', '空闲', '爸爸空闲时喜欢读书。']] },
  { id: 'jiao', text: '教', note: '表示传授具体本领时常读 jiāo；表示教育、教学等意思时读 jiào。', readings: [['jiāo', '教我', '姐姐教我折纸。'], ['jiào', '教师', '我的妈妈是一位教师。']] },
  { id: 'jue', text: '觉', note: '表示感觉时读 jué；表示睡眠时读 jiào。', readings: [['jué', '感觉', '我感觉天气变凉了。'], ['jiào', '睡觉', '晚上九点，我准备睡觉。']] },
  { id: 'bei', text: '背', note: '表示用背部负着东西时读 bēi；表示背部或背诵时读 bèi。', readings: [['bēi', '背着', '他背着书包去学校。'], ['bèi', '背诵', '我正在背诵古诗。']] },
  { id: 'de', text: '得', note: '表示得到时读 dé；表示需要、必须时读 děi；在“跑得快”中读轻声 de。', readings: [['dé', '得到', '认真练习后，我得到了表扬。'], ['děi', '得快点', '要迟到了，我得快点走。'], ['de', '跑得快', '这匹马跑得快。']] },
  { id: 'zhao', text: '着', note: '表示动作持续时常读轻声 zhe；表示接触到、达到目的时可读 zháo。“着”还有其他读音，这里先学两种。', readings: [['zhe', '看着', '小猫看着窗外。'], ['zháo', '找着', '我终于找着丢失的钥匙了。']] },
];

export const characterReadingsTopic = defineTopic({
  id: 'character-readings', name: '同音字与多音字', stage: '第三阶段 · 字词进阶、阅读与积累',
  description: '读音相同也要分清字义，一个字有不同读音时，要联系词语和句子来判断。',
  categories: [{ id: 'homophones', name: '同音字放回句子' }, { id: 'polyphones', name: '多音字联系词义' }],
  lessons: [
    ...homophoneGroups.map(group => ({
      id: group.id, category: 'homophones', title: `${group.words.map(item => item[0]).join(' · ')}（${group.sound}）`,
      body: group.note,
      comparison: group.words.map(([text, word]) => ({ text, pinyin: group.sound, word, clue: `用“${word}”帮助记住“${text}”的写法。` })),
      examples: group.words.map(([text, , sentence]) => sentence.replace('____', text)),
      task: '用这两个同音字分别组词，再写一句话，检查有没有用错字。',
      activity: { type: 'write', sample: group.words[0][2].replace('____', group.words[0][0]), checklist: ['读音相同时，是否也看了字义？', '用字和整句话的意思相合吗？'] },
    })),
    ...polyphonicCharacters.map(entry => ({
      id: entry.id, category: 'polyphones', title: `${entry.text}：${entry.readings.map(item => item[0]).join(' / ')}`,
      body: entry.note,
      comparison: entry.readings.map(([pinyin, word]) => ({ text: entry.text, pinyin, word, clue: `在“${word}”中读 ${pinyin}。` })),
      examples: entry.readings.map(([, , sentence]) => sentence),
      task: '先读词语和例句，再选择一个读音写自己的句子。这里只学习列出的常见用法。',
      activity: { type: 'write', sample: entry.readings[0][2], checklist: ['先读完整词语、理解句意了吗？', '能说清句子里这个字的读音吗？'] },
    })),
  ],
  questions: [
    ...homophoneGroups.flatMap(group => group.words.map(([text, , sentence], index) =>
      choice(`${group.id}-${index}`, 'homophones', '联系句意，空白处应该用哪个字？', text,
        [group.words.find(item => item[0] !== text)[0], group.distractor],
        `${sentence.replace('____', text)}${group.note}`, sentence))),
    ...polyphonicCharacters.flatMap(entry => entry.readings.map(([pinyin, word, sentence], index) =>
      choice(`${entry.id}-${index}`, 'polyphones', `“${word}”中的“${entry.text}”读什么？`, pinyin,
        [...entry.readings.map(item => item[0]).filter(reading => reading !== pinyin), '不看词语，任选一种'],
        `${entry.note}这句话中的“${word}”应读 ${pinyin}。`, sentence))),
  ],
});
