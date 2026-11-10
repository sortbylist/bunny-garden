import { defineTopic, choice } from './chinese-content.js';

export const synonymPairs = [
  ['高兴', '开心', '收到朋友的礼物，我很高兴。', '都表示心情愉快。', ['寒冷', '缓慢']],
  ['美丽', '漂亮', '花园里的花朵十分美丽。', '这里都表示好看。', ['拥挤', '沉重']],
  ['立刻', '马上', '听到集合的口令，我们立刻排好队。', '这里都表示很快就行动。', ['从前', '偶尔']],
  ['寻找', '寻觅', '我们在树林里寻找春天的踪迹。', '都表示设法找；“寻觅”更常见于书面表达。', ['丢弃', '忘记']],
  ['温暖', '暖和', '外面很冷，屋里却很温暖。', '这里都表示不冷不热、让人舒服；并非所有用法都能互换。', ['冰冷', '漆黑']],
  ['仔细', '认真', '她仔细地检查每一道题。', '这里都表示用心、不马虎；“仔细”更强调细心。', ['随便', '慌张']],
];

export const antonymPairs = [
  ['明亮', '昏暗', '打开灯后，房间十分明亮。', '没开灯的屋子十分昏暗。', '这里比较光线的亮暗。', ['整齐', '宽阔']],
  ['宽阔', '狭窄', '新修的马路很宽阔。', '山间的小路很狭窄，只能一人通过。', '这里比较空间的宽窄。', ['明亮', '温暖']],
  ['整齐', '凌乱', '书架上的书摆放得很整齐。', '桌上散落着各种玩具，显得很凌乱。', '这里比较物品摆放是否有条理。', ['热闹', '缓慢']],
  ['热闹', '冷清', '集市上人来人往，十分热闹。', '散场后的广场人很少，十分冷清。', '这里比较人多活跃和人少安静的情景。', ['明亮', '干净']],
  ['节约', '浪费', '及时关好水龙头，能节约用水。', '一直开着水龙头不关，会浪费用水。', '这里比较是否珍惜资源、避免无谓消耗。', ['寻找', '观察']],
  ['谦虚', '骄傲', '取得好成绩后，他仍然谦虚地请教别人。', '取得一点成绩就看不起别人，是骄傲的表现。', '这里的“骄傲”指自满，不是“为祖国骄傲”中的自豪。', ['整齐', '清楚']],
];

export const relationContexts = [
  { id: 'quiet', title: '安静与平静', body: '安静常指没有声音或不喧闹；平静常指心情、局面或水面没有明显起伏。要结合对象判断。', cases: [['安静', '大家不再说话，教室里十分____。', '平静', '响亮'], ['平静', '深呼吸后，我激动的心情渐渐____下来。', '安静', '热闹']] },
  { id: 'wide', title: '宽阔与宽敞', body: '宽阔常形容道路、田野等范围大；宽敞常形容房屋内部空间大。这里练习常见搭配。', cases: [['宽阔', '这条马路有六条车道，非常____。', '宽敞', '瘦小'], ['宽敞', '新教室里摆好桌椅后仍有很大空间，十分____。', '宽阔', '高兴']] },
  { id: 'beautiful', title: '美丽与美好', body: '美丽常形容外貌、景色好看；美好常形容生活、愿望等令人向往。', cases: [['美丽', '眼前的花朵颜色鲜艳，十分____。', '美好', '诚实'], ['美好', '愿大家的____愿望都能实现。', '美丽', '冰冷']] },
  { id: 'improve', title: '改正与改善', body: '改正针对错误和缺点；改善是让原有的情况变得更好。意思相关，但搭配对象不同。', cases: [['改正', '发现作业中的错误后，我及时____。', '改善', '欣赏'], ['改善', '新修的水管____了村里的供水条件。', '改正', '观看']] },
  { id: 'discover', title: '发现与发明', body: '发现是找到原来存在但未被注意的事物；发明是创造出原来没有的新事物。不是意思相近就能互换。', cases: [['发现', '我们在雪地里____了一串小动物的脚印。', '发明', '背诵'], ['发明', '工程师____了一种全新的节水工具。', '发现', '朗读']] },
  { id: 'watch', title: '观看与观察', body: '观看是看事物或活动；观察更强调有目的地仔细查看，以了解特点和变化。', cases: [['观察', '为了记录叶脉的形状，我们用放大镜仔细____叶片。', '观看', '倾听'], ['观看', '同学们坐在礼堂里____文艺演出。', '观察', '触摸']] },
];

export const relationsTopic = defineTopic({
  id: 'word-relations', name: '近义词与反义词', description: '先读懂句子，再找意思相近或相反的词。近义词也不一定处处能替换。',
  categories: [{ id: 'synonyms', name: '句子中的近义词' }, { id: 'antonyms', name: '句子中的反义词' }, { id: 'context', name: '放回语境选一选' }],
  lessons: [
    ...synonymPairs.map(([left, right, sentence, note]) => ({ id: `syn-${left}`, category: 'synonyms', title: `${left} · ${right}`, body: `近义词的意思相近，不一定完全相同。${note}`, examples: [sentence, sentence.replace(left, right)], task: `把句子中的“${left}”换成“${right}”读一读，意思是否接近？再说一个自己的例句。` })),
    ...antonymPairs.map(([left, right, leftSentence, rightSentence, note]) => ({ id: `ant-${left}`, category: 'antonyms', title: `${left} ↔ ${right}`, body: `反义词表示同一方面相反或相对的意思。${note}`, examples: [leftSentence, rightSentence], task: `用“${left}”和“${right}”各说一句话，比较它们描写的情况。` })),
    ...relationContexts.map(item => ({ id: item.id, category: 'context', title: item.title, body: item.body, examples: item.cases.map(([answer, sentence]) => sentence.replace('____', answer)), task: '说说每个句子描写的是什么，再解释为什么选择这个词。' })),
  ],
  questions: [
    ...synonymPairs.flatMap(([left, right, sentence, note, distractors]) => [
      choice(`syn-${left}`, 'synonyms', `句子中的“${left}”与哪个词意思相近？`, right, distractors, `这里“${left}”与“${right}”意思相近。${note}`, sentence),
      choice(`syn-${right}`, 'synonyms', `哪一个词可以替换句子中的“${right}”，使意思基本不变？`, left, distractors, `这里可以用“${left}”替换“${right}”。${note}`, sentence.replace(left, right)),
    ]),
    ...antonymPairs.flatMap(([left, right, leftSentence, rightSentence, note, distractors]) => [
      choice(`ant-${left}`, 'antonyms', `这里“${left}”的反义词是哪个？`, right, distractors, `这里“${left}”与“${right}”意思相反。${note}`, leftSentence),
      choice(`ant-${right}`, 'antonyms', `这里“${right}”的反义词是哪个？`, left, distractors, `这里“${right}”与“${left}”意思相反。${note}`, rightSentence),
    ]),
    ...relationContexts.flatMap(item => item.cases.map(([answer, sentence, other, distractor], index) => choice(`context-${item.id}-${index}`, 'context', '根据语境，选最恰当的词。', answer, [other, distractor], `${sentence.replace('____', answer)}${item.body}`, sentence))),
  ],
});
