# 1030
課堂程式練習

## 啟動網站

```bash
npm install
npm run dev
```

網站使用 Firebase JavaScript SDK 連到 `website-design-cdb11` 專案。登入 Google 帳戶後，行程和習慣會即時同步到台灣 `asia-east1` 的 Enterprise Firestore `planner` 資料庫。第一次登入會建立範例行程和習慣；每位使用者的資料都存放在自己的 Firestore 子集合中。

## AI 行程小助手

登入後可使用右下角的浮動 AI 助手。使用者送出訊息時，網站會將未來 14 天的行程、待辦與習慣摘要傳送至 Firebase AI Logic 的 Gemini Developer API，取得安排建議。對話只保存在目前分頁記憶體，不會寫入 Firestore；助手也不能直接新增或修改資料。

AI 請求使用 Firebase App Check 與網域限定的 reCAPTCHA Enterprise 金鑰驗證。此金鑰是網站公開設定，限 `yangyun-66.github.io` 使用。
