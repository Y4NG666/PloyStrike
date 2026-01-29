# PloyStrike
PolyStrike 是一个部署在 Polygon 链上的去中心化 CS (Counter-Strike) 衍生品与电竞预测协议，它旨在解决传统 Web2 饰品市场（如 Buff163/Steam）数据不透明、无法对冲价格风险以及中心化博彩平台抽水高、资金不安全的问题。通过链上预言机（Oracle）机制，我们将 CS 饰品价格指数和 HLTV 赛事数据“解码”并映射到区块链上，为玩家提供饰品价格二元期权和点对点（P2P）赛事对赌服务。
项目通过 **Web2 数据 → Oracle → Web3 智能合约** 的架构，实现：

- 饰品价格涨跌的链上预测池（AMM 模式）
- 电竞赛事结果的点对点（P2P）对赌市场
- 基于真实数据的自动结算与激励分配

PolyStrike 的目标是：

> 用预测市场机制，提升非金融资产（游戏饰品 & 赛事结果）的透明度与决策效率。
> 

## 1. 系统架构设计 (System Architecture)

我们将系统分为三层，严格遵循“数据解码 -> 链上验证 -> 应用交互”的逻辑。

### 第一层：链下数据层 (Off-chain Data Layer) - "The Eyes"

这是项目的核心数据源，负责抓取和清洗数据。

- **饰品价格抓取器 (Skin Indexer):**
    - *目标:* 追踪主流饰品（如: AK-47 | 红线, 蝴蝶刀 | 自动化）的实时成交价。
    - *技术:* Python (Scrapy/Selenium) 或 Node.js。
    - *源:* Buff163 API (主要), Steam Community Market (辅助验证)。
    - *处理:* 剔除异常值（如有人以 $0.01 误售），计算加权平均价（VWAP）。
- **赛事数据抓取器 (Match Scraper):**
    - *目标:* 获取即将到来的比赛列表及比赛结果。
    - *技术:* 解析 HLTV.org 或 PandaScore API。
    - *数据:* 队伍 A vs 队伍 B，比赛时间，最终比分。

### 第二层：预言机与验证层 (Oracle & Verification Layer) - "The Bridge"

**这是满足赛道“防止作恶”要求的关键层。**

- **自定义预言机节点 (Custom Oracle):**
    - 将清洗后的数据签名，通过 **Chainlink Functions** 或自建的 Relayer 服务推送到 Polygon 合约。
- **乐观验证机制 (Optimistic Verification):**
    - *机制:* 预言机提交结果（例如：NaVi 赢了）后，有 2 小时的“争议期”。
    - *防作恶:* 如果有人（挑战者）质押代币发起挑战并提供证据，将进入社区仲裁（或多源复核）。如果预言机作恶，其质押金被罚没（Slashed）给挑战者。

### 第三层：链上合约层 (On-chain Layer / Polygon) - "The Brain"

使用 **Solidity** 编写，建议使用 **Foundry** 进行开发和测试。

- **Core Contract (核心结算):** 管理资金池、处理下单、根据预言机数据进行结算。
- **Market Factory (工厂合约):** 允许用户或管理员快速部署新的预测池（例如：新建一个 "Major 决赛预测"）。
- **P2P Betting Contract (对赌合约):** 专门处理你要求的“赛事对赌”逻辑。

---

## 2. 核心功能模块详解

### 🎯 模块 A：CS 饰品价格预测 (Skin Binary Options)

- **场景:** “下周五 18:00，【蝴蝶刀 | 渐变大理石】的价格会高于 $1500 吗？”
- **逻辑:**
    1. **建仓:** 用户用 USDT 购买 YES 或 NO 的份额 (Share)。
    2. **交易:** 采用 **AMM (自动做市商)** 机制（参考 Gnosis 或 Uniswap 模型），随着两边资金量的变化，赔率实时浮动。
    3. **结算:** 到期后，Oracle 从 Buff 抓取价格。如果 >$1500，YES 份额可赎回 $1，NO 归零。

### ⚔️ 模块 B：P2P 赛事对赌 (P2P Match Betting) - *你的特定需求*

