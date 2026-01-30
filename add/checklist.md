# PolyStrike 开发清单

## 进度总览

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 后端 Oracle | 🟢 100% | 价格与开箱后端已完成 |
| 智能合约 | 🔴 0% | 待开发 |
| 前端 | 🔴 0% | 待开发 |

---

## ✅ 已完成

### 后端 (Backend)

#### 模块 A — 价格预测
- [x] 数据库设计 (Prisma Schema)
- [x] Buff163 价格爬虫 (`src/scrapers/buff163.ts`)
- [x] Steam 价格爬虫 (`src/scrapers/steam.ts`)
- [x] VWAP 均价算法 (`src/oracle/vwap.ts`)
- [x] Oracle 服务 (`src/oracle/service.ts`)
- [x] Relayer 发送器 (`src/oracle/relayer.ts`)
- [x] 价格监控脚本 (`scripts/price_monitor.py`)
- [x] API 路由 (skins, markets, oracle)
- [x] WebSocket 实时推送

#### 数据
- [x] 饰品数据填充 (Steam)
- [x] 赛事数据填充 (PandaScore)
- [x] 历史价格采集

---

## 🔨 待开发

### 智能合约 (Solidity)

#### 通用
- [ ] `Vault.sol` — 资金库合约
  - 充值/提现
  - ReentrancyGuard
  - 余额查询

#### 模块 A — 价格预测
- [ ] `PriceOracle.sol` — 价格预言机
  - updatePrice() — Oracle 喂价
  - getPrice() — 查询价格
  - 权限控制 (onlyOracle)

- [ ] `PriceOptionPool.sol` — 价格期权池
  - placeBet() — 下注
  - settle() — 结算
  - claimReward() — 领取奖励

#### 模块 B — 开箱预测
- [ ] `UnboxJackpot.sol` — 开箱 Jackpot 池
  - createSession() — 创建场次
  - placeBet() — 下注
  - resolveSession() — 结算
  - claimReward() — 领取奖励
  - **claimRefund() — 无人中奖时退款** ⭐

---

### 后端 (Backend)

#### 模块 B — 开箱预测
- [x] `src/scrapers/unbox.ts` — 开箱结果爬虫/模拟器
- [x] `src/processors/unboxProcessor.ts` — 结果处理器
- [x] Session 管理 API
  - `GET /api/unbox/sessions`
  - `GET /api/unbox/sessions/:id`
  - `POST /api/unbox/sessions`
  - `GET /api/unbox/sessions/:id/odds`
  - `POST /api/unbox/sessions/:id/bets`
  - `POST /api/unbox/sessions/:id/resolve`
  - `POST /api/unbox/sessions/:id/refund`
- [x] WebSocket 事件
  - `session:created`
  - `session:betting`
  - `session:resolved`
  - `odds:update`
  - `jackpot:update`

#### 合约交互
- [x] 价格结算 Keeper 脚本
- [x] 开箱结算 Keeper 脚本

#### 用户资产
- [x] 余额查询 API (`GET /api/user/balance`)
- [x] 交易历史 API (`GET /api/user/transactions`)

---

## 📘 后端 API / WebSocket 文档

### REST API

#### 健康检查
- `GET /health` → `{ status: "ok" }`

#### 价格模块
- `GET /api/skins` → 饰品列表
- `GET /api/skins/:id` → 单个饰品详情
- `GET /api/skins/:id/history` → 历史价格
- `GET /api/markets` → 市场数据聚合
- `POST /api/oracle/prices` → 推送价格 (oracle)

#### 开箱模块
- `GET /api/unbox/sessions` → 场次列表
- `GET /api/unbox/sessions/:id` → 场次详情 + 下注
- `POST /api/unbox/sessions` → 创建场次
- `GET /api/unbox/sessions/:id/odds` → 实时赔率
- `POST /api/unbox/sessions/:id/bets` → 提交下注
- `POST /api/unbox/sessions/:id/resolve` → 结算场次
- `POST /api/unbox/sessions/:id/refund` → 退款

