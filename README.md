# 小兔学习乐园

面向小学生的中文网页应用。使用原生 JavaScript、CSS、SVG 和 Vite，免登录，学习记录保存在当前浏览器。

| 学科 | 已实现内容 |
| --- | --- |
| 语文 | 拼音与字词基础、句子运用、阅读与积累。含汉字笔顺、短文理解、古诗示范朗读和遮文背诵。 |
| 数学 | 第一阶段「数与运算」，含数的认识、加减法、乘法、除法和混合运算。 |
| 英语 | 第一阶段「词汇与日常听说」，含自然拼读，以及校园主题词汇、听力理解和情景口语。 |

右上角「我的」集中提供错题本、收藏、学习记录和奖励收藏册。「学习设置 → 数据备份」可导出完整 JSON，也可确认后从备份替换本机记录。操作细节见 [本机数据与备份规范](docs/本机数据与备份规范.md)。

三科规划、教学音频、公共 UI 和奖励规则见 [文档索引](docs/README.md)。开发者检查项见 [AGENTS.md](AGENTS.md)。

## 本地运行

需要 Node.js 20.19+ 或 22.12+，开发环境使用 Node.js 24。

```sh
npm install
npm run dev
```

浏览器打开终端显示的地址，默认是 `http://127.0.0.1:5173`。

## 重新生成英语音频

校园英语和自然拼读的音频随站点发布。需要重新生成时，先安装 Python 和 `gTTS`，并确保能访问语音合成服务。在本项目根目录运行以下命令，将 [WordAudio](https://github.com/mrcraked/WordAudio) 克隆到与本项目同级的目录。

```sh
git clone https://github.com/mrcraked/WordAudio.git ../WordAudio
```

从本项目根目录运行 `npm run english:audio:generate` 生成校园英语音频，或运行 `npm run phonics:audio:generate` 生成自然拼读音频。两个命令默认从本项目根目录定位 `../WordAudio`。如果 WordAudio 放在其他位置，校园英语命令支持 `-- <Audio.py 路径>`，自然拼读命令支持 `-- --wordaudio=<仓库目录>`。

## 构建与部署

```sh
npm run build
npm run preview
```

产物输出到 `dist/`。要部署到 GitHub Pages，在仓库的 **Settings → Pages** 将发布源设为 **GitHub Actions**。`.github/workflows/deploy-pages.yml` 在更新 `main` 时构建并发布，子路径由 Pages 配置提供。可通过 **Actions → Deploy to GitHub Pages** 查看执行结果或手动运行。

本地预览 `/rabbit-garden/` 子路径时使用 `npm run build -- --base /rabbit-garden/` 和 `npm run preview -- --base /rabbit-garden/`。

## 验证

```sh
npm test
npm run test:browser
```

浏览器测试通过 `playwright.config.js` 启动已安装的 Chrome。多工作区可用 `PLAYWRIGHT_PORT` 指定独立端口，避免复用其他工作区的服务。若 Node 环境代理影响本机连接，可在测试终端设置 `NODE_USE_ENV_PROXY=0`。

开发服务器启动后可运行 `npm run test:audio`，检查浏览器解码与非静音。测试截图与音频报告保存在 `artifacts/`。

## 设计参考

页面风格参考 [Bunny Math](https://bunnyland.app/)。