- **场景:** 用户 A 认为 G2 会赢，用户 B 认为 FaZe 会赢。他们不相信庄家，想直接对赌。
- **逻辑:**
    1. **挂单 (Maker):** 用户 A 创建一个合约订单：“我赌 50 MATIC 押 G2 赢，赔率 1:1”。
    2. **吃单 (Taker):** 用户 B 浏览列表，看到这个订单，存入 50 MATIC 进行匹配。
    3. **锁定:** 智能合约锁定双方共 100 MATIC。
    4. **裁决:** 比赛结束，Oracle 抓取 HLTV 结果写入合约。
    5. **提款:** 合约自动判断 G2 赢，用户 A 提取 100 MATIC（扣除 1% 协议手续费）。

### 🛡️ 模块 C：激励与风控机制 (Incentive & Security)

- **数据验证激励:** 设立“守望者”节点。如果用户发现链上价格与 Buff 实际价格偏离过大，可发起挑战，成功后获得奖励。
- **流动性挖矿:** 鼓励用户为饰品预测池提供 USDT 流动性，奖励项目原生代币或额外的 MATIC。

---

## 🟢 第一部分：智能合约层 (Smart Contracts)

**状态：** 逻辑闭环，商业模式清晰，安全性完备。

### 1. 核心数据结构 (Refined Structs)

我们在数据结构中增加了“时间戳”和“费率”，这让合约具备了抗攻击能力和商业价值。

Solidity

`// 饰品期权市场
struct Market {
    uint256 marketId;
    bytes32 targetSkinId;       // e.g. "AK47-Redline-FT"
    uint256 targetPrice;        // 锚定价格，e.g. 1500 (15.00 USD)
    uint256 expiryTimestamp;    // 下注截止时间
    
    uint256 totalYesAmount;     // YES 池资金
    uint256 totalNoAmount;      // NO 池资金
    
    bool resolved;              // 是否已结算
    bool finalResult;           // 最终结果 (true/false)
    
    // ✅ [新增] 关键字段
    uint256 resolutionTimestamp;// 实际结算时间 (防止重放，明确结算点)
    uint256 feeRate;            // 平台手续费 (Basis Points, e.g., 100 = 1%) -> 回答"商业模式"
}

// P2P 赛事对赌订单
struct P2PBet {
    uint256 betId;
    bytes32 matchId;            // e.g. "HLTV-12345"
    address maker;              // 发起人
    address taker;              // 接单人 (0x0 表示待接单)
    uint256 amount;             // 赌注金额
    bytes32 predictedWinner;    // Maker 预测的胜者
    
    BetStatus status;           // 枚举: OPEN, MATCHED, RESOLVED, CANCELLED
    
    // ✅ [新增] 关键字段
    uint256 expiryTimestamp;    // 超时时间 -> 超过此时间若无人接单，Maker 可退款
}`

### 2. 关键事件 (Events - Event Driven Architecture)

这是前端实时刷新和索引层（The Graph）的基础。

Solidity

`// Market Events
event SkinMarketCreated(uint256 indexed marketId, bytes32 indexed skinId);
event SkinPredicted(uint256 indexed marketId, address indexed user, bool direction, uint256 amount);
event MarketResolved(uint256 indexed marketId, bool finalResult, uint256 timestamp);

// P2P Events
event P2PBetCreated(uint256 indexed betId, address indexed maker, uint256 amount);
event P2PBetMatched(uint256 indexed betId, address indexed taker);
event P2PBetResolved(uint256 indexed betId, address indexed winner, uint256 payout);
event P2PBetCancelled(uint256 indexed betId); // ✅ 资金退回事件`

### 3. 核心接口增强 (Missing Pieces Filled)

补全了生命周期管理的函数，确保资金有进有出。

- **`MarketFactory.sol`**
    - `resolveMarket(uint256 marketId)`: **[Admin/Oracle Only]** 触发结算，计算最终状态，开启提款权限。
- **`BettingRouter.sol`**
    - `cancelP2PBet(uint256 betId)`: **[Maker Only]** 检查 `block.timestamp > expiryTimestamp` 且状态为 `OPEN`，允许 Maker 取回资金。
    - `resolveP2PBet(uint256 betId)`: **[Public/Auto]** 根据 Oracle 写入的比赛结果，将锁定的资金发送给胜者。

---

## 🔵 第二部分：后端 / Oracle 层 (The Truth Machine)

**状态：** 强调“防作恶”与“多源校验”，提升评审信任度。

### 1. 可信数据机制 (Credibility Statement)

**我们在文档中需明确声明 Oracle 的运行逻辑（防作恶叙事核心）：**