#### 用户模块
- `GET /api/user/stats?address=0x...` → 用户统计
- `GET /api/user/history?address=0x...&module=price|unbox&page=1&limit=20` → 历史记录
- `GET /api/user/balance?address=0x...` → 余额查询
- `GET /api/user/transactions?address=0x...&module=all|price|unbox&page=1&limit=20` → 交易流水

### WebSocket
- 连接地址：`/ws`
- 事件：
  - `prices` → `{ skinId, price, timestamp }[]`
  - `unbox` → `{ sessionId, status, totalPool, odds, result, createdAt, startTime, endTime }`
  - `session:created` → `{ sessionId, status, startTime, endTime }`
  - `session:betting` → `{ sessionId, endTime }`
  - `session:resolved` → `{ sessionId, status, result }`
  - `odds:update` → `{ sessionId, odds }`
  - `jackpot:update` → `{ sessionId, totalPool }`

### 前端 (Frontend)

#### 通用组件
- [ ] 项目初始化 (Next.js / Vite)
- [ ] wagmi + viem 钱包集成
- [ ] WalletButton 组件
- [ ] BalancePanel 组件
- [ ] Navbar 导航栏
- [ ] Modal 弹窗
- [ ] Toast 通知

#### 模块 A — 价格预测页面
- [ ] 页面布局
- [ ] K 线图 (TradingView Lightweight Charts)
- [ ] 实时价格显示
- [ ] 下注面板
  - 选择标的物
  - 选择方向 (涨/跌)
  - 选择到期时间
  - 输入金额
- [ ] 持仓列表
- [ ] 交易历史

#### 模块 B — 开箱预测页面
- [ ] 页面布局
- [ ] 直播播放器 (Twitch/YouTube)
- [ ] Jackpot 池显示 (带动画)
- [ ] 实时赔率显示
- [ ] 下注面板
  - 选择预测 (蓝/金/刀)
  - 输入金额
- [ ] 倒计时组件
- [ ] 历史开奖记录

#### 个人中心
- [ ] 用户统计看板
- [ ] 历史记录表格
- [ ] 充值/提现功能

---

## 📋 数据库表 (已新增)

```prisma
// prisma/schema.prisma

// 开箱场次
model UnboxSession {
  id             Int       @id @default(autoincrement())
  hostAddress    String?
  status         String    // WAITING/BETTING/OPENING/RESOLVED/REFUNDABLE
  totalPool      Decimal   @default(0)
  result         String?
  startTime      DateTime?
  endTime        DateTime?
  createdAt      DateTime  @default(now())
  bets           UnboxBet[]
}

// 开箱下注
model UnboxBet {
  id          Int          @id @default(autoincrement())
  session     UnboxSession @relation(fields: [sessionId], references: [id])
  sessionId   Int
  userAddress String
  prediction  String       // BLUE/GOLD/KNIFE
  amount      Decimal
  payout      Decimal?
  createdAt   DateTime     @default(now())
}

// 用户统计
model UserStats {
  id            Int      @id @default(autoincrement())
  address       String   @unique
  totalBets     Int      @default(0)
  totalWins     Int      @default(0)
  totalWagered  Decimal  @default(0)
  totalProfit   Decimal  @default(0)
  updatedAt     DateTime @updatedAt
}

// 用户交易流水
model UserTransaction {
  id        Int      @id @default(autoincrement())
  address   String
  module    String   // price | unbox
  type      String   // BET | PAYOUT | REFUND
  amount    Decimal
  sessionId Int?
  betId     Int?
  createdAt DateTime @default(now())
}
```

---

## 🚀 快速启动命令

```bash
# 后端
cd backend
npm install
docker-compose up -d          # 启动 PostgreSQL + Redis
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run api                   # 启动 API 服务

# 价格监控 (已完成)
python scripts/price_monitor.py --source api --write-db --interval 1800

# 前端 (待创建)
cd frontend
npm install
npm run dev
```

---

## 📝 备注

- 模块 B (开箱) 是演示的核心亮点，建议优先开发
- 无人中奖退款机制是核心卖点，零风险参与，要重点展示
- 如果时间紧张，可以用模拟数据代替真实爬虫
