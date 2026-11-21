export const phonicsModules = [
  ['准备出发', '字母与声音', 3], ['短元音', '从小词开始合音', 6],
  ['辅音连缀', '每个声音都保留', 6], ['辅音组合', '几个字母，一个声音', 4],
  ['长元音', '发现词尾 e', 4], ['元音组合', '字母一起工作', 5],
  ['带 r 的元音', '发现 r 和元音的组合', 5], ['更多元音', '发现声音的变化', 4],
  ['特殊读法', '规律也有例外', 4], ['音节探索', '读出更长的词', 3],
  ['词尾与词素', '小变化，大意思', 2], ['阅读迁移', '把知识用起来', 2],
].map(([name, description, count], index) => ({ id: `module-${index + 1}`, name, description, count, advanced: index >= 9 }));

const lessonRows = [
  ['字母名不是字母音', '先认识大小写；Z 的名称可以读 zed。字母名称不能代替拼读时的声音。', 'm|a|p', 'm æ p', 'map:地图 mat:垫子 sat:坐过 tap:轻拍 pat:轻拍 am:是 at:在 an:一个 as:作为 man:男人 pan:平底锅 nap:小睡 sap:树液 tan:棕褐色 ant:蚂蚁', '哪一个是字母 Z 的名称？', 'zed', 'map|zip|zoo'],
  ['听出词首与词尾', '先听一听，再看看字母。找找单词开头和结尾的声音，一个声音可以由一个或多个字母表示。', 's|i|t', 's ɪ t', 'sit:坐 sip:小口喝 tip:尖端 tin:锡 pin:别针 pit:坑 nip:轻咬 net:网 ten:十 men:男人们 met:遇见过 pet:宠物 pen:钢笔 set:放置 wet:湿的', 'map 的词首字母是？', 'm', 'a|p|s'],
  ['合音与分音', '合音把声音连成词，分音把词拆成声音。不在辅音后人为加“呃”，不要求先背完字母表才开始读词。', 's|u|n', 's ʌ n', 'sun:太阳 sum:总数 run:跑 fun:乐趣 bun:小圆面包 cup:杯子 cut:切 hut:小屋 nut:坚果 mud:泥土 mug:马克杯 rug:小地毯 jug:水壶 pup:小狗 bus:公交车', 'sun 的三个音按什么顺序合起来？', '/s/ /ʌ/ /n/', '/n/ /ʌ/ /s/|/s/ /ɪ/ /t/|/m/ /æ/ /p/'],
  ['短 a · 张开嘴', 'a 在这些短词中通常读 /æ/。先读每个声音，再连起来；不要用中文“啊”代替示范。', 'c|a|t', 'k æ t', 'cat:猫 bat:球棒 hat:帽子 rat:老鼠 bag:袋子 tag:标签 rag:抹布 wag:摇摆 van:厢式车 fan:风扇 can:能够 cap:鸭舌帽 gap:间隙 lap:膝上 pad:软垫 sad:难过的 bad:坏的 dad:爸爸 jam:果酱', 'cat 中 a 的目标音是？', '/æ/', '/eɪ/|/ʌ/|/ɪ/'],
  ['短 e · 听中间', '这里 e 读 /e/，也有词典记作 /ɛ/。同一音标体系保持一致，不把符号差异当成口音差异。', 'b|e|d', 'b e d', 'bed:床 red:红色的 fed:喂过 led:带领过 leg:腿 peg:挂钩 beg:请求 hen:母鸡 den:兽穴 gem:宝石 jet:喷气飞机 vet:兽医 get:得到 yes:是的 yet:还', 'bed 的中间元音是？', '/e/', '/iː/|/æ/|/əʊ/'],
  ['短 i · 轻短的音', 'i 在这些词中读 /ɪ/。与 ee 的 /iː/ 不仅有长短差别，也有音质差别。', 'p|i|g', 'p ɪ ɡ', 'pig:猪 big:大的 dig:挖 fig:无花果 wig:假发 bin:垃圾桶 fin:鱼鳍 win:赢 lid:盖子 kid:小孩 hid:躲藏过 bib:围嘴 rib:肋骨 zip:拉链 six:六 mix:混合 fix:修理', 'pig 中 i 的目标音是？', '/ɪ/', '/aɪ/|/iː/|/e/'],
  ['短 o · 听一听', 'hot 的短 o 在这里用 /ɒ/ 表示。先听一听，再读一读同组的小词。', 'h|o|t', 'h ɒ t', 'hot:热的 pot:锅 dot:小圆点 cot:婴儿床 lot:许多 not:不 dog:狗 log:木头 fog:雾 jog:慢跑 hop:单脚跳 top:顶部 mop:拖把 pop:砰的一声 box:盒子 fox:狐狸 nod:点头 rod:杆', '这里 hot 的元音用哪个符号表示？', '/ɒ/', '/ɑː/|/əʊ/|/ʌ/'],
  ['短 u · 找到规律', 'u 在 sun、cup 中读 /ʌ/，但不是所有含 u 的词都如此，例如 put 要另学。', 'd|u|ck', 'd ʌ k', 'bug:小虫 hug:拥抱 tug:用力拉 dug:挖过 cub:幼兽 rub:揉 tub:浴盆 sub:潜水艇的简称 gum:口香糖 hum:哼唱 but:但是 shut:关上 duck:鸭子 luck:运气 stuck:卡住的', '哪个词里的 u 不能直接套用 cup 的短 u？', 'put', 'bug|hug|mud'],
  ['短元音混合复习', '比较中间元音，先看清字母再读。不用图片猜词；同音或多读音词必须给语境。', 'h|e|n', 'h e n', 'ham:火腿 yam:山药 wax:蜡 tax:税 cab:出租车 lab:实验室的简称 web:网织物 neck:脖子 bell:铃铛 hill:小山 doll:玩偶 sock:袜子 rock:岩石 drum:鼓 plum:李子', '把 cap 的 a 换成 u，会得到？', 'cup', 'cat|map|cap'],
  ['l 连缀', 'bl、cl、fl、gl、pl、sl 中两个辅音都保留，不在中间增加元音。fl 不是一个单独音素。', 'f|l|a|g', 'f l æ ɡ', 'flag:旗帜 flat:平的 flap:拍动 flip:翻转 clap:拍手 clip:夹子 club:俱乐部 clam:蛤蜊 glad:高兴的 glum:闷闷不乐的 plan:计划 plot:小块土地 plug:插头 sled:雪橇 slim:苗条的 slip:滑倒 slab:厚板 blob:一小团', 'flag 的 fl 包含几个辅音音素？', '2', '1|3|4'],
  ['r 连缀', 'br、cr、dr、fr、gr、pr、tr 的 r 位于元音前，要和前面的辅音一起读出。', 'c|r|a|b', 'k r æ b', 'crab:螃蟹 crib:婴儿小床 crop:庄稼 crack:裂缝 grab:抓住 grin:咧嘴笑 grip:紧握 grim:严肃的 drip:滴水 drop:落下 drag:拖动 dress:连衣裙 frog:青蛙 from:从 fresh:新鲜的 trap:陷阱 trip:短途旅行 trim:修剪', '哪一个词以 /ɡ/ 与 /r/ 连缀开头？', 'grin', 'slip|clap|stop'],
  ['s 连缀', '先保留 /s/，紧接下一个辅音。stop 不读成多出一个元音的“sə-top”。', 's|t|o|p', 's t ɒ p', 'stop:停止 step:台阶 stem:茎 stick:棍子 stack:一摞 stamp:邮票 spin:旋转 spot:斑点 spill:洒出 skip:跳过 skin:皮肤 skid:打滑 snap:啪地折断 sniff:嗅 snip:剪一小口 swim:游泳 swam:游过 snug:温暖舒适的', 'stop 的词首是哪一组辅音？', 'st', 'sh|ch|th'],
  ['词尾连缀', '单词末尾也会有相邻辅音。轻短地保留末尾声音，不额外加一拍元音。', 'h|a|n|d', 'h æ n d', 'hand:手 land:陆地 sand:沙子 band:乐队 bend:弯曲 end:结束 send:发送 pond:池塘 tent:帐篷 went:去过 bent:弯曲的 hunt:寻找 jump:跳 lamp:台灯 camp:营地 bump:碰撞 nest:鸟巢 best:最好的 desk:书桌 mask:面具', 'hand 的词尾连缀是？', 'nd', 'ng|sh|ck'],
  ['三个辅音一起读', 'scr、spr、str、spl 中仍然保留各个声音。先从短词慢慢合成，不把字母组硬读成一个音。', 's|t|r|i|ng', 's t r ɪ ŋ', 'scrap:小碎片 scrub:擦洗 script:脚本 sprint:短跑 spring:春天 sprig:小枝 strip:长条 strap:带子 string:细绳 strong:强壮的 splash:溅水 split:分开 splint:夹板 squid:鱿鱼 squint:眯眼', 'string 的词首 str 通常包含几个音素？', '3', '1|2|4'],
  ['连缀中的新朋友', '比较词首与词尾，同时复习短元音。遇到没学过的读法可以求助，不根据词长猜发音。', 'c|r|u|n|ch', 'k r ʌ n tʃ', 'frost:霜 crisp:酥脆的 trust:信任 trunk:树干 print:打印 craft:手工艺 drift:漂流 swift:迅速的 lift:抬起 gift:礼物 left:左边的 milk:牛奶 silk:丝绸 belt:腰带 melt:融化 help:帮助 elf:小精灵 crunch:嘎吱咬', '哪个词含有词尾 /l/ /k/？', 'milk', 'gift|belt|help'],
  ['sh 与 ch', 'sh 在 ship 中表示 /ʃ/；ch 在 chin 中表示 /tʃ/。多个字母可以表示一个音素。ch 还有其他读音，后续按词学。', 'sh|i|p', 'ʃ ɪ p', 'ship:船 shop:商店 shell:贝壳 shed:棚屋 fish:鱼 dish:盘子 wish:愿望 cash:现金 brush:刷子 chin:下巴 chip:薯条 chop:切碎 chat:聊天 rich:富有的 much:许多 such:这样的 lunch:午餐 bench:长椅', 'ship 通常有几个音素？', '3', '2|4|5'],
  ['th、wh 与 ng', 'thin 的 th 是 /θ/，this 的 th 是 /ð/；本课程 wh 常用 /w/。sing 的 ng 为 /ŋ/，末尾不额外加 /ɡ/。', 'th|i|n', 'θ ɪ n', 'thin:瘦的 thick:厚的 bath:洗澡 moth:蛾 path:小路 this:这个 that:那个 them:他们的宾格 then:然后 with:和 when:什么时候 which:哪一个 whip:鞭子 sing:唱歌 ring:戒指 king:国王 wing:翅膀 long:长的', '哪个词的 th 与 this 相同，读 /ð/？', 'that', 'thin|thick|moth'],
  ['ck、tch、dge', '短元音后常见 ck、tch、dge。它们各可对应一个音；这是常见拼写位置规律，不是没有例外的定律。', 'b|a|dge', 'b æ dʒ', 'back:背部 pack:包裹 sack:麻袋 rack:架子 kick:踢 lick:舔 tick:滴答声 lock:锁 clock:时钟 block:积木块 catch:接住 match:比赛 patch:补丁 fetch:取来 ditch:沟 badge:徽章 edge:边缘 bridge:桥 fridge:冰箱 fudge:软糖', 'badge 中 dge 表示哪个音？', '/dʒ/', '/ɡ/|/k/|/ʃ/'],
  ['双写、qu 与 x', 'ff、ll、ss、zz 在这些词中不是读两次。qu 常对应 /k/ /w/；x 在 box 中对应 /k/ /s/ 两个音。', 'b|o|x', 'b ɒ k s', 'puff:一口气 huff:气呼呼地吹气 cliff:悬崖 off:离开 cuff:袖口 fill:装满 pill:药片 well:水井 tell:告诉 fell:落下过 miss:想念 kiss:亲吻 fuss:大惊小怪 buzz:嗡嗡声 fizz:嘶嘶冒泡 quit:退出 quick:快的 quiz:小测验 quilt:被子', 'box 通常有几个音素？', '4', '2|3|5'],
  ['a_e 与 i_e', '比较 cap/cape、kit/kite：词尾 e 在这些词中不单独发音，前面的元音读长音。have、give 不适用这个简单模式。', 'c|a|k|e', 'k eɪ k', 'cake:蛋糕 make:制作 bake:烘焙 lake:湖泊 take:拿 late:迟的 gate:大门 date:日期 name:名字 game:游戏 same:相同的 cape:披风 kite:风筝 bike:自行车 like:喜欢 time:时间 lime:青柠 five:五 nine:九', '在 cape 中，a 的声音是？', '/eɪ/', '/æ/|/ɒ/|/ʌ/'],
  ['o_e 与 u_e', 'o_e 常读 /əʊ/；u_e 可读 /juː/ 或 /uː/，如 cube、rule。不能把所有 u_e 都教成同一种读音。', 'c|u|b|e', 'k j uː b', 'home:家 hope:希望 rope:绳子 nose:鼻子 rose:玫瑰 note:便条 bone:骨头 cone:圆锥形 stone:石头 hole:洞 pole:杆子 cube:立方体 tube:管子 tune:曲调 cute:可爱的 mule:骡子 huge:巨大的 rule:规则 flute:长笛 use:使用', '哪组词说明 u_e 可以有两种常见读音？', 'cube / rule', 'cat / mat|bed / red|pig / big'],
  ['开音节与长元音', 'me、go 末尾的元音常读字母名音，但不是所有以元音字母结尾的词都如此。e_e 例词较少，按词认识。', 'm|e', 'm iː', 'me:我作宾语 he:他 she:她 we:我们 be:是 go:去 no:不 so:所以 hi:嗨 hero:英雄 zero:零 veto:否决 theme:主题 these:这些 complete:完成', '哪个词中 e 在词尾读 /iː/？', 'me', 'met|net|bed'],
  ['长短元音复习', '先比较已学模式，再把规律用于新词。开头连缀和长元音可以出现在同一个词中。', 's|m|i|l|e', 's m aɪ l', 'smile:微笑 slide:滑梯 shine:发光 white:白色的 wide:宽的 ride:骑 drive:驾驶 prize:奖品 size:大小 line:线 fine:好的 mine:我的 flame:火焰 brave:勇敢的 plane:飞机 plate:盘子 skate:滑冰 grade:年级 trade:交易', 'kit 变成 kite 后，i 的读音怎样变化？', '/ɪ/ → /aɪ/', '/ɪ/ → /æ/|/e/ → /iː/|/ɒ/ → /əʊ/'],
  ['ai 与 ay', 'ai 常出现在词中，ay 常在词尾；它们在这些词中读 /eɪ/。不能仅听声音就分辨所有同音拼写。', 'r|ai|n', 'r eɪ n', 'rain:雨 train:火车 main:主要的 pain:疼痛 chain:链子 grain:谷物 brain:大脑 snail:蜗牛 tail:尾巴 mail:邮件 sail:帆 wait:等待 paint:颜料 day:一天 play:玩耍 stay:停留 tray:托盘 clay:黏土 way:路 say:说', '听到 rain/rein 这样的同音词，选拼写还需要什么？', '词义或句子语境', '只比较音量|只看词长|随便选一个'],
  ['ee 与 ea', 'ee 和 ea 在这些词中通常读 /iː/。ea 还有 head、bread 等读法，后面专门比较。', 'sh|ee|p', 'ʃ iː p', 'see:看见 bee:蜜蜂 tree:树 free:自由的 three:三 green:绿色的 queen:女王 feet:脚的复数 seed:种子 need:需要 feed:喂食 sheep:绵羊 sleep:睡觉 deep:深的 sea:海 tea:茶 pea:豌豆 leaf:叶子 team:队伍 clean:干净的 dream:梦 beach:海滩 peach:桃子', 'sheep 中 ee 的目标音是？', '/iː/', '/ɪ/|/e/|/eɪ/'],
  ['oa 与 ow', 'boat、snow 中的元音在这里记作 /əʊ/。cow 中 ow 的读法不同，不能看到 ow 就只读一种音。', 'b|oa|t', 'b əʊ t', 'boat:小船 coat:外套 goat:山羊 road:道路 toad:蟾蜍 load:装载 soap:肥皂 oak:橡树 toast:吐司 float:漂浮 goal:目标 snow:雪 grow:生长 slow:慢的 show:展示 low:低的 blow:吹 flow:流动 bowl:碗 window:窗户', 'boat 的字母组应怎样组合？', 'b / oa / t', 'bo / a / t|b / o / at|b / o / a / t'],
  ['igh、ie 与 y', 'night 的 igh、pie 的 ie、my 的 y 都可读 /aɪ/。这些是当前词语的读法，不代表所有 ie、y 都如此。', 'n|igh|t', 'n aɪ t', 'night:夜晚 light:光 bright:明亮的 right:右边的 tight:紧的 high:高的 sigh:叹气 fight:打斗 flight:飞行 slight:轻微的 pie:馅饼 tie:领带 lie:躺 my:我的 by:在旁边 sky:天空 fly:飞 try:尝试 dry:干的 shy:害羞的', 'night 中表示 /aɪ/ 的字母组是？', 'igh', 'ni|gh|ht'],
  ['ue、ui 与 ew', 'blue、fruit 的元音为 /uː/；new、few 可以读 /njuː/、/fjuː/。结合词首辅音，听一听每个词。', 'b|l|ue', 'b l uː', 'blue:蓝色的 glue:胶水 clue:线索 true:真的 due:到期的 cue:提示 rescue:营救 argue:争论 value:价值 fruit:水果 suit:套装 juice:果汁 new:新的 few:少数的 dew:露水 stew:炖菜 blew:吹过 flew:飞过 grew:长大过 screw:螺丝', 'blue 的 ue 在本词中读？', '/uː/', '/ʌ/|/ʊ/|/eɪ/'],
  ['ar · 听长元音', 'car 的示例读音为 /kɑː/。先听完整单词，再找一找同组词中的 ar。', 'c|ar', 'k ɑː', 'car:汽车 far:远的 jar:罐子 bar:条状物 star:星星 park:公园 dark:黑暗的 bark:树皮 mark:记号 shark:鲨鱼 farm:农场 arm:手臂 harm:伤害 hard:硬的 card:卡片 yard:院子 sharp:锋利的 smart:聪明的 start:开始 part:部分', '这里 car 中 ar 的示例读音是？', '/ɑː/', '/æ/|/e/|/ɪ/'],
  ['or · 听长元音', 'fork、corn 等词中的 or 常读 /ɔː/。word、work 不按这个模式读，后续单独学。', 'f|or|k', 'f ɔː k', 'fork:叉子 corn:玉米 horn:号角 born:出生的 torn:撕破的 worn:穿旧的 port:港口 short:短的 sport:运动 sort:分类 storm:暴风雨 form:形状 north:北方 morning:早晨 horse:马 porch:门廊 torch:手电筒 cord:绳索', 'fork 中 or 的目标音是？', '/ɔː/', '/ɒ/|/əʊ/|/ɜː/'],
  ['er、ir 与 ur', 'her、bird、turn 的重读元音常读 /ɜː/。这几种拼写可能同音，所以纯听音不能总是确定拼写。', 'b|ir|d', 'b ɜː d', 'her:她的 fern:蕨类 term:学期 verb:动词 bird:鸟 girl:女孩 shirt:衬衫 skirt:短裙 first:第一 third:第三 dirt:泥土 stir:搅拌 fur:动物皮毛 turn:转动 burn:燃烧 hurt:受伤 curl:卷曲 surf:冲浪 nurse:护士 purse:小钱包', 'bird 中 ir 按本课程口径读？', '/ɜː/', '/ɪ/|/aɪ/|/ɑː/'],
  ['air、are 与 ear', 'air、care 中的元音可记作 /eə/；near、deer 中可记作 /ɪə/。读一读，比较每组词的声音。', 'h|air', 'h eə', 'air:空气 hair:头发 chair:椅子 pair:一双 fair:公平的 stair:楼梯台阶 care:照顾 share:分享 square:正方形 spare:备用的 bare:裸露的 rare:稀有的 ear:耳朵 near:近的 hear:听见 dear:亲爱的 year:年 clear:清楚的 deer:鹿 cheer:欢呼', '哪组词中的元音采用相同的目标读音？', 'hair / chair', 'hair / near|care / deer|pair / ear'],
  ['更多带 r 的拼写', 'more、door 的示例元音为 /ɔː/；bear 的 ear 为 /eə/；teacher 末尾可弱读为 /ə/。结合具体单词听一听。', 'd|oor', 'd ɔː', 'more:更多的 store:商店 shore:岸边 score:得分 core:核心 door:门 floor:地板 board:木板 roar:吼叫 soar:高飞 bear:熊 pear:梨 wear:穿 earth:地球 learn:学习 early:早的 teacher:教师 sister:姐妹 brother:兄弟 mother:妈妈 father:爸爸', '这里 teacher 的词尾示例音是？', '/ə/', '/ɝ/|/æ/|/ɪ/'],
  ['oo 的两个声音', 'book、look 中为 /ʊ/；moon、food 中为 /uː/。不是所有 oo 都一样，blood 等特殊词另学。', 'b|oo|k', 'b ʊ k', 'book:书 look:看 cook:烹饪 hook:钩子 took:拿过 good:好的 wood:木材 wool:羊毛 foot:脚 stood:站过 moon:月亮 food:食物 pool:水池 school:学校 spoon:勺子 boot:靴子 root:根 roof:屋顶 room:房间 broom:扫帚', '哪一个词的 oo 与 book 相同？', 'look', 'moon|food|spoon'],
  ['oi 与 oy', 'coin、toy 中的声音为 /ɔɪ/。oi 常在词中，oy 常在词尾；遇到具体拼写仍需结合词义与已有知识。', 't|oy', 't ɔɪ', 'coin:硬币 join:加入 point:点 joint:关节 noise:噪音 voice:声音 choice:选择 oil:油 boil:煮沸 soil:土壤 foil:箔纸 spoil:糟蹋 moist:潮湿的 toy:玩具 boy:男孩 joy:欢乐 enjoy:享受 annoy:使烦恼 royal:王室的 oyster:牡蛎', 'toy 的 oy 读？', '/ɔɪ/', '/əʊ/|/aɪ/|/aʊ/'],
  ['ou 与 ow', 'out、cow 中常为 /aʊ/；snow 为 /əʊ/。ou 在 soup、young 等词中还会有其他读法，按词认识。', 'c|ow', 'k aʊ', 'out:外面 about:关于 shout:喊叫 loud:响亮的 cloud:云 round:圆的 ground:地面 sound:声音 found:找到过 pound:英镑 count:数数 mount:登上 mouse:老鼠 house:房屋 mouth:嘴巴 south:南方 cow:奶牛 now:现在 how:怎样 brown:棕色的 crown:王冠 town:城镇 down:向下', '哪一个词的 ow 与 cow 相同？', 'town', 'snow|grow|show'],
  ['au、aw 与 al', 'sauce、saw、ball 中常读 /ɔː/。听一听这些词，再和 hot 的短元音比较。', 's|aw', 's ɔː', 'saw:锯子 paw:爪子 jaw:下巴 raw:生的 draw:画画 straw:吸管 yawn:打哈欠 lawn:草坪 claw:爪子 dawn:黎明 sauce:酱汁 pause:暂停 cause:原因 autumn:秋天 August:八月 ball:球 wall:墙 tall:高的 small:小的 call:呼叫 hall:大厅 walk:步行 talk:说话 chalk:粉笔', '这里 saw 与 hot 的示例元音分别是？', '分别为 /ɔː/ 与 /ɒ/', '都必须读 /ɑː/|都读 /ʌ/|都读 /eɪ/'],
  ['c、g 与 y 的多种工作', 'c 在 e/i/y 前常读 /s/；g 在这些环境中有时读 /dʒ/，但 get、give 是重要例外。y 可作辅音，也可表示元音。', 'c|i|t|y', 's ɪ t i', 'city:城市 face:脸 rice:米饭 ice:冰 nice:好的 race:赛跑 space:空间 place:地方 price:价格 giant:巨人 gentle:温和的 giraffe:长颈鹿 magic:魔法 stage:舞台 age:年龄 yellow:黄色的 happy:快乐的 funny:有趣的 sunny:晴朗的 puppy:小狗', '哪一句关于 g 的说法更准确？', 'g 在 e 前不一定读 /dʒ/，如 get', 'g 在 e 前永远读 /dʒ/|g 永远不发音|g 永远读字母名'],
  ['ea 与其他多读音组合', 'head、bread 中 ea 读 /e/，sea 中读 /iː/。read 现在式与过去式发音不同，必须有时态语境；本课避免孤立听辨。', 'h|ea|d', 'h e d', 'head:头 bread:面包 dead:死去的 spread:展开 thread:线 sweat:汗 ready:准备好的 heavy:重的 breakfast:早餐 weather:天气 feather:羽毛 instead:代替 sweater:毛衣 treasure:宝物 measure:测量 great:很棒的 break:打破 steak:牛排 eight:八 weight:重量', '哪一个词的 ea 与 head 相同？', 'bread', 'sea|tea|team'],
  ['不发音的字母', 'k 在 knee、know 中不发音；w 在 write 中不发音；l 在 lamb 中仍读，词尾 b 不读。不要靠删除规则任意造读音。', 'kn|ee', 'n iː', 'knee:膝盖 know:知道 knock:敲门 knot:绳结 knit:编织 knife:小刀 write:写 wrong:错误的 wrap:包裹 wrist:手腕 wreck:残骸 lamb:小羊 thumb:拇指 comb:梳子 climb:攀爬 crumb:面包屑 calm:平静的 palm:手掌 half:一半 listen:听', 'lamb 中通常不发音的是？', 'b', 'l|a|m'],
  ['高频词的特殊部分', '高频不等于不规则。the、said 等可分析规则部分和特殊部分；have、give 不按普通词尾 e 规律读。词义和语境同样重要。', 's|ai|d', 's e d', 'the:这个那个冠词 a:一个冠词 I:我 you:你 are:是 was:曾经是 were:曾经是 said:说过 have:有 give:给 live:居住 one:一 once:一次 two:二 to:到 do:做 does:做的第三人称 some:一些 come:来 love:爱 of:属于的 who:谁 what:什么', 'said 中 ai 的读音是？', '/e/', '/eɪ/|/aɪ/|/iː/'],
  ['闭音节与复合词', '把熟悉的小词组成长词，如 sun + set。rabbit 的双写 b 不意味着要读两个 /b/；音节划分是帮助解码的工具。', 's|u|n|s|e|t', 's ʌ n s e t', 'sunset:日落 sunbed:日光浴躺椅 picnic:野餐 rabbit:兔子 kitten:小猫 muffin:松饼 mitten:连指手套 button:纽扣 basket:篮子 pocket:口袋 rocket:火箭 tennis:网球 attic:阁楼 traffic:交通 napkin:餐巾 hotdog:热狗的合写形式 handbag:手提包 lunchbox:午餐盒 bathtub:浴缸 dustbin:垃圾箱', 'sunset 可以先借助哪两个熟悉部分？', 'sun + set', 'su + nset|s + unset|suns + et'],
  ['开音节与辅音-le', 'robot、paper 中可看到开音节；table、apple 中的词尾有弱读或成音节辅音。不要用一条切分公式套所有长词。', 'r|o|b|o|t', 'r əʊ b ɒ t', 'robot:机器人 paper:纸 tiger:老虎 spider:蜘蛛 pilot:飞行员 music:音乐 human:人类 unit:单元 pupil:学生 table:桌子 cable:电缆 stable:马厩 maple:枫树 apple:苹果 little:小的 bottle:瓶子 bubble:气泡 middle:中间 purple:紫色的 uncle:叔叔', '哪一个词有常见的辅音-le 词尾？', 'table', 'robot|paper|pilot'],
  ['重音与弱元音', '多音节词并不是每一部分都同样响亮。about 的第一个元音常弱读为 /ə/；词典与自然语流中有合理变体。', 'a|b|ou|t', 'ə b aʊ t', 'away:离开 again:再次 ago:以前 along:沿着 around:周围 asleep:睡着的 alive:活着的 above:上方 alone:独自的 banana:香蕉 sofa:沙发 zebra:斑马 panda:熊猫 salad:沙拉 lemon:柠檬 melon:甜瓜 seven:七 eleven:十一 today:今天 tomorrow:明天 together:一起', 'about 的第一个非重读元音常为？', '/ə/', '/æ/|/eɪ/|/aɪ/'],
  ['-s、-es 与 -ed', 'cats、dogs、buses 的词尾依次为 /s z ɪz/；jumped、played、wanted 的 -ed 为 /t d ɪd/。看前面的音，不只看字母。', 'c|a|t|s', 'k æ t s', 'cats:猫的复数 dogs:狗的复数 buses:公交车的复数 cups:杯子的复数 pens:钢笔的复数 boxes:盒子的复数 wishes:愿望的复数 dishes:盘子的复数 jumped:跳过 played:玩过 wanted:想要过 looked:看过 helped:帮助过 washed:洗过 called:叫过 cleaned:清洁过 needed:需要过 waited:等待过 landed:着陆过 ended:结束过', 'wanted 的 -ed 读？', '/ɪd/', '/t/|/d/|/ed/'],
  ['-ing 与小词素', 'run → running 常双写末尾辅音，make → making 常去词尾 e；baby → babies 则改变 y。规律有适用条件，先看示例。', 'r|u|nn|i|ng', 'r ʌ n ɪ ŋ', 'running:正在跑 swimming:正在游泳 sitting:正在坐 hopping:正在单脚跳 making:正在制作 riding:正在骑 smiling:正在微笑 baking:正在烘焙 playing:正在玩 reading:正在阅读 singing:正在唱歌 looking:正在看 unhappy:不开心的 unsafe:不安全的 unfair:不公平的 redo:重做 refill:重新装满 replay:重放 helpful:乐于助人的 hopeful:抱有希望的 careless:粗心的 fearless:无畏的', 'make 加上 -ing 的常见正确拼写是？', 'making', 'makeing|makking|makinge'],
  ['熟悉场景中的新词', '把已学规律用于学校、家庭和日常场景。遇到长词可先分段，再听完整示范。', 'p|e|n|c|i|l', 'p e n s ə l', 'pencil:铅笔 ruler:尺子 rubber:橡皮 crayon:蜡笔 lesson:课程 classroom:教室 playground:操场 homework:家庭作业 reading:正在阅读 writing:写作 drawing:绘画 painting:绘画作品 singing:正在唱歌 dancing:跳舞 football:足球 basketball:篮球 bedroom:卧室 bathroom:浴室 kitchen:厨房 garden:花园', '哪一个词表示“铅笔”？', 'pencil', 'ruler|rubber|crayon'],
  ['阅读与自主复习', '先读再理解，听懂不等于独立读出。错题与自评分别记录，发现不熟悉的规律就回到对应课程。', 'f|a|m|i|l|y', 'f æ m ə l i', 'family:家庭 friend:朋友 children:孩子们 parent:家长 grandpa:爷爷 grandma:奶奶 cousin:堂表兄弟姐妹 people:人们 animal:动物 elephant:大象 monkey:猴子 donkey:驴 chicken:鸡 penguin:企鹅 dolphin:海豚 orange:橙子 strawberry:草莓 favourite:最喜欢的 colour:颜色 holiday:假期 birthday:生日 story:故事', '哪一种说法更准确？', '自然拼读帮助解码，但也要学词义和理解', '会拼读就懂所有词义|每个词都完全符合一种规则|点开卡片就表示掌握'],
];

