import { defineTopic, choice } from './chinese-content.js';

export const repeatedWords = [
  { text: '绿油油', pattern: 'ABB', meaning: '形容浓绿而润泽的样子。', sentence: '雨后的麦苗绿油油的。' },
  { text: '红彤彤', pattern: 'ABB', meaning: '形容颜色很红。', sentence: '傍晚的太阳红彤彤的。' },
  { text: '亮晶晶', pattern: 'ABB', meaning: '形容明亮闪光。', sentence: '露珠在阳光下亮晶晶的。' },
  { text: '静悄悄', pattern: 'ABB', meaning: '形容非常安静，没有声响。', sentence: '夜深了，校园里静悄悄的。' },
  { text: '干干净净', pattern: 'AABB', meaning: '形容十分干净。', sentence: '我们把教室打扫得干干净净。' },
  { text: '整整齐齐', pattern: 'AABB', meaning: '形容很有条理，排列整齐。', sentence: '书架上的书摆得整整齐齐。' },
  { text: '高高兴兴', pattern: 'AABB', meaning: '形容心情十分愉快。', sentence: '同学们高高兴兴地去春游。' },
  { text: '明明白白', pattern: 'AABB', meaning: '形容非常清楚、明白。', sentence: '老师把规则讲得明明白白。' },
  { text: '商量商量', pattern: 'ABAB', meaning: '表示一起讨论一下，语气比较缓和。', sentence: '春游带什么，我们先商量商量。' },
  { text: '休息休息', pattern: 'ABAB', meaning: '表示稍微休息一下。', sentence: '走累了，我们坐下来休息休息。' },
  { text: '打扫打扫', pattern: 'ABAB', meaning: '表示做一下打扫这件事。', sentence: '客人来之前，我们把房间打扫打扫。' },
  { text: '研究研究', pattern: 'ABAB', meaning: '表示仔细思考、探讨一下。', sentence: '这道题怎么做，大家一起研究研究。' },
];

export const idioms = [
  { text: '一心一意', meaning: '心思专一，专心致志。', sentence: '弟弟一心一意地读书，连窗外的鸟叫也没注意。', situation: '小明关掉电视，专心做一件事，没有想着别的事。', distractors: ['三心二意', '守株待兔'], warning: '适合描写做事专心，不用来表示数量多。' },
  { text: '三心二意', meaning: '心思不专一，犹豫不定。', sentence: '学习时一会儿看书一会儿玩玩具，这样三心二意可不行。', situation: '小华一会儿想画画，一会儿想玩球，做事不能专心。', distractors: ['一心一意', '齐心协力'], warning: '常用于提醒别人专心，不能用来夸奖认真。' },
  { text: '齐心协力', meaning: '大家一条心，共同努力。', sentence: '同学们齐心协力，把图书角整理好了。', situation: '全组同学互相配合，一起完成了清扫任务。', distractors: ['三心二意', '自言自语'], warning: '强调大家共同努力，不只是一个人独自做事。' },
  { text: '自言自语', meaning: '自己对自己说话。', sentence: '爷爷一边找眼镜，一边自言自语：“放在哪里了呢？”', situation: '小刚独自在房间里，小声对自己说：“下一步该怎么办？”', distractors: ['齐心协力', '争先恐后'], warning: '自己说给自己听，和两个人交谈不同。' },
  { text: '争先恐后', meaning: '争着向前，唯恐落后。', sentence: '听说可以报名参加劳动，同学们争先恐后地举手。', situation: '老师问谁愿意帮助搬书，大家都抢着举手报名。', distractors: ['自言自语', '守株待兔'], warning: '可描写积极争取，也要结合情境注意秩序。' },
  { text: '守株待兔', meaning: '比喻不主动努力，只希望靠偶然的好运得到收获。', sentence: '学习要主动练习，不能守株待兔，等着好成绩自己到来。', situation: '偶然捡到一次钱后，他每天坐在原地等着再捡钱，也不去做该做的事。', distractors: ['齐心协力', '一心一意'], warning: '本义来自等兔子撞树桩的故事，使用时要理解比喻义。' },
  { text: '画蛇添足', meaning: '比喻做了多余的事，反而不恰当。', sentence: '这个标志已经很清楚，再加无关图案反而画蛇添足。', situation: '海报已经清楚好看，他硬加许多无关文字，反而让人看不懂重点。', distractors: ['齐心协力', '一心一意'], warning: '不是所有补充都是画蛇添足，关键是多余且造成不好的效果。' },
  { text: '亡羊补牢', meaning: '比喻出了问题以后及时补救，防止再受损失。', sentence: '这次忘带作业后，他开始每天检查书包，算是亡羊补牢。', situation: '发现围栏破了、羊跑丢一只后，牧人马上修好围栏，防止再丢羊。', distractors: ['守株待兔', '画蛇添足'], warning: '强调已经出现问题后及时补救，不是出事前的预防。' },
];

