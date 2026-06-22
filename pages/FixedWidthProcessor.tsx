import React, { useState, useRef, useCallback } from 'react';
import { Button, PageHeader } from '../components/UI';

// --- Types ---
interface FieldDef {
  seq: number;
  engName: string;
  name: string;
  type: string;       // 數字 / 文字
  start: number;
  end: number;
  length: number;
  description: string;
}

interface DataTab {
  id: string;
  label: string;
  values: Record<number, string>; // keyed by field seq
}

// --- Pattern Parser ---
// Dynamically detects column layout by scanning header keywords.
// Supports any column order and various header naming conventions.
function parsePattern(text: string): FieldDef[] {
  const rawLines = text.split('\n').map(l => l.replace(/\r$/, ''));
  if (rawLines.length < 2) return [];

  const results: FieldDef[] = [];

  // --- Step 1: Detect header line and map columns by keywords ---
  const headerKeywords = ['序號', '欄位', '名稱', '起', '迄', '長度', '說明', '型態', '型別', '資料'];
  let headerLineIdx = -1;
  for (let i = 0; i < Math.min(rawLines.length, 3); i++) {
    if (headerKeywords.some(kw => rawLines[i].includes(kw))) {
      headerLineIdx = i;
      break;
    }
  }

  // Column role mapping
  let colMap: Record<string, number> = {};
  // seq, engName, name, type, length, range, start, end, desc
  
  if (headerLineIdx >= 0) {
    const headerCols = rawLines[headerLineIdx].split('\t').map(c => c.trim());
    headerCols.forEach((h, idx) => {
      const lh = h.toLowerCase();
      if (/序號|seq|no\.?$/i.test(h)) colMap['seq'] = idx;
      else if (/英文.*名|eng.*name/i.test(h)) colMap['engName'] = idx;
      else if (/欄位名稱|名稱|field.*name|column.*name/i.test(h) && !('name' in colMap)) colMap['name'] = idx;
      else if (/資料型態|型態|型別|type|data.*type/i.test(h)) colMap['type'] = idx;
      else if (/長度|length|len/i.test(h)) colMap['length'] = idx;
      else if (/起迄|起迄位置|position|range/i.test(h)) colMap['range'] = idx;
      else if (/^起$|start/i.test(h)) colMap['start'] = idx;
      else if (/^迄$|end/i.test(h)) colMap['end'] = idx;
      else if (/說明|備註|desc|remark|note/i.test(h)) colMap['desc'] = idx;
    });
  }

  const dataStartIdx = headerLineIdx >= 0 ? headerLineIdx + 1 : 0;

  // Known type values (short codes + Chinese)
  const knownTypes = new Set(['X', '9', 'A', 'N', 'S', 'AN', 'XN',
    '數字', '文字', '數值', '英數', '日期', '文數']);

  for (let i = dataStartIdx; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line.trim()) continue;

    const cols = line.split('\t');
    const firstCol = cols[0]?.trim();

    // Check if this line starts a new field (first column is a number)
    const seqNum = parseInt(firstCol, 10);
    if (!isNaN(seqNum) && firstCol === String(seqNum)) {
      // --- Use column map if available ---
      let fieldName = '';
      let engName = '';
      let fieldType = '';
      let fieldLength = 0;
      let start = 0, end = 0;
      let description = '';
      
      // Get values by mapped columns
      if ('name' in colMap) fieldName = (cols[colMap['name']] || '').trim();
      if ('engName' in colMap) engName = (cols[colMap['engName']] || '').trim();
      if ('type' in colMap) fieldType = (cols[colMap['type']] || '').trim();
      if ('length' in colMap) fieldLength = parseInt((cols[colMap['length']] || '').trim(), 10) || 0;
      if ('desc' in colMap) description = (cols[colMap['desc']] || '').trim();
      
      // Handle range column (combined "1-7" format)
      if ('range' in colMap) {
        const rangeVal = (cols[colMap['range']] || '').trim();
        const rangeMatch = rangeVal.match(/^(\d+)\s*[-–]\s*(\d+)$/);
        if (rangeMatch) {
          start = parseInt(rangeMatch[1], 10);
          end = parseInt(rangeMatch[2], 10);
        }
      }
      
      // Handle separate start/end columns
      if ('start' in colMap && 'end' in colMap) {
        start = parseInt((cols[colMap['start']] || '').trim(), 10) || 0;
        end = parseInt((cols[colMap['end']] || '').trim(), 10) || 0;
      }

      // --- Fallback: no header detected, use heuristic scan ---
      if (Object.keys(colMap).length === 0) {
        // Try to find range pattern
        for (let c = 0; c < cols.length; c++) {
          const rangeMatch = cols[c].trim().match(/^(\d+)\s*[-–]\s*(\d+)$/);
          if (rangeMatch) {
            start = parseInt(rangeMatch[1], 10);
            end = parseInt(rangeMatch[2], 10);
            break;
          }
        }
        // Try separate start/end
        if (start === 0 && end === 0) {
          const numbers: { idx: number; val: number }[] = [];
          cols.forEach((c, idx) => {
            const n = parseInt(c.trim(), 10);
            if (idx > 0 && !isNaN(n) && c.trim() === String(n)) {
              numbers.push({ idx, val: n });
            }
          });
          if (numbers.length >= 2) {
            start = numbers[numbers.length - 2].val;
            end = numbers[numbers.length - 1].val;
          }
        }
        // Scan for type
        for (let c = 1; c < cols.length; c++) {
          if (knownTypes.has(cols[c].trim())) {
            fieldType = cols[c].trim();
            break;
          }
        }
        // Scan for names (non-number, non-type text)
        const nameParts: string[] = [];
        for (let c = 1; c < cols.length; c++) {
          const val = cols[c].trim();
          if (val && !/^\d+$/.test(val) && !knownTypes.has(val) && !/^\d+\s*[-–]\s*\d+$/.test(val)) {
            nameParts.push(val);
          }
        }
        if (nameParts.length >= 2) { engName = nameParts[0]; fieldName = nameParts[1]; }
        else if (nameParts.length === 1) {
          if (/^[A-Za-z0-9_\-()]+$/.test(nameParts[0])) engName = nameParts[0];
          else fieldName = nameParts[0];
        }
        // Scan for standalone length number
        for (let c = 1; c < cols.length; c++) {
          const val = cols[c].trim();
          const n = parseInt(val, 10);
          if (!isNaN(n) && val === String(n) && n !== seqNum && n !== start && n !== end) {
            fieldLength = n;
            break;
          }
        }
      }

      // Calculate length from range if not found
      if (fieldLength === 0 && start > 0 && end > 0) {
        fieldLength = end - start + 1;
      }

      if (start === 0 && end === 0 && fieldLength === 0) continue; // Can't parse

      results.push({
        seq: seqNum,
        engName,
        name: fieldName,
        type: fieldType,
        start,
        end,
        length: fieldLength,
        description,
      });
    } else {
      // --- Continuation line (multi-line description) ---
      if (results.length > 0 && line.trim()) {
        results[results.length - 1].description += '\n' + line.trim();
      }
    }
  }

  return results;
}

