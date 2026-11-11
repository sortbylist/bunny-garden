import { escapeText, readingText } from './chinese-reading.js';

const tree = (height, color = '#70a582') => `<path d="M78 148V${148 - height}" stroke="#8e6c53" stroke-width="10" stroke-linecap="round"/><ellipse cx="78" cy="${143 - height}" rx="34" ry="29" fill="${color}"/><path d="M34 153H126" stroke="#b5c7a1" stroke-width="4" stroke-linecap="round"/>`;
const books = tidy => `<path d="M18 135H142" stroke="#947564" stroke-width="8" stroke-linecap="round"/>${[0, 1, 2, 3].map((index) => `<g transform="translate(${31 + index * 26} ${tidy ? 48 : 52 + index % 2 * 22}) rotate(${tidy ? 0 : [-18, 16, -10, 25][index]} 10 40)"><rect width="20" height="78" rx="3" fill="${['#b395c5', '#dfaa7b', '#8eb7ab', '#e4b1bc'][index]}"/><path d="M5 12H15M5 64H15" stroke="#fffaf2" stroke-width="2"/></g>`).join('')}`;
const cup = full => `<path d="M41 35L47 145H112L119 35Z" fill="#fbf9ee" stroke="#839eac" stroke-width="4"/>${full ? '<path d="M44 42Q79 38 116 42L111 140H49Z" fill="#99cfdf"/>' : ''}<path d="M119 58Q152 58 145 96Q140 111 116 108" fill="none" stroke="#839eac" stroke-width="5"/>`;
const face = happy => `<circle cx="80" cy="87" r="44" fill="#f4d7af"/><path d="M42 65Q54 21 93 43Q113 37 123 67" fill="#756056"/><circle cx="64" cy="84" r="3" fill="#514451"/><circle cx="96" cy="84" r="3" fill="#514451"/><path d="${happy ? 'M62 103Q80 123 98 103' : 'M62 114Q80 96 98 114'}" stroke="#a66e72" fill="none" stroke-width="4" stroke-linecap="round"/><path d="M39 158Q45 128 80 131Q115 128 121 158" fill="#a6b8cf"/>`;
const road = wide => `<path d="M${wide ? 24 : 58} 150V27H${wide ? 136 : 102}V150" fill="#bfc5c7"/><path d="M80 30V150" stroke="#fffbe9" stroke-width="4" stroke-dasharray="14 10"/><path d="M18 150V23M142 150V23" stroke="#a8c49b" stroke-width="7"/>`;
const room = bright => `<rect x="20" y="29" width="120" height="120" rx="9" fill="${bright ? '#fff1b5' : '#5d637d'}"/><rect x="34" y="50" width="36" height="45" rx="3" fill="${bright ? '#b9dbe0' : '#3c4760'}"/><path d="M52 50V95M34 72H70" stroke="#fff8ec" stroke-width="3"/><path d="M80 29V55" stroke="#7f6a63" stroke-width="3"/><path d="M65 67Q80 41 95 67Z" fill="${bright ? '#ecc36b' : '#9e9caf'}"/><path d="M91 122H128M101 122V145M119 122V145" stroke="#a58673" stroke-width="6"/>`;
const rope = long => `<path d="${long ? 'M25 82Q45 47 65 82T142 82' : 'M25 82Q45 47 65 82T86 82'}" fill="none" stroke="#c1956b" stroke-width="10" stroke-linecap="round"/>`;
const tap = saving => `<path d="M45 36H95V63H116V80H86V61H45" fill="#a3c0c9"/><path d="M63 24H91" stroke="#7b9ca7" stroke-width="6"/>${saving ? '<path d="M60 122L76 138L108 103" fill="none" stroke="#7ba776" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M102 88V152M111 88V152" stroke="#7ab9d1" stroke-width="5"/>'}`;
const book = '<path d="M21 44Q51 29 80 45Q109 29 139 44V137Q108 120 80 138Q52 120 21 137Z" fill="#fdf6df" stroke="#ad8b98" stroke-width="4"/><path d="M80 45V137M33 62Q52 53 67 62M93 62Q111 53 127 62M33 80Q52 71 67 80M93 80Q111 71 127 80" fill="none" stroke="#cfb3b9" stroke-width="3"/>';
const flower = '<path d="M80 146V85M80 121Q44 94 48 127Q61 141 80 135M80 115Q111 89 114 120Q103 132 80 130" fill="#93b78a" stroke="#709b6a" stroke-width="3"/><g fill="#eab2bb"><ellipse cx="80" cy="48" rx="17" ry="26"/><ellipse cx="106" cy="69" rx="26" ry="17"/><ellipse cx="96" cy="93" rx="17" ry="25" transform="rotate(-32 96 93)"/><ellipse cx="60" cy="92" rx="17" ry="25" transform="rotate(32 60 92)"/><ellipse cx="53" cy="67" rx="26" ry="17"/></g><circle cx="80" cy="73" r="17" fill="#f6d47b"/>';
const butterfly = '<path d="M78 87Q28 12 19 65Q14 111 66 99Q19 109 39 143Q62 159 79 103M82 87Q132 12 141 65Q146 111 94 99Q141 109 121 143Q98 159 81 103" fill="#cfb0d5" stroke="#a081ae" stroke-width="3"/><path d="M80 72V125M80 76Q66 46 57 55M80 76Q94 46 103 55" fill="none" stroke="#75627c" stroke-width="5" stroke-linecap="round"/>';
const leaf = '<path d="M42 141Q9 52 131 30Q142 134 42 141Z" fill="#9fc78e" stroke="#739b6c" stroke-width="3"/><path d="M35 153L115 48M54 128L46 88M71 105L103 107M84 86L81 58" stroke="#709366" stroke-width="3" fill="none"/>';
const sun = '<circle cx="80" cy="85" r="32" fill="#f3d482"/><path d="M80 32V18M80 152V138M27 85H13M147 85H133M42 47L32 37M118 123L128 133M118 47L128 37M42 123L32 133" stroke="#e7be71" stroke-width="6" stroke-linecap="round"/>';
const snow = '<path d="M80 25V145M28 55L132 115M28 115L132 55M66 36L80 50L94 36M66 134L80 120L94 134M35 70L53 69L53 51M107 119L107 101L125 100" stroke="#a8c9da" stroke-width="6" stroke-linecap="round" fill="none"/>';

