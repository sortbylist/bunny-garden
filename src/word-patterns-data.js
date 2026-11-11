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
  { text: '白茫茫', pattern: 'ABB', meaning: '形容一片白色，看不清边际。', sentence: '大雪过后，田野里白茫茫一片。' },
  { text: '金灿灿', pattern: 'ABB', meaning: '形容金光耀眼。', sentence: '成熟的稻田金灿灿的。' },
  { text: '黑乎乎', pattern: 'ABB', meaning: '形容光线暗或颜色黑。', sentence: '停电后，屋里黑乎乎的。' },
  { text: '热乎乎', pattern: 'ABB', meaning: '形容温热、让人感到暖和。', sentence: '刚出锅的馒头热乎乎的。' },
  { text: '甜丝丝', pattern: 'ABB', meaning: '形容略带甜味，也可形容心里愉快。', sentence: '咬一口梨，汁水甜丝丝的。' },
  { text: '笑眯眯', pattern: 'ABB', meaning: '形容微笑时眼睛眯起来的样子。', sentence: '奶奶笑眯眯地迎接我们。' },
  { text: '清清楚楚', pattern: 'AABB', meaning: '形容非常清楚，没有含混。', sentence: '他把路线说得清清楚楚。' },
  { text: '认认真真', pattern: 'AABB', meaning: '形容做事十分用心。', sentence: '她认认真真地完成了作业。' },
  { text: '平平安安', pattern: 'AABB', meaning: '形容没有危险或事故。', sentence: '我们祝愿出门的家人平平安安。' },
  { text: '来来往往', pattern: 'AABB', meaning: '形容不断地来和去。', sentence: '街上来来往往的行人很多。' },
  { text: '多多少少', pattern: 'AABB', meaning: '表示数量不一，也表示或多或少。', sentence: '每个人多多少少都出了一份力。' },
  { text: '大大小小', pattern: 'AABB', meaning: '表示有大的也有小的。', sentence: '海滩上散落着大大小小的贝壳。' },
  { text: '讨论讨论', pattern: 'ABAB', meaning: '表示一起交换一下意见。', sentence: '这个方案还需要大家讨论讨论。' },
  { text: '练习练习', pattern: 'ABAB', meaning: '表示反复做一做，以便熟练。', sentence: '这个动作不熟练，还要练习练习。' },
  { text: '整理整理', pattern: 'ABAB', meaning: '表示把物品收拾一下。', sentence: '书桌有点乱，我们把书本整理整理。' },
  { text: '活动活动', pattern: 'ABAB', meaning: '表示稍微动一动身体。', sentence: '坐了很久，起来活动活动筋骨吧。' },
  { text: '打听打听', pattern: 'ABAB', meaning: '表示向别人询问一下消息。', sentence: '不知道图书馆在哪儿，我们去打听打听。' },
  { text: '体验体验', pattern: 'ABAB', meaning: '表示亲身感受一下。', sentence: '这次到农场，我们想体验体验种菜的过程。' },
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
  { text: '井底之蛙', meaning: '比喻见识狭窄、眼界很小的人。', sentence: '多读书、多观察，才不会成为井底之蛙。', situation: '小明从没离开过小山村，却认定天下所有地方都和村里一样。', distractors: ['齐心协力', '亡羊补牢'], warning: '不是泛指井里的青蛙，要理解见识有限的比喻义。' },
  { text: '掩耳盗铃', meaning: '比喻自己欺骗自己，以为别人也不知道。', sentence: '把错误藏起来却以为没有人发现，这样做无异于掩耳盗铃。', situation: '有人偷铃铛，怕别人听见响声，就捂住自己的耳朵，以为别人也听不见。', distractors: ['一心一意', '齐心协力'], warning: '强调自欺欺人，不是保护耳朵的正确方法。' },
  { text: '刻舟求剑', meaning: '比喻不懂情况已经变化，仍照老办法办事。', sentence: '事情已经变了，还照旧办法处理，就像刻舟求剑。', situation: '剑从船上掉进水里，他在船边刻个记号，等船开远后才从记号处下水找剑。', distractors: ['亡羊补牢', '争先恐后'], warning: '关键在于情况变了，却不知道改变方法。' },
  { text: '拔苗助长', meaning: '比喻急于求成，反而把事情弄坏。', sentence: '学习要循序渐进，不能拔苗助长。', situation: '种田人嫌禾苗长得慢，把苗往上拔，结果禾苗都枯死了。', distractors: ['齐心协力', '一心一意'], warning: '帮助成长要符合规律，不能只求眼前快。' },
  { text: '狐假虎威', meaning: '比喻借助别人的威势来吓唬人。', sentence: '借着别人的名头欺负同学，是狐假虎威的行为。', situation: '狐狸自己不厉害，却借身后的老虎吓走了小动物。', distractors: ['自言自语', '亡羊补牢'], warning: '“假”在这里是借用的意思，不是说老虎是假的。' },
  { text: '坐井观天', meaning: '比喻眼界狭小，看事情不全面。', sentence: '只凭一点经验就下结论，容易坐井观天。', situation: '青蛙待在井里，只见井口那么大的天空，就认定天空只有那么大。', distractors: ['画蛇添足', '齐心协力'], warning: '不要只凭自己看到的一小部分判断整体。' },
  { text: '半途而废', meaning: '事情没有做完，就在中途停止。', sentence: '练字要坚持，不能半途而废。', situation: '模型做了一半，小华嫌麻烦，丢在一边再也不做了。', distractors: ['一心一意', '亡羊补牢'], warning: '是没有完成就放弃，不是完成后的正常休息。' },
  { text: '坚持不懈', meaning: '一直坚持，不松懈。', sentence: '经过坚持不懈的练习，她终于学会了游泳。', situation: '一开始总失败，他仍每天练习，几个月后终于成功。', distractors: ['三心二意', '半途而废'], warning: '强调持续努力，不是偶尔做一次。' },
  { text: '迫不及待', meaning: '心情急切，等不下去了。', sentence: '新书一到，他就迫不及待地翻开了。', situation: '收到盼了很久的包裹，妹妹急着立刻打开。', distractors: ['自言自语', '守株待兔'], warning: '形容急切心情，也要注意安全和礼貌。' },
  { text: '恍然大悟', meaning: '一下子完全明白过来。', sentence: '听了老师的解释，我恍然大悟。', situation: '困惑了许久，看到演示后，他突然明白了其中的道理。', distractors: ['半途而废', '争先恐后'], warning: '强调由不明白到忽然明白的变化。' },
  { text: '目不转睛', meaning: '眼珠不转地注视，形容看得专心。', sentence: '同学们目不转睛地看着实验。', situation: '魔术开始后，孩子紧紧盯着魔术师的手，一点也不舍得移开目光。', distractors: ['自言自语', '三心二意'], warning: '形容专注看，不是身体一动也不能动。' },
  { text: '大吃一惊', meaning: '对意外的事情感到十分惊讶。', sentence: '看到花盆里竟然长出了小蘑菇，他大吃一惊。', situation: '原以为盒子空着，打开却发现里面有一只小猫，她惊讶极了。', distractors: ['一心一意', '齐心协力'], warning: '这里的“吃”不是吃东西，而是受到惊吓或惊讶。' },
];

