# 模块 B：开箱直播预测 (Live Unbox Jackpot)

## 定位
**高频互动的娱乐游戏** — 面向直播观众 "The Viewer" 和主播 "The Host"

---

## 核心模式
**Parimutuel (彩池) + Refund (无人中奖退款)**

> 这是演示的核心亮点，零风险参与，演示效果好

---

## 功能需求

### F1. 场次管理 (Session)

**状态流转:**
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
│ Waiting  │ ──>│ Betting  │ ──>│ Opening  │ ──>│ Resolved   │
│ 等待开始  │    │ 下注中    │    │ 锁定开箱  │    │ 有人猜中   │
│          │    │ (60秒)   │    │          │    │ → 分奖金   │
└──────────┘    └──────────┘    └──────────┘    └────────────┘
                                                       │
                                      若无人中奖        │
                                            ┌──────────┴──────────┐
                                            │ Refundable          │
                                            │ 无人猜中 → 全额退款  │
                                            └─────────────────────┘
```

**主播模式:**
- 主播绑定钱包后，可自行开启一轮预测
- 主播可获得返佣 (如 1% 池子)

**数据库表设计:**
```sql
-- 开箱场次表
CREATE TABLE "UnboxSession" (
    "id" SERIAL PRIMARY KEY,
    "hostAddress" TEXT,              -- 主播钱包地址
    "status" TEXT NOT NULL,          -- WAITING/BETTING/OPENING/RESOLVED/REFUNDABLE
    "totalPool" DOUBLE PRECISION DEFAULT 0,
    "result" TEXT,                   -- BLUE/GOLD/KNIFE/etc.
    "startTime" TIMESTAMP,
    "endTime" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 下注记录表
CREATE TABLE "UnboxBet" (
    "id" SERIAL PRIMARY KEY,
    "sessionId" INTEGER REFERENCES "UnboxSession"(id),
    "userAddress" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,      -- BLUE/GOLD/KNIFE
    "amount" DOUBLE PRECISION NOT NULL,
    "payout" DOUBLE PRECISION,       -- 结算后填入
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### F2. 动态赔率

**彩池赔率计算:**
```
预期回报率 = 总池子 / 该选项下注总额

例子:
- 总池子: 1000 USDT
- 押"出金": 200 USDT
- 押"出蓝": 800 USDT

出金赔率 = 1000 / 200 = 5.0x
出蓝赔率 = 1000 / 800 = 1.25x
```

**前端实时显示:**
```typescript
interface OddsDisplay {
  option: 'BLUE' | 'GOLD' | 'KNIFE';
  totalBet: number;      // 该选项下注总额
  percentage: number;    // 占比 (%)
  payout: number;        // 预期赔率 (x)
}

// 每秒更新赔率
useEffect(() => {
  const interval = setInterval(fetchOdds, 1000);
  return () => clearInterval(interval);
}, [sessionId]);
```

---

### F3. 公平退款机制 ⭐

**这是模块 B 的核心卖点！**

**规则:**
1. 若当前 Session 有人猜中 → 按比例瓜分奖池
2. 若当前 Session 无人猜中 → **资金原路退回**
3. 零风险参与，用户体验更友好

**智能合约逻辑:**
```solidity
contract UnboxJackpot {
    function resolveSession(uint256 sessionId, uint8 result) external onlyOracle {
        Session storage s = sessions[sessionId];
        
        uint256 winnerPool = optionPools[sessionId][result];
        
        if (winnerPool == 0) {
            // 无人猜中 → 标记为可退款
            s.status = SessionStatus.REFUNDABLE;
        } else {
            // 有人猜中 → 分配奖金
            distributeRewards(sessionId, result, s.totalPool);
            s.status = SessionStatus.RESOLVED;
        }
    }
    
    // 用户主动领取退款
    function claimRefund(uint256 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId];
        require(s.status == SessionStatus.REFUNDABLE, "Not refundable");
        
        // 退回用户在所有选项的下注总额
        uint256 totalBet = 0;
        for (uint8 i = 0; i < 3; i++) {
            totalBet += userBets[sessionId][msg.sender][Prediction(i)];
            userBets[sessionId][msg.sender][Prediction(i)] = 0;
        }
        
        require(totalBet > 0, "Nothing to refund");
        payable(msg.sender).transfer(totalBet);
    }
}
```

**前端展示:**
```
┌─────────────────────────────────────────┐
│  🎰 CURRENT POOL                        │
│                                         │
│      💰 $2,580 USDT                     │
│      ────────────────                   │
│      ✅ 无人中奖 = 全额退款              │
│                                         │
└─────────────────────────────────────────┘
```

---

### F4. 直播流接入

**集成方案:**

| 平台 | 集成方式 |
|------|----------|
| Twitch | iframe embed / Twitch API |
| YouTube | YouTube IFrame API |
| 斗鱼/虎牙 | iframe (需要处理跨域) |

**前端组件:**
```tsx
// components/LivePlayer.tsx
interface LivePlayerProps {
  platform: 'twitch' | 'youtube' | 'douyu';
  channelId: string;
}

const LivePlayer: React.FC<LivePlayerProps> = ({ platform, channelId }) => {
  switch (platform) {
    case 'twitch':
      return (
        <iframe
          src={`https://player.twitch.tv/?channel=${channelId}&parent=${window.location.hostname}`}
          allowFullScreen
        />
      );
    case 'youtube':
      return (
        <iframe
          src={`https://www.youtube.com/embed/${channelId}?autoplay=1`}
          allow="autoplay; encrypted-media"
        />
      );
    default:
      return null;
  }
};
```

---

## 页面布局设计

```
┌─────────────────────────────────────────────────────────────────┐
│                         LIVE UNBOX                              │
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│                                 │    🎰 JACKPOT: $12,580        │
│      ┌───────────────────┐      │    ═══════════════════        │
│      │                   │      │                               │
│      │   直播播放器       │      │    ┌─────┐ ┌─────┐ ┌─────┐   │
│      │   (Twitch/YT)     │      │    │ 出蓝 │ │ 出金 │ │ 出刀 │   │
│      │                   │      │    │1.25x│ │ 5.0x│ │25.0x│   │
│      │                   │      │    └─────┘ └─────┘ └─────┘   │
│      └───────────────────┘      │                               │
│                                 │    下注金额: [____] USDT      │
│                                 │                               │
│      ⏱️ 下注倒计时: 00:42       │    [ 确认下注 ]               │
│                                 │                               │
├─────────────────────────────────┴───────────────────────────────┤
│  最近开奖: 🔵 蓝 → 🔵 蓝 → 🟡 金 → 🔵 蓝 → 🗡️ 刀            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 后端需要新增

