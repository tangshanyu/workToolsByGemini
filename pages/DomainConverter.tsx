import React, { useState, useEffect, useMemo } from 'react';
import { TextArea, Button, PageHeader, OutputBox } from '../components/UI';

// Provided default data in CSV format
const DEFAULT_SOURCE_DATA = `SN,Domain說明,Data type,Excel檔的“型態”,UI【型態】,UI【長度】,備註,Oracle欄位長度
1,<None>,,,,,,
2,ID 及代碼 - OID,Variable multibyte (32),VARCHAR2(32),Text,32,,32
3,ID 及代碼 - 一般文字代碼,Characters (1),CHAR(1),Text,1,,1
4,ID 及代碼 - 文字序號,Variable multibyte (5),NVARCHAR2(5),Text,5,2009/12/25修改,5
5,ID 及代碼 - 投資商品種類,Variable multibyte (10),NVARCHAR2(10),Text,10,,10
6,ID 及代碼 - 統一編號,Variable multibyte (20),NVARCHAR2(20),Text,20,2009/11/09修改,20
7,ID 及代碼 - 單位代碼,Variable multibyte (10),NVARCHAR2(10),Text,10,,10
8,ID 及代碼 - 幣別,Variable multibyte (5),NVARCHAR2(5),Text,5,,5
9,ID 及代碼 - 銀行分行代碼,Variable multibyte (10),NVARCHAR2(10),Text,10,,10
10,ID 及代碼 - 銀行代碼,Variable multibyte (10),NVARCHAR2(10),Text,10,,10
11,ID 及代碼 - 確認碼,Characters (1),CHAR(1),Text,1,,1
12,ID 及代碼 - 選項類別代碼 (N000XX),Variable multibyte (10),NVARCHAR2(10),Text,10,,10
13,ID 及代碼 - 檔案名稱,Variable multibyte (30),NVARCHAR2(30),Text,30,2010/03/10修改,30
14,ID 及代碼 - 證件號碼,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
15,ID 及代碼 - 證券歸戶代碼,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
16,一般文字字串 - GMT時差資料(±HH:MM),Characters (6),CHAR(6),Text,6,2009/10/30修改,6
17,文字說明 - 訊息內容,Variable multibyte (500),NVARCHAR2(500),Text,500,,500
18,文字說明 - 說明、備註 (60-200個字元),Variable multibyte (200),NVARCHAR2(200),Text,200,,200
19,文字說明 - 說明、備註 (60 個字元內),Variable multibyte (60),NVARCHAR2(60),Text,60,,60
20,日期時間 - 時間,Time,Time,Time,n/a,,8
21,日期時間 - 精確日期 (含時分秒),Date,Date,Date,n/a,,26
22,各式代碼 - 人員代碼 (無登入系統權限),Variable multibyte (16),NVARCHAR2(16),Text,16,2012/0620修改,16
23,各式代碼 - 商品代碼,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
24,各式代碼 - 報表代碼,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
25,各式代碼 - 會計子目,Variable multibyte (50),NVARCHAR2(50),Text,50,2011/06/03修改,50
26,各式代碼 - 會計科目,Variable multibyte (12),NVARCHAR2(12),Text,12,,12
27,各式帳號 - 委託人集保境外基金交易平臺帳號,Variable multibyte (16),NVARCHAR2(16),Text,16,,16
28,各式帳號 - 客戶帳戶,Variable multibyte (15),NVARCHAR2(15),Text,15,,15
29,各式帳號 - 集保帳號,Variable multibyte (15),NVARCHAR2(15),Text,15,,15
30,各式帳號 - 銀行帳號,Variable multibyte (50),NVARCHAR2(50),Text,50,2010/5/26修改,50
31,各類代碼 - 信用卡別代碼,Variable multibyte (6),NVARCHAR2(6),Text,6,,6
32,各類代碼 - 程式代碼,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
33,名稱 - 一般名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
34,名稱 - 一般名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
35,名稱 - 一般名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
36,名稱 - 一般英文名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
37,名稱 - 一般英文名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
38,名稱 - 一般英文名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
39,名稱 - 自然人或法人名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
40,名稱 - 自然人或法人名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
41,名稱 - 自然人或法人名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
42,名稱 - 自然人或法人英文名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
43,名稱 - 自然人或法人英文名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
44,名稱 - 自然人或法人英文名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
45,名稱 - 商品名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
46,名稱 - 商品名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
47,名稱 - 商品名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
48,名稱 - 商品英文名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
49,名稱 - 商品英文名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
50,名稱 - 商品英文名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
51,名稱 - 單位組織名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
52,名稱 - 單位組織名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
53,名稱 - 單位組織名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
54,名稱 - 單位組織英文名稱,Variable multibyte (60),NVARCHAR2(60),Text,60,,60
55,名稱 - 單位組織英文名稱 (全稱),Variable multibyte (120),NVARCHAR2(120),Text,120,,120
56,名稱 - 單位組織英文名稱 (簡稱),Variable multibyte (30),NVARCHAR2(30),Text,30,,30
57,地址資料 - 地址 (備註、非郵寄用),Variable multibyte (128),NVARCHAR2(128),Text,128,,128
58,地址資料 - 地址 (郵寄用),Variable multibyte (128),NVARCHAR2(128),Text,128,,128
59,地址資料 - 郵遞區號,Variable multibyte (5),NVARCHAR2(5),Text,5,,5
60,地址資料 - 電子郵件地址,Variable multibyte (50),NVARCHAR2(50),Text,50,,50
61,系統 ID - 使用分支單位,Variable multibyte (10),NVARCHAR2(10),Text,10,,10
62,系統控制代碼 - 控制型態,Variable multibyte (15),NVARCHAR2(15),Text,15,,15
63,系統控制代碼 - 資料狀態,Variable multibyte (1),NVARCHAR2(1),Text,1,,1
64,系統登入帳號 - 使用者代碼,Variable multibyte (32),NVARCHAR2(32),Text,32,,32
65,系統登入帳號 - 使用者登入帳號,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
66,金額及價格 - 金額,"Number (17,2)","NUMBER(17,2)",Number,整數15小數2,2012/03/16修改,17
67,金額及價格 - 計算用精確金額,"Number (21,6)","NUMBER(21,6)",Number,整數15小數6,2012/03/16修改,21
68,金額及價格 - 級距金額,"Number (15,0)","NUMBER(15,0)",Number,整數15小數0,2012/03/16修改,15
69,金額及價格 - 單價,"Number (16,8)","NUMBER(16,8)",Number,整數8小數8,2012/03/16修改,16
70,金額及價格 - 匯率,"Number (14,8)","NUMBER(14,8)",Number,整數6小數8,2012/03/16修改,14
71,格式化字串 - IP 位址,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
72,格式化字串 - 日期 (YYYY/MM/DD),Characters (10),CHAR(10),Text,10,2009/10/23修改,10
73,格式化字串 - 交易序號,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
74,格式化字串 - 年月 (YYYY/MM),Characters (7),CHAR(7),Text,7,2009/10/27修改,7
75,格式化字串 - 西元年 (YYYY),Characters (4),CHAR(4),Text,4,,4
76,格式化字串 - 投資依據、下單指示編號,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
77,格式化字串 - 契約編號,Variable multibyte (15),NVARCHAR2(15),Text,15,,15
78,格式化字串 - 時間 (HH:MM),Characters (5),CHAR(5),Text,5,2009/10/23修改,5
79,格式化字串 - 核准文號,Variable multibyte (50),NVARCHAR2(50),Text,50,,50
80,格式化字串 - 訊息編號,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
81,格式化字串 - 密碼,Variable multibyte (32),NVARCHAR2(32),Text,32,2011/06/01修改,32
82,格式化字串 - 稅籍編號,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
83,格式化字串 - 憑證編號,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
84,浮點數 - 百分比,"Number (18,12)","NUMBER(18,12)",Number,整數6小數12,,18
85,浮點數 - 金額費率,"Number (12,6)","NUMBER(12,6)",Number,整數6小數6,2012/03/16修改,12
86,浮點數 - 單位數、股數、面額,"Number (19,6)","NUMBER(19,6)",Number,整數13小數6,2012/03/16修改,19
87,浮點數 - 匯率加減碼控制,"Number (4,4)","NUMBER(4,4)",Number,整數0小數4,,4
88,國際通用代碼 - BLOOMBERG CODE,Variable multibyte (32),NVARCHAR2(32),Text,32,2022/11/29修改長度,32
89,國際通用代碼 - CUSIP CODE,Variable multibyte (9),NVARCHAR2(9),Text,9,,9
90,國際通用代碼 - ISIN CODE,Variable multibyte (12),NVARCHAR2(12),Text,12,,12
91,國際通用代碼 - LIPPER CODE,Variable multibyte (12),NVARCHAR2(12),Text,12,,12
92,國際通用代碼 - SEDOL CODE,Variable multibyte (7),NVARCHAR2(7),Text,7,,7
93,國際通用代碼 - SWIFT CODE,Variable multibyte (11),NVARCHAR2(11),Text,11,,11
94,電話及傳真 - 行動電話號碼,Variable multibyte (20),NVARCHAR2(20),Text,20,,20
95,電話及傳真 - 傳真號碼,Variable multibyte (30),NVARCHAR2(30),Text,30,,30
96,電話及傳真 - 電話號碼,Variable multibyte (30),NVARCHAR2(30),Text,30,,30
97,整數 - 一般整數、次數,Integer,INT,Number,n/a,,10
98,整數 - 天數,Integer,INT,Number,n/a,,10
99,整數 - 數值有效位數,"Number (1,0)","NUMBER(1,0)",Number,整數1小數0,,1
100,浮點數 - 百分比(大),"Number (21,15)","NUMBER(21,15)",Number,整數6小數15,2012/03/16新增,21
101,ID 及代碼 - 其他0,Variable multibyte (5),NVARCHAR2(5),Text,5,2013/10/31新增,5
102,ID 及代碼 - 其他1,Variable multibyte (10),NVARCHAR2(10),Text,10,2013/10/31新增,10
103,ID 及代碼 - 其他2,Variable multibyte (20),NVARCHAR2(20),Text,20,2013/10/31新增,20
104,ID 及代碼 - 其他02,Variable multibyte (2),NVARCHAR2(2),Text,2,2013/10/31新增,2
105,ID 及代碼 - 其他3,Variable multibyte (30),NVARCHAR2(30),Text,30,2013/10/31新增,30
106,ID 及代碼 - 其他4,Variable multibyte (40),NVARCHAR2(40),Text,40,2013/10/31新增,40
107,ID 及代碼 - 其他5,Variable multibyte (50),NVARCHAR2(50),Text,50,2013/10/31新增,50
108,ID 及代碼 - 其他6,Variable multibyte (60),NVARCHAR2(60),Text,60,2013/10/31新增,60
109,ID 及代碼 - 其他99,Variable multibyte (1024),NVARCHAR2(1024),Text,1024,2013/10/31新增,1024
110,浮點數 - 其他1,"Number (3,2)","NUMBER(3,2)",Number,整數1小數2,2013/10/31新增,3
111,名稱 - 商品英文名稱 (長全稱),Variable multibyte (240),NVARCHAR2(240),Text,240,2015/03/10新增,240
112,浮點數 - 金額費率(大),"Number (14,8)","NUMBER(14,8)",Number,整數6小數8,2017/03/03新增,14
113,格式化字串 - 時間 (HH:MM:SS),Characters (8),CHAR(8),Text,8,2021/03/10新增,8
114,印章圖檔,Binary Large Object(1MB),BLOB(1MB),File,1MB,2021/05/13新增,1048576
115,ID 及代碼 - OID2,Variable multibyte (36),VARCHAR2(36),Text,36,2022/05/04新增,36
116,大量文字,Character Large Object(1MB),CLOB(1MB),Textarea,1MB,2022/10/04新增,1048576
117,國際通用代碼 - MCC CODE,Variable multibyte (4),NVARCHAR2(4),Text,4,2023/11/06新增,4`;