export const fourCharacterPhrases = [
  { text: '春暖花开', meaning: '春天气候温暖，百花开放。', sentence: '春暖花开的日子里，我们到郊外散步。' },
  { text: '鸟语花香', meaning: '鸟儿鸣叫，花儿飘香，形容春天的美好景象。', sentence: '公园里鸟语花香，令人心情舒畅。' },
  { text: '五颜六色', meaning: '形容颜色繁多。', sentence: '花坛里开满了五颜六色的花。' },
  { text: '四面八方', meaning: '泛指各个方向或各个地方。', sentence: '游客从四面八方来到这里。' },
];

const patterns = ['ABB', 'AABB', 'ABAB'];
const usageDistractors = {
  绿油油: ['静悄悄', '高高兴兴'], 红彤彤: ['绿油油', '明明白白'],
  亮晶晶: ['明明白白', '高高兴兴'], 静悄悄: ['红彤彤', '明明白白'],
  干干净净: ['红彤彤', '明明白白'], 整整齐齐: ['红彤彤', '高高兴兴'],
  高高兴兴: ['亮晶晶', '绿油油'], 明明白白: ['绿油油', '红彤彤'],
  商量商量: ['绿油油', '静悄悄'], 休息休息: ['红彤彤', '整整齐齐'],
  打扫打扫: ['高高兴兴', '亮晶晶'], 研究研究: ['绿油油', '干干净净'],
};
const phraseContexts = {
  春暖花开: '春天气候转暖，百花开放，正是____的好时节。',
  鸟语花香: '走进花园，听见鸟儿鸣叫，闻到阵阵花香，这就是____的景象。',
  五颜六色: '花坛里有红、黄、紫、白等各种颜色的花，真是____。',
  四面八方: '游客从东南西北各个地方赶来，也就是从____来到这里。',
};

export const patternsTopic = defineTopic({
  id: 'word-patterns', name: '叠词与四字词语', description: '发现词语重复的节奏，读懂四字词语，再把它们用进合适的句子里。',
  categories: [
    { id: 'ABB', name: 'ABB 叠词' }, { id: 'AABB', name: 'AABB 叠词' }, { id: 'ABAB', name: 'ABAB 叠词' },
    { id: 'four', name: '四字词语积累' }, { id: 'idioms', name: '成语理解与运用' },
  ],
  lessons: [
    ...repeatedWords.map(item => ({
      id: item.text, category: item.pattern, title: item.text,
      body: `${item.pattern} 表示字的重复位置：${item.pattern === 'ABB' ? '后两个字相同' : item.pattern === 'AABB' ? '第一个字重复一次，第二个字也重复一次' : '把两个字组成的一组整体重复一次'}。${item.meaning}`,
      examples: [`${item.text} → ${[...item.text].join(' · ')}`, item.sentence],
      task: `按节奏读一读“${item.text}”，再用它说一句话。不是所有词都能照样重复，要选自然的说法。`,
    })),
    ...fourCharacterPhrases.map(item => ({ id: item.text, category: 'four', title: item.text, body: `${item.meaning}四字词语是按字数说的，成语是约定俗成的固定表达。并非所有四字组合都是成语。`, examples: [item.sentence, '例如“我的书包”虽然有四个字，却只是普通短语，不是成语。'], task: `用“${item.text}”描写你见过的景象，先想一想意思是否合适。` })),
    ...idioms.map(item => ({ id: item.text, category: 'idioms', title: item.text, body: item.meaning, examples: [item.sentence, `用法提醒：${item.warning}`], task: `用自己的话解释“${item.text}”，再说一个适合用它的情景。不要只按字面猜意思。` })),
  ],
  questions: [
    ...repeatedWords.flatMap(item => [
      choice(`pattern-${item.text}`, item.pattern, `“${item.text}”是哪种叠词形式？`, item.pattern, patterns.filter(pattern => pattern !== item.pattern), `${[...item.text].join(' · ')}：${item.pattern} 中相同字母代表相同的字。`, item.text),
      choice(`use-${item.text}`, item.pattern, '根据语境选择合适的叠词。', item.text, usageDistractors[item.text], `${item.meaning}完整句子：${item.sentence}`, item.sentence.replace(item.text, '____')),
    ]),
    ...fourCharacterPhrases.flatMap(item => [
      choice(`meaning-${item.text}`, 'four', `“${item.text}”是什么意思？`, item.meaning, fourCharacterPhrases.filter(other => other.text !== item.text).map(other => other.meaning), item.meaning, item.sentence),
      choice(`use-${item.text}`, 'four', '选择与描述最贴切的四字词语。', item.text, fourCharacterPhrases.filter(other => other.text !== item.text).map(other => other.text), `${item.sentence}${item.meaning}`, phraseContexts[item.text]),
    ]),
    ...idioms.flatMap(item => [
      choice(`meaning-${item.text}`, 'idioms', `句子中“${item.text}”是什么意思？`, item.meaning, idioms.filter(other => item.distractors.includes(other.text)).map(other => other.meaning), `${item.meaning}${item.warning}`, item.sentence),
      choice(`use-${item.text}`, 'idioms', '哪个成语最符合这个情景？', item.text, item.distractors, `${item.text}：${item.meaning}${item.warning}`, item.situation),
    ]),
    choice('phrase-not-idiom', 'four', '下面哪个只是普通的四字短语，不是成语？', '我的书包', ['五颜六色', '一心一意'], '“我的书包”是普通短语。不能因为有四个字，就把它当作成语。'),
  ],
});