const panels = {
  height: { title: '比较高和矮', items: [['高', tree(94)], ['矮', tree(40)]], caption: '两棵树从同一条地面线开始，树梢更高的一棵叫“高”。' },
  length: { title: '比较长和短', items: [['长', rope(true)], ['短', rope(false)]], caption: '比较绳子的长度，要让起点对齐，再看哪一根更长。' },
  full: { title: '比较满和空', items: [['满', cup(true)], ['空', cup(false)]], caption: '看杯子里面：装满水和没有水，是不同的状态。' },
  tidy: { title: '物品怎样摆放？', items: [['整齐', books(true)], ['凌乱', books(false)]], caption: '看看书的方向和位置，试着用一组反义词说一说。' },
  width: { title: '路面宽度不一样', items: [['宽阔', road(true)], ['狭窄', road(false)]], caption: '比较的是路面横向的宽度，不是道路的长短。' },
  bright: { title: '同一间屋子的亮暗', items: [['明亮', room(true)], ['昏暗', room(false)]], caption: '打开灯和没有开灯时，屋子里的光线不同。' },
  happy: { title: '看表情，说心情', items: [['高兴、开心', face(true)], ['难过、伤心', face(false)]], caption: '同一边的两个词意思接近；两边描写的是不同的心情。' },
  water: { title: '用水习惯不一样', items: [['节约', tap(true)], ['浪费', tap(false)]], caption: '用完水后及时关好水龙头，避免让水白白流走。' },
  seasons: { title: '看一看四季的线索', items: [['春：花开', flower], ['夏：日暖', sun], ['秋：叶变色', leaf.replace('#9fc78e', '#dfb17a')], ['冬：冰雪', snow]], caption: '图中是常见的季节线索。你家乡的四季可能不完全一样。' },
  plants: { title: '观察植物的不同部分', items: [['花朵', flower], ['叶片', leaf]], caption: '看形状、颜色和组成部分，再读一读词卡中的具体植物。' },
  butterfly: { title: '观察动物的外形', items: [['蝴蝶的两对翅膀', butterfly]], caption: '看看翅膀和触角，读词卡时也留意动物的外形特点。' },
  measure: { title: '量词跟着事物走', items: [['一本书', book], ['一朵花', flower]], caption: '书常用“本”来数，花常用“朵”来数。换一种事物，也要留意量词。' },
};

function panelFigure(name, showPinyin) {
  const panel = panels[name];
  return `<figure class="ct-visual"><figcaption><strong>${panel.title}</strong></figcaption><div class="ct-visual-panels">${panel.items.map(([label, drawing]) => `<div><svg viewBox="0 0 160 170" role="img" aria-label="${escapeText(label)}"><rect x="2" y="2" width="156" height="166" rx="18" fill="#fffaf0"/>${drawing}</svg><p>${readingText(label, showPinyin)}</p></div>`).join('')}</div><p>${readingText(panel.caption, showPinyin)}</p></figure>`;
}

export function dictionaryDiagram(method, showPinyin = true) {
  const steps = method === 'sound' ? [['读音', 'qíng'], ['音序', 'Q'], ['音节', 'qing'], ['正文核对', '晴']] : [['部首画数', '4 画'], ['部首', '日'], ['剩余笔画', '8 画'], ['正文核对', '晴']];
  return `<figure class="ct-visual ct-dictionary-diagram"><figcaption><strong>${method === 'sound' ? '会读的字，跟着音序走' : '不认识读音，先找部首'}</strong></figcaption><div class="ct-dictionary-demo"><svg viewBox="0 0 160 170" role="img" aria-label="翻开的字典">${book}</svg><ol>${steps.map(([label, value]) => `<li><span>${readingText(label, showPinyin)}</span><b>${value}</b></li>`).join('')}</ol></div><p>${method === 'sound' ? '晴 qíng：找到 Q 下的 qing，再在正文核对字形与声调。' : '晴共 12 画：部首日 4 画，剩余青 8 画；找到后再看读音和字义。'}</p><p class="ct-visual-caption">示意路线不代表字典页码。实际翻页以所用字典为准。</p></figure>`;
}

export function lessonVisual(topic, lesson, showPinyin = true) {
  if (topic.id === 'dictionary') return dictionaryDiagram(lesson.category === 'radical' ? 'radical' : 'sound', showPinyin);
  if (topic.id === 'word-relations') {
    const mappings = { 'ant-明亮': 'bright', 'ant-宽阔': 'width', 'ant-整齐': 'tidy', 'ant-节约': 'water', 'ant-高': 'height', 'ant-长': 'length', 'ant-满': 'full', 'syn-高兴': 'happy', 'syn-欢乐': 'happy', wide: 'width' };
    const key = lesson.id.split(':lesson:')[1];
    return mappings[key] ? panelFigure(mappings[key], showPinyin) : '';
  }
  if (topic.id === 'word-categories') {
    if (lesson.category === 'seasons') return panelFigure('seasons', showPinyin);
    if (lesson.category === 'plants') return panelFigure('plants', showPinyin);
    if (lesson.title === '蝴蝶') return panelFigure('butterfly', showPinyin);
    if (lesson.category === 'feelings' && ['高兴', '难过', '兴奋'].includes(lesson.title)) return panelFigure('happy', showPinyin);
  }
  if (topic.id === 'collocations' && lesson.category === 'measure') return panelFigure('measure', showPinyin);
  if (topic.id === 'word-patterns' && ['绿油油', '红彤彤', '金灿灿', '白雪皑皑', '春暖花开', '层林尽染'].includes(lesson.title)) return panelFigure('seasons', showPinyin);
  return '';
}
