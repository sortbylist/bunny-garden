import { defineTopic, choice } from './chinese-content.js';

const categories = [
  { id: 'people', name: '人物与职业' }, { id: 'animals', name: '动物' }, { id: 'plants', name: '植物' },
  { id: 'actions', name: '动作' }, { id: 'feelings', name: '心情' }, { id: 'seasons', name: '四季' },
];

const groups = {
  people: [
    ['医生', '给人检查身体、治疗疾病的人。', '医生正在给病人看病。', '看病、检查、治疗'],
    ['教师', '教学生知识、帮助学生成长的人。', '教师正在给学生讲课。', '讲课、指导、教育'],
    ['农民', '主要从事农业生产劳动的人。', '农民在田里种水稻。', '播种、耕地、收获'],
    ['厨师', '以烹调菜肴为职业的人。', '厨师在厨房里做菜。', '切菜、烹调、饭菜'],
  ],
  animals: [
    ['燕子', '一种善于飞行、常在屋檐下筑巢的鸟。', '燕子在屋檐下筑巢。', '飞行、翅膀、鸟巢'],
    ['松鼠', '常在树上活动、尾巴蓬松的小动物。', '松鼠抱着松果坐在树枝上。', '松果、尾巴、跳跃'],
    ['青蛙', '一种两栖动物，后腿长，善于跳跃。', '青蛙蹲在荷叶上呱呱叫。', '池塘、跳跃、捕虫'],
    ['蜜蜂', '会采集花蜜、花粉的昆虫。', '蜜蜂在花丛中采蜜。', '花蜜、蜂巢、飞舞'],
  ],
  plants: [
    ['松树', '叶子细长像针、常年保持绿色的树。', '松树的叶子像一根根细针。', '松针、树干、松果'],
    ['柳树', '枝条细长、叶子狭长的树。', '柳树的长枝条垂在河边。', '柳条、柳叶、垂柳'],
    ['荷花', '生长在水中的植物开的花。', '荷花在池塘里开放。', '荷叶、莲蓬、池塘'],
    ['向日葵', '花盘大、常见花瓣呈黄色的植物。', '向日葵结出了许多葵花籽。', '花盘、葵花籽、金黄'],
  ],
  actions: [
    ['奔跑', '快速地跑。', '运动员在跑道上奔跑。', '奔跑、跳跃、行走'],
    ['观察', '有目的地仔细查看。', '我们用放大镜观察叶脉。', '观察叶片、观察变化'],
    ['整理', '把东西收拾得有条理。', '我把书本按大小整理好。', '整理书包、整理房间'],
    ['照顾', '关心别人并给予帮助。', '姐姐细心地照顾生病的弟弟。', '照顾家人、照顾病人'],
  ],
  feelings: [
    ['高兴', '感到愉快、开心。', '收到朋友的祝福，我很高兴。', '高兴、开心、喜悦'],
    ['难过', '心里不舒服、感到伤心。', '心爱的玩具坏了，弟弟很难过。', '难过、伤心、失落'],
    ['紧张', '心里不安，难以放松。', '第一次上台讲话，我有点紧张。', '紧张的心情、深呼吸'],
    ['平静', '这里指心情安定，没有大的起伏。', '听了老师的安慰，我的心情渐渐平静。', '心情平静、恢复平静'],
  ],
  seasons: [
    ['春天', '一年四季中的第一季，许多地方天气转暖。', '春天到了，小草发芽，燕子归来。', '春雨、嫩芽、春暖花开'],
    ['夏天', '一年四季中的第二季，许多地方天气炎热。', '夏天到了，蝉在树上鸣叫。', '夏夜、蝉鸣、烈日'],
    ['秋天', '一年四季中的第三季，许多地方天气转凉。', '秋天到了，稻谷成熟，田野金黄。', '秋风、落叶、丰收'],
    ['冬天', '一年四季中的第四季，许多地方天气寒冷。', '冬天到了，北方常见冰雪。', '冬雪、寒风、冰霜'],
  ],
};

export const vocabularyEntries = Object.entries(groups).flatMap(([category, items]) => items.map(([text, meaning, sentence, related]) => ({ category, text, meaning, sentence, related })));

export const vocabularyTopic = defineTopic({
  id: 'word-categories', name: '词语积累与分类', description: '把生活中的词语分分类，再放进句子里说一说、用一用。', categories,
  lessons: vocabularyEntries.map(entry => ({
    id: entry.text, category: entry.category, title: entry.text, body: entry.meaning,
    examples: [entry.sentence, `一起积累：${entry.related}。`],
    task: entry.category === 'seasons' ? `说说你家乡的${entry.text}是什么样子。各地气候不同，不必照搬例句。` : `用“${entry.text}”说一句完整的话，再找一个同类词语。分类要看词在这里表达的意思。`,
  })),
  questions: vocabularyEntries.flatMap(entry => {
    const category = categories.find(item => item.id === entry.category);
    const distractors = vocabularyEntries.filter(item => item.category !== entry.category && item.text !== entry.text).filter((item, index, items) => items.findIndex(other => other.category === item.category) === index).slice(0, 3).map(item => item.text);
    return [
      choice(`class-${entry.text}`, entry.category, `句子中的“${entry.text}”主要属于哪一类？`, category.name, categories.filter(item => item.id !== entry.category).slice(0, 3).map(item => item.name), `这里的“${entry.text}”表示${entry.meaning}所以归入“${category.name}”。分类要结合语境。`, entry.sentence),
      choice(`use-${entry.text}`, entry.category, '选一个合适的词语，把句子补完整。', entry.text, distractors, `应选“${entry.text}”。${entry.meaning}完整句子：${entry.sentence}`, entry.sentence.replace(entry.text, '____')),
    ];
  }),
});
