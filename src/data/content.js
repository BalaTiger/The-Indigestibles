export const LARGE_BOSS_POOL = [
  "mr-hemorrhoid",
  "constipation-idol",
  "gas-duke",
];

export const MAP_CONFIG = {
  layerNodeCountRange: [5, 7],
  maxBranchByLayer: { 0: 2, 1: 3, 2: 4 },
  middleNodeTypes: ["elite", "shop", "event", "campfire"],
  layerBossIds: ["pyloric-sentry", "brush-border-warden"],
  normalPools: {
    0: ["gastric-pebble", "acidic-dumpling", "sour-yogurt"],
    1: ["bile-scout", "villus-bandit"],
    2: ["fermenting-rice", "mucus-polyp"],
  },
  elitePools: {
    0: ["gastric-pebble", "acidic-dumpling", "sour-yogurt"],
    1: ["bile-scout", "villus-bandit"],
    2: ["fermenting-rice", "mucus-polyp"],
  },
  nodeTypeNames: {
    combat: "普通战斗",
    elite: "精英战斗",
    boss: "Boss",
    shop: "商店",
    event: "事件",
    campfire: "篝火",
  },
  nodeTypeColors: {
    combat: "#a4d566",
    elite: "#ff9e6d",
    boss: "#d96f86",
    shop: "#74d4b3",
    event: "#94c8ff",
    campfire: "#f3a06c",
  },
};

export const HEROES = {
  enoki: {
    id: "enoki",
    name: "金针菇",
    glyph: "菇",
    accent: "#d4d785",
    panel: "#3f4632",
    maxHp: 56,
    energy: 3,
    summary: "脆长、耐熬、会分叉。靠小金针菇把战场越养越大。",
    mechanic: "共享机制：制造“小金针菇”。成熟后会在攻击时自动支援。",
    builds: {
      guardian: {
        id: "guardian",
        name: "护伞培育",
        passive: "成熟的小金针菇在你回合开始时提供护甲。敌方专打幼体时，你更擅长替它们扛伤。",
        vibe: "把自己当培养皿，拖到菌群成型。",
      },
      martyr: {
        id: "martyr",
        name: "菌葬祭司",
        passive: "每个敌方回合的第一击优先命中最老的小金针菇。死亡数会强化你的葬送牌。",
        vibe: "让小金针菇替你接刀，再把尸体点成伤害。",
      },
    },
  },
  macadamia: {
    id: "macadamia",
    name: "夏威夷果壳",
    glyph: "壳",
    accent: "#f2c87f",
    panel: "#5b4430",
    maxHp: 52,
    energy: 3,
    summary: "空心、硬壳、会收纳。靠吸收濒死敌人的特性反击。",
    mechanic: "共享机制：用基础牌在敌人濒死时把特殊能力吸进果壳。",
    builds: {
      focus: {
        id: "focus",
        name: "单核共振",
        passive: "连续吸收同类特性会叠高专精层数，单一能力越磨越锋利。",
        vibe: "盯准一类猎物，把同一种恶心发挥到极致。",
      },
      kaleidoscope: {
        id: "kaleidoscope",
        name: "杂食转盘",
        passive: "尽量收集不同特性，轮切当前壳芯，靠复合施法吃遍肠道。",
        vibe: "什么都要一点，转起来就很有节目效果。",
      },
    },
  },
};

export const TRAITS = {
  acidSplash: {
    id: "acidSplash",
    name: "胃酸回吐",
    short: "酸",
    color: "#9ed65f",
    description: "打主目标并顺带溅到旁边。",
  },
  mucusWrap: {
    id: "mucusWrap",
    name: "黏液包裹",
    short: "黏",
    color: "#74d4b3",
    description: "卷起黏膜，主要转成护甲和反刺。",
  },
  bileJet: {
    id: "bileJet",
    name: "胆汁喷射",
    short: "胆",
    color: "#ffd768",
    description: "小而快的灼击，并顺手摸牌。",
  },
  villusSnare: {
    id: "villusSnare",
    name: "绒毛绞索",
    short: "绒",
    color: "#94c8ff",
    description: "把目标表面的护甲和余裕一块扯掉。",
  },
  gasBurst: {
    id: "gasBurst",
    name: "肠气爆散",
    short: "胀",
    color: "#f3a06c",
    description: "对全体的闷爆伤害。",
  },
  clotClamp: {
    id: "clotClamp",
    name: "血团紧箍",
    short: "箍",
    color: "#d5647f",
    description: "变硬、回血、顺便准备反弹。",
  },
  dryPlug: {
    id: "dryPlug",
    name: "干结塞栓",
    short: "栓",
    color: "#d8b17a",
    description: "又干又硬，重击后还留下碎屑护体。",
  },
  putridRush: {
    id: "putridRush",
    name: "腐熟奔流",
    short: "腐",
    color: "#8fcb74",
    description: "一边发酵一边扑上来，顺便回一点命。",
  },
};

