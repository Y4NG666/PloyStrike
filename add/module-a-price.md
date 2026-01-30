# 模块 A：饰品价格预测 (Skin Price Market)

## 定位
**严肃的金融工具** — 面向硬核交易者 "The Investor"

---

## 核心模式
**Binary Options (二元期权)** 或 AMM
> 推荐二元期权，开发最快

---

## 功能需求

### F1. 标的物管理

| 需求 | 描述 |
|------|------|
| 单品交易 | 支持主流饰品（如 AK-47 Redline, Butterfly Knife Fade） |
| 指数交易 | 支持"指数"交易（如"Top 10 匕首指数"） |

**数据库表设计参考:**
```sql
-- 已有 Skin 表
CREATE TABLE "Skin" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "marketHashName" TEXT NOT NULL UNIQUE,
    "iconUrl" TEXT,
    "currentPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 价格历史表 (已有)
CREATE TABLE "PriceHistory" (
    "id" SERIAL PRIMARY KEY,
    "skinId" INTEGER REFERENCES "Skin"(id),
    "price" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL
);
```

---

### F2. 交易逻辑

```
用户操作流程:
┌─────────────────────────────────────────────────────────────┐
│  1. 选择标的物 (饰品/指数)                                    │
│                    ▼                                        │
│  2. 选择方向: 看涨 (CALL) / 看跌 (PUT)                       │
│                    ▼                                        │
│  3. 选择到期时间: 1小时 / 24小时 / 7天                        │
│                    ▼                                        │
│  4. 输入下注金额 (USDT)                                      │
│                    ▼                                        │
│  5. 确认交易 → 资金进入合约锁定                               │
│                    ▼                                        │
│  6. 到期自动结算                                             │
└─────────────────────────────────────────────────────────────┘
```

**智能合约接口设计:**
```solidity
// 下注
function placeBet(
    uint256 skinId,
    bool isCallOption,    // true=看涨, false=看跌
    uint256 expiryTime,
    uint256 amount
) external;

// Oracle 更新价格
function updatePrice(uint256 skinId, uint256 price) external onlyOracle;

// 结算
function settle(uint256 betId) external;
```

---

### F3. 数据可视化

| 功能 | 优先级 | 描述 |
|------|--------|------|
| K线图 | **必须** | 历史价格走势图（支持 1H/4H/1D 周期） |
| 当前喂价 | **必须** | 实时显示预言机喂价 |
| 持仓面板 | **必须** | 显示用户当前持仓、盈亏 |
| 历史记录 | 建议 | 用户历史交易记录 |

**前端组件:**
```
├── components/
│   ├── PriceChart.tsx        # K线图组件
│   ├── CurrentPrice.tsx      # 实时价格显示
│   ├── BetPanel.tsx          # 下注面板
│   ├── PositionList.tsx      # 持仓列表
│   └── TradeHistory.tsx      # 历史记录
```

---

### F4. 结算机制

| 项目 | 说明 |
|------|------|
| 触发方式 | 到期自动结算 (Keeper / Cron Job) |
| 数据源 | Buff163 成交均价 (VWAP) |
| 结算周期 | 每日/每小时（根据到期时间） |

**VWAP 算法 (已实现):**
```typescript
// backend/src/oracle/vwap.ts
function calculateVWAP(prices: PricePoint[]): number {
    const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0);
    const weightedSum = prices.reduce((sum, p) => sum + p.price * p.volume, 0);
    return weightedSum / totalVolume;
}
```

---

## 后端已有组件

| 文件 | 功能 | 状态 |
|------|------|------|
| `src/oracle/vwap.ts` | VWAP 均价计算 | ✅ 已完成 |
| `src/oracle/service.ts` | Oracle 服务主逻辑 | ✅ 已完成 |
| `src/oracle/relayer.ts` | 链上交易发送 | ✅ 已完成 |
| `src/scrapers/buff163.ts` | Buff 价格爬虫 | ✅ 已完成 |
| `src/scrapers/steam.ts` | Steam 价格爬虫 | ✅ 已完成 |
| `scripts/price_monitor.py` | 价格监控脚本 | ✅ 已完成 |

---

## 待开发内容

### 智能合约
- [ ] `PriceOptionPool.sol` — 价格期权池合约
- [ ] `PriceOracle.sol` — 价格预言机合约
- [ ] `Vault.sol` — 资金库合约

### 前端
- [ ] 价格预测页面布局
- [ ] K线图组件集成 (推荐 TradingView / Lightweight Charts)
- [ ] 下注交互面板
- [ ] 持仓管理页面

### 后端
- [x] 合约交互服务 (ethers.js)
- [x] 结算 Keeper 脚本
