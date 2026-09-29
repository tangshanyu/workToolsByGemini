# SQL Dev Toolkit

以 PoorSQL 為核心的 SQL 工具箱，使用 Material You 動態色彩。提供 SQL 格式化、SQL 轉 Java、參數替換、問號轉換，以及原有的資料整理工具。

## 本機啟動

使用 Node.js 24 與 npm。不需要 API key。

```sh
npm ci
npm run dev
```

開啟終端機顯示的本機網址，預設為 `http://127.0.0.1:3000`。入口為 SQL 格式化；所有工具列表位於 `#/tools`。

## 檢查與建置

```sh
npm run check
npm run preview
```

`check` 執行 strict TypeScript、回歸測試與正式建置。正式檔案在 `dist/`，可部署到根目錄或子目錄（相對 base）。不要將 dev／preview server 當作正式服務。

## 第一階段

- PoorSQL：共用背景格式化引擎、逾時與取消、語法警示、縮排／逗號／清單等設定。
- 語法預覽及明確的文字編輯模式；複製目前內容，提供純文字與 Word 彩色 HTML。
- 主題：六種配色、自訂 seed color、淺色／深色／跟隨系統。
- Java：跳脫引號與反斜線，每段 sb.append 以空格串接，不產生排版用的 `\n`；SQL 行註解轉為區塊註解，避免吞掉後面的 SQL。字串與引用識別字內具有意義的換行以 `(char)10`／`(char)13` 保留；欄位解析略過括號內的逗號。
- 參數：略過 SQL 字串、識別字與註解中的問號；支援含逗號的引號參數；安全保留 `$&`、單引號與空值。
- CSS 在建置時產生，無 Tailwind CDN；其他工具按路由載入。

偏好儲存在 `sql-toolkit.theme`、`sql-toolkit.format-options` 與 `sql-toolkit.word-colors`。不保存 SQL／轉換資料、不呼叫雲端 API；切換工具或重新整理會清除目前工具的輸入。格式化是排版工具，不是完整的資料庫語法驗證；PoorSQL 主要對應 T-SQL。資料量上限 100 萬字元，處理逾時 30 秒。

Word 預設配色依使用者提供的截圖：SELECT／FROM／WHERE／IS 等關鍵字藍色、字串亮紅色、註解青色，AND／OR／ON／NULL 與運算符灰色，識別字黑色。截圖未出現函數及數字，這兩類沿用紫色與青綠色。

四個 SQL 工具的「格式設定」同時提供排版與 Word 配色。八類色彩均可透過選色器或 HEX 色碼調整，設定共用且自動保存；「套用截圖配色」僅重設顏色，「還原預設」重設排版與顏色。白底範例即時顯示效果，結果區的「Word 預覽」顯示目前 SQL 的複製配色；調色不需重新格式化，也不會清除編輯中的結果。一般語法預覽仍配合介面淺／深色主題。

Word HTML 使用 Courier New 與一般字重，中文註解指定標楷體，不受介面主題影響。實際貼入 Word 的效果仍取決於 Word 版本、字型及貼上選項；選擇保留來源格式。格式化後的編輯內容需重新格式化才會更新著色。

## 後續階段

CSV 資料保真、定長文字的完整編碼處理、VLookup 複合 key、Java Map 自動偵測及大型 diff 演算法仍依健康檢查報告排程。本次保留這些工具的既有資料處理行為。

`public/poorsql.js` 沿用原專案的 vendored formatter；升級時需同時驗證 parser／色彩 HTML／格式設定與第三方授權資訊。