// --- Encoding Utilities ---
const ENCODINGS = [
  { value: 'UTF-8', label: 'UTF-8' },
  { value: 'Big5', label: 'Big5 (繁體中文)' },
  { value: 'ASCII', label: 'ASCII' },
  { value: 'Shift_JIS', label: 'Shift_JIS (日文)' },
  { value: 'GBK', label: 'GBK (簡體中文)' },
];

// Calculate byte length of a string in a given encoding
// For fixed-width formats, "length" usually means byte length
function getByteLength(str: string, encoding: string): number {
  if (encoding === 'ASCII') return str.length;
  if (encoding === 'UTF-8') {
    return new TextEncoder().encode(str).length;
  }
  // For Big5, GBK, Shift_JIS: ASCII=1byte, CJK=2bytes
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += code > 0x7F ? 2 : 1;
  }
  return len;
}

// Pad string to exact byte length
function padToByteLength(str: string, targetBytes: number, encoding: string): string {
  let result = '';
  let currentBytes = 0;
  for (let i = 0; i < str.length; i++) {
    const charBytes = encoding === 'UTF-8'
      ? new TextEncoder().encode(str[i]).length
      : (str.charCodeAt(i) > 0x7F ? 2 : 1);
    if (currentBytes + charBytes > targetBytes) break;
    result += str[i];
    currentBytes += charBytes;
  }
  // Fill remaining with spaces
  while (currentBytes < targetBytes) {
    result += ' ';
    currentBytes += 1;
  }
  return result;
}

