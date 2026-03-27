# Vibe Planner — 專案說明

## 產品定位

具有 Vibe Coding 流程規劃模板的**個人專案開發平台**。

目標用戶：只有我自己（個人工具）。
核心價值：把「思考過程」結構化——靈感、LLM 對話、待執行任務，全部整合在同一個專案空間，按開發流程階段組織。

---

## 核心資料結構（目前實作版本）

```
Project
├── id, name, createdAt, updatedAt
├── currentPhase: 'research' | 'plan' | 'execute' | 'review'
├── conversations: Conversation[]   // 每個 phase 各自獨立
├── tickets: Ticket[]
├── docs: ProjectDoc[]              // 專案文件區
├── githubRepoUrl?: string          // 連結的 GitHub repo
└── githubContext?: string          // 從 GitHub 抓取的快照（README + 檔案結構 + 關鍵檔案）

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
├── reason: string                  // 背景說明（2-4句）
├── acceptanceCriteria?: string     // 完成定義（PM 開單時填入）
├── phase: Phase
├── assignedTo: string | null       // Role.id（動態角色，非硬編碼）
├── status: 'todo' | 'in_progress' | 'done'
├── createdBy: 'user' | 'pm'
├── contextSnippet: string          // 來源對話引用原文
├── priority?: 'high' | 'medium' | 'low'
├── workLogs?: WorkLog[]            // Slack-style 工作進度記錄
└── createdAt

WorkLog
├── id, content, createdAt
└── author?: string

Role（動態角色，可自訂）
├── id, name, color
└── createdAt

ProjectDoc
├── id, projectId
├── title: string
├── content: string                 // markdown 純文字
├── createdAt, updatedAt
```

---

## Agents 系統

### 四個流程階段 Agent（對話用，均串接 Claude API 串流）

每個階段有詳細的 system prompt，包含角色定義、行為規範、明確的「不做的事」：

| Phase | 角色 | 職責 |
|-------|------|------|
| research | 好奇的提問者 | 只問問題不給答案，每輪最多 2 問，釐清模糊想法 |
| plan | 嚴謹的架構師 | 先質疑假設再建議，提供 trade-offs，ASCII 架構圖 |
| execute | 務實的工程師 | 直接給完整可執行程式碼，不給偽代碼 |
| review | 挑剔的 Reviewer | 按 🔴🟡🟢 分類嚴重度，每個問題說明「是什麼→為什麼→怎麼改」 |

#### Context 注入機制
- **GitHub context**：Sync 後注入 system prompt，agent 被告知要主動參考（README + 檔案樹 + 關鍵檔案內容）
- **跨 phase 歷史**：每次對話帶入其他 phase 最後 8 則訊息作為背景，agent 了解整個專案來龍去脈

### PM Agent（Ticket 分析用）

- 唯一串接 Claude API 的分析性 agent
- 輸出豐富 ticket：`title / reason（2-4句）/ acceptanceCriteria / contextSnippet / assignTo / priority`
- assign 的角色為動態 Role（由用戶自訂），非硬編碼

### People / Roles 系統

- 角色可自訂（名稱、顏色），左側欄 People 區管理
- 預設四個角色：工程師、設計師、行銷、市調
- 點擊角色 → 跨專案 RoleBoard，顯示該角色被指派的所有工作
- 每張 Ticket 可展開 Slack-style Work Log，記錄執行歷史

---

## PM Agent 規格

### 觸發方式
手動點「請 PM 整理工作」按鈕（在 Ticket panel header）。

### 執行流程
1. 讀取當前專案所有 phase 的對話記錄 + 現有 tickets
2. 呼叫 Claude API 分析
3. 彈出確認 panel：PM 分析思路 + 提議的新 tickets（可展開詳情）
4. 使用者勾選要建立哪幾張 → 點確認 → 建立

### PM 輸出格式
```json
{
  "thinking": "分析思路（2-4句）",
  "tickets": [
    {
      "title": "ticket 標題（10字以內）",
      "reason": "背景說明（2-4句：為什麼需要、來自哪段對話、完成後效益）",
      "acceptanceCriteria": "完成定義（2-3條可驗證條件，- 開頭）",
      "contextSnippet": "從對話直接引用的關鍵原文（或空字串）",
      "assignTo": "角色名稱（必須符合可用角色清單）",
      "priority": "high | medium | low"
    }
  ]
}
```

### API 規格
- Model: `claude-haiku-4-5-20251001`
- Max tokens: 2000
- API key 在後端處理，不暴露前端

---

## 功能清單（實作進度）

### 已完成 ✅
- [x] 專案 CRUD（建立、切換、列表、刪除）
- [x] 四個 phase tab，各自獨立對話串
- [x] 每個 phase 有詳細 system prompt（含行為規範）
- [x] AI 對話串流（SSE，逐字輸出）
- [x] Refresh Session 按鈕（清空當前 phase 對話）
- [x] Ticket 建立、完成、刪除、inline 編輯
- [x] Ticket 按 phase 分組顯示（可展開/收合）
- [x] Ticket assign 給動態角色
- [x] PM agent 串接 Claude API（開單 + assign）
- [x] PM 開單後需用戶確認才建立
- [x] PM 輸出豐富 ticket 內容（reason + acceptanceCriteria + contextSnippet）
- [x] 對話訊息可轉成 ticket
- [x] GitHub repo 連結（Sync 抓取 README、檔案樹、關鍵檔案）
- [x] GitHub context 注入 AI 對話 system prompt
- [x] 跨 phase 對話歷史注入（agent 了解整個專案脈絡）
- [x] 動態 People/Roles 系統（可自訂名稱、顏色）
- [x] 跨專案 RoleBoard（點角色看所有被指派的工作）
- [x] Ticket Work Log（Slack-style 執行歷史記錄）
- [x] Project Docs 區（markdown 文件，Docs tab）
- [x] RWD（桌面三欄、手機漢堡選單 + bottom tab bar）
- [x] Zeabur 部署（Dockerfile multi-stage build）
- [x] Supabase adapter（寫好，待用戶設定 env vars 啟用）

### 暫緩 / 未來
- 多專案之間的關聯
- Ticket 截止日期
- Agent skill 匯入（GitHub repo YAML format）
- Docs 區 markdown 渲染預覽
- 自動摘要跨 phase 重點（目前是帶原始訊息）

---

## 技術架構

### Tech Stack
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **State**: Zustand
- **Storage**: localStorage（預設）→ Supabase（設定 env vars 後自動切換）
- **AI**: Anthropic SDK，`claude-haiku-4-5-20251001`，SSE streaming
- **部署**: Zeabur，Dockerfile multi-stage (node:20-alpine)

### Storage 抽象層
```typescript
interface StorageAdapter {
  getProjects() / saveProject() / deleteProject()
  saveConversation() / saveTicket() / updateTicket() / deleteTicket()
  getRoles() / saveRole() / deleteRole()
  saveDoc() / deleteDoc()
}
```
工廠函式 `getStorage()` 根據 `NEXT_PUBLIC_SUPABASE_URL` 自動選擇 adapter。

### API Routes
```
POST /api/chat                  → AI 對話串流（SSE）
POST /api/pm/analyze            → PM 開單分析
POST /api/github/fetch-context  → GitHub repo 快照
```

### Supabase 資料表
`projects / conversations / messages / tickets / work_logs / roles / project_docs`
Migration SQL: `supabase/schema.sql`

---

## 啟用 Supabase

1. 在 [supabase.com](https://supabase.com) 建立新 Project
2. Dashboard → SQL Editor → 執行 `supabase/schema.sql`
3. 在 `.env.local` 填入：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=your_key
```
4. 重啟 dev server，資料自動寫入 Supabase

---

## 常用指令

```bash
# 開發
npm run dev

# 型別檢查
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```

---

## 設計規範

- 深色主題，工具感
- 字體：等寬字體（font-mono）為主
- Accent: `#7c6dfa`

Phase 顏色：
- research: `#60a5fa`（藍）
- plan: `#a78bfa`（紫）
- execute: `#4ade80`（綠）
- review: `#fbbf24`（黃）
- PM / Docs: `#a78bfa`（紫）

---

## 設計原則

- 你主導決策，agent 輔助分析和執行機械性工作
- Research agent 只問問題，不給答案
- Execute agent 直接給可執行程式碼，不給虛擬碼
- PM agent 開的每張 ticket 都要能讓執行者獨立理解背景和完成定義
