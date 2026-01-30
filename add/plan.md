## 后端完成情况

- [x] 价格模块爬虫 + VWAP + Oracle 服务
- [x] 开箱模块 Session API + 赔率 + WebSocket
- [x] Keeper 脚本 (价格结算、开箱结算)
- [x] 用户统计/历史 API
- [x] 资产余额与交易历史 API (`/api/user/balance`, `/api/user/transactions`)

---

这是一个非常宏大且完整的构想。将 “饰品价格预测（金融属性/低频）” 与 “开箱直播预测（娱乐属性/高频）” 结合，形成了一个**“长短结合、覆盖全用户层”**的超级应用。左手金融 (DeFi): 吸引巨鲸和硬核交易者（类似于 Aave/GMX）。右手娱乐 (GameFi): 吸引赌徒和直播观众（类似于 Rollbit/Polymarket）。以下是针对 PolyStrike 双模块架构 的详细 项目需求性分析 (PRD - Project Requirements Document)。这份文档将帮助你们团队理清逻辑，防止开发时需求蔓延。📑 PolyStrike 项目需求分析报告 (PRD)1. 市场痛点与核心价值 (Problem & Solution)1.1 现状与痛点Web2 饰品市场的金融缺失： 玩家手持价值数万美金的库存（如龙狙），但不仅面临 V 社封号风险，且无法对冲价格下跌风险（没有做空机制）。开箱玩法的黑箱操作： 传统开箱网站（Web2）赔率不透明，不仅存在后台操纵概率的嫌疑，而且资金必须充值进平台，随时可能跑路。Web3 预测市场的枯燥： 现有的 Polymarket 多关注政治/体育，缺乏针对 Gamers 的高频、高刺激（Degen）场景。1.2 我们的解决方案 (The Hybrid Model)Module A (Price): 提供链上二元期权/衍生品，允许玩家做多/做空饰品指数。Module B (Unbox): 提供透明的、可滚存的彩池预测，将直播流量转化为链上交易。2. 用户画像分析 (User Personas)我们需要同时满足两类完全不同的人群：用户类型代号核心诉求对应模块行为特征硬核交易者"The Investor"风险对冲、套利饰品价格预测理性，看K线，资金量大，关注 Oracle 准确性，低频操作。直播观众/赌徒"The Viewer"娱乐、以小博大开箱直播预测感性，看直播，资金量小但频次高，喜欢 Jackpot/滚存，追求瞬间快感。主播/KOL"The Host"流量变现、互动开箱直播预测希望粉丝停留时间长，通过“带单”或“开池”获得返佣。3. 功能需求细化 (Functional Requirements)📈 模块一：饰品价格预测 (Skin Price Market)定位： 严肃的金融工具。模式： 推荐使用 Binary Options (二元期权) 或 AMM（根据之前讨论，如果你想做大而全，二元期权开发最快）。F1. 标的物管理：系统需支持主流饰品（如 AK-47 Redline, Butterfly Knife Fade）。需支持“指数”交易（如“Top 10 匕首指数”）。F2. 交易逻辑：用户选择方向（看涨/看跌）和到期时间（如：24小时后）。资金进入合约锁定。F3. 数据可视化：必须功能： 历史价格走势图（K线），当前预言机喂价。F4. 结算机制：到期自动结算。数据源：Buff163 成交均价 (VWAP)。🎁 模块二：开箱直播预测 (Live Unbox Jackpot)定位： 高频互动的娱乐游戏。模式： Parimutuel (彩池) + Rollover (滚存)。F1. 场次管理 (Session):支持“主播模式”：主播绑定钱包后，可自行开启一轮预测。状态流转：Waiting -> Betting (60s) -> Opening (锁定) -> Resolved。F2. 动态赔率：前端需实时计算并展示各选项（出蓝/出金）的预期回报率 (Payout)。F3. 滚存系统 (The Soul):核心需求： 若当前 Session 无人中奖，合约需自动将资金转入 Next Session。前端需有醒目的“Jackpot Pool”累计金额显示。F4. 直播流接入：集成 Twitch/YouTube 播放器组件。🛡️ 通用基础模块 (Common)F1. 钱包连接： 支持 MetaMask, OKX Wallet (EVM)。F2. 资产管理： USDT 充值/提现，个人历史战绩看板。F3. 甚至可以发币 (积分系统): 如下注送 $POLY 积分，用于抵扣手续费（黑客松加分项）。4. 非功能性需求 (Non-Functional Requirements)N1. 实时性 (Latency):关键点： 模块 B（开箱）要求非常高。从后端抓取到开箱结果，到链上结算，延迟不能超过 15 秒，否则用户体验会断层。解决方案： 使用 Polygon（速度快）+ 优化的 Node.js 脚本。N2. 数据准确性 (Integrity):饰品价格需剔除异常值（防止有人在 Buff 上挂 1 美元的龙狙砸盘）。解决方案： 时间加权平均价 (VWAP) 算法。N3. 防作恶 (Security):Oracle 必须有权限控制，不能让普通用户调用 resolve 函数。资金合约必须防重入 (ReentrancyGuard)。5. 数据流架构图 (Data Flow)为了让团队理解这两个模块的数据是如何并行的，这里是数据流逻辑：代码段graph TD
    subgraph Client [用户前端]
        User((User))
        UI_A[界面 A: 价格趋势 K 线]
        UI_B[界面 B: 直播 + 滚存池]
    end

    subgraph Blockchain [Polygon 合约层]
        Contract_A[合约 A: 价格期权池]
        Contract_B[合约 B: 开箱 Jackpot 池]
        Vault[资金库: 存取 USDT]
    end

    subgraph Backend [后端 Oracle]
        Crawler_Price[爬虫 A: Buff163 价格]
        Crawler_Live[爬虫 B: 开箱结果/模拟流]
        
        Logic_Price[逻辑: 均价计算 VWAP]
        Logic_Live[逻辑: 结果判定 & 滚存触发]
        
        Relayer[交易发送器 (EOA Wallet)]
    end

    %% 交互流 - 模块 A (价格)
    User -->|1. 下注涨跌| Contract_A
    Crawler_Price --> Logic_Price
    Logic_Price -->|2. 每日结算| Relayer
    Relayer -->|3. updatePrice()| Contract_A

    %% 交互流 - 模块 B (开箱)
    User -->|1. 押注出金| Contract_B
    Crawler_Live --> Logic_Live
    Logic_Live -->|2. 每分钟结算| Relayer
    Relayer -->|3. resolveSession()| Contract_B
    
    Contract_A -.-> Vault
    Contract_B -.-> Vault
