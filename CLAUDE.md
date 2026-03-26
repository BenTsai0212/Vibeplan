# Vibe Planner — 專案說明

## 產品定位

具有 Vibe Coding 流程規劃模板的**個人專案開發平台**。

目標用戶：只有我自己（個人工具）。
核心價值：把「思考過程」結構化——靈感、LLM 對話、待執行任務，全部整合在同一個專案空間，按開發流程階段組織。

---

## 核心資料結構

```
Project
├── id, name, createdAt, updatedAt
├── currentPhase: 'research' | 'plan' | 'execute' | 'review'
├── conversations: Conversation[]   // 每個 phase 各自獨立
└── tickets: Ticket[]

Conversation
├── id, projectId
├── phase: Phase
├── messages: Message[]
└── createdAt

Message
├── id, role: 'user' | 'assistant'
├── content: string
└── createdAt

Ticket
├── id, projectId
├── title: string
├── reason: string               // 為什麼需要這個 ticket
├── phase: Phase                 // 在哪個階段建立
├── assignedTo: AgentId | null
├── status: 'todo' | 'in_progress' | 'done'
├── createdBy: 'user' | 'pm'    // 手動建立 or PM agent 開單
├── contextSnippet: string       // 來源對話摘要
└── createdAt
```

---

## Agents 系統

### 四個流程階段 Agent（對話用）

每個階段有專屬 system prompt，LLM 扮演不同角色：

| Phase | 角色 | 職責 |
|-------|------|------|
| research | 好奇的提問者 | 透過提問釐清模糊想法，不給答案 |
| plan | 嚴謹的架構師 | 挑戰假設、找盲點、產出實作計劃 |
| execute | 務實的工程師 | 聚焦可執行細節，給出具體 code |
| review | 挑剔的 Reviewer | 找安全疑慮、edge case、技術債 |

### 四個專業 Agent（ticket 分析用）

| Agent | ID | 職責 |
|-------|----|------|
| 產品經理 PM | pm | **唯一串 Claude API**。讀取 context 開單、assign |
| 前端工程師 | fe | UI 元件、狀態管理、效能 |
| 後端工程師 | be | API 設計、資料庫、安全性 |
| UI/UX 設計師 | ux | 使用者流程、視覺設計、一致性 |

---

## PM Agent 規格（最重要）

### 觸發方式
手動點「請 PM 整理工作」按鈕。

### 執行流程
1. 讀取當前專案的對話記錄（所有 phase）+ 現有 tickets
2. 呼叫 Claude API 分析
3. 彈出確認 panel，顯示：PM 分析思路 + 提議的新 tickets
4. 使用者勾選要建立哪幾張 → 點確認 → 建立

### PM System Prompt
```
你是一位資深產品經理，負責分析專案進度並規劃工作分配。

任務：
1. 讀取「專案對話記錄」和「現有 tickets」
2. 找出目前缺少的工作
3. 為每個新工作寫清楚的 ticket，決定 assign 給哪個 agent

可 assign 的 agent：
- frontend（前端工程師）：UI 元件、互動、樣式
- backend（後端工程師）：API、資料庫、邏輯
- ux（UI/UX 設計師）：使用流程、視覺設計
- pm（產品經理）：需求釐清、優先序決策

回應格式（只回傳 JSON，不要其他文字）：
{
  "thinking": "分析思路（中文，2-4句）",
  "tickets": [
    {
      "title": "ticket 標題",
      "reason": "為什麼需要（一句話）",
      "assignTo": "frontend | backend | ux | pm",
      "priority": "high | medium | low"
    }
  ]
}
```

### API 規格
- Model: `claude-haiku-4-5-20251001`（成本低，ticket 分析不需要最強模型）
- Max tokens: 1000
- 注意：API key 必須在後端處理，不能暴露在前端

---

## 功能清單（MVP 範圍）

### 必做
- [ ] 專案 CRUD（建立、切換、列表）
- [ ] 四個 phase tab，各自獨立的對話串
- [ ] 每個 phase 有對應的 system prompt
- [ ] Ticket 建立、完成、刪除
- [ ] Ticket assign 給 agent
- [ ] PM agent 串接 Claude API（開單 + assign）
- [ ] PM 開單後需用戶確認才建立
- [ ] 對話訊息可轉成 ticket（附帶 context snippet）

### 暫緩
- 多專案之間的關聯
- Ticket 優先序 / 截止日期
- 對話跨 phase 參考
- Agent skill 匯入（GitHub repo YAML format）
- 雲端同步（先用 localStorage）

---

## 技術決策

### 資料儲存
**暫時用 localStorage**，key 設計要考慮之後遷移到雲端 DB 的擴展性。

建議用抽象層包一層：
```typescript
interface StorageAdapter {
  getProjects(): Promise<Project[]>
  saveProject(p: Project): Promise<void>
  getTickets(projectId: string): Promise<Ticket[]>
  saveTicket(t: Ticket): Promise<void>
  // ...
}
```

### API 呼叫
PM agent 的 Claude API 呼叫**必須走後端**，不能在前端直接呼叫（API key 安全性）。

建議架構：
```
前端 → POST /api/pm/analyze → 後端呼叫 Claude API → 回傳 tickets JSON
```

### Tech Stack（建議，可調整）
- Frontend: Next.js + TypeScript
- Styling: Tailwind CSS
- Storage: localStorage → 之後換 Supabase
- Backend API: Next.js API routes（輕量）

---

## UI 設計參考

已有可互動的 HTML prototype（`vibe-planner-v3.html`），設計語言：
- 深色主題，工具感
- 字體：Berkeley Mono（等寬）+ Instrument Serif（標題）
- 色系：accent `#7c6dfa`，各 phase 各有顏色

Phase 顏色對應：
- research: `#60a5fa`（藍）
- plan: `#a78bfa`（紫）
- execute: `#4ade80`（綠）
- review: `#fbbf24`（黃）
- PM: `#a78bfa`（與 plan 同色）

---

## 開發建議順序

```
Phase 1 — 骨架
  1. 專案資料結構 + localStorage adapter
  2. 專案列表 + 建立專案
  3. Phase tab 切換 + 各 phase system prompt

Phase 2 — 核心功能
  4. 對話串（每個 phase 獨立）
  5. Ticket CRUD + assign agent
  6. 對話轉 ticket

Phase 3 — PM Agent
  7. 後端 API route（/api/pm/analyze）
  8. PM 分析 + 確認 panel
  9. PM 開單建立 tickets
```

---

## 常用指令（待補）

```bash
# 開發
npm run dev

# 型別檢查
npm run typecheck

# Lint
npm run lint

# 測試
npm run test
```

---

## 備註

這個專案從一段模糊的想法開始，經過對話逐步落地：
- 定位：個人用的 vibe coding 思考外腦
- 最重要的功能：PM agent 根據對話 context 主動開單 + assign
- 其他 agent（前端、後端、UX）目前不串 API，收到 ticket 後給建議即可
- 設計原則：你主導決策，agent 輔助分析和執行機械性工作
