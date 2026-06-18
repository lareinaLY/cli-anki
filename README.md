# cli-anki

用背单词的方式学命令行 —— 给 CLI 命令做的间隔重复（spaced repetition）应用。

不同于普通 Anki 的“翻卡片 → 自评”，cli-anki 让你**主动敲出命令**再**自动判分**：
命令是可被机器精确比对的，忽略 flag 顺序、识别短选项簇（`-la` == `-l -a`）、无视引号差异。
学习数据**本地优先**，只存在你自己的浏览器里。

## 功能

- **单卡复习** — FSRS 间隔重复调度的命令卡片。题干按语义高亮（动作 / 对象），讲解是
  结构化 Markdown：缩写全称、参数详解、🧠 记忆钩子，真有故事的还有 🕰 冷知识。
  内置 **Git 基础** 和 **命令行基础 · zsh** 两套卡组，可在 deck 下拉框切换。
- **单词本总览** — 把当前卡组的命令按掌握度（未学 / 学习中 / 巩固中 / 已掌握）动态分类，
  随复习实时更新，每张显示 FSRS 难度与下次复习时间。
- **场景练习** — 把零散命令串成真实工作流（新建仓库 → 首次提交、连接 GitHub、回滚版本），
  跟着剧情一步步走完。
- **生词本** — 粘贴任意命令，AI（你自己的 OpenAI Key）生成同款讲解卡片，可加入复习；
  生词本本身也是一个可独立复习的 deck。
- **问 AI** — 右侧问答面板，结合当前卡片上下文随时追问，用你自己的 OpenAI Key。

## 技术栈

- **React 19 + TypeScript + Vite** — 纯前端 SPA，无后端
- **ts-fsrs** — FSRS 间隔重复算法（Anki 默认算法）
- **IndexedDB**（经 `idb`）— 本地优先，进度与生词本只存在本机浏览器
- **OpenAI**（可选）— 问答与卡片生成，Key 存本地、不进代码、不上传
- **Zod** — 卡片 / 场景内容的运行时校验
- **Vitest + Testing Library + jsdom** — 判分 / 调度 / 内容 / 组件测试

## 开发

```bash
npm install
npm run dev        # 启动开发服务器
npm test           # 跑全部测试
npm run typecheck  # 类型检查
npm run lint       # ESLint
npm run build      # 生产构建（输出到 dist/）
```

## 架构分层

```
src/
├─ content/   内容与模型（Zod schema + YAML）
│   ├─ types.ts       Card / Deck / Step / Scenario schema
│   ├─ loader.ts      解析 + 校验 YAML
│   ├─ prompt.ts      题干角色标注解析（[动作] {对象}）
│   ├─ git.yaml       Git 卡组
│   ├─ shell.yaml     命令行基础 · zsh 卡组
│   └─ scenarios.yaml 场景练习
├─ matcher/   判分层 —— 命令规范化与比对（纯函数）
│   ├─ normalize.ts   分词 / 拆短选项簇 / 规范化
│   └─ match.ts       judge() 比对 + token diff
├─ srs/       调度层 —— ts-fsrs 的薄封装
├─ store/     存储层 —— IndexedDB（复习进度 + 生词本）
├─ study/     会话层 —— 复习队列（queue）+ 单词本分类（wordbook）
├─ ai/        AI 层 —— 配置 / 问答客户端 / 卡片生成（OpenAI）
└─ ui/        界面层 —— React 组件与 hooks
```

## 设计取舍

### 判分：只做机械归一，语义等价靠声明

`matcher` 只处理空白、引号、短选项簇、flag 顺序这些**机械层面**的差异。它**不猜语义**——
`git switch main` 与 `git checkout main` 是否等价，由卡片作者在 `accept[]` 里显式声明。
这样判分可预测、零误判（误判比判错的体验更糟）。

### AI 生成：答案永远用你粘的原命令

生成生词本卡片时，AI 只负责产出题干与讲解，**答案固定用你粘贴的原命令**，从不让 AI 改写——
保证每张卡都能判对自己的答案。

### 本地优先，Key 不外泄

复习进度与生词本存 IndexedDB；OpenAI Key 存 `localStorage`，不进代码、不进 git，
只在你的浏览器直接请求 OpenAI。⚠️ 若要公开部署给他人使用，需改为后端代理藏 Key，切勿直接填入。

## 编写卡片

卡组是 YAML 文件（见 `src/content/git.yaml`）：

```yaml
id: git
title: Git 基础
cards:
  - id: git-reset-soft
    prompt: '[撤销]最近一次 {commit}'   # [动作] 高亮谓语，{对象} 高亮宾语
    constraint: 把改动[保留]在{暂存区}    # 可选，约束条件单独成行
    answer: git reset --soft HEAD~1
    accept:                             # 作者声明的等价答案
      - git reset --soft HEAD^
    explanation: |                      # Markdown；结尾约定带 🧠 记忆钩子
      `--soft` 只移动 `HEAD`，暂存区和工作区都保留。

      #### 🧠 记忆钩子
      软硬之分：`--soft` 软着陆（改动还在），`--hard` 硬碰硬（全没了）。
    tags: [reset, undo]
```

场景见 `src/content/scenarios.yaml`：每个场景含 `intro` 和一串 `steps`，每步像一张卡，
外加 `narration` 衔接剧情。

`content.test.ts` / `scenarios.test.ts` 会校验每张卡、每个场景步骤的 `answer`/`accept`
都能被判分器判为正确——加内容时自动跑这条护栏。

## OpenAI 配置

「问 AI」与「生词本生成」共用一套配置。首次使用在「问 AI」面板填入：

- **API Key**（必填，存本地）
- **模型**（默认 `gpt-4o-mini`，可换成更强的模型获得更深入的讲解）
- **API 地址**（默认官方，兼容 OpenAI 接口的网关可改）

## Roadmap

- [x] git / shell 卡组 + 判分 + FSRS 调度 + 本地进度
- [x] 题干高亮、结构化讲解、记忆钩子
- [x] 场景练习、AI 问答、AI 生成生词本、单词本总览、deck 选择器
- [ ] 填空 / “找错”题型
- [ ] 跨 deck 的统计与连胜
- [ ] 可选：沙箱真实执行判分（matcher 已预留执行接口位）

## License

MIT