// Try to auto-detect encoding from file bytes
function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Check UTF-8 BOM
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'UTF-8';
  }
  // Heuristic: scan for Big5 vs UTF-8
  let isValidUtf8 = true;
  let hasBig5Patterns = false;
  for (let i = 0; i < Math.min(bytes.length, 4096); i++) {
    if (bytes[i] > 0x7F) {
      // Check UTF-8 multi-byte sequence
      if ((bytes[i] & 0xE0) === 0xC0) {
        if (i + 1 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80) isValidUtf8 = false;
        i += 1;
      } else if ((bytes[i] & 0xF0) === 0xE0) {
        if (i + 2 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80 || (bytes[i + 2] & 0xC0) !== 0x80) isValidUtf8 = false;
        i += 2;
      } else {
        // Check Big5 range: high byte 0x81-0xFE, low byte 0x40-0x7E or 0xA1-0xFE
        if (bytes[i] >= 0x81 && bytes[i] <= 0xFE && i + 1 < bytes.length) {
          const lo = bytes[i + 1];
          if ((lo >= 0x40 && lo <= 0x7E) || (lo >= 0xA1 && lo <= 0xFE)) {
            hasBig5Patterns = true;
          }
        }
        isValidUtf8 = false;
        i += 1;
      }
    }
  }
  if (isValidUtf8) return 'UTF-8';
  if (hasBig5Patterns) return 'Big5';
  return 'Big5'; // Default for Taiwan banking files
}

// --- Generate fixed-width line (byte-aware) ---
function generateLine(fields: FieldDef[], values: Record<number, string>, encoding: string): string {
  if (fields.length === 0) return '';
  const totalLength = Math.max(...fields.map(f => f.end));
  // Build line by padding each field to its byte length
  let result = ' '.repeat(totalLength);

  // Sort fields by start position
  const sorted = [...fields].sort((a, b) => a.start - b.start);
  sorted.forEach(f => {
    const raw = values[f.seq] || '';
    const padded = padToByteLength(raw, f.length, encoding);
    result = result.substring(0, f.start - 1) + padded + result.substring(f.start - 1 + f.length);
  });

  return result;
}

// --- Parse fixed-width data line into values (byte-aware) ---
function parseLine(fields: FieldDef[], line: string, encoding: string): Record<number, string> {
  const values: Record<number, string> = {};
  // For byte-level slicing with non-ASCII encodings, we need byte-aware substring
  if (encoding !== 'ASCII' && encoding !== 'UTF-8') {
    // For Big5/GBK/Shift_JIS: convert to byte array, slice, decode back
    try {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(line);
      // Re-encode with target encoding not possible in browser,
      // so we use character-level approximation
      fields.forEach(f => {
        let bytePos = 0;
        let charStart = 0, charEnd = 0;
        for (let i = 0; i < line.length && bytePos < f.end; i++) {
          const charBytes = line.charCodeAt(i) > 0x7F ? 2 : 1;
          if (bytePos + charBytes <= f.start - 1) {
            bytePos += charBytes;
            charStart = i + 1;
          } else if (bytePos < f.end) {
            bytePos += charBytes;
            charEnd = i + 1;
          }
        }
        values[f.seq] = line.substring(charStart, charEnd).trimEnd();
      });
    } catch {
      // Fallback to character-level
      fields.forEach(f => {
        values[f.seq] = line.substring(f.start - 1, f.end).trimEnd();
      });
    }
  } else {
    fields.forEach(f => {
      values[f.seq] = line.substring(f.start - 1, f.end).trimEnd();
    });
  }
  return values;
}

// --- Ruler for preview ---
function generateRuler(totalLength: number): string {
  let ruler = '';
  for (let i = 1; i <= totalLength; i++) {
    if (i % 10 === 0) {
      ruler += '|';
    } else if (i % 5 === 0) {
      ruler += '+';
    } else {
      ruler += '·';
    }
  }
  return ruler;
}

function generateRulerNumbers(totalLength: number): string {
  let nums = '';
  for (let i = 1; i <= totalLength; i++) {
    if (i % 10 === 0) {
      const label = String(i);
      nums = nums.substring(0, nums.length - (label.length - 1)) + label;
    } else {
      nums += ' ';
    }
  }
  return nums;
}

let tabIdCounter = 0;
function nextTabId(): string {
  return `tab_${++tabIdCounter}_${Date.now()}`;
}

// ============================================================
// Component
// ============================================================
const emptyManualField = (): FieldDef => ({
  seq: 0, engName: '', name: '', type: 'X', start: 0, end: 0, length: 0, description: ''
});