let moduleIndex = 0;
let moduleLesson = 0;
export const phonicsLessons = lessonRows.map(([title, tip, parts, sounds, rows, prompt, answer, distractors], index) => {
  if (moduleLesson === phonicsModules[moduleIndex].count) { moduleIndex++; moduleLesson = 0; }
  moduleLesson++;
  return {
    id: `lesson-${index + 1}`, number: index + 1, moduleId: phonicsModules[moduleIndex].id,
    title, tip, parts: parts.split('|'), sounds: sounds.split(' '),
    prerequisite: index ? `建议先学习第 ${index} 课，或确认已具备相关基础。` : '不要求已有拼读基础。可先认识字母，再听老师示范。',
    words: rows.split(' ').map(row => { const [text, meaning] = row.split(':'); return { id: `word-${text.toLowerCase()}`, text, meaning }; }),
    rule: { id: `rule-${index + 1}`, kind: 'rule', prompt, answer, options: [answer, ...distractors.split('|')], explanation: tip, lessonId: `lesson-${index + 1}` },
    locale: 'en-GB', contentStatus: 'editorial-draft',
  };
});

export const phonicsWords = [...new Map(phonicsLessons.flatMap(lesson => lesson.words.map(word => [word.id, { ...word, lessonId: lesson.id }]))).values()];
export const phonicsWordById = new Map(phonicsWords.map(word => [word.id, word]));
export const phonicsLessonById = new Map(phonicsLessons.map(lesson => [lesson.id, lesson]));

