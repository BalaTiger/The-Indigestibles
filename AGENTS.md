# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 编码优先

- 在 Windows PowerShell 中读取或编辑项目文件前，必须先显式使用 UTF-8。
- 读取文件时优先使用：

```powershell
Get-Content <path> -Encoding UTF8
```

- 需要设置终端输出编码时使用：

```powershell
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
```

- 如果终端输出仍然出现乱码，停止对文本内容做修改，先向用户确认；不要基于 mojibake 猜测修复文本。
- 不要为了绕过乱码而做大范围脚本替换或整文件重写。优先用 `apply_patch` 做小范围、可审查的补丁。
- 执行新的编码或实现任务前，先核对用户最新消息，确认没有偏离当前任务。

## 项目概览

The Indigestibles 是一个胃肠道主题的《杀戮尖塔》式 DBG（牌组构筑）前端原型，基于 React 19 + Vite 8 开发。当前代码包含两名宿主（金针菇 / 夏威夷果壳）、地图节点流程、手牌扇形渲染与简单动画反馈。没有后端、没有路由。

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

当前 `package.json` 没有配置 `test` 或 `lint` 脚本；如果需要引入，先在 `package.json` 添加对应依赖和脚本。

## 架构与数据流

### 1. 内容配置层：`src/data/content.js`

这是游戏的主要数据源，包含：

- `HEROES`：两名宿主（`enoki`、`macadamia`）及其构筑信息。
- `TRAITS`：敌人可被吸收的特性，每种特性有对应释放逻辑。
- `RELICS`：遗物定义。
- `CARD_LIBRARY`：所有卡牌定义（`key`、`suite`、`target`、`cost`、`palette`、`description`）。
- `ENEMY_LIBRARY`：敌人蓝图（血量、意图循环 `intentCycle`、特性）。
- `STARTER_DECKS`：每位宿主的初始牌组。
- `REWARD_CARD_POOL`：奖励和商店可出现的新增卡牌池。

卡牌和敌人的实际行为不在这里实现，只在这里定义；逻辑层根据 `card.key` / `enemy.intent.type` 分支处理。

### 2. 逻辑层：`src/game/engine.js`

战斗规则在这里，核心函数：

- `openEncounter(state, layer, encounter, heal)`：切换到指定遭遇并重置临时战斗状态（手牌、能量、格挡、召唤物/特性等）。
- `playCard(state, cardId, targetEnemyId)`：玩家出牌。返回 `{ nextState, report }`。
- `endPlayerTurn(state)` / `resolveEnemyAction(state, enemyId)` / `startNextPlayerTurn(state)`：敌方回合链路。
- `getValidTargets(state, card)`：返回可选中的敌人实例 ID 列表。

设计约定：

- 函数内部先用 `structuredClone` 复制传入的 `state`，然后直接修改副本；调用方拿到的是新状态。
- 战斗事件通过 `report`（`{ events: [...] }`）返回，事件类型包括 `floater`、`banner`、`shake`、`cardFlow`、`actorAction`、`hitFx`。
- 出牌、敌人行动后都会调用 `checkCombatState` 将 `phase` 切换为 `victory` 或 `defeat`。
- 不要跨层直接修改战斗 `state`；UI 一律通过 engine 函数返回的新状态替换。

### 3. 地图与非战斗流程：`src/game/navigation.js`

负责跑团状态、地图节点、商店、糖原、遗物、奖励等非战斗流程：

- `createRunState`：创建单局状态。
- `generateLayerNodes`：生成层地图。
- `makeEncounterFromNode`：根据地图节点生成遭遇。
- `generateShopInventory`：生成商店库存。
- `addPlayerCard` / `addPlayerRelic` / `computeGlycogenReward` / `addMapLink`：处理牌组、遗物、货币与地图连线。

### 4. UI 层：`src/App.jsx`

`App.jsx` 持有全部客户端状态，负责：

- 标题、角色选择、地图、战斗、商店、事件、篝火、胜利/失败弹窗之间的切换。
- 调用 engine/navigation 函数后，用 `handleReport` 把 `report` 转成飘字、横幅、震动、攻击动画、受击反馈等。
- 控制交互锁（`isResolving`），在动画期间禁止玩家操作。
- 目标选择流程：拖拽或点击手牌，选择敌人目标后出牌。

展示组件：

- `HandFan`：扇形手牌布局。
- `CardView`：单张卡牌渲染，按 `card.palette` 取色板。
- `EnemyPanel` / `BattleAvatar`：敌人与角色展示。
- `FxLayer`：飘字和受击动画层。

### 5. 样式

全部样式集中在 `src/index.css`，使用 CSS 变量实现主题切换：

- `--theme-accent` / `--theme-surface`：由当前遭遇的 `accent` / `surface` 注入。
- `--card-edge` / `--card-bg` / `--card-badge`：由卡牌 `palette` 注入。
- `--trait-color`：敌人/特性面板的主题色。

## 修改时需要注意的约定

- **新增卡牌**：先在 `CARD_LIBRARY` 定义；奖励/商店牌加入 `REWARD_CARD_POOL`，初始牌才加入 `STARTER_DECKS`；最后在 `engine.js` 的 `playCardEffect` switch 中实现效果。
- **新增敌人/意图**：在 `ENEMY_LIBRARY` 添加；若新增 `intent.type`，需要在 `resolveEnemyAction` 中处理，否则该意图不生效。
- **新增特性**：在 `TRAITS` 定义，并在 `castTrait` 中实现效果；macadamia 吸收逻辑在 `absorbTrait`。
- **新增遗物**：在 `RELICS` 定义，并在 navigation/App 的获取、购买、触发流程中接入。
- **随机性**：当前使用 `Math.random()`，没有可复现种子；如需回放/种子功能，需要从 `createRunState` / `shuffle` 等位置开始替换。
