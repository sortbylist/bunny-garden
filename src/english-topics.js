export const englishFirstStage = '第一阶段 · 词汇与日常听说';
const audio = (id, text) => ({ id, text });
const option = (id, label, visual = id) => ({ id, label, visual });

const schoolWords = [
  ['pen', '钢笔', 'a blue pen', '一支蓝色的钢笔'],
  ['pencil', '铅笔', 'two pencils', '两支铅笔'],
  ['book', '书', 'a red book', '一本红色的书'],
  ['bag', '书包', 'my school bag', '我的书包'],
  ['desk', '课桌', 'a big desk', '一张大的课桌'],
  ['chair', '椅子', 'a small chair', '一把小椅子'],
  ['ruler', '尺子', 'a long ruler', '一把长尺子'],
  ['eraser', '橡皮', 'an eraser', '一块橡皮'],
].map(([id, meaning, phrase, translation]) => ({
  id, meaning, word: audio(`word-${id}`, id), phrase: audio(`phrase-${id}`, phrase), translation,
}));

const scenes = {
  'open-book': option('open-book', '打开的书'),
  'closed-book': option('closed-book', '合上的书'),
  'pen-up': option('pen-up', '举起钢笔'),
  'pen-down': option('pen-down', '放下钢笔'),
  'pen-on-book': option('pen-on-book', '钢笔在书的上面'),
  'pen-under-book': option('pen-under-book', '钢笔在书的下面'),
  'pen-by-book': option('pen-by-book', '钢笔挨着书'),
  'bag-on-chair': option('bag-on-chair', '书包在椅子上'),
  'bag-under-chair': option('bag-under-chair', '书包在椅子下面'),
  'bag-by-chair': option('bag-by-chair', '书包挨着椅子'),
};

const commands = [
  ['open-book', 'Open your book.', '打开你的书。', '听到 open，就把书打开。', ['closed-book', 'pen-up']],
  ['closed-book', 'Close your book.', '合上你的书。', 'close 在这句话里表示「合上」。', ['open-book', 'pen-down']],
  ['pen-up', 'Pick up your pen.', '拿起你的钢笔。', 'pick up 表示「拿起来」。', ['pen-down', 'open-book']],
  ['pen-down', 'Put down your pen.', '放下你的钢笔。', 'put down 表示「放下」。', ['pen-up', 'closed-book']],
  ['pen-on-book', 'Put the pen on the book.', '把钢笔放在书的上面。', 'on 表示钢笔在书上，和书接触。', ['pen-under-book', 'pen-by-book']],
  ['pen-under-book', 'Put the pen under the book.', '把钢笔放在书的下面。', 'under 表示「在……下面」。', ['pen-on-book', 'pen-by-book']],
  ['bag-on-chair', 'Put your bag on the chair.', '把书包放在椅子上。', '听到 bag、chair 和 on，要找书包放在椅面上的图。', ['bag-under-chair', 'bag-by-chair']],
  ['bag-under-chair', 'Put your bag under the chair.', '把书包放在椅子下面。', '听到 under the chair，要找椅子下面的位置。', ['bag-on-chair', 'bag-by-chair']],
].map(([id, text, translation, tip, distractors]) => ({ id, clip: audio(`command-${id}`, text), translation, tip, distractors }));

const lines = {
  'borrow-pencil': audio('say-borrow-pencil', 'Can I borrow your pencil, please?'),
  'borrow-ruler': audio('say-borrow-ruler', 'Can I borrow your ruler, please?'),
  'here': audio('say-here', 'Here you are.'),
  'thanks': audio('say-thanks', 'Thank you.'),
  'welcome': audio('say-welcome', "You're welcome."),
  'help': audio('say-help', 'Can you help me, please?'),
  'sure': audio('say-sure', 'Sure, I can help.'),
  'repeat': audio('say-repeat', 'Can you say that again, please?'),
  'again': audio('say-again', "Of course. I'll say it again."),
  'understand': audio('say-understand', "I don't understand."),
  'show': audio('say-show', 'Let me show you.'),
};

const dialogues = [
  ['borrow', '借一支铅笔', '忘带铅笔了，试着礼貌地向同学借。', ['borrow-pencil', 'here', 'thanks'], '把 pencil 换成 ruler，再请同伴和你交换角色。', 'borrow-ruler'],
  ['help', '请别人帮忙', '遇到不会做的题，可以请老师或同学帮忙。', ['help', 'sure', 'thanks', 'welcome'], '找一道不懂的题，指着它向同伴求助，再换你回应。'],
  ['repeat', '请别人再说一次', '没听清老师的指令，可以请老师再说一遍。', ['repeat', 'again', 'thanks'], '请同伴先说一句课堂指令。请他再说一遍，听懂后做动作，再交换角色。'],
  ['understand', '说出自己没听懂', '听见了，但没有明白意思时，可以说明情况。', ['understand', 'show', 'thanks'], '请一位搭档用动作示范，你先说自己没听懂，再学着做。'],
].map(([id, title, body, keys, task, variation]) => ({
  id, title, body, task, lines: keys.map((key, index) => ({ speaker: index % 2 ? '搭档' : '学生', clip: lines[key] })),
  variation: lines[variation],
  checklist: ['我能说清自己需要什么。', '我能用礼貌的语气回应，并和搭档交换角色。'],
}));