const FixedWidthProcessor: React.FC = () => {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [tabs, setTabs] = useState<DataTab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [patternInput, setPatternInput] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [encoding, setEncoding] = useState('Big5');
  const [manualFields, setManualFields] = useState<FieldDef[]>([{ ...emptyManualField(), seq: 1, start: 1, end: 1, length: 1 }]);
  const [showManualEditor, setShowManualEditor] = useState(false);

  const patternFileRef = useRef<HTMLInputElement>(null);
  const dataFileRef = useRef<HTMLInputElement>(null);

  // ---- Manual Pattern Editor ----
  const addManualRow = () => {
    setManualFields(prev => {
      const lastField = prev[prev.length - 1];
      const nextStart = lastField ? lastField.end + 1 : 1;
      return [...prev, { ...emptyManualField(), seq: prev.length + 1, start: nextStart, end: nextStart, length: 1 }];
    });
  };

  const removeManualRow = (idx: number) => {
    setManualFields(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((f, i) => ({ ...f, seq: i + 1 }));
    });
  };

  const updateManualField = (idx: number, key: keyof FieldDef, value: string | number) => {
    setManualFields(prev => {
      const next = [...prev];
      const f = { ...next[idx] };
      (f as any)[key] = value;
      // Auto-calculate length from start/end
      if (key === 'start' || key === 'end') {
        const s = key === 'start' ? Number(value) : f.start;
        const e = key === 'end' ? Number(value) : f.end;
        if (s > 0 && e >= s) f.length = e - s + 1;
      }
      // Auto-calculate end from start+length
      if (key === 'length') {
        const len = Number(value);
        if (f.start > 0 && len > 0) f.end = f.start + len - 1;
      }
      next[idx] = f;
      return next;
    });
  };

  const applyManualPattern = () => {
    const valid = manualFields.filter(f => f.name.trim() && f.length > 0 && f.start > 0 && f.end > 0);
    if (valid.length === 0) {
      alert('請至少填寫一個有效的欄位定義（名稱、長度、起迄）。');
      return;
    }
    setFields(valid);
    const firstTab: DataTab = { id: nextTabId(), label: '資料 1', values: {} };
    setTabs([firstTab]);
    setActiveTabId(firstTab.id);
  };

  // ---- Pattern Import ----
  const importPattern = useCallback((text: string) => {
    const parsed = parsePattern(text);
    if (parsed.length === 0) {
      alert('無法解析格式定義，請確認格式正確（Tab 分隔）。');
      return;
    }
    setFields(parsed);
    const firstTab: DataTab = { id: nextTabId(), label: '資料 1', values: {} };
    setTabs([firstTab]);
    setActiveTabId(firstTab.id);
    setPatternInput('');
  }, []);

  const handlePatternFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importPattern(ev.target?.result as string);
    };
    reader.readAsText(file, encoding);
    if (patternFileRef.current) patternFileRef.current.value = '';
  };

  // ---- Data Import (load existing TXT) ----
  const handleDataFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // First read as ArrayBuffer for auto-detection, then decode
    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      const detected = detectEncoding(buffer);
      const useEncoding = encoding === 'auto' ? detected : encoding;

      // Decode with detected/selected encoding
      const decoder = new TextDecoder(useEncoding);
      const text = decoder.decode(buffer);
      const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
      if (lines.length === 0) return;

      const newTabs: DataTab[] = lines.map((line, idx) => ({
        id: nextTabId(),
        label: `資料 ${idx + 1}`,
        values: parseLine(fields, line, useEncoding),
      }));
      setTabs(newTabs);
      setActiveTabId(newTabs[0].id);
    };
    reader.readAsArrayBuffer(file);
    if (dataFileRef.current) dataFileRef.current.value = '';
  };

  // ---- Tab Management ----
  const addTab = () => {
    const newTab: DataTab = { id: nextTabId(), label: `資料 ${tabs.length + 1}`, values: {} };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const deleteTab = (tabId: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && next.length > 0) {
        setActiveTabId(next[0].id);
      }
      return next;
    });
  };

  const renameTab = (tabId: string, newLabel: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, label: newLabel } : t));
  };

  // ---- Value Editing ----
  const activeTab = tabs.find(t => t.id === activeTabId);

  const updateValue = (seq: number, value: string) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      return { ...t, values: { ...t.values, [seq]: value } };
    }));
  };

  // ---- Output ----
  const generateAllLines = useCallback((): string => {
    return tabs.map(t => generateLine(fields, t.values, encoding)).join('\n');
  }, [tabs, fields, encoding]);

  const handleDownload = () => {
    const content = generateAllLines();
    // For non-UTF-8 encodings, try to use TextEncoder if available
    let blob: Blob;
    if (encoding === 'UTF-8' || encoding === 'ASCII') {
      blob = new Blob([content], { type: 'text/plain;charset=' + encoding + ';' });
    } else {
      // Browser TextEncoder only supports UTF-8, so we export as UTF-8 with a note
      // For Big5 etc., the user should use a text editor to convert
      blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    const content = generateAllLines();
    navigator.clipboard.writeText(content).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  // ---- Reset ----
  const handleReset = () => {
    setFields([]);
    setTabs([]);
    setActiveTabId('');
    setPatternInput('');
  };

  // ---- Computed ----
  const totalLength = fields.length > 0 ? Math.max(...fields.map(f => f.end)) : 0;
  const currentLine = activeTab ? generateLine(fields, activeTab.values, encoding) : '';
  const hasPattern = fields.length > 0;

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="flex flex-col h-full gap-5 pb-20">
      <PageHeader
        title="定長文字處理"
        icon="📏"
        description="匯入格式定義（Pattern），以表格填入資料後匯出為定長 TXT 檔案。"
        controls={
          <div className="flex items-center gap-3">
            {/* Encoding Selector */}
            <div className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-[#252526] px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#333]">
              <span className="text-gray-500 dark:text-gray-400 text-xs">編碼</span>
              <select
                value={encoding}
                onChange={(e) => setEncoding(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 border-none outline-none cursor-pointer"
              >
                {ENCODINGS.map(enc => (
                  <option key={enc.value} value={enc.value}>{enc.label}</option>
                ))}
              </select>
            </div>

            {hasPattern && (
              <div className="flex items-center gap-2 text-sm font-medium bg-gray-100 dark:bg-[#252526] px-4 py-2 rounded-full border border-gray-200 dark:border-[#333]">
                <span className="text-blue-600 dark:text-blue-400">{fields.length} 欄位</span>
                <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
                <span className="text-green-600 dark:text-green-400">總長 {totalLength}</span>
                <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
                <span className="text-purple-600 dark:text-purple-400">{tabs.length} 筆</span>
              </div>
            )}
          </div>
        }
      />

      {/* ========== Pattern Input Section ========== */}
      {!hasPattern && (
        <div className="flex flex-col gap-4">
          {/* File Import */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📂 從檔案匯入格式定義</h3>
              <input
                ref={patternFileRef}
                type="file"
                accept=".txt,.csv,.tsv"
                onChange={handlePatternFileImport}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-semibold file:cursor-pointer
                  file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                  dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50
                  transition-all"
              />
            </div>
          </div>

          {/* Text Import */}
          <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📋 或直接貼上格式定義（Tab 分隔，自動辨識欄位名稱）</h3>
            <textarea
              className="w-full p-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#333] rounded-lg text-sm font-mono text-gray-800 dark:text-[#D4D4D4] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-0 min-h-[160px] resize-none"
              placeholder={`序號\t欄位名稱\t資料型態\t長度\t起迄位置\n1\t成交日期\tX\t8\t1-8\n2\t保管帳號\tX\t11\t9-19`}
              value={patternInput}
              onChange={(e) => setPatternInput(e.target.value)}
              spellCheck={false}
              style={{ overflow: 'hidden' }}
              onInput={(e) => {
                const ta = e.currentTarget;
                ta.style.height = 'auto';
                ta.style.height = Math.max(160, ta.scrollHeight) + 'px';
              }}
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={() => importPattern(patternInput)} variant="primary" disabled={!patternInput.trim()}>
                📥 匯入格式定義
              </Button>
            </div>
          </div>

          {/* Manual Pattern Editor */}
          <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">✏️ 或手動建立格式定義</h3>
              <button
                onClick={() => setShowManualEditor(!showManualEditor)}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                {showManualEditor ? '▲ 收合' : '▼ 展開'}
              </button>
            </div>

            {showManualEditor && (
              <>
                <div className="overflow-auto rounded-lg border border-gray-200 dark:border-[#333] mb-3">
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-[#252526] border-b border-gray-200 dark:border-[#333]">
                        <th className="p-2 text-xs text-gray-400 w-10 text-center">#</th>
                        <th className="p-2 text-xs text-gray-600 dark:text-gray-300 text-left min-w-[120px]">欄位名稱 *</th>
                        <th className="p-2 text-xs text-gray-600 dark:text-gray-300 text-left min-w-[100px]">英文名稱</th>
                        <th className="p-2 text-xs text-gray-600 dark:text-gray-300 text-center w-16">型態</th>
                        <th className="p-2 text-xs text-gray-600 dark:text-gray-300 text-center w-14">起 *</th>
                        <th className="p-2 text-xs text-gray-600 dark:text-gray-300 text-center w-14">迄 *</th>
                        <th className="p-2 text-xs text-gray-600 dark:text-gray-300 text-center w-14">長度</th>
                        <th className="p-2 text-xs text-gray-600 dark:text-gray-300 text-left min-w-[100px]">說明</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#333]/50">
                      {manualFields.map((mf, idx) => (
                        <tr key={idx} className="group hover:bg-blue-50/30 dark:hover:bg-[#2D2D2D]">
                          <td className="p-1 text-center text-xs text-gray-400 font-mono">{mf.seq}</td>
                          <td className="p-0"><input className="w-full p-1.5 bg-transparent text-sm focus:outline-none focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40 text-gray-700 dark:text-gray-200" value={mf.name} onChange={e => updateManualField(idx, 'name', e.target.value)} placeholder="欄位名稱" /></td>
                          <td className="p-0"><input className="w-full p-1.5 bg-transparent text-sm font-mono focus:outline-none focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40 text-gray-600 dark:text-gray-300" value={mf.engName} onChange={e => updateManualField(idx, 'engName', e.target.value)} placeholder="ENG_NAME" /></td>
                          <td className="p-0"><select className="w-full p-1.5 bg-transparent text-sm text-center focus:outline-none text-gray-600 dark:text-gray-300 cursor-pointer" value={mf.type} onChange={e => updateManualField(idx, 'type', e.target.value)}><option value="X">X (文字)</option><option value="9">9 (數字)</option><option value="A">A (英數)</option><option value="文字">文字</option><option value="數字">數字</option></select></td>
                          <td className="p-0"><input type="number" className="w-full p-1.5 bg-transparent text-sm text-center font-mono focus:outline-none focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40 text-gray-600 dark:text-gray-300" value={mf.start || ''} onChange={e => updateManualField(idx, 'start', parseInt(e.target.value) || 0)} /></td>
                          <td className="p-0"><input type="number" className="w-full p-1.5 bg-transparent text-sm text-center font-mono focus:outline-none focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40 text-gray-600 dark:text-gray-300" value={mf.end || ''} onChange={e => updateManualField(idx, 'end', parseInt(e.target.value) || 0)} /></td>
                          <td className="p-1.5 text-center text-xs font-mono text-gray-400">{mf.length > 0 ? mf.length : '-'}</td>
                          <td className="p-0"><input className="w-full p-1.5 bg-transparent text-sm focus:outline-none focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40 text-gray-500 dark:text-gray-400" value={mf.description} onChange={e => updateManualField(idx, 'description', e.target.value)} placeholder="說明" /></td>
                          <td className="p-1 text-center">
                            <button onClick={() => removeManualRow(idx)} className="w-5 h-5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded text-xs transition-all opacity-0 group-hover:opacity-100">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={addManualRow} variant="secondary">➕ 新增欄位</Button>
                  <div className="flex-1" />
                  <Button onClick={applyManualPattern} variant="primary" disabled={manualFields.every(f => !f.name.trim())}>
                    ✅ 套用格式定義
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== Editor Section ========== */}
      {hasPattern && (
        <>
          {/* Tab Bar + Actions */}
          <div className="flex flex-col gap-3">
            {/* Actions Row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button onClick={addTab} variant="secondary">➕ 新增資料</Button>
              <label>
                <input
                  ref={dataFileRef}
                  type="file"
                  accept=".txt"
                  onChange={handleDataFileImport}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer bg-gray-100 dark:bg-[#303134] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#444] hover:bg-gray-200 dark:hover:bg-[#3c3c3f] transition-all">
                  📤 載入 TXT 資料
                </span>
              </label>

              <div className="flex-1" />

              <Button onClick={handleCopyAll} variant="ghost">
                {copiedAll ? '✅ 已複製' : '📋 複製全部'}
              </Button>
              <Button onClick={handleDownload} variant="primary">💾 下載 TXT</Button>
              <Button onClick={handleReset} variant="danger">🗑️ 重設</Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`group relative flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer border border-b-0 transition-all shrink-0 ${
                    tab.id === activeTabId
                      ? 'bg-white dark:bg-[#1E1E1E] border-gray-200 dark:border-[#333] text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'bg-gray-50 dark:bg-[#252526] border-gray-100 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2D2D2D]'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {editingTabId === tab.id ? (
                    <input
                      className="bg-transparent border-b border-blue-400 outline-none text-sm w-20"
                      defaultValue={tab.label}
                      autoFocus
                      onBlur={(e) => {
                        renameTab(tab.id, e.target.value || tab.label);
                        setEditingTabId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameTab(tab.id, e.currentTarget.value || tab.label);
                          setEditingTabId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span onDoubleClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id); }}>
                      {tab.label}
                    </span>
                  )}
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }}
                      className="ml-1 w-4 h-4 text-[10px] rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTab}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all shrink-0 text-lg"
                title="新增資料"
              >
                +
              </button>
            </div>
          </div>

          {/* Data Editing Table */}
          {activeTab && (
            <div className="overflow-auto rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#141414] shadow-sm">
              <table className="min-w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 dark:bg-[#252526] border-b border-gray-200 dark:border-[#333]">
                    <th className="p-2 text-xs text-gray-400 dark:text-gray-500 font-mono text-center border-r border-gray-200 dark:border-[#333] w-12">序號</th>
                    <th className="p-2 text-xs text-gray-600 dark:text-gray-300 font-semibold text-left border-r border-gray-200 dark:border-[#333] min-w-[120px]">英文名稱</th>
                    <th className="p-2 text-xs text-gray-600 dark:text-gray-300 font-semibold text-left border-r border-gray-200 dark:border-[#333] min-w-[100px]">欄位名稱</th>
                    <th className="p-2 text-xs text-gray-600 dark:text-gray-300 font-semibold text-center border-r border-gray-200 dark:border-[#333] w-14">型態</th>
                    <th className="p-2 text-xs text-gray-400 dark:text-gray-500 font-mono text-center border-r border-gray-200 dark:border-[#333] w-12">起</th>
                    <th className="p-2 text-xs text-gray-400 dark:text-gray-500 font-mono text-center border-r border-gray-200 dark:border-[#333] w-12">迄</th>
                    <th className="p-2 text-xs text-gray-400 dark:text-gray-500 font-mono text-center border-r border-gray-200 dark:border-[#333] w-12">長度</th>
                    <th className="p-2 text-xs text-gray-600 dark:text-gray-300 font-semibold text-left border-r border-gray-200 dark:border-[#333] min-w-[120px]">說明</th>
                    <th className="p-2 text-xs text-blue-600 dark:text-blue-400 font-bold text-left min-w-[200px]">✏️ 值</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#333]/50">
                  {fields.map((f) => {
                    const val = activeTab.values[f.seq] || '';
                    const byteLen = getByteLength(val, encoding);
                    const isOverLength = byteLen > f.length;
                    return (
                      <tr key={f.seq} className="group hover:bg-blue-50/30 dark:hover:bg-[#2D2D2D] transition-colors">
                        <td className="p-2 text-center text-gray-400 dark:text-gray-500 text-xs font-mono bg-gray-50 dark:bg-[#1A1A1A] border-r border-gray-100 dark:border-[#333]">
                          {f.seq}
                        </td>
                        <td className="p-2 text-gray-600 dark:text-gray-400 font-mono text-xs border-r border-gray-100 dark:border-[#333]">
                          {f.engName}
                        </td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-sm border-r border-gray-100 dark:border-[#333]">
                          {f.name}
                        </td>
                        <td className="p-2 text-center text-xs border-r border-gray-100 dark:border-[#333]">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            f.type === '數字' || f.type === '數值'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                          }`}>
                            {f.type || '-'}
                          </span>
                        </td>
                        <td className="p-2 text-center text-gray-400 dark:text-gray-500 text-xs font-mono border-r border-gray-100 dark:border-[#333]">
                          {f.start}
                        </td>
                        <td className="p-2 text-center text-gray-400 dark:text-gray-500 text-xs font-mono border-r border-gray-100 dark:border-[#333]">
                          {f.end}
                        </td>
                        <td className="p-2 text-center text-gray-400 dark:text-gray-500 text-xs font-mono border-r border-gray-100 dark:border-[#333]">
                          {f.length}
                        </td>
                        <td className="p-2 text-gray-500 dark:text-gray-400 text-xs border-r border-gray-100 dark:border-[#333] whitespace-pre-line" title={f.description}>
                          {f.description}
                        </td>
                        <td className="p-0">
                          <div className="relative">
                            <input
                              className={`w-full p-2 pr-16 bg-transparent font-mono text-sm focus:outline-none transition-colors ${
                                isOverLength
                                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10'
                                  : 'text-gray-700 dark:text-[#D4D4D4] focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40'
                              }`}
                              value={val}
                              onChange={(e) => updateValue(f.seq, e.target.value)}
                              placeholder={`${f.length} bytes`}
                              spellCheck={false}
                            />
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                              isOverLength ? 'text-red-500 font-bold' : 'text-gray-300 dark:text-gray-600'
                            }`}>
                              {byteLen}/{f.length}B
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Preview Section */}
          {activeTab && (
            <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  👁️ 即時預覽 — {activeTab.label}
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  共 {totalLength} 字元
                </span>
              </div>
              <div className="overflow-x-auto">
                {/* Ruler */}
                <div className="font-mono text-[10px] text-gray-300 dark:text-gray-600 leading-tight select-none whitespace-pre">
                  {generateRulerNumbers(totalLength)}
                </div>
                <div className="font-mono text-[10px] text-gray-300 dark:text-gray-600 leading-tight select-none whitespace-pre mb-1">
                  {generateRuler(totalLength)}
                </div>
                {/* Output */}
                <div className="font-mono text-sm text-gray-800 dark:text-[#D4D4D4] bg-gray-50 dark:bg-[#141414] p-3 rounded-lg border border-gray-100 dark:border-[#333] whitespace-pre overflow-x-auto">
                  {currentLine || <span className="text-gray-300 dark:text-gray-600 italic">（尚無資料）</span>}
                </div>
              </div>
            </div>
          )}

          {/* ========== Excel-like Grid View ========== */}
          {fields.length > 0 && tabs.length > 0 && (
            <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  📊 表格總覽
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {tabs.length} 筆資料 × {fields.length} 欄位
                </span>
              </div>
              <div className="overflow-auto rounded-lg border border-gray-200 dark:border-[#333]">
                <table className="min-w-full text-sm border-collapse">
                  {/* --- Header: Field Names --- */}
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-b from-gray-100 to-gray-50 dark:from-[#2a2a2a] dark:to-[#252526] border-b border-gray-200 dark:border-[#333]">
                      <th className="p-2 text-xs text-gray-400 dark:text-gray-500 font-mono text-center border-r border-gray-200 dark:border-[#333] w-20 bg-gray-100 dark:bg-[#252526] sticky left-0 z-20">
                        #
                      </th>
                      {fields.map((f) => (
                        <th
                          key={f.seq}
                          className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-200 text-center border-r border-gray-200 dark:border-[#333] min-w-[80px] whitespace-nowrap"
                          title={f.description || undefined}
                        >
                          <div>{f.name || f.engName}</div>
                          {f.engName && f.name && (
                            <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 font-normal mt-0.5">{f.engName}</div>
                          )}
                        </th>
                      ))}
                    </tr>
                    {/* --- Sub-header: Position Range --- */}
                    <tr className="bg-gray-50 dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-[#444]">
                      <td className="p-1 text-[10px] text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#1E1E1E] sticky left-0 z-20 font-mono">
                        位置
                      </td>
                      {fields.map((f) => (
                        <td
                          key={f.seq}
                          className="p-1 text-center border-r border-gray-200 dark:border-[#333]"
                        >
                          <div className="text-[10px] font-mono text-blue-500 dark:text-blue-400 font-medium">
                            {f.start}-{f.end}
                          </div>
                          <div className="text-[9px] font-mono text-gray-400 dark:text-gray-500">
                            ({f.length}{f.type ? ` ${f.type}` : ''})
                          </div>
                        </td>
                      ))}
                    </tr>
                  </thead>
                  {/* --- Data Rows --- */}
                  <tbody className="divide-y divide-gray-100 dark:divide-[#333]/50">
                    {tabs.map((tab) => (
                      <tr
                        key={tab.id}
                        className={`cursor-pointer transition-colors ${
                          tab.id === activeTabId
                            ? 'bg-blue-50/50 dark:bg-blue-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-[#2D2D2D]'
                        }`}
                        onClick={() => setActiveTabId(tab.id)}
                      >
                        {/* Row label (sticky left) */}
                        <td className={`p-2 text-xs font-medium text-center border-r border-gray-200 dark:border-[#333] sticky left-0 z-10 whitespace-nowrap ${
                          tab.id === activeTabId
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-50 dark:bg-[#1A1A1A] text-gray-500 dark:text-gray-400'
                        }`}>
                          {tab.label}
                        </td>
                        {/* Field values */}
                        {fields.map((f) => {
                          const val = tab.values[f.seq] || '';
                          const byteLen = getByteLength(val, encoding);
                          const isOver = byteLen > f.length;
                          return (
                            <td
                              key={f.seq}
                              className={`p-0 border-r border-gray-100 dark:border-[#333]/50 ${
                                isOver ? 'bg-red-50/50 dark:bg-red-900/5' : ''
                              }`}
                            >
                              <input
                                className={`w-full p-1.5 bg-transparent font-mono text-xs focus:outline-none transition-colors text-center ${
                                  isOver
                                    ? 'text-red-600 dark:text-red-400'
                                    : tab.id === activeTabId
                                      ? 'text-gray-800 dark:text-gray-200'
                                      : 'text-gray-600 dark:text-gray-400'
                                } focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40`}
                                value={val}
                                onChange={(e) => {
                                  setActiveTabId(tab.id);
                                  setTabs(prev => prev.map(t =>
                                    t.id === tab.id
                                      ? { ...t, values: { ...t.values, [f.seq]: e.target.value } }
                                      : t
                                  ));
                                }}
                                spellCheck={false}
                                title={val ? `${byteLen}/${f.length}B` : `${f.name} (${f.start}-${f.end})`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FixedWidthProcessor;
