# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

The Indigestibles 是一个胃肠道主题的《杀戮尖塔》式 DBG（牌组构筑）前端原型，基于 React 19 + Vite 8 开发。当前代码以“单文件战斗演示”为核心，包含两名宿主（金针菇 / 夏威夷果壳）、每层 2 场遭遇的三层流程、手牌扇形渲染与简单动画反馈。没有后端、没有测试、没有路由。

## 常用命令

依赖未提交到仓库，首次使用前先安装：

```bash
npm install
```

开发/构建/预览：

```bash
npm run dev      # 启动 Vite 开发服务器，默认 http://127.0.0.1:5173
npm run build    # 打包到 dist/
npm run preview  # 预览生产构建，默认 http://127.0.0.1:4173
```

> 当前 `package.json` 没有配置 `test` 或 `lint` 脚本；如果需要引入，先在 `package.json` 添加对应依赖和脚本。

## 架构与数据流

### 1. 内容配置层：`src/data/content.js`

这是游戏的唯一数据源，包含：

- `HEROES`：两名宿主（`enoki`、`macadamia`）及其两套构筑（`builds`）。
- `TRAITS`：敌人可被吸收的 8 种特性，每种特性有对应的释放逻辑。
- `CARD_LIBRARY`：所有卡牌定义（`key`、`suite`、`target`、`cost`、`palette`、`description`）。
- `ENEMY_LIBRARY`：敌人蓝图（血量、意图循环 `intentCycle`、特性）。
- `STARTER_DECKS`：每位宿主 × 每套构筑的初始牌组。
- `buildRunPlan(finalBossId)`：生成胃 → 小肠 → 大肠三层遭遇流程，每层 2 场遭遇，最终 Boss 从 `LARGE_BOSS_POOL` 随机选取。

卡牌和敌人的实际行为不在这里实现，只在这里定义；逻辑层根据 `card.key` / `enemy.intent.type` 分支处理。

### 2. 逻辑层：`src/game/engine.js`

所有战斗规则都在这里，核心函数：

- `createDemoState({ classId, buildId })`：创建一场新演示战斗。
- `openEncounter(state, layerIndex, encounterIndex, heal)`：切换到指定遭遇并重置临时战斗状态（手牌、能量、格挡、召唤物/特性等）。
- `playCard(state, cardId, targetEnemyId)`：玩家出牌。返回 `{ nextState, report }`。
- `endPlayerTurn(state)` / `resolveEnemyAction(state, enemyId)` / `startNextPlayerTurn(state)`：敌方回合链路。
- `continueRun(state)`：胜利后推进到下一个遭遇或进入 `runComplete`。
- `getValidTargets(state, card)`：返回可选中的敌人实例 ID 列表。

设计约定：

- 函数内部先用 `structuredClone` 复制传入的 `state`，然后直接修改副本；调用方拿到的是新状态。
- 战斗事件通过 `report`（`{ events: [...] }`）返回，事件类型包括 `floater`（飘字）、`banner`（顶部横幅）、`shake`（屏幕震动）。
- 出牌、敌人行动后都会调用 `checkCombatState` 将 `phase` 切换为 `victory` 或 `defeat`。
- 两套宿主的差异化机制分散在多个函数中：
  - **金针菇（enoki）**：通过 `summonMinis` / `growMinis` 管理小金针菇；成熟后攻击自动援击（`useEnokiAssist`）。
    - `guardian`：替幼体承伤（`bodyguardHits`）、回合开始按成熟数给格挡。
    - `martyr`：第一击由最老的小金针菇替死（`decoyReady`），死亡数强化 `butter-pyre` / `funeral-bloom`。
  - **夏威夷果壳（macadamia）**：通过 `absorbTrait` 在敌人濒死时吸收特性，存储在 `player.traits` 中。
    - `focus`：连续吸收同一特性会叠加 `focusChain`，强化单一特性释放。
    - `kaleidoscope`：收集多个特性，`trait-carousel` 轮切当前壳芯。

### 3. UI 层：`src/App.jsx`

`App.jsx` 持有全部客户端状态（`config`、`state`、`selectedCardId`、`floaters`、`banner`、`isResolving`），负责：

- 通过 `Sidebar` 切换宿主/构筑并重开一局。
- 调用 engine 函数后，用 `handleReport` 把 `report` 转成飘字、横幅、震动等反馈。
- 控制交互锁（`isResolving`），在动画期间禁止玩家操作。
- 目标选择流程：点击手牌 → 若需要目标则高亮可点击敌人 → 点击敌人出牌。
- 回合结束按钮触发敌方逐个行动，最后进入下一玩家回合。

展示组件：

- `HandFan`：扇形手牌布局。
- `CardView`：单张卡牌渲染，按 `card.palette` 取色板。
- `FxLayer`：飘字动画层。

### 4. 样式

全部样式集中在 `src/index.css`，使用 CSS 变量实现主题切换：

- `--theme-accent` / `--theme-surface`：由当前遭遇的 `accent` / `surface` 注入。
- `--card-edge` / `--card-bg` / `--card-badge`：由卡牌 `palette` 注入。
- `--trait-color`：敌人/特性面板的主题色。

## 修改时需要注意的约定

- **新增卡牌**：先在 `CARD_LIBRARY` 定义，再把它加入 `STARTER_DECKS` 对应牌组，最后在 `engine.js` 的 `playCardEffect` switch 中实现效果。
- **新增敌人/意图**：在 `ENEMY_LIBRARY` 添加；若新增 `intent.type`，需要在 `resolveEnemyAction` 中处理，否则该意图不生效。
- **新增特性**：在 `TRAITS` 定义，并在 `castTrait` 中实现效果；macadamia 吸收逻辑在 `absorbTrait`。
- **不要跨层直接修改 `state`**：战斗状态一律通过 engine 函数返回的新状态替换，避免 UI 与逻辑不同步。
- **随机性**：当前使用 `Math.random()`，没有可复现种子；如需回放/种子功能，需要从 `createDemoState` / `shuffle` 等位置开始替换。
