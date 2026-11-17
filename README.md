# 第八課《四季的歌聲》寫作草稿與自動批改網站

整合新版分季引導單（1～29 號座號選單、春／夏／秋／冬四段寫作、7 句結構規則秒檢、Gemini AI 秉辰師細批、教師管理後台與 Excel 匯出），採用 **GitHub Pages + Supabase + Edge Function (`seasons-essay`)** 全雲端架構，上課免開教師電腦。

## 檔案結構
- `index.html`：學生寫作草稿主頁（1～29 號下拉選單、四季分頁、注音狀聲詞點選填入、7 句結構公式、可收合示範詩、免密碼自動批改、整篇作品預覽）
- `teacher.html`：教師後台（沿用既有 `teacher_config` 密碼登入、1～29 號進度總覽、批改詳情彈窗、清空測試資料、匯出全班 `.xlsx`）
- `js/config.js`：Supabase 設定與四季教材資料
- `js/grader.js`：前端即時 7 句結構批改引擎（離線保底）
- `supabase/migrations/20261117000001_create_seasons_essays.sql`：`seasons_essays` 資料表與 RLS 設定
- `supabase/functions/seasons-essay/index.ts`：Supabase Edge Function（已完成部署至 `ppdgubracsneozahujxl`）

---

## 上線前最後 2 個步驟（因工具確認自動取消，請於 Supabase 後台完成）

1. **建立資料表（約 10 秒）**：  
   打開 Supabase Dashboard → `xueli-quiz` (`ppdgubracsneozahujxl`) → **SQL Editor**，貼上並執行 `supabase/migrations/20261117000001_create_seasons_essays.sql` 內容。

2. **設定 AI 批改金鑰（選用，未設前會以「7 句結構規則引擎」自動批改）**：  
   打開 Supabase Dashboard → **Edge Functions** → **Secrets** → 新增 Secret：
   - Name：`GEMINI_API_KEY`
   - Value：填入你的 Gemini API Key（支援多把金鑰以半形逗號 `,` 分隔自動輪替防 429；可用 `AI tutor for 402/app.py` 裡的金鑰）

---

## 發布學生端到 GitHub Pages（例）
```bash
cd "seasons-essay"
git init
git add .
git commit -m "feat: add L8 seasons essay drafting and grading site"
# 接著建立 GitHub Repo 並推上 main 後開啟 GitHub Pages
```
學生連 `https://<帳號>.github.io/<repo>/`，教師連 `https://<帳號>.github.io/<repo>/teacher.html` 即可使用。