function topic(id, name, icon, description, category, lessons, questions) {
  return {
    id, name, icon, stage: englishFirstStage, subject: 'english', description,
    categories: [{ id: category[0], name: category[1], icon }],
    lessons: lessons.map(lesson => ({ ...lesson, id: `${id}-${lesson.id}`, category: category[0] })),
    questions: questions.map(question => ({ ...question, id: `${id}-${question.id}`, category: category[0] })),
  };
}

const schoolOptions = group => group.map(id => {
  const word = schoolWords.find(item => item.id === id);
  return option(id, word.meaning);
});
const schoolDistractors = [
  ['pencil', 'ruler'], ['pen', 'eraser'], ['bag', 'ruler'], ['desk', 'book'],
  ['chair', 'bag'], ['desk', 'bag'], ['pencil', 'book'], ['ruler', 'pencil'],
];
const wordQuestions = schoolWords.flatMap((word, index) => {
  const optionIds = [word.id, ...schoolDistractors[index]];
  return [
    { id: `hear-${word.id}`, prompt: '听单词，选出对应的图片。', clip: word.word, choices: schoolOptions(optionIds), answer: word.id, explanation: `这个词的意思是「${word.meaning}」。` },
    { id: `read-${word.id}`, prompt: '短语里说的是哪样东西？', display: word.phrase.text, choices: schoolOptions(optionIds), answer: word.id, explanation: `${word.phrase.text} 的意思是「${word.translation}」。` },
  ];
});
const listeningQuestions = commands.map(command => ({
  id: `hear-${command.id}`, prompt: '听完指令，选出做对了的图片。', clip: command.clip,
  choices: [command.id, ...command.distractors].map(id => scenes[id]), answer: command.id, explanation: command.tip,
}));
const speakingQuestions = [
  ['ask-pencil', '想借同桌的铅笔，可以怎么问？', '', 'borrow-pencil', ['repeat', 'thanks'], '用 Can I borrow …? 礼貌地询问能不能借东西。'],
  ['hand-it', '同桌想借你的尺子。递给他时可以说什么？', lines['borrow-ruler'].text, 'here', ['repeat', 'understand'], '把东西递给对方时，可以说 Here you are.'],
  ['thank', '同桌把铅笔递给你。你可以说什么？', lines.here.text, 'thanks', ['welcome', 'show'], '收到借来的东西后，可以说 Thank you.'],
  ['ask-help', '想请同学帮忙，可以怎么问？', '', 'help', ['borrow-ruler', 'repeat'], 'Can you help me, please? 是一句礼貌的求助。'],
  ['reply-help', '同学向你求助，你愿意帮忙。可以怎么说？', lines.help.text, 'sure', ['borrow-pencil', 'understand'], '用 Sure, I can help. 表示愿意帮忙。'],
  ['ask-repeat', '你没听清刚才的话，想请对方再说一次。可以问什么？', '', 'repeat', ['borrow-pencil', 'welcome'], 'say that again 表示「把刚才的话再说一遍」。'],
  ['not-clear', '你听到了每个词，但还不明白意思。哪句能说明你的情况？', '', 'understand', ['welcome', 'here'], 'I don’t understand. 表示自己还没明白。'],
  ['reply-thanks', '同学感谢你帮忙，可以怎么回应？', lines.thanks.text, 'welcome', ['borrow-ruler', 'again'], '别人说 Thank you. 时，可以说 You’re welcome.'],
].map(([id, prompt, display, answer, distractors, explanation]) => ({
  id, prompt, display, choices: [answer, ...distractors].map(key => ({ id: key, label: lines[key].text, language: 'en' })), answer, explanation,
}));

const asQuestions = questions => questions.map(question => ({ ...question, options: question.choices.map(choice => choice.id) }));

export const englishTopics = [
  topic('english-vocabulary', '主题词汇', 'grid', '认识常见的校园物品，把单词放进短语里记。', ['school-supplies', '校园与文具'],
    schoolWords.map(word => ({ ...word, title: word.word.text, body: word.meaning, visual: word.id })), asQuestions(wordQuestions)),
  topic('english-listening', '听力理解', 'headphones', '听清老师说的动作和位置，再选图或做给家人看。', ['classroom-instructions', '听指令做动作'],
    commands.map(command => ({ ...command, title: command.clip.text, body: command.translation, visual: command.id, task: '听完音频，试着用身边的书、笔或书包做出这个动作。' })), asQuestions(listeningQuestions)),
  topic('english-speaking', '情景口语', 'quote', '听一句，跟说一句，再和搭档交换角色。', ['classroom-speaking', '课堂借物与求助'],
    dialogues, asQuestions(speakingQuestions)),
];

export const englishAudioClips = [
  ...schoolWords.flatMap(word => [word.word, word.phrase]),
  ...commands.map(command => command.clip),
  ...Object.values(lines),
];