export const RELICS = {
  "reward-relic": {
    id: "reward-relic",
    name: "选择之眼",
    description: "战斗胜利后的卡牌奖励从 2 选 1 变为 3 选 1。",
    rarity: "common",
  },
  "gold-relic": {
    id: "gold-relic",
    name: "糖原菌囊",
    description: "战斗胜利时获得的糖原 +30%。",
    rarity: "common",
  },
  "map-link-relic": {
    id: "map-link-relic",
    name: "肠壁捷径",
    description: "获得时，可以在当前层地图上绘制一条单向捷径。",
    rarity: "rare",
  },
  "barrier-keep-relic": {
    id: "barrier-keep-relic",
    name: "钙化菌膜",
    description: "每回合开始时，你的格挡不会被清空。",
    rarity: "epic",
  },
};

export const GLYCOGEN_REWARDS = {
  combat: 5,
  elite: 8,
  boss: 25,
};

export const CARD_RARITY_PRICE = {
  common: 4,
  rare: 7,
  epic: 10,
};

export const RELIC_RARITY_PRICE = {
  common: 10,
  rare: 16,
  epic: 24,
};

export const REWARD_CARD_POOL = [
  "summon-vampire",
  "summon-energy",
  "summon-buffer",
  "summon-re-attack",
  "summon-devourer",
  "summon-bomb",
  "summon-poison",
  "summon-draw",
  "accelerate-growth",
];

