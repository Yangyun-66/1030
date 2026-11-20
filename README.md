# 1030
課堂程式練習

## 啟動網站

```bash
npm install
npm run dev
```

網站使用 Firebase JavaScript SDK 連到 `website-design-cdb11` 專案。登入 Google 帳戶後，行程和習慣會即時同步到台灣 `asia-east1` 的 Enterprise Firestore `planner` 資料庫。第一次登入會建立範例行程和習慣；每位使用者的資料都存放在自己的 Firestore 子集合中。