> "Oracle 节点采用「多源校验 + 时间加权」策略："
> 
> 1. **多源校验 (Multi-Source Check):** 同一饰品价格需同时从 Buff163 和 Steam Market 获取。若两者偏差 >5%，触发熔断，暂停上链并人工介入。
> 2. **VWAP (Volume Weighted Average Price):** 剔除瞬间插针价格，取 1 小时窗口内的成交量加权平均价，反映真实市场情绪。
> 3. **异常处理:** 若识别到恶意清洗交易（Wash Trading），该数据点将被自动丢弃。

### 2. 权限与安全策略

- **白名单机制 (Whitelist):** `OracleAdapter` 合约仅接受来自我们多签钱包控制的 Relayer 地址的交易。
- **不可篡改 (Immutable Commit):** 错误数据一旦上链（Resolve），无法回滚。为了防止这种情况，我们在链下设有 2 分钟的“挑战缓冲期”，确认无误后上链。

---

## 🟠 第三部分：前端应用层 (Frontend)

**状态：** 逻辑严谨，用户体验流畅，数据展示清晰。

### 1. 赔率计算逻辑 (Odds Calculation)

前端不只是展示数字，而是实时计算预期收益，增强博弈感。

- **核心公式:**JavaScript
    
    `// 假设用户想投 100 USDT 到 YES 侧
    const potentialPayout = betAmount * (totalPoolSize / (currentYesPool + betAmount));
    // 扣除手续费
    const finalPayout = potentialPayout * (1 - feeRate/10000);`
    
- **UI 展示:** 当用户输入金额时，显示 *"预计回报率: 150% (若获胜)"*。

### 2. 状态对齐策略 (State Alignment)

明确链上与链下的分工，展示架构成熟度：

- **链上数据 (The Truth):** 用户的余额、当前池子金额、订单状态、最终胜负。**（涉及金钱，必须读合约）**
- **链下 API (The View):** K 线图、历史价格走势、热门榜单。**（涉及展示，读取后端数据库）**
- **冲突解决:** 若 API 显示价格与合约结算价格不一致，前端 UI 会打上标记，并明确提示**“以链上结算结果为准”**。

---

## 2. 团队分工 (Squad Roles - 5人制)

为了效率最大化，所有人必须并行工作。

### 👮‍♂️ 成员 A: 首席合约工程师 (Lead Solidity Dev)

- **职责:** 负责核心资金逻辑，确保钱不出错。
- **任务:**
    - 编写 `Market.sol` (AMM池逻辑) 和 `P2PBet.sol` (对赌逻辑)。
    - 实现 **V2 核心:** 费率扣除 (`feeRate`)、超时退款 (`cancelP2PBet`)、赔率计算。
    - 安全审计（防重入、权限控制）。

### 🛠️ 成员 B: 合约架构与测试 (Contract Architect & QA)

- **职责:** 负责合约的“外壳”和测试，协助成员 A。
- **任务:**
    - 编写 `MarketFactory.sol` (工厂模式) 和 `BettingRouter.sol` (统一入口)。
    - 编写 `OracleAdapter.sol` (权限管理)。
    - **关键:** 使用 **Foundry** 编写覆盖率 >90% 的测试用例（尤其是退款和结算逻辑）。

### 🤖 成员 C: 后端与预言机 (Backend & Oracle Dev)

- **职责:** 负责“搬运真理”，连接 Web2 与 Web3。
- **任务:**
    - 编写 Node.js/Python 脚本抓取 Buff163/HLTV 数据。
    - **实现 V2 防作恶:** 实现 VWAP 均价计算、多源数据比对逻辑。
    - 搭建 Relayer 服务，定时调用合约的 `updatePrice/resolveMarket`。

### 🎨 成员 D: 前端全栈 (Frontend Lead)

- **职责:** 负责用户能看到的一切。
- **任务:**
    - 搭建 Next.js + RainbowKit + Tailwind 项目。
    - 对接合约接口（Wagmi Hooks）。
    - **实现 V2 展示:** 实时赔率预估、K线图渲染（Recharts）、个人中心历史记录。

### 🧠 成员 E: 产品经理与设计 (PM & UI/UX)

- **职责:** 负责项目“卖相”和最终交付物。
- **任务:**
    - 设计 UI 原型（Figma），切图给成员 D。
    - 撰写 `README.md` 文档（包含架构图）。
    - **关键:** 制作 Demo 视频和 Pitch Deck（演示文稿），准备答辩话术。