const CARD_LIBRARY = {
  "cap-jab": {
    key: "cap-jab",
    name: "伞帽戳刺",
    suite: "attack",
    target: "enemy",
    cost: 1,
    palette: "enoki",
    description: "造成 6 点伤害。成熟的小金针菇会自动补刀。",
    rarity: "common",
  },
  "split-cluster": {
    key: "split-cluster",
    name: "分叉出芽",
    suite: "skill",
    target: "none",
    cost: 2,
    palette: "enoki",
    description: "召唤 1 个小金针菇，并抽 1 张牌。",
    rarity: "common",
  },
  "tender-guard": {
    key: "tender-guard",
    name: "嫩柄护膜",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "enoki",
    description: "获得 7 点格挡。若场上有小金针菇，再得 3 点。",
    rarity: "common",
  },
  "mycelial-shelter": {
    key: "mycelial-shelter",
    name: "菌丝遮护",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "guardian",
    description: "所有小金针菇成长 1。获得 5 点格挡，并替它们承受接下来 2 次群伤。",
    rarity: "rare",
  },
  "patient-canopy": {
    key: "patient-canopy",
    name: "耐心伞幕",
    suite: "attack",
    target: "enemy",
    cost: 2,
    palette: "guardian",
    description: "所有小金针菇成长 1。每个成熟分身对目标造成 5 点伤害，并为你提供 2 点格挡。",
    rarity: "rare",
  },
  "butter-pyre": {
    key: "butter-pyre",
    name: "黄油火葬",
    suite: "attack",
    target: "enemy",
    cost: 1,
    palette: "martyr",
    description: "献祭最老的小金针菇。若成功，造成 12 点伤害并获得 1 点能量。",
    rarity: "rare",
  },
  "funeral-bloom": {
    key: "funeral-bloom",
    name: "丧礼繁花",
    suite: "skill",
    target: "none",
    cost: 2,
    palette: "martyr",
    description: "召唤 2 个小金针菇。每有 1 个死亡分身，再获得 3 点格挡并摸 1 张牌。",
    rarity: "rare",
  },
  "shell-bash": {
    key: "shell-bash",
    name: "壳面重拍",
    suite: "attack",
    target: "enemy",
    cost: 1,
    palette: "macadamia",
    description: "造成 6 点伤害。若当前壳芯已有特性，额外触发一次。",
    rarity: "common",
  },
  "crack-and-seal": {
    key: "crack-and-seal",
    name: "裂壳封存",
    suite: "attack",
    target: "enemy",
    cost: 1,
    palette: "macadamia",
    description: "造成 5 点伤害。若目标濒死，则把它的特性封进果壳。",
    rarity: "common",
  },
  "kernel-recall": {
    key: "kernel-recall",
    name: "芯仁回忆",
    suite: "skill",
    target: "none",
    cost: 0,
    palette: "macadamia",
    description: "获得 4 点格挡并抽 1 张牌。若已有壳芯，再得 2 点格挡。",
    rarity: "common",
  },
  "mono-resonance": {
    key: "mono-resonance",
    name: "单核共振",
    suite: "attack",
    target: "enemy",
    cost: 1,
    palette: "focus",
    description: "造成 5 点伤害，并按专精层数强化当前壳芯。",
    rarity: "rare",
  },
  "pressure-polish": {
    key: "pressure-polish",
    name: "高压抛磨",
    suite: "attack",
    target: "enemy",
    cost: 2,
    palette: "focus",
    description: "造成 10 点伤害，并追加一次当前壳芯。专精越高越狠。",
    rarity: "rare",
  },
  "trait-carousel": {
    key: "trait-carousel",
    name: "特性转盘",
    suite: "skill",
    target: "none",
    cost: 0,
    palette: "kaleidoscope",
    description: "切换到下一个已储存特性，并抽 1 张牌。",
    rarity: "rare",
  },
  "pantry-choir": {
    key: "pantry-choir",
    name: "储藏室合唱",
    suite: "attack",
    target: "enemy",
    cost: 2,
    palette: "kaleidoscope",
    description: "造成 4 点伤害，并把所有已储存特性一起唱出来。",
    rarity: "rare",
  },
  "summon-vampire": {
    key: "summon-vampire",
    name: "血菇寄生",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "martyr",
    description: "消耗 1 点宿主 HP，召唤 1 个吸血小金针菇。成熟后攻击会治疗宿主。",
    rarity: "rare",
  },
  "summon-energy": {
    key: "summon-energy",
    name: "能菇充能",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "guardian",
    description: "召唤 1 个能量小金针菇。成熟后每回合开始时为你提供 1 点临时能量。",
    rarity: "rare",
  },
  "summon-buffer": {
    key: "summon-buffer",
    name: "壮菇培育",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "guardian",
    description: "召唤 1 个缓冲小金针菇。成熟后攻击时给相邻分身 +1 攻击和 +1 最大 HP。",
    rarity: "rare",
  },
  "summon-re-attack": {
    key: "summon-re-attack",
    name: "连击菌丝",
    suite: "skill",
    target: "none",
    cost: 2,
    palette: "martyr",
    description: "召唤 1 个重击小金针菇。成熟后攻击完毕，令前一位分身再次攻击。",
    rarity: "rare",
  },
  "summon-devourer": {
    key: "summon-devourer",
    name: "吞噬菌核",
    suite: "skill",
    target: "none",
    cost: 2,
    palette: "martyr",
    description: "召唤 1 个吞噬者小金针菇。成熟时会吞噬场上所有其他分身，获得其双倍攻击和 HP。",
    rarity: "epic",
  },
  "summon-bomb": {
    key: "summon-bomb",
    name: "爆菇埋设",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "martyr",
    description: "召唤 1 个炸弹小金针菇。死亡时对全体敌人造成攻击×2 伤害。",
    rarity: "rare",
  },
  "summon-poison": {
    key: "summon-poison",
    name: "毒菇分泌",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "martyr",
    description: "召唤 1 个毒菇小金针菇。死亡时让击杀者获得攻击×2 层中毒。",
    rarity: "rare",
  },
  "summon-draw": {
    key: "summon-draw",
    name: "抽丝菌柄",
    suite: "skill",
    target: "none",
    cost: 1,
    palette: "guardian",
    description: "召唤 1 个抽牌小金针菇。死亡时你抽 1 张牌。",
    rarity: "rare",
  },
  "accelerate-growth": {
    key: "accelerate-growth",
    name: "催熟激素",
    suite: "skill",
    target: "none",
    cost: 2,
    palette: "enoki",
    description: "所有小金针菇剩余成熟回合 -1。",
    rarity: "epic",
  },
};

