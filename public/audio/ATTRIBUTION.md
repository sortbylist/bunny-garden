# 音频来源与使用说明

拼音录音主要来自 [audio-cmn](https://github.com/hugolpz/audio-cmn)，少量来自 Wikimedia Commons 和英国开放大学 OpenLearn。古诗朗读和部分拼音读音由微软慧慧语音合成，英语音频由 gTTS 合成。

## 语文

### má（二声）的替换录音

`ma2-yue-tan.ogg` 是“麻 má”的完整真人录音，由 Yue Tan 朗读，来自 The Shtooka Project，经 [Wikimedia Commons 的 Zh-má.ogg](https://commons.wikimedia.org/wiki/File:Zh-m%C3%A1.ogg) 获取，许可为 [CC BY-SA 3.0 US](https://creativecommons.org/licenses/by-sa/3.0/us/)。本项目未剪辑或修改录音内容；该文件替换原先不适合二声教学的 `ma2.mp3`，声调学习和听辨练习均使用新文件。来源和下载覆盖关系记录在 `overrides.json`，重新下载时继续保留这一替换。

### ong 韵母录音

[ong-openlearn.wav](ong-openlearn.wav) 节选自 [Getting started with Chinese 1 · Pronunciation Guide](https://www.open.edu/openlearn/mod/oucontent/view.php?id=106435&section=1.1)，© The Open University，2020。原音轨为 `l197-pronunciation-02.mp3`，逐字稿的最后一项是单独朗读的 `ong`。本项目截取 16.15–17.03 秒，首尾各做 5 毫秒淡化并转为单声道 WAV。按[课程署名说明](https://www.open.edu/openlearn/mod/oucontent/view.php?id=108532&section=__acknowledgements)，此片段采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可。

### 慧慧合成录音

部分拼音音节、字词和全部古诗示范朗读使用 `Microsoft Huihui Desktop` 普通话语音离线合成。文字、路径和 SHA-256 见[整词清单](huihui/manifest.json)、[拼音替换清单](huihui-pinyin/manifest.json)和[古诗清单](poetry/manifest.json)。慧慧借音样本用于试听对照，见[借音对照清单](huihui-borrowed/manifest.json)。

### 其余拼音录音

- 音节录音：[Chen Wang](https://github.com/hugolpz/audio-cmn#voices)。
- HSK 字词录音：[Yue Tan](https://commons.wikimedia.org/wiki/File:Zh-m%C3%A1.ogg#Summary)，Shtooka Project。
- 项目组织、整理、压缩和文件命名：[Hugo Lopez](https://github.com/hugolpz)。
- 录音软件与技术支持：[Nicolas Vion](https://github.com/hugolpz/audio-cmn#credits)。
- 上游声明许可：[CC BY-SA](https://creativecommons.org/cc-licenses/)。上游 README 未明确统一版本，故本项目不自行指定许可版本。
- 本项目下载上游 64k MP3 文件，未修改录音内容，仅调整本地文件名。若再分发或修改这些录音，须保留署名并遵守上游的相同方式共享要求。
- 来源清单、下载结果见同目录 manifest.json；上游说明见 UPSTREAM-README.md。

音节录音用于标准音节及借音示范。声母通过对应呼读音辅助认读，部分韵母通过同音或相近拼写的完整音节示范。

部分辨音题和「虾」字卡使用 Yue Tan 录制的同音同调单字音频，文件位于 `audio-cmn/`，原始地址及单字见[替换清单](overrides.json)。

拼音录音按教学场景逐项审核，已于 2026 年 11 月 24 日完成。

页面代码和原创题目不因引用音频而自动采用音频许可；此说明仅适用于对应第三方音频。

## 英语

校园英语和自然拼读使用 [WordAudio](https://github.com/mrcraked/WordAudio) 和 [gTTS](https://gtts.readthedocs.io/en/stable/) 生成的英式英语音频，分别存放在 `english/` 和 `phonics/`。自然拼读另有[工具署名](phonics/ATTRIBUTION.md)。