6. 5人团队分工建议 (针对双模块)由于有两个模块，分工需要更加紧凑：成员 A (Solidity Lead): 负责 模块 A (价格预测) 的合约 + 资金库 (Vault) 的安全性。因为涉及金融衍生品，逻辑要严谨。成员 B (Solidity Support): 负责 模块 B (开箱 Jackpot) 的合约。逻辑相对简单（彩池），重点在于写好“滚存”逻辑。成员 C (Backend): 这是一个重活。需要写 两套爬虫/脚本。建议先写模块 B 的脚本（因为演示效果好），再写模块 A 的。成员 D (Frontend - Component): 负责封装通用组件（钱包连接、弹窗）以及 模块 A 的 K 线图页面。成员 E (Frontend - Live & PM): 负责 模块 B 的直播页面（这是演示的核心），以及最后的 PPT 和视频剪辑。7. 总结：为什么这个需求组合能赢？完整生态闭环： 评委看到你不仅仅做了一个赌博小游戏（Module B），还做了一个严肃的金融基础设施（Module A），会认为项目具有可持续性和深度。技术展示全面：Module A 展示了你们对 DeFi、Oracle 均价算法 的理解。Module B 展示了你们对 高频交互、游戏化机制、Rollover 算法 的理解。下一步行动建议：请团队成员确认这个“双模块”需求是否能接受？如果觉得工作量太大，我们可以把“模块 A”简化为只做一个 ETH/BTC 价格预测（现成预言机），重点做“模块 B CS 饰品开箱”。如果团队战斗力强，双开是最好的。