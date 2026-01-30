# 通用基础模块 (Common)

## 概述
两个模块共享的基础设施和组件

---

## F1. 钱包连接

### 支持钱包
| 钱包 | 优先级 | 说明 |
|------|--------|------|
| MetaMask | **必须** | 最主流的 EVM 钱包 |
| OKX Wallet | 建议 | 亚洲用户多 |
| WalletConnect | 可选 | 支持更多钱包 |

### 技术方案
推荐使用 **wagmi + viem** (React) 或 **ethers.js**

```typescript
// hooks/useWallet.ts
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask, walletConnect } from 'wagmi/connectors';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const connectMetaMask = () => connect({ connector: metaMask() });
  const connectWalletConnect = () => connect({ connector: walletConnect({ projectId: '...' }) });

  return {
    address,
    isConnected,
    connectMetaMask,
    connectWalletConnect,
    disconnect,
  };
}
```

### 前端组件
```tsx
// components/WalletButton.tsx
const WalletButton = () => {
  const { address, isConnected, connectMetaMask, disconnect } = useWallet();

  if (isConnected) {
    return (
      <button onClick={disconnect}>
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  return <button onClick={connectMetaMask}>Connect Wallet</button>;
};
```

---

## F2. 资产管理

### 充值/提现流程
```
充值 (Deposit):
用户钱包 USDT ──> approve() ──> deposit() ──> Vault 合约

提现 (Withdraw):
Vault 合约 ──> withdraw() ──> 用户钱包 USDT
```

### Vault 合约
```solidity
// contracts/Vault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable usdt;
    
    mapping(address => uint256) public balances;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    
    constructor(address _usdt) {
        usdt = IERC20(_usdt);
    }
    
    function deposit(uint256 amount) external nonReentrant {
        usdt.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        usdt.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}
```

### API 路由
```typescript
// 已有余额查询
GET /api/user/balance?address=0x...

// 交易历史
GET /api/user/transactions?address=0x...
```

### 后端实现状态
- [x] `GET /api/user/balance` — 余额查询
- [x] `GET /api/user/transactions` — 交易历史

### 前端组件
```tsx
// components/BalancePanel.tsx
const BalancePanel = () => {
  const { address } = useWallet();
  const { data: balance } = useBalance(address);

  return (
    <div className="balance-panel">
      <div className="balance">{balance?.formatted} USDT</div>
      <div className="actions">
        <button onClick={openDepositModal}>充值</button>
        <button onClick={openWithdrawModal}>提现</button>
      </div>
    </div>
  );
};
```

---

## F3. 个人历史战绩看板

### 数据结构
```typescript
interface UserStats {
  address: string;
  totalBets: number;         // 总下注次数
  totalWins: number;         // 总获胜次数
  totalLosses: number;       // 总失败次数
  totalWagered: number;      // 总下注金额
  totalProfit: number;       // 总盈亏
  winRate: number;           // 胜率 (%)
  
  // 按模块细分
  priceMarket: {
    bets: number;
    wins: number;
    profit: number;
  };
  unboxJackpot: {
    bets: number;
    wins: number;
    profit: number;
  };
}
```

### API 路由
```typescript
// 用户统计
GET /api/user/stats?address=0x...

// 历史记录
GET /api/user/history?address=0x...&module=price|unbox&page=1&limit=20
```

### 后端实现状态
- [x] `GET /api/user/stats` — 用户统计
- [x] `GET /api/user/history` — 历史记录

### 前端组件
```tsx
// components/UserDashboard.tsx
const UserDashboard = () => {
  const { address } = useWallet();
  const { data: stats } = useUserStats(address);
  const { data: history } = useUserHistory(address);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard title="Total Bets" value={stats?.totalBets} />
        <StatCard title="Win Rate" value={`${stats?.winRate}%`} />
        <StatCard title="Total Profit" value={`$${stats?.totalProfit}`} />
      </div>
      
      <div className="history-table">
        <HistoryTable data={history} />
      </div>
    </div>
  );
};
```

---

## F4. 积分系统 (可选 - 黑客松加分项)

### 代币设计
- 代币名: **$POLY**
- 用途: 抵扣手续费、治理投票、空投资格

### 积分获取方式
| 行为 | 积分 |
|------|------|
| 首次连接钱包 | 100 $POLY |
| 每次下注 | 下注金额 × 1% |
| 邀请好友 | 50 $POLY |
| 连续签到 | 10-100 $POLY |

### 积分消耗
| 用途 | 消耗 |
|------|------|
| 抵扣手续费 | 1 $POLY = $0.01 |
| 兑换 NFT | 1000+ $POLY |

---

## 非功能性需求

### N1. 实时性 (Latency)

| 模块 | 延迟要求 | 解决方案 |
|------|----------|----------|
| 模块 A (价格) | < 30秒 | 可接受，Cron Job |
| 模块 B (开箱) | < 15秒 | **关键！** WebSocket + 优化脚本 |

**模块 B 延迟优化:**
```typescript
// 使用 WebSocket 而非轮询
// 后端抓取结果后立即推送

// 链上操作
// 使用 Polygon (区块时间 ~2秒)
// 使用 EIP-1559 动态 Gas

// 脚本优化
// 预连接 RPC
// 批量处理
```

### N2. 数据准确性 (Integrity)

**价格异常值过滤:**
```typescript
// backend/src/oracle/validator.ts
function validatePrice(newPrice: number, historicalPrices: number[]): boolean {
  const avg = mean(historicalPrices);
  const stdDev = standardDeviation(historicalPrices);
  
  // 价格偏离超过 3 个标准差则拒绝
  if (Math.abs(newPrice - avg) > 3 * stdDev) {
    console.warn(`Price ${newPrice} rejected: too far from mean ${avg}`);
    return false;
  }
  
  return true;
}
```

### N3. 防作恶 (Security)

| 风险 | 防护措施 |
|------|----------|
| Oracle 被篡改 | 只有授权地址可调用 `resolve()` |
| 重入攻击 | 使用 `ReentrancyGuard` |
| 前端被篡改 | 合约校验所有输入 |
| 大额异常下注 | 设置单笔限额 |

---

## 前端目录结构建议

```
frontend/
├── components/
│   ├── common/
│   │   ├── WalletButton.tsx
│   │   ├── BalancePanel.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Navbar.tsx
│   ├── price/
│   │   ├── PriceChart.tsx
│   │   ├── BetPanel.tsx
│   │   └── PositionList.tsx
│   └── unbox/
│       ├── LivePlayer.tsx
│       ├── JackpotDisplay.tsx
│       ├── BettingPanel.tsx
│       └── OddsDisplay.tsx
├── hooks/
│   ├── useWallet.ts
│   ├── useBalance.ts
│   ├── useUserStats.ts
│   └── useWebSocket.ts
├── pages/
│   ├── index.tsx          # 首页
│   ├── price.tsx          # 模块 A
│   ├── unbox.tsx          # 模块 B
│   └── dashboard.tsx      # 个人中心
├── contracts/
│   └── abis/              # 合约 ABI
└── utils/
    ├── format.ts
    └── constants.ts
```

---

## 待开发清单

### 智能合约
- [ ] `Vault.sol` — 资金库合约
- [ ] `PolyToken.sol` — 积分代币 (可选)

### 前端
- [ ] 钱包连接组件
- [ ] 充值/提现弹窗
- [ ] 个人中心页面
- [ ] 统一导航栏
- [ ] Toast 通知组件

### 后端
- [x] 用户统计 API
- [x] 历史记录 API