const ENEMY_LIBRARY = {
  "gastric-pebble": {
    id: "gastric-pebble",
    name: "胃石小砾",
    glyph: "石",
    tier: "normal",
    threat: 1,
    maxHp: 22,
    traitId: "dryPlug",
    intentCycle: [
      { type: "attack", value: 6, label: "轻硌" },
      { type: "guard", value: 5, label: "蜷成硬块" },
      { type: "attack", value: 7, label: "硬蹭" },
    ],
  },
  "acidic-dumpling": {
    id: "acidic-dumpling",
    name: "酸泡饺子",
    glyph: "酸",
    tier: "normal",
    threat: 2,
    maxHp: 24,
    traitId: "acidSplash",
    intentCycle: [
      { type: "attack", value: 6, label: "酸咬" },
      { type: "miniSweep", value: 2, fallback: 5, label: "沸泡" },
      { type: "guard", value: 6, label: "回锅" },
    ],
  },
  "sour-yogurt": {
    id: "sour-yogurt",
    name: "返酸酸奶",
    glyph: "酵",
    tier: "normal",
    threat: 2,
    maxHp: 26,
    traitId: "mucusWrap",
    intentCycle: [
      { type: "guard", value: 7, label: "凝膜" },
      { type: "attack", value: 7, label: "乳酸拍脸" },
      { type: "miniSweep", value: 1, fallback: 4, label: "起泡" },
    ],
  },
  "pyloric-sentry": {
    id: "pyloric-sentry",
    name: "幽门守闸肌",
    glyph: "门",
    tier: "boss",
    maxHp: 72,
    traitId: "acidSplash",
    boss: true,
    intentCycle: [
      { type: "attackAndGuard", value: 8, guard: 6, label: "括约震颤" },
      { type: "miniSweep", value: 3, fallback: 7, label: "反流浪潮" },
      { type: "stripAttack", strip: 5, value: 10, label: "胃门绞压" },
    ],
  },
  "bile-scout": {
    id: "bile-scout",
    name: "胆汁斥候",
    glyph: "胆",
    tier: "normal",
    threat: 2,
    maxHp: 28,
    traitId: "bileJet",
    intentCycle: [
      { type: "attack", value: 7, label: "苦喷" },
      { type: "attack", value: 8, label: "胆滴连刺" },
      { type: "guard", value: 5, label: "回流防护" },
    ],
  },
  "villus-bandit": {
    id: "villus-bandit",
    name: "绒毛劫匪",
    glyph: "绒",
    tier: "normal",
    threat: 3,
    maxHp: 30,
    traitId: "villusSnare",
    intentCycle: [
      { type: "stripAttack", strip: 4, value: 5, label: "拽膜" },
      { type: "miniSweep", value: 2, fallback: 6, label: "绒刷乱割" },
      { type: "attack", value: 8, label: "细绳勒紧" },
    ],
  },
  "brush-border-warden": {
    id: "brush-border-warden",
    name: "刷状缘监工",
    glyph: "刷",
    tier: "boss",
    maxHp: 78,
    traitId: "villusSnare",
    boss: true,
    intentCycle: [
      { type: "stripAttack", strip: 6, value: 9, label: "刷缘剐蹭" },
      { type: "attackAndGuard", value: 7, guard: 8, label: "绒毯收拢" },
      { type: "miniSweep", value: 3, fallback: 8, label: "消化波纹" },
    ],
  },
  "fermenting-rice": {
    id: "fermenting-rice",
    name: "发酵米团",
    glyph: "胀",
    tier: "normal",
    threat: 3,
    maxHp: 29,
    traitId: "gasBurst",
    intentCycle: [
      { type: "attackAll", value: 4, miniValue: 2, label: "鼓胀喷发" },
      { type: "guard", value: 7, label: "闷熟" },
      { type: "attack", value: 9, label: "顶胃回冲" },
    ],
  },
  "mucus-polyp": {
    id: "mucus-polyp",
    name: "黏膜息肉",
    glyph: "黏",
    tier: "normal",
    threat: 4,
    maxHp: 32,
    traitId: "putridRush",
    intentCycle: [
      { type: "guard", value: 8, heal: 3, label: "裹膜增生" },
      { type: "attack", value: 7, label: "滑腻扑击" },
      { type: "miniSweep", value: 2, fallback: 5, label: "分泌淹没" },
    ],
  },
  "mr-hemorrhoid": {
    id: "mr-hemorrhoid",
    name: "痔疮先生",
    glyph: "痔",
    tier: "boss",
    maxHp: 84,
    traitId: "clotClamp",
    boss: true,
    intentCycle: [
      { type: "guard", value: 12, heal: 4, label: "充血隆起" },
      { type: "attack", value: 13, label: "坐压怒撞" },
      { type: "attackAll", value: 6, miniValue: 3, label: "血线崩喷" },
    ],
  },
  "constipation-idol": {
    id: "constipation-idol",
    name: "便秘偶像",
    glyph: "梗",
    tier: "boss",
    maxHp: 88,
    traitId: "dryPlug",
    boss: true,
    intentCycle: [
      { type: "attackAndGuard", value: 11, guard: 7, label: "干结栓击" },
      { type: "attack", value: 15, label: "硬推到底" },
      { type: "miniSweep", value: 4, fallback: 7, label: "碎屑横飞" },
    ],
  },
  "gas-duke": {
    id: "gas-duke",
    name: "胀气公爵",
    glyph: "公",
    tier: "boss",
    maxHp: 80,
    traitId: "gasBurst",
    boss: true,
    intentCycle: [
      { type: "attackAll", value: 5, miniValue: 2, label: "贵族闷雷" },
      { type: "attackAndGuard", value: 9, guard: 8, label: "鼓腹转身" },
      { type: "attack", value: 12, label: "礼炮直喷" },
    ],
  },
};

