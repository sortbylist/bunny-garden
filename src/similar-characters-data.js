import { defineTopic, choice } from './chinese-content.js';

export const similarCharacterGroups = [
  {
    id: 'qing-one', category: 'radicals', note: '右边都是“青”，先看左边的偏旁，再把字放回词语里。',
    characters: [
      ['晴', 'qíng', '日字旁，常用来表示天气晴朗。', '晴天', '雨停了，天空没有云，是个____。'],
      ['睛', 'jīng', '目字旁，“眼睛”与看东西有关。', '眼睛', '做眼保健操前，先轻轻闭上____。'],
      ['情', 'qíng', '竖心旁，常与心情、感情有关。', '心情', '收到朋友的来信，我的____很好。'],
    ],
  },
  {
    id: 'qing-two', category: 'radicals', note: '“清、请、蜻”都有“青”，读音和意思却不完全相同。',
    characters: [
      ['清', 'qīng', '三点水，“清水”中的“清”表示干净、透明。', '清水', '洗画笔时，我们先接了一盆干净的____。'],
      ['请', 'qǐng', '言字旁，“请问”是有礼貌的说法。', '请问', '我向工作人员打听路，说：“____，图书馆怎么走？”'],
      ['蜻', 'qīng', '虫字旁，出现在昆虫名称“蜻蜓”中。', '蜻蜓', '池塘上飞来一只____，两对翅膀又细又长。'],
    ],
  },
  {
    id: 'he', category: 'radicals', note: '“河、何、荷”都有“可”这一部分，认偏旁也要联系词义。',
    characters: [
      ['河', 'hé', '三点水，“河水”与水有关。', '河水', '小桥下面，____缓缓流过。'],
      ['何', 'hé', '单人旁，“为何”表示为什么。', '为何', '我想知道原因，便问：“你____没有参加活动？”'],
      ['荷', 'hé', '草字头，“荷花”是一种植物的花。', '荷花', '夏天的池塘里，粉红的____开了。'],
    ],
  },
  {
    id: 'bao', category: 'radicals', note: '都有“包”，但手的动作、脚的动作和吃东西，要分别看。',
    characters: [
      ['抱', 'bào', '提手旁，“拥抱”是用手臂围住。', '拥抱', '久别重逢，我给了奶奶一个____。'],
      ['跑', 'pǎo', '足字旁，“跑步”是脚的动作。', '跑步', '体育课上，我们先在操场上____热身。'],
      ['饱', 'bǎo', '食字旁，“吃饱”表示已经吃够了。', '吃饱', '午饭我已经____了，不再添饭。'],
    ],
  },
  {
    id: 'pao', category: 'radicals', note: '“泡、炮、袍”的左边不同，用词语帮助记住字形。',
    characters: [
      ['泡', 'pào', '三点水，“水泡”中的“泡”读 pào。', '水泡', '小鱼吐出一串圆圆的____。'],
      ['炮', 'pào', '火字旁，“礼炮”中的“炮”读 pào。', '礼炮', '庆典开始时，远处响起了____声。'],
      ['袍', 'páo', '衣字旁，“长袍”是一种衣服。', '长袍', '戏台上的演员穿着一件长长的____。'],
    ],
  },
  {
    id: 'yang', category: 'radicals', note: '都有“羊”这一部分；偏旁能提供线索，但不能代替查词义。',
    characters: [
      ['洋', 'yáng', '三点水，“海洋”指广阔的海。', '海洋', '鲸生活在广阔的____里。'],
      ['样', 'yàng', '木字旁，记住“样子”的固定写法。', '样子', '这只小猫睡觉的____真可爱。'],
      ['祥', 'xiáng', '示字旁，“吉祥”表示吉利、美好。', '吉祥', '过年时，大家互相送上____的祝福。'],
    ],
  },
  {
    id: 'wei-mo', category: 'details', note: '比较横画的位置和长短，不要只看整体轮廓。',
    characters: [
      ['未', 'wèi', '上横短、下横长，“未来”指还没有到来的时间。', '未来', '我盼望____能成为一名科学家。'],
      ['末', 'mò', '上横长、下横短，“周末”是一周的末尾。', '周末', '星期六和星期日是____。'],
      ['朱', 'zhū', '上方多一撇，“朱红”是一种红色。', '朱红', '这扇门漆成了鲜艳的____色。'],
    ],
  },
  {
    id: 'tu-shi', category: 'details', note: '“土”和“士”都可看成三笔，但横画长短不同。',
    characters: [
      ['土', 'tǔ', '上横短、下横长，记词语“泥土”。', '泥土', '下过雨后，花坛里的____湿润了。'],
      ['士', 'shì', '上横长、下横短，记词语“战士”。', '战士', '守卫边疆的____日夜站岗。'],
      ['干', 'gān', '上横短、下横长，竖画穿过下横；在“干燥”中读 gān。', '干燥', '很久没有下雨，空气十分____。'],
    ],
  },
  {
    id: 'ren-ru', category: 'details', note: '留心撇捺的起笔和相接位置；再读完整词语核对。',
    characters: [
      ['人', 'rén', '撇捺相接，常见于“人们”。', '人们', '广场上，____正在晨练。'],
      ['入', 'rù', '捺画从撇画上方起笔，记词语“入口”。', '入口', '我们从公园的____走进去。'],
      ['八', 'bā', '撇捺分开，表示数字八。', '八个', '盘里有____苹果，正好每人一个。'],
    ],
  },
  {
    id: 'xiu-ti', category: 'details', note: '观察“木”和“本”的差别，再看有没有单人旁。',
    characters: [
      ['休', 'xiū', '单人旁加“木”，右边没有短横，记“休息”。', '休息', '走累了，我们在树荫下____一会儿。'],
      ['体', 'tǐ', '单人旁加“本”，右边比“木”多一短横，记“身体”。', '身体', '每天锻炼有助于____健康。'],
      ['本', 'běn', '“木”的下部加一短横，没有单人旁，记“书本”。', '书本', '下课后，我把____整齐地放回书包。'],
    ],
  },
  {
    id: 'ri-mu', category: 'details', note: '比较框内横画的数量和上方有没有撇。',
    characters: [
      ['日', 'rì', '框内一横，记词语“日光”。', '日光', '清晨，金色的____照进窗户。'],
      ['目', 'mù', '框内两横，记词语“目光”。', '目光', '大家的____都投向舞台上的演员。'],
      ['白', 'bái', '“日”的上方有一撇，记词语“白云”。', '白云', '蓝天上飘着几朵____。'],
    ],
  },
  {
    id: 'niao-wu', category: 'details', note: '比较有没有点、有没有口字旁。',
    characters: [
      ['鸟', 'niǎo', '上部里面有一点，记词语“小鸟”。', '小鸟', '一只____落在窗外的树枝上。'],
      ['乌', 'wū', '与“鸟”相比少一点，记词语“乌黑”。', '乌黑', '妹妹有一头____的头发。'],
      ['鸣', 'míng', '左边有口字旁，右边是“鸟”，记词语“鸣叫”。', '鸣叫', '清晨，鸟儿在树上____。'],
    ],
  },
];

