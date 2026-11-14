import { chineseTopics } from './chinese-topics.js';
import { mathTopics } from './math-topics.js';

export const groups = [
  { id: 'single', name: '单韵母', short: '从 a o e 开始', color: 'pink' },
  { id: 'initial', name: '声母', short: '认识拼音好朋友', color: 'mint' },
  { id: 'compound', name: '复韵母与 er', short: '两个字母手拉手', color: 'yellow' },
  { id: 'front', name: '前鼻韵母', short: '听听鼻音的小秘密', color: 'blue' },
  { id: 'back', name: '后鼻韵母', short: '分清前鼻音和后鼻音', color: 'purple' },
  { id: 'whole', name: '整体认读音节', short: '一起读，不用拼', color: 'peach' },
];

const basicRows = [
  ['single', 'a|a1|啊|张大嘴巴，a a a。;o|o1|喔|嘴巴圆圆，o o o。;e|e1|鹅|嘴巴扁扁，e e e。;i|yi1|衣|牙齿对齐，i i i。;u|wu1|乌|嘴巴突出，u u u。;ü|yu1|鱼|像读 i 一样，嘴唇再拢圆。'],
  ['initial', 'b|bo1|波|双唇闭拢，再轻轻打开。;p|po1|坡|双唇打开时，送出一口气。;m|mo1|摸|嘴唇闭拢，让声音从鼻子出来。;f|fo1|佛|上齿轻碰下唇，送出气流。;d|de1|的|舌尖抵住上齿龈，再放开。;t|te1|特|和 d 比一比，t 的气流更强。;n|ne1|呢|舌尖抵住上齿龈，声音走鼻腔。;l|le1|乐|舌尖轻抵上齿龈，气流从两旁出来。;g|ge1|哥|舌根抬起，再轻轻放开。;k|ke1|科|舌根放开时，送出一口气。;h|he1|喝|舌根靠近软腭，让气流通过。;j|ji1|鸡|舌面抬起，轻轻发音。;q|qi1|七|和 j 比一比，q 送出的气更多。;x|xi1|西|舌面靠近硬腭，让气流轻轻通过。;zh|zhi1|知|舌尖翘起，认识翘舌音。;ch|chi1|吃|翘起舌尖，送出一口气。;sh|shi1|诗|舌尖翘起，让气流通过。;r|ri1|日|舌尖翘起，声带轻轻振动。;z|zi1|字|舌尖向前，舌头不翘起。;c|ci1|次|舌尖向前，送出一口气。;s|si1|丝|舌尖向前，让气流通过。;y|yi1|衣|记住 y，读作“衣”。;w|wu1|乌|记住 w，读作“乌”。'],
  ['compound', 'ai|ai1|挨|先发 a，再自然滑向 i。;ei|ei1|诶|先发 e，再自然滑向 i。;ui|wei1|威|ui 是 uei 的缩写，连起来读。;ao|ao1|凹|从 a 滑向 o，一口气读出。;ou|ou1|欧|先发 o，再自然滑向 u。;iu|you1|优|iu 是 iou 的缩写，连起来读。;ie|ye1|椰|从 i 滑向 ê，声音连贯。;üe|yue1|约|从 ü 滑向 ê，嘴形慢慢展开。;er|er2|儿|发音时把舌尖轻轻卷起。'],
  ['front', 'an|an1|安|先发 a，最后舌尖抵住上齿龈。;en|en1|恩|先发 e，最后用鼻音收尾。;in|yin1|音|从 i 开始，以前鼻音 n 收尾。;un|wen1|温|un 是 uen 的缩写，最后读 n。;ün|yun1|晕|从 ü 开始，以前鼻音 n 收尾。'],
  ['back', 'ang|ang1|昂|从 a 开始，舌根抬起发鼻音。;eng|eng1|哼|从 e 开始，以后鼻音 ng 收尾。;ing|ying1|英|从 i 开始，最后舌根抬起。;ong|dong1|冬|听“冬”的后半段，找出 ong。'],
  ['whole', 'zhi|zhi1|知|整体认读，一口气读出来。;chi|chi1|吃|舌尖翘起来，整个音节一起读。;shi|shi1|诗|这是整体认读音节 shi。;ri|ri4|日|整个音节一起读，不拆开拼。;zi|zi1|资|舌尖不翘起，一起读 zi。;ci|ci1|疵|这是平舌的整体认读音节。;si|si1|丝|和 shi 比一比，舌尖不要翘起。;yi|yi1|衣|整体认读 yi，读音和 i 相同。;wu|wu1|乌|整体认读 wu，读音和 u 相同。;yu|yu1|迂|yu 中的 u 实际上表示 ü。;ye|ye1|椰|整个音节一起认读。;yue|yue1|约|yue 中的 u 表示 ü。;yuan|yuan1|鸳|yuan 中的 u 表示 ü。;yin|yin1|音|注意前鼻音 n 的收尾。;yun|yun1|晕|yun 中的 u 表示 ü，最后读 n。;ying|ying1|英|注意后鼻音 ng 的收尾。'],
];