### 爬虫/脚本
- [x] `src/scrapers/unbox.ts` — 开箱结果爬虫 (或模拟器)
- [x] `src/processors/unboxProcessor.ts` — 开箱结果处理

### API 路由
- [x] `GET /api/unbox/sessions` — 获取场次列表
- [x] `GET /api/unbox/sessions/:id` — 获取单个场次详情
- [x] `POST /api/unbox/sessions` — 创建新场次 (主播)
- [x] `GET /api/unbox/sessions/:id/odds` — 获取实时赔率
- [x] `POST /api/unbox/sessions/:id/bets` — 提交下注
- [x] `POST /api/unbox/sessions/:id/resolve` — 结算场次
- [x] `POST /api/unbox/sessions/:id/refund` — 退款
- [x] `WS /ws` — 实时推送场次状态和赔率

### WebSocket 事件
```typescript
// 服务端推送事件
interface UnboxEvents {
  'session:created': { sessionId: number; status: string; startTime: Date; endTime: Date | null };
  'session:betting': { sessionId: number; endTime: Date | null };
  'session:resolved': { sessionId: number; status: string; result: string | null };
  'odds:update': { sessionId: number; odds: OddsDisplay[] };
  'jackpot:update': { sessionId: number; totalPool: number };
}
```

---

## 智能合约

