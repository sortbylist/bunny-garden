# 古诗示范朗读

- 20 首古诗，普通话合成语音，非真人教师录音。
- 生成方式：Windows `System.Speech.Synthesis.SpeechSynthesizer`。
- 语音：本机安装的 `Microsoft Huihui Desktop`，`zh-CN`，生成语速 `-1`。
- 内容来自 `src/poetry-data.js`，朗读标题、朝代、作者和完整原诗。
- `manifest.json` 保存生成文字、语音来源、文件路径和 SHA256；WAV 随站点发布，运行时不请求在线合成服务。
- 重新生成：在装有上述语音的 Windows 上运行 `npm run poetry:audio:generate`。脚本仅在子进程使用 `RemoteSigned`，不改系统执行策略。
- 古诗为公版作品；本目录记录合成语音来源，不将录音标注为真人录音或另行宣称开放许可。
- 自动解码和文件校验不能代替教学审核；多音字、停连、节奏等需要普通话教师逐首试听。
