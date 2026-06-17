# cli-anki

用背单词的方式学命令行 —— 给 CLI 命令做的间隔重复（spaced repetition）应用。

不同于普通 Anki 的“翻卡片→自评”，cli-anki 让你**主动敲出命令**，再**自动判分**：
命令是可被机器精确比对的，忽略 flag 顺序、识别短选项簇（`-la` == `-l -a`）、
无视引号差异。第一版聚焦 **git**，跑通后再加 **bash**。

## 技术栈

- **React 19 + TypeScript + Vite** — 纯前端 SPA，无后端
- **ts-fsrs** — FSRS 间隔重复算法（Anki 默认算法）
- **IndexedDB**（经 `idb`）— 本地优先，进度只存在本机浏览器
- **Vitest** — 核心判分 / 调度 / 内容逻辑的单元测试
- **Zod** — 卡片内容的运行时校验

## 开发

```bash
npm install
npm run dev        # 启动开发服务器
npm test           # 跑单元测试
npm run typecheck  # 类型检查
npm run lint       # ESLint
npm run build      # 生产构建（输出到 dist/）
```

## 架构分层

```
src/
├─ content/     卡片内容与模型（Zod schema + YAML 卡组）
│   ├─ types.ts     Card / Deck schema
│   ├─ loader.ts    解析 + 校验 YAML
│   └─ git.yaml     git 种子卡组
├─ matcher/     判分层 —— 命令规范化与比对（纯函数，无外部依赖）
│   ├─ normalize.ts  分词 / 拆短选项簇 / 规范化
│   └─ match.ts      judge() 比对 + token diff
├─ srs/         调度层 —— ts-fsrs 的薄封装
├─ store/       存储层 —— IndexedDB
├─ study/       会话层 —— 组建复习队列（due + new）
└─ ui/          界面层 —— React 组件
```

设计取舍见下。

### 判分：只做机械归一，语义等价靠声明

`matcher` 只处理空白、引号、短选项簇、flag 顺序这些**机械层面**的差异。
它**不猜语义**——`git switch main` 与 `git checkout main` 是否等价，由卡片作者在
`accept[]` 里显式声明。这样判分可预测、零误判（误判比判错的体验更糟）。

## 编写卡片

卡组是 YAML 文件（见 `src/content/git.yaml`）：

```yaml
id: git
title: Git 基础
cards:
  - id: git-reset-soft
    prompt: 撤销最近一次 commit，但把改动保留在暂存区
    answer: git reset --soft HEAD~1
    accept: # 作者声明的等价答案
      - git reset --soft HEAD^
    explanation: |
      --soft 只移动 HEAD，index 和工作区都保留。
    tags: [reset, undo]
```

`src/content/content.test.ts` 会校验每张卡的 `answer`/`accept` 都能被自己的
判分器判为正确——加卡时自动跑这条护栏。

## Roadmap

- [x] git 卡组 + 判分 + FSRS 调度 + 本地进度
- [ ] bash 卡组（文件操作 / find / grep / 权限）
- [ ] 卡组选择器与跨卡组统计
- [ ] 填空题型与“找错”题型
- [ ] 可选：沙箱真实执行判分（matcher 已预留执行接口位）

## License

MIT