export const fourCharacterPhrases = [
  { text: '春暖花开', meaning: '春天气候温暖，百花开放。', sentence: '春暖花开的日子里，我们到郊外散步。' },
  { text: '鸟语花香', meaning: '鸟儿鸣叫，花儿飘香，形容春天的美好景象。', sentence: '公园里鸟语花香，令人心情舒畅。' },
  { text: '五颜六色', meaning: '形容颜色繁多。', sentence: '花坛里开满了五颜六色的花。' },
  { text: '四面八方', meaning: '泛指各个方向或各个地方。', sentence: '游客从四面八方来到这里。' },
  { text: '风和日丽', meaning: '微风和畅，阳光明丽。', sentence: '今天风和日丽，很适合在户外散步。' },
  { text: '天高云淡', meaning: '天空高远，云朵稀少而淡薄。', sentence: '秋日天高云淡，远山看得十分清楚。' },
  { text: '层林尽染', meaning: '一层层树林好像都染上了颜色。', sentence: '深秋，山上层林尽染，红叶格外好看。' },
  { text: '果实累累', meaning: '结出的果实很多。', sentence: '秋天的果园果实累累，枝头挂满了苹果。' },
  { text: '白雪皑皑', meaning: '形容霜雪洁白。', sentence: '远处的山顶白雪皑皑，闪着银光。' },
  { text: '生机勃勃', meaning: '形容生命力旺盛，充满活力。', sentence: '春雨过后，小花园显得生机勃勃。' },
  { text: '五光十色', meaning: '形容色彩鲜艳、光泽耀眼。', sentence: '灯光照在水晶上，映出五光十色的光彩。' },
  { text: '人山人海', meaning: '形容聚集的人非常多。', sentence: '节日的广场人山人海，十分热闹。' },
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
  风和日丽: '微风轻轻吹拂，阳光明亮，今天的天气真是____。',
  天高云淡: '向上望去，天空高远，只有几片淡淡的云，真是____。',
  层林尽染: '秋天的山坡上，一层层树林都像染上红黄的颜色，这是____的景象。',
  果实累累: '果园里每棵树都挂满了果子，真是____。',
  白雪皑皑: '高山上覆盖着一片洁白的积雪，远远看去____。',
  生机勃勃: '花草长出新芽，小动物活跃起来，花园充满生命力，显得____。',
  五光十色: '水晶折射出鲜艳又耀眼的各色光泽，真是____。',
  人山人海: '广场上聚集的人多得像山和海一样，真是____。',
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
      choice(`use-${item.text}`, item.pattern, '根据语境选择合适的叠词。', item.text, usageDistractors[item.text] || (item.pattern === 'ABAB' ? ['绿油油', '红彤彤'] : ['研究研究', '打听打听']), `${item.meaning}完整句子：${item.sentence}`, item.sentence.replace(item.text, '____')),
      choice(`definition-${item.text}`, item.pattern, '根据解释，选择合适的叠词。', item.text, item.pattern === 'ABAB' ? ['绿油油', '高高兴兴'] : ['休息休息', '商量商量'], `${item.text}：${item.meaning}`, item.meaning),
    ]),
    ...fourCharacterPhrases.flatMap(item => [
      choice(`meaning-${item.text}`, 'four', `“${item.text}”是什么意思？`, item.meaning, fourCharacterPhrases.filter(other => other.text !== item.text).slice(0, 3).map(other => other.meaning), item.meaning, item.sentence),
      choice(`use-${item.text}`, 'four', '选择与描述最贴切的四字词语。', item.text, fourCharacterPhrases.filter(other => other.text !== item.text).slice(0, 3).map(other => other.text), `${item.sentence}${item.meaning}`, phraseContexts[item.text]),
    ]),
    ...idioms.flatMap(item => [
      choice(`meaning-${item.text}`, 'idioms', `句子中“${item.text}”是什么意思？`, item.meaning, idioms.filter(other => item.distractors.includes(other.text)).map(other => other.meaning), `${item.meaning}${item.warning}`, item.sentence),
      choice(`use-${item.text}`, 'idioms', '哪个成语最符合这个情景？', item.text, item.distractors, `${item.text}：${item.meaning}${item.warning}`, item.situation),
    ]),
    choice('phrase-not-idiom', 'four', '下面哪个只是普通的四字短语，不是成语？', '我的书包', ['五颜六色', '一心一意'], '“我的书包”是普通短语。不能因为有四个字，就把它当作成语。'),
  ],
});