export const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, index) => ({
  id: `letter-${letter}`, letter, upper: letter.toUpperCase(),
  name: ['eɪ', 'biː', 'siː', 'diː', 'iː', 'ef', 'dʒiː', 'eɪtʃ', 'aɪ', 'dʒeɪ', 'keɪ', 'el', 'em', 'en', 'əʊ', 'piː', 'kjuː', 'ɑː', 'es', 'tiː', 'juː', 'viː', 'ˈdʌbəljuː', 'eks', 'waɪ', 'zed'][index],
}));

const storyRows = [
  ['A Red Tent', 'Sam has a red tent. A cat is in the tent. Sam pats the cat. The cat has a nap.', '谁在帐篷里？', 'A cat', 'A dog|A pig', '短元音；词尾连缀；a/the/is/has；名字 Sam'],
  ['A Big Splash', 'A frog is on a log. It jumps into a pond. Splash! A duck swims past.', '谁跳进池塘？', 'A frog', 'A duck|A cat', '短元音；连缀；jumps/swims 词尾；into/past'],
  ['A Small Gift', 'Ben has a gift. It is a red belt. Mum puts it in a bag. Ben is glad.', '礼物是什么？', 'A belt', 'A cup|A desk', '短元音；词尾连缀；is/a/it/puts；名字 Ben'],
  ['A Fish Dish', 'A fish is in a dish. A cat can sniff the fish. Sam can shut the cat in.', '鱼在哪里？', 'In a dish', 'In a bag|On a bed', 'sh/th；sn 连缀；a/is/the；名字 Sam'],
  ['Sing a Song', 'The king has a ring. A bird is on his hand. The bird can sing. The king smiles.', '谁会唱歌？', 'The bird', 'The ring|The hand', 'ng/th；bird；his/the/has；smiles'],
  ['A Badge', 'Jess has a badge. The badge is on a bag. Jess takes the bag to the park. It is a big bag.', '徽章在哪里？', 'On a bag', 'On a hat|In a box', 'dge；词尾 e；park；takes/to/the；名字 Jess'],
  ['A Quick Quiz', 'A quiz is on the desk. Bill picks up a pen. He gets six right. Bill is happy.', 'Bill 拿起了什么？', 'A pen', 'A cup|A toy', 'qu/x；词尾变化；he/up/right/happy；名字 Bill'],
  ['A Red Kite', 'Kate has a kite. The kite is red. Kate can run. The kite can rise.', '风筝是什么颜色？', 'Red', 'Blue|Green', 'a_e/i_e；rise 中 s；a/the/has/is；名字 Kate'],
  ['A Tune at Home', 'Luke is at home. He has a flute. He plays a tune. Mum likes the tune.', 'Luke 用什么演奏？', 'A flute', 'A bell|A drum', 'u_e/o_e；he/plays/likes/the；名字 Luke'],
  ['Go with Me', 'We can go to the park. We see a big tree. A bird is in the tree. We sit and look.', '小鸟在哪里？', 'In the tree', 'In a box|On a boat', '开音节；ee；park/bird/look；to/the/and'],
  ['A Brave Ride', 'Grace has a bike. She can ride to the gate. She stops at the gate. Then she smiles.', 'Grace 骑什么？', 'A bike', 'A boat|A bus', '词尾 e；连缀；stops/then/she/the；名字 Grace'],
  ['A Rainy Day', 'Rain taps on the glass. May has a toy train. She plays with the train. It is a good day.', 'May 玩什么？', 'A toy train', 'A kite|A ball', 'ai/ay；glass/toy/good；taps/plays；名字 May'],
  ['A Green Seed', 'Lee has a seed. He puts the seed in a pot. He gives it water. A green leaf grows.', '最后长出了什么？', 'A green leaf', 'A red flower|A blue stone', 'ee/ea；puts/gives/water/grows；名字 Lee'],
  ['A Boat in the Snow', 'Snow is on the road. A toy boat is in a box. Jo puts on a coat. Jo takes the box home.', 'Jo 穿上什么？', 'A coat', 'A hat|A skirt', 'oa/ow；toy；puts/takes；名字 Jo'],
  ['A Bright Light', 'It is night. A bright light is on. A moth flies by the light. I can see it.', '什么飞过灯旁？', 'A moth', 'A frog|A fish', 'igh/y；moth；flies/by/I/see'],
  ['Blue Glue', 'Sue has blue glue. She makes a new card. A star is on the card. The card is for Mum.', '卡片送给谁？', 'Mum', 'Dad|Sue', 'ue/ew；ar；makes/for/the；名字 Sue'],
  ['A Star Card', 'Mark has a card. A star is on the card. Mark takes it to the farm. It is for his dad.', 'Mark 去哪里？', 'The farm', 'The shop|The beach', 'ar；takes/for/his；名字 Mark'],
  ['A Short Storm', 'A storm comes in the morning. We stay in the house. Then the storm stops. We can go out.', '暴风雨时大家在哪里？', 'In the house', 'In the park|On the beach', 'or；comes/stay/house/then/stops/out'],
  ['A Hurt Bird', 'A girl sees a bird. Its wing is hurt. She asks an adult for help. They call a vet.', '他们联系了谁？', 'A vet', 'A pilot|A cook', 'ir/ur；sees/asks/adult/they/call/vet；求助成人'],
  ['A Pair of Chairs', 'Two chairs are near a table. A bear sits on one chair. It is a toy bear. A doll sits on the other.', '熊是什么？', 'A toy', 'A real bear|A picture', 'air/ear；two/are/table/one/other；词尾变化'],
  ['At the Door', 'My sister is at the door. She has a pear. My brother has an apple. We share the fruit.', '哥哥或弟弟有什么？', 'An apple', 'A pear|A cake', '带 r 元音；sister/brother/apple/share/fruit'],
  ['A Book by the Pool', 'Mum has a book. She sits by the pool. I have a spoon and a bowl. We eat some food.', 'Mum 在哪里看书？', 'By the pool', 'In a tent|On a bus', 'oo；sits/I/have/eat/some'],
  ['A Toy Coin', 'Roy has a toy coin. He puts it in a box. The box makes a noise. Roy opens the box.', '硬币被放在哪里？', 'In a box', 'In a cup|On a desk', 'oi/oy；puts/makes/opens；名字 Roy'],
  ['A Brown Cow', 'A brown cow is near the house. A mouse runs past. The cow looks down. The mouse hides in the grass.', '牛往哪个方向看？', 'Down', 'Up|Behind', 'ou/ow；near/house；runs/looks/hides/grass'],
  ['Draw a Tall Wall', 'Paul draws a tall wall. A small cat is on the wall. The cat has a long tail. Paul draws a ball too.', '墙上有什么？', 'A small cat', 'A duck|A dog', 'au/aw/al；draws/tail/too；名字 Paul'],
  ['A Gentle Giant', 'A giant is in the city. He has a gentle voice. A little girl waves. The giant waves back.', '谁先挥手？', 'A little girl', 'A teacher|A boy', 'soft c/g；city/voice/little/waves'],
  ['Breakfast is Ready', 'Bread is on a plate. A red apple is next to it. Mum has a cup of tea. Breakfast is ready.', '面包旁边是什么？', 'An apple', 'A pear|A toy', 'ea 多读音；plate/next/to/of/breakfast/ready'],
  ['A Knot', 'Dad has a long rope. He ties a knot. I wrap a gift. We write a card for Grandma.', '他们给谁写卡片？', 'Grandma', 'A teacher|A friend', 'kn/wr；ties/I/we/for/Grandma'],
  ['Come and Play', 'I have one ball. You have two bats. Come and play with me. We can have some fun.', '有几个球？', 'One', 'Two|Three', '高频特殊词；one/two/have/come/some'],
  ['A Picnic at Sunset', 'We pack a basket. A rabbit hops past. We sit on a blanket. The picnic ends at sunset.', '野餐什么时候结束？', 'At sunset', 'At breakfast|At midnight', '双音节；basket/rabbit/blanket；hops/ends'],
  ['A Little Robot', 'A little robot is on the table. It has a purple button. I press the button. The robot plays music.', '按下按钮后机器人做什么？', 'Plays music', 'Runs away|Makes a cake', '开音节/辅音-le；purple/button/press/plays/music'],
  ['A Banana for Later', 'Anna has a banana. She puts it in her bag. She eats it after a lesson. Then she plays with a friend.', 'Anna 什么时候吃香蕉？', 'After a lesson', 'Before breakfast|At night', '弱元音；banana/after/lesson/friend；名字 Anna'],
  ['We Helped', 'We washed the cups. Dad cleaned the table. Mum played a tune. We wanted to sing along.', '谁清洁了桌子？', 'Dad', 'Mum|A teacher', '-ed 三种读音；washed/cleaned/played/wanted/along'],
  ['Making a Card', 'I am making a card. My friend is drawing a flower. We are writing a message. It is a helpful thing to do.', '朋友正在画什么？', 'A flower', 'A boat|A bird', '-ing；friend/flower/message/helpful/thing'],
  ['In the Classroom', 'My pencil is on the desk. My ruler is in my bag. I open my book. We read a story together.', '尺子在哪里？', 'In the bag', 'On the desk|In the garden', '学校主题；ruler/pencil/open/read 现在式/together'],
  ['A Favourite Story', 'Our family has a favourite story. It is about a penguin. We read it on holiday. I tell my cousin about the penguin.', '故事讲什么动物？', 'A penguin', 'A dolphin|An elephant', '综合共读；our/family/favourite/penguin/holiday/cousin'],
];

export const phonicsStories = storyRows.map(([title, text, prompt, answer, alternatives, prerequisites], index) => ({
  id: `story-${index + 1}`, lessonId: `lesson-${index + 13}`, title, text, prerequisites,
  type: 'guided-reading', locale: 'en-GB',
  question: { id: `reading-${index + 1}`, kind: 'reading', prompt, answer, options: [answer, ...alternatives.split('|')], explanation: text, lessonId: `lesson-${index + 13}` },
}));

export const phonicsSentences = [...new Set(phonicsStories.flatMap(story => story.text.match(/[^.!?]+[.!?]/g).map(sentence => sentence.trim())))];

export const phonicsModes = [
  ['learn', '课程学习', 'book'], ['random', '随机词卡', 'shuffle'], ['meaning', '词义选择', 'search'], ['spelling', '字母拼词', 'puzzle'],
  ['rules', '规律小练习', 'layers'], ['mixed', '综合练习', 'pen'], ['listen', '听音选词', 'headphones'], ['reading', '故事共读', 'quote'], ['review', '错题本', 'notebook'], ['favorites', '我的收藏', 'heart'], ['records', '学习记录', 'clock'],
].map(([id, name, icon]) => ({ id, name, icon }));
