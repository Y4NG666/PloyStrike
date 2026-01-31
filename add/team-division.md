# 5人团队分工建议

## 总览

由于有两个模块，分工需要更加紧凑。以下是针对**双模块架构**的分工建议。

---

## 分工表

| 成员 | 角色 | 主要职责 | 优先级 |
|------|------|----------|--------|
| **A** | Solidity Lead | 模块 A 合约 + Vault 安全 | ⭐⭐⭐ |
| **B** | Solidity Support | 模块 B 合约 | ⭐⭐⭐ |
| **C** | Backend | 两套爬虫/脚本 + API | ⭐⭐⭐ |
| **D** | Frontend - Component | 通用组件 + 模块 A 页面 | ⭐⭐ |
| **E** | Frontend - Live & PM | 模块 B 页面 + PPT + 视频 | ⭐⭐⭐ |

---

## 详细职责

### 成员 A — Solidity Lead

**负责内容:**
- [ ] `PriceOptionPool.sol` — 价格期权池合约
- [ ] `PriceOracle.sol` — 价格预言机合约
- [ ] `Vault.sol` — 资金库合约 (关键！涉及资金安全)

**技术要点:**
- 合约安全性 (ReentrancyGuard, AccessControl)
- 金融衍生品逻辑 (二元期权结算)
- Gas 优化

**交付物:**
- 合约代码 + 测试用例
- 部署脚本 (Hardhat/Foundry)
- ABI 文件给前端

---

### 成员 B — Solidity Support

**负责内容:**
- [ ] `UnboxJackpot.sol` — 开箱 Jackpot 池合约
- [ ] 合约测试用例

**技术要点:**
- 彩池逻辑 (Parimutuel)
- **滚存机制** — 这是核心卖点！
- 与 Oracle 的配合

**交付物:**
- 合约代码 + 测试用例
- 部署脚本
- ABI 文件给前端

---

### 成员 C — Backend (重活！)

**负责内容:**

*模块 A (价格预测):*
- [x] `src/scrapers/buff163.ts` — Buff 价格爬虫 ✅ 已完成
- [x] `src/scrapers/steam.ts` — Steam 价格爬虫 ✅ 已完成
- [x] `src/oracle/vwap.ts` — VWAP 算法 ✅ 已完成
- [x] `src/oracle/relayer.ts` — 链上交易发送 ✅ 已完成
- [x] `scripts/price_monitor.py` — 价格监控 ✅ 已完成
- [x] 结算 Keeper 脚本 (调用合约 settle)

*模块 B (开箱预测):*
- [x] `src/scrapers/unbox.ts` — 开箱结果爬虫/模拟器
- [x] `src/processors/unboxProcessor.ts` — 结果处理
- [x] Session 管理 API
- [x] 实时赔率计算
- [x] WebSocket 推送

**建议顺序:**
> 先写模块 B 的脚本（演示效果好），再写模块 A 的

**交付物:**
- API 文档
- WebSocket 事件文档
- 部署说明

---

### 成员 D — Frontend - Component

**负责内容:**

*通用组件:*
- [ ] 钱包连接 (WalletButton)
- [ ] 充值/提现弹窗
- [ ] 导航栏 (Navbar)
- [ ] Toast 通知
- [ ] Modal 弹窗

*模块 A 页面:*
- [ ] K 线图组件 (推荐 TradingView Lightweight Charts)
- [ ] 当前价格显示
- [ ] 下注面板
- [ ] 持仓列表
- [ ] 交易历史

**技术选型:**
- React / Next.js
- wagmi + viem (钱包)
- TailwindCSS / Chakra UI (样式)
- TradingView Lightweight Charts (K线)

**交付物:**
- 组件库
- 模块 A 完整页面

---

### 成员 E — Frontend - Live & PM

**负责内容:**

*模块 B 页面:*
- [ ] 直播播放器组件 (Twitch/YouTube embed)
- [ ] Jackpot 池显示 (醒目！动画！)
- [ ] 下注面板 + 赔率显示
- [ ] 倒计时组件
- [ ] 历史开奖记录

*项目管理:*
- [ ] PPT 制作
- [ ] Demo 视频剪辑
- [ ] 项目文档

**技术要点:**
- iframe 跨域处理
- WebSocket 实时更新
- 动画效果 (Framer Motion)

**交付物:**
- 模块 B 完整页面
- 演示 PPT
- Demo 视频

---

## 时间线建议 (7天黑客松)

```
Day 1-2: 搭建基础
├── 成员 A: Vault 合约 + 价格预言机合约
├── 成员 B: Unbox Jackpot 合约
├── 成员 C: 后端框架 + 模块 B 爬虫
├── 成员 D: 前端框架 + 通用组件
└── 成员 E: 页面设计 + 直播集成

Day 3-4: 核心功能
├── 成员 A: 价格期权池合约 + 测试
├── 成员 B: 滚存逻辑 + 测试
├── 成员 C: Session API + WebSocket
├── 成员 D: K线图 + 下注面板
└── 成员 E: Jackpot 显示 + 下注面板

Day 5-6: 集成联调
├── 全员: 前后端对接
├── 全员: 合约部署 (测试网)
└── 全员: Bug 修复

Day 7: 演示准备
├── 成员 E: PPT + Demo 视频
└── 全员: 彩排 + 优化
```

---

## 协作工具建议

| 工具 | 用途 |
|------|------|
| GitHub | 代码版本控制 |
| Notion / Feishu | 文档协作 |
| Figma | UI 设计稿 |
| Discord / 微信 | 即时沟通 |

---

## 降级方案

如果时间紧张，可以简化：

**方案 A — 只做模块 B (开箱 Jackpot)**
- 砍掉模块 A 的价格预测
- 专注把模块 B 做得酷炫
- 演示效果依然很好

**方案 B — 模块 A 用现成预言机**
- 模块 A 不做饰品价格，改做 ETH/BTC 价格
- 使用 Chainlink 喂价，省去爬虫开发
- 重点做模块 B