export const similarCharactersTopic = defineTopic({
  id: 'similar-characters', name: '形近字辨析', stage: '第三阶段 · 字词进阶、阅读与积累',
  description: '比一比偏旁和笔画，再放回词语、句子里认清形近字。每一节都能直接开始。',
  categories: [{ id: 'radicals', name: '换个偏旁认一认' }, { id: 'details', name: '看清笔画小差别' }],
  lessons: similarCharacterGroups.map(group => ({
    id: group.id, category: group.category, title: group.characters.map(item => item[0]).join(' · '),
    body: group.note,
    comparison: group.characters.map(([text, pinyin, clue, word]) => ({ text, pinyin, clue, word })),
    examples: group.characters.map(([, , , word, sentence]) => sentence.replace('____', word)),
    task: '选两个字各组一个词，再写一句话，说说你怎样分清它们。',
    activity: { type: 'write', sample: group.characters[0][4].replace('____', group.characters[0][3]), checklist: ['看清偏旁或笔画的差别了吗？', '组词和句子的意思相合吗？'] },
  })),
  questions: similarCharacterGroups.flatMap(group => group.characters.map(([text, , clue, word, sentence], index) =>
    choice(`${group.id}-${index}`, group.category, `“${word.replace(text, '____')}”中缺少哪个字？`, text,
      group.characters.filter(item => item[0] !== text).map(item => item[0]),
      `${sentence.replace('____', word)}${clue}`, sentence))),
});