export const basics = basicRows.flatMap(([group, rows]) => rows.split(';').map(row => {
  const [text, sound, example, tip] = row.split('|');
  return { id: `${group}-${text}`, text, sound, example, tip, group, type: 'basic' };
}));

export const toneMarks = { a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè', i: 'īíǐì', u: 'ūúǔù', ü: 'ǖǘǚǜ' };

export function marked(syllable) {
  const tone = Number(syllable.at(-1));
  const plain = syllable.replace(/[0-5]$/, '').replaceAll('v', 'ü');
  if (!tone || tone === 5) return plain;
  let index = plain.indexOf('a');
  if (index < 0) index = plain.indexOf('e');
  if (index < 0 && plain.includes('ou')) index = plain.indexOf('o');
  if (index < 0) {
    for (let cursor = plain.length - 1; cursor >= 0; cursor--) {
      if (toneMarks[plain[cursor]]) { index = cursor; break; }
    }
  }
  return index < 0 ? plain : plain.slice(0, index) + toneMarks[plain[index]][tone - 1] + plain.slice(index + 1);
}

const characterRows = `山 shan1 水 shui3 火 huo3 木 mu4 金 jin1 土 tu3 日 ri4 月 yue4 星 xing1 云 yun2 风 feng1 雨 yu3 雪 xue3 天 tian1 地 di4 人 ren2 口 kou3 手 shou3 足 zu2 目 mu4 耳 er3 心 xin1 头 tou2 牙 ya2 毛 mao2 米 mi3 田 tian2 禾 he2 花 hua1 草 cao3 树 shu4 叶 ye4 林 lin2 竹 zhu2 石 shi2 沙 sha1 河 he2 湖 hu2 海 hai3 江 jiang1 池 chi2 泉 quan2 鸟 niao3 虫 chong2 鱼 yu2 虾 xia1 马 ma3 牛 niu2 羊 yang2 猫 mao1 狗 gou3 兔 tu4 虎 hu3 鹿 lu4 象 xiang4 鸡 ji1 鸭 ya1 鹅 e2 蛙 wa1 蜂 feng1 蝶 die2 蚁 yi3 蛇 she2 龙 long2 门 men2 窗 chuang1 房 fang2 床 chuang2 桌 zhuo1 椅 yi3 灯 deng1 书 shu1 笔 bi3 纸 zhi3 包 bao1 尺 chi3 球 qiu2 船 chuan2 车 che1 路 lu4 桥 qiao2 衣 yi1 帽 mao4 鞋 xie2 袜 wa4 杯 bei1 碗 wan3 盘 pan2 勺 shao2 瓜 gua1 果 guo3 桃 tao2 梨 li2 杏 xing4 枣 zao3 茶 cha2 饭 fan4 菜 cai4 面 mian4 蛋 dan4 奶 nai3 糖 tang2 盐 yan2 油 you2 红 hong2 黄 huang2 蓝 lan2 绿 lv4 白 bai2 黑 hei1 大 da4 小 xiao3 多 duo1 少 shao3 上 shang4 下 xia4 左 zuo3 右 you4 前 qian2 后 hou4 东 dong1 西 xi1 南 nan2 北 bei3 春 chun1 夏 xia4 秋 qiu1 冬 dong1`.split(/\s+/);
export const characters = [];
for (let index = 0; index < characterRows.length; index += 2) {
  characters.push({ id: `char-${characterRows[index]}`, text: characterRows[index], sounds: [characterRows[index + 1]], pinyin: marked(characterRows[index + 1]), type: 'word' });
}

const wordRows = `学校|xue2 xiao4;老师|lao3 shi1;同学|tong2 xue2;书包|shu1 bao1;铅笔|qian1 bi3;课本|ke4 ben3;教室|jiao4 shi4;黑板|hei1 ban3;操场|cao1 chang3;作业|zuo4 ye4;学习|xue2 xi2;读书|du2 shu1;写字|xie3 zi4;画画|hua4 hua4;音乐|yin1 yue4;朋友|peng2 you5;我们|wo3 men5;你们|ni3 men5;他们|ta1 men5;妈妈|ma1 ma5;爸爸|ba4 ba5;哥哥|ge1 ge5;姐姐|jie3 jie5;弟弟|di4 di5;妹妹|mei4 mei5;太阳|tai4 yang2;月亮|yue4 liang5;星星|xing1 xing5;白云|bai2 yun2;蓝天|lan2 tian1;春天|chun1 tian1;夏天|xia4 tian1;秋天|qiu1 tian1;冬天|dong1 tian1;花朵|hua1 duo3;小草|xiao3 cao3;大树|da4 shu4;森林|sen1 lin2;大海|da4 hai3;河水|he2 shui3;小鸟|xiao3 niao3;小鱼|xiao3 yu2;白兔|bai2 tu4;山羊|shan1 yang2;黄牛|huang2 niu2;熊猫|xiong2 mao1;蝴蝶|hu2 die2;蜜蜂|mi4 feng1;蚂蚁|ma3 yi3;青蛙|qing1 wa1;苹果|ping2 guo3;西瓜|xi1 gua1;香蕉|xiang1 jiao1;葡萄|pu2 tao5;牛奶|niu2 nai3;面包|mian4 bao1;米饭|mi3 fan4;鸡蛋|ji1 dan4;汽车|qi4 che1;火车|huo3 che1;飞机|fei1 ji1;轮船|lun2 chuan2;公园|gong1 yuan2;早晨|zao3 chen2;晚上|wan3 shang5;快乐|kuai4 le4;干净|gan1 jing4;认真|ren4 zhen1;勇敢|yong3 gan3;温暖|wen1 nuan3`;
export const words = wordRows.split(';').map(row => {
  const [text, soundText] = row.split('|');
  const sounds = soundText.split(' ');
  return { id: `word-${text}`, text, sounds, pinyin: sounds.map(marked).join(' '), type: 'word' };
});
export const vocabulary = [...characters, ...words];

export const modes = [
  { id: 'sequence', name: '顺序学习', icon: 'book', group: '认识拼音', description: '从 a o e 出发，一步一步学' },
  { id: 'random', name: '随机练习', icon: 'shuffle', group: '认识拼音', description: '打乱顺序，看看还认识谁' },
  { id: 'tones', name: '声调学习', icon: 'wave', group: '认识拼音', description: '认识四声、轻声和变调' },
  { id: 'listen', name: '听音选拼音', icon: 'sound', group: '趣味练习', description: '小耳朵听一听，再选一选' },
  { id: 'audio', name: '看拼音选读音', icon: 'headphones', group: '趣味练习', description: '哪个声音和拼音是一对' },
  { id: 'blend', name: '拼读组合', icon: 'puzzle', group: '趣味练习', description: '声母和韵母，一起交朋友' },
  { id: 'hanzi', name: '看字选拼音', icon: 'type', group: '趣味练习', description: '给常见字词找到正确拼音' },
  { id: 'pinyin', name: '看拼音选字词', icon: 'search', group: '趣味练习', description: '读一读，找出对应的字词' },
  { id: 'match', name: '拼音配对', icon: 'link', group: '趣味练习', description: '把汉字和拼音连成一对' },
  { id: 'confusing', name: '易混专项', icon: 'compare', group: '巩固提高', description: '把长得像、读得像的分清楚' },
  { id: 'rules', name: '标调与拼写', icon: 'pen', group: '巩固提高', description: '声调应该戴在哪个字母上' },
  { id: 'challenge', name: '综合闯关', icon: 'flag', group: '巩固提高', description: '用一组小挑战检验收获' },
  { id: 'mistakes', name: '错题本', icon: 'notebook', group: '我的复习', description: '再练一次，每次都有进步' },
  { id: 'favorites', name: '我的收藏', icon: 'heart', group: '我的复习', description: '把不熟悉的朋友再认一认' },
];

export const playModes = modes.filter(mode => mode.group !== '我的复习');
export const modeSections = ['认识拼音', '趣味练习', '巩固提高'];

export const spellingRules = [
  { id: 'r1', prompt: '给“水”的拼音 shui 标上第三声', options: ['shuǐ', 'shǔi', 'shuí', 'shùi'], answer: 'shuǐ', explanation: 'ui 的声调标在后面的 i 上。水：shuǐ。', sound: 'shui3' },
  { id: 'r2', prompt: '给“九”的拼音 jiu 标上第三声', options: ['jiǔ', 'jǐu', 'jíu', 'jiù'], answer: 'jiǔ', explanation: 'iu 的声调标在后面的 u 上。九：jiǔ。', sound: 'jiu3' },
  { id: 'r3', prompt: 'j 和 ü 相拼，正确的写法是？', options: ['ju', 'jü', 'jyu', 'jiu'], answer: 'ju', explanation: 'ü 和 j、q、x 相拼时，ü 上的两点要省去。', sound: 'ju1' },
  { id: 'r4', prompt: '“女孩”的“女”，拼音应该怎样写？', options: ['nǚ', 'nǔ', 'nǐ', 'nú'], answer: 'nǚ', explanation: 'ü 和 n、l 相拼时，两点不能省。女：nǚ。', sound: 'nv3' },
  { id: 'r5', prompt: '给“好”的拼音 hao 标上第三声', options: ['hǎo', 'haǒ', 'háo', 'haò'], answer: 'hǎo', explanation: '有 a 先找 a。好：hǎo。', sound: 'hao3' },
  { id: 'r6', prompt: '给“飞”的拼音 fei 标上第一声', options: ['fēi', 'feī', 'féi', 'fěi'], answer: 'fēi', explanation: '没有 a 时找 o、e，fei 标在 e 上。飞：fēi。', sound: 'fei1' },
  { id: 'r7', prompt: '“妈妈”的第二个“妈”读轻声，应该怎样标？', options: ['mā ma', 'mā mā', 'má má', 'mǎ mà'], answer: 'mā ma', explanation: '轻声不标声调符号，读得轻而短。', word: '妈妈' },
  { id: 'r8', prompt: '“去”的拼音，哪一种写法正确？', options: ['qù', 'qǜ', 'qǔ', 'qiu'], answer: 'qù', explanation: 'ü 遇到 q 省去两点，但仍然发 ü 的音。', sound: 'qu4' },
  { id: 'r9', prompt: '“月”的拼音，哪一种写法正确？', options: ['yuè', 'yüè', 'yùe', 'yiè'], answer: 'yuè', explanation: 'üe 自成音节时写作 yue，省去 ü 上的两点。', sound: 'yue4' },
  { id: 'r10', prompt: '“对”的拼音，哪一种标调正确？', options: ['duì', 'dùi', 'duí', 'dǔi'], answer: 'duì', explanation: 'ui 标在后一个元音 i 上。', sound: 'dui4' },
  { id: 'r11', prompt: '“优”的韵母 iou 与声母 l 相拼时，写作？', options: ['liu', 'liou', 'lou', 'lyou'], answer: 'liu', explanation: 'iou 前面有声母时，写成 iu。', sound: 'liu2' },
  { id: 'r12', prompt: '“温”的韵母 uen 与声母 l 相拼时，写作？', options: ['lun', 'luen', 'len', 'lün'], answer: 'lun', explanation: 'uen 前面有声母时，写成 un。', sound: 'lun2' },
];

export const blends = [
  ['b', 'a', 'ba1', '八'], ['p', 'o', 'po1', '坡'], ['m', 'i', 'mi3', '米'], ['f', 'u', 'fu3', '斧'],
  ['d', 'a', 'da4', '大'], ['t', 'u', 'tu4', '兔'], ['n', 'ü', 'nv3', '女'], ['l', 'ü', 'lv4', '绿'],
  ['g', 'e', 'ge1', '哥'], ['k', 'ou', 'kou3', '口'], ['h', 'ua', 'hua1', '花'], ['j', 'i', 'ji1', '鸡'],
  ['q', 'i', 'qi1', '七'], ['x', 'üe', 'xue3', '雪'], ['zh', 'u', 'zhu2', '竹'], ['ch', 'e', 'che1', '车'],
  ['sh', 'u', 'shu1', '书'], ['r', 'i', 'ri4', '日'], ['z', 'u', 'zu2', '足'], ['c', 'ao', 'cao3', '草'],
  ['s', 'an', 'san1', '三'], ['g', 'ua', 'gua1', '瓜'], ['d', 'uo', 'duo1', '多'], ['x', 'iong', 'xiong2', '熊'],
].map(([initial, final, sound, text], index) => ({ id: `blend-${index}`, initial, final, sound, text }));

export const confusionSets = {
  retroflex: { name: '平舌 / 翘舌', pairs: [['zi1', 'zhi1'], ['ci1', 'chi1'], ['si1', 'shi1'], ['za1', 'zha1'], ['ca1', 'cha1'], ['sa1', 'sha1']] },
  nasal: { name: '前鼻音 / 后鼻音', pairs: [['an1', 'ang1'], ['en1', 'eng1'], ['yin1', 'ying1'], ['ban1', 'bang1'], ['chen2', 'cheng2'], ['jin1', 'jing1']] },
  nl: { name: 'n / l', pairs: [['na2', 'la2'], ['ni2', 'li2'], ['nu4', 'lu4'], ['nan2', 'lan2'], ['na3', 'la3']] },
  bp: { name: 'b / p · d / t', pairs: [['ba1', 'pa1'], ['bo1', 'po1'], ['bi3', 'pi3'], ['da1', 'ta1'], ['du4', 'tu4']] },
  jqx: { name: 'j / q / x', pairs: [['ji1', 'qi1', 'xi1'], ['jia1', 'qia1', 'xia1'], ['ju1', 'qu1', 'xu1'], ['jie1', 'qie1', 'xie1']] },
};

export const toneItems = [1, 2, 3, 4].map(tone => ({ id: `tone-ma${tone}`, sound: `ma${tone}`, label: ['一声 · 平平的', '二声 · 往上扬', '三声 · 拐个弯', '四声 · 往下降'][tone - 1], text: marked(`ma${tone}`) }));

export const tonePracticeSounds = ['ma', 'ba', 'yi', 'wu', 'yu'].flatMap(syllable => [1, 2, 3, 4].map(tone => `${syllable}${tone}`));

export const subjects = [
  { id: 'chinese', name: '语文', english: 'CHINESE', icon: 'book', color: 'pink', features: [{ id: 'pinyin', name: '拼音学习', icon: 'type', category: '拼音学习' }, { id: 'hanzi-structure', name: '汉字笔画与结构', icon: 'pen', category: '第一阶段 · 字词基础' }, ...chineseTopics.map(topic => ({ id: topic.id, name: topic.name, category: topic.stage, icon: ({ dictionary: 'search', 'word-categories': 'grid', 'word-relations': 'compare', collocations: 'link', 'word-patterns': 'flower', 'sentence-building': 'puzzle', punctuation: 'quote', 'sentence-patterns': 'layers', 'sentence-revision': 'refresh', 'vivid-expression': 'leaf', 'similar-characters': 'character-radical', 'character-readings': 'sound', 'poetry-culture': 'scroll' })[topic.id] || 'book' }))] },
  { id: 'math', name: '数学', english: 'MATH', icon: 'math', color: 'blue', features: mathTopics.map(topic => ({ id: topic.id, name: topic.name, category: topic.stage, icon: topic.icon })) },
  { id: 'english', name: '英语', english: 'ENGLISH', icon: 'globe', color: 'yellow', features: [{ id: 'phonics', name: '自然拼读', icon: 'type' }] },
];