### UnboxJackpot.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UnboxJackpot is ReentrancyGuard, Ownable {
    enum SessionStatus { WAITING, BETTING, OPENING, RESOLVED, REFUNDABLE }
    enum Prediction { BLUE, GOLD, KNIFE }
    
    struct Session {
        address host;
        SessionStatus status;
        uint256 totalPool;
        uint256 bettingEndTime;
        Prediction result;
    }
    
    uint256 public sessionCount;
    
    mapping(uint256 => Session) public sessions;
    mapping(uint256 => mapping(Prediction => uint256)) public optionPools;
    mapping(uint256 => mapping(address => mapping(Prediction => uint256))) public userBets;
    
    event SessionCreated(uint256 indexed sessionId, address host);
    event BetPlaced(uint256 indexed sessionId, address user, Prediction prediction, uint256 amount);
    event SessionResolved(uint256 indexed sessionId, Prediction result, uint256 prizePool);
    event SessionRefundable(uint256 indexed sessionId);
    event RefundClaimed(uint256 indexed sessionId, address user, uint256 amount);
    
    function createSession() external returns (uint256) {
        sessionCount++;
        sessions[sessionCount] = Session({
            host: msg.sender,
            status: SessionStatus.BETTING,
            totalPool: 0,
            bettingEndTime: block.timestamp + 60,
            result: Prediction.BLUE
        });
        
        emit SessionCreated(sessionCount, msg.sender);
        return sessionCount;
    }
    
    function placeBet(uint256 sessionId, Prediction prediction) external payable nonReentrant {
        Session storage s = sessions[sessionId];
        require(s.status == SessionStatus.BETTING, "Not in betting phase");
        require(block.timestamp < s.bettingEndTime, "Betting closed");
        
        s.totalPool += msg.value;
        optionPools[sessionId][prediction] += msg.value;
        userBets[sessionId][msg.sender][prediction] += msg.value;
        
        emit BetPlaced(sessionId, msg.sender, prediction, msg.value);
    }
    
    function resolveSession(uint256 sessionId, Prediction result) external onlyOwner {
        Session storage s = sessions[sessionId];
        s.result = result;
        
        uint256 winnerPool = optionPools[sessionId][result];
        
        if (winnerPool == 0) {
            // 无人猜中 → 标记为可退款
            s.status = SessionStatus.REFUNDABLE;
            emit SessionRefundable(sessionId);
        } else {
            // 有人猜中 → 正常结算
            s.status = SessionStatus.RESOLVED;
            emit SessionResolved(sessionId, result, s.totalPool);
        }
    }
    
    // 猜中时领取奖励
    function claimReward(uint256 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId];
        require(s.status == SessionStatus.RESOLVED, "Not resolved");
        
        uint256 userBet = userBets[sessionId][msg.sender][s.result];
        require(userBet > 0, "No winning bet");
        
        uint256 winnerPool = optionPools[sessionId][s.result];
        uint256 reward = (userBet * s.totalPool) / winnerPool;
        
        userBets[sessionId][msg.sender][s.result] = 0;
        payable(msg.sender).transfer(reward);
    }
    
    // 无人猜中时领取退款
    function claimRefund(uint256 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId];
        require(s.status == SessionStatus.REFUNDABLE, "Not refundable");
        
        // 计算用户在所有选项的下注总额
        uint256 totalBet = 0;
        for (uint8 i = 0; i < 3; i++) {
            totalBet += userBets[sessionId][msg.sender][Prediction(i)];
            userBets[sessionId][msg.sender][Prediction(i)] = 0;
        }
        
        require(totalBet > 0, "Nothing to refund");
        payable(msg.sender).transfer(totalBet);
        
        emit RefundClaimed(sessionId, msg.sender, totalBet);
    }
}
```

---

## 待开发清单

### 智能合约
- [ ] `UnboxJackpot.sol` — 开箱 Jackpot 池合约
- [ ] 合约测试用例

### 后端
- [x] 开箱结果爬虫/模拟器
- [x] Session 管理 API
- [x] 实时赔率计算服务
- [x] WebSocket 推送

### 前端
- [ ] 直播播放器组件
- [ ] Jackpot 池显示
- [ ] 下注面板
- [ ] 倒计时组件
- [ ] 历史开奖记录