export const STARTER_DECKS = {
  enoki: [
    "cap-jab",
    "cap-jab",
    "cap-jab",
    "cap-jab",
    "split-cluster",
    "split-cluster",
    "split-cluster",
    "tender-guard",
    "tender-guard",
    "tender-guard",
  ],
  macadamia: [
    "shell-bash",
    "shell-bash",
    "shell-bash",
    "shell-bash",
    "crack-and-seal",
    "crack-and-seal",
    "crack-and-seal",
    "kernel-recall",
    "kernel-recall",
    "kernel-recall",
  ],
};

export function getCardDefinition(key) {
  return CARD_LIBRARY[key];
}

export function getStarterDeck(classId) {
  return STARTER_DECKS[classId].map((key) => CARD_LIBRARY[key]);
}

export function getEnemyBlueprint(id) {
  return ENEMY_LIBRARY[id];
}

export function pickLargeBoss(seed = Math.random()) {
  const idx = Math.floor(Math.abs(seed) * LARGE_BOSS_POOL.length) % LARGE_BOSS_POOL.length;
  return LARGE_BOSS_POOL[idx];
}

export function buildRunPlan(finalBossId) {
  return [
    {
      id: "stomach",
      name: "胃",
      subtitle: "酸雾前庭",
      accent: "#a4d566",
      surface: "#4a211e",
      encounters: [
        {
          id: "stomach-entry",
          name: "胃液前厅",
          note: "刚进门就闻到酸气，食团们已经开始发软。",
          enemyIds: ["acidic-dumpling", "sour-yogurt"],
        },
        {
          id: "stomach-boss",
          name: "幽门门槛",
          note: "括约肌决定谁能滚进下一段肠道。",
          enemyIds: ["pyloric-sentry"],
          boss: true,
        },
      ],
    },
    {
      id: "small-intestine",
      name: "小肠",
      subtitle: "绒毛走廊",
      accent: "#80c0ff",
      surface: "#5a2e28",
      encounters: [
        {
          id: "si-ambush",
          name: "胆汁盲角",
          note: "胆汁斥候配合绒毛劫匪，手很脏。",
          enemyIds: ["bile-scout", "villus-bandit"],
        },
        {
          id: "si-boss",
          name: "刷状缘关口",
          note: "这里的组织已经学会自己动手榨干你。",
          enemyIds: ["brush-border-warden"],
          boss: true,
        },
      ],
    },
    {
      id: "large-intestine",
      name: "大肠",
      subtitle: "发酵后场",
      accent: "#d96f86",
      surface: "#40292a",
      encounters: [
        {
          id: "li-ferment",
          name: "发酵回旋",
          note: "剩饭剩菜和黏膜一起搅成了有意见的团块。",
          enemyIds: ["fermenting-rice", "mucus-polyp"],
        },
        {
          id: "li-boss",
          name: "终端堵点",
          note: "这里的关底每次都不一样，但都很不体面。",
          enemyIds: [finalBossId],
          boss: true,
        },
      ],
    },
  ];
}

export function pickRewardCards(count, seed = Math.random()) {
  const pool = [...REWARD_CARD_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.abs(seed + i) * (i + 1)) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((key) => CARD_LIBRARY[key]);
}