interface DomainInfo {
    uiType: string;
    uiLength: string;
}

const DomainConverter: React.FC = () => {
    const [inputIds, setInputIds] = useState('');
    const [sourceData, setSourceData] = useState(DEFAULT_SOURCE_DATA);
    const [output, setOutput] = useState('');
    const [isSourceVisible, setIsSourceVisible] = useState(false);

    // Build map for quick lookup
    const domainMap = useMemo(() => {
        const map = new Map<string, DomainInfo>();
        
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentVal = '';
        let insideQuote = false;
        
        // CSV Parsing Logic
        const cleanText = sourceData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            const nextChar = cleanText[i + 1];

            if (char === '"') {
                if (insideQuote && nextChar === '"') {
                    // Escaped quote
                    currentVal += '"';
                    i++; 
                } else {
                    insideQuote = !insideQuote;
                }
            } else if (char === ',' && !insideQuote) {
                // End of field
                currentRow.push(currentVal);
                currentVal = '';
            } else if (char === '\n' && !insideQuote) {
                // End of row
                currentRow.push(currentVal);
                rows.push(currentRow);
                currentRow = [];
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        
        // Push last field/row if exists
        if (currentVal || currentRow.length > 0) {
            currentRow.push(currentVal);
            rows.push(currentRow);
        }
        
        rows.forEach((cols, index) => {
            // Skip empty rows or header if present
            if (cols.length === 0) return;
            // Header Check: if first col is 'SN' and it's the first row
            if (index === 0 && cols[0].trim().toUpperCase() === 'SN') return;
            
            // CSV Structure:
            // 0: SN (ID)
            // 1: Domain說明
            // 2: Data type
            // 3: Excel檔的“型態”
            // 4: UI【型態】
            // 5: UI【長度】
            // 6: 備註
            // 7: Oracle欄位長度

            if (cols.length >= 6) {
                const id = cols[0]?.trim();
                const uiType = cols[4]?.trim() || '';
                const uiLength = cols[5]?.trim() || '';
                
                if (id) {
                    map.set(id, { uiType, uiLength });
                }
            }
        });
        return map;
    }, [sourceData]);

    const handleConvert = () => {
        if (!inputIds.trim()) {
            setOutput('');
            return;
        }

        const lines = inputIds.split(/\r?\n/);
        const resultLines = lines.map(line => {
            const id = line.trim();
            if (!id) return '';

            const info = domainMap.get(id);
            if (info) {
                // Format: Type \t Length
                // This allows direct paste into a 2-column Word table
                return `${info.uiType}\t${info.uiLength}`;
            } else {
                return `未找到 (${id})\t-`;
            }
        });

        setOutput(resultLines.join('\n'));
    };

    const handleClear = () => {
        setInputIds('');
        setOutput('');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <PageHeader
                title="Domain 轉換"
                icon="📋"
                description={
                    <span>
                        輸入 Domain 序號（一行一個），自動查找並輸出 <code>UI型態</code> 與 <code>UI長度</code>。
                        <br/>
                        <span className="text-gray-400 text-xs mt-1 block">
                            輸出結果使用 Tab 分隔，可直接複製並貼入 Microsoft Word 的表格中。
                        </span>
                    </span>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px]">
                {/* Input Column */}
                <div className="flex flex-col gap-2 h-full">
                    <TextArea
                        label="📥 輸入 Domain 序號 (例如: 73, 77...)"
                        placeholder={`73\n77\n72\n7`}
                        value={inputIds}
                        onChange={(e) => setInputIds(e.target.value)}
                        className="h-full font-mono text-sm"
                    />
                    <div className="flex gap-2 shrink-0">
                        <Button onClick={handleConvert} variant="primary" className="flex-1">
                            🚀 轉換為表格格式
                        </Button>
                        <Button onClick={handleClear} variant="secondary">
                            🗑️ 清空
                        </Button>
                    </div>
                </div>

                {/* Output Column */}
                <div className="flex flex-col gap-2 h-full">
                    <OutputBox
                        title="📤 輸出 (Tab 分隔，可貼 Word)"
                        content={output}
                        placeholder="結果將顯示於此..."
                    />
                    <div className="text-xs text-gray-400 dark:text-gray-500 px-2">
                        提示：複製後，在 Word 中選取兩欄的表格儲存格並貼上，或貼上文字後選擇「將文字轉換為表格」。
                    </div>
                </div>
            </div>

            {/* Config Section (Toggleable) */}
            <div className="border-t border-gray-200 dark:border-[#3c4043] pt-4">
                <button 
                    onClick={() => setIsSourceVisible(!isSourceVisible)}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2 font-medium"
                >
                    <span className={`transform transition-transform duration-200 ${isSourceVisible ? 'rotate-90' : ''}`}>▶</span>
                    ⚙️ 參照表設定 (Source Data - CSV)
                </button>
                
                {isSourceVisible && (
                    <div className="animate-fade-in">
                        <p className="text-xs text-gray-400 mb-2">
                            格式：CSV 格式，欄位順序：<code>SN (ID), Domain說明, Data type, Excel檔的“型態”, UI【型態】, UI【長度】, ...</code>。
                            系統依據第一欄 (SN/ID) 作為查詢 Key。
                        </p>
                        <TextArea
                            value={sourceData}
                            onChange={(e) => setSourceData(e.target.value)}
                            className="h-[200px] font-mono text-xs whitespace-pre"
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DomainConverter;