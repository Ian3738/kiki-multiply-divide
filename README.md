# KIKI 的乘除小達人

> 國小數學「乘除關係」康軒版 155 題互動遊戲。
> 單人練習 + 雙人對戰 + 速度賽 三種模式，仿 [三視圖大挑戰](https://three-view-game.vercel.app/) 的 4 字房間代碼跨裝置對戰。

## 線上玩

➡️ **https://kiki-multiply-divide.vercel.app**

## 三種模式

| 模式 | 玩法 |
|---|---|
| 🧘 **單人練習** | 自己挑題（10/20/30/50/全部）、隨機或依序，純練習 |
| ⚔️ **雙人對戰** | 兩人各自開瀏覽器、用 4 字代碼配對。各自獨立題目流，答對讓對方 −15 HP、答錯自己 −8 HP，先 KO 對方者勝 |
| ⚡ **速度賽** | 兩人看**同一題**搶答 10 題，先答對者得 1 分，分數高者勝 |

## 技術架構

- **Next.js 16 App Router** + TypeScript + Tailwind 4
- **Upstash Redis** 房間 store（沒設定時 fallback in-memory，跨 lambda instance 不會持久）
- **API routes**：
  - `POST /api/rooms` 建對戰房間
  - `GET/POST /api/rooms/[roomId]` 查狀態 / 提交答案
  - `POST /api/races` 建速度賽房間
  - `GET/POST /api/races/[raceId]` 查狀態 / 提交答案 / 推進回合
- **題庫**：`lib/questions.ts` 包含 155 題（從 `乘除關係康軒題庫.csv` 用 Python 腳本動態產生 distractor）
- **房間狀態同步**：前端用 polling（對戰 1.5s，速度賽 0.8s）

## 連 Upstash KV（必做，否則跨裝置對戰會失效）

CLI 無法直接 attach 既有 Upstash 到新 project，需要在 Dashboard 操作（30 秒）：

1. 開 https://vercel.com/ian3738s-projects/kiki-multiply-divide/stores
2. 點 **Connect Store** → 選 **Upstash for Redis** → 選現有的 `upstash-kv-cyclamen-canvas`（或新建一個）
3. Vercel 會自動加上 `KV_REST_API_URL` 跟 `KV_REST_API_TOKEN` env var，並觸發 redeploy

連好後對戰跟速度賽就能在不同裝置間運作。
key namespace 用 `kiki:room:` 跟 `kiki:race:`，跟 three-view-game 的 `tvg:room:v2:` 完全隔離。

## 題庫來源

原始 CSV 在 `~/Desktop/遊戲/乘除關係康軒題庫.csv`（不在此 repo），來自康軒版國小數學「乘除關係」單元的 155 題。

題目原本只有單一答案，這個專案用以下規則動態產生 3 個錯誤選項（distractor）：

| 答案類型 | 範例 | distractor |
|---|---|---|
| 純數字 | `74` | `76`, `72`, `148` (±N, ±10) |
| 帶單位 | `18個字` | `19個字`, `17個字`, `20個字` |
| 複合句 | `161盒，剩下1個` | `162盒，剩下1個`, `160盒，剩下1個`, `161盒，剩下3個` |
| 兩個數字 | `8，7` | `8，9`, `8，5`, `10，7` |
| 字母 | `乙` | 甲、丙、丁 |
| ○/× | `○` | × |

題目題幹前會加 `【應用題·中】` 之類的類型/難度標籤幫助玩家識別。
