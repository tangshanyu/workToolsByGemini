import React, { useState, useMemo } from 'react';
import { TextArea, Button } from '../components/UI';

// --- Types ---
type DiffType = 'eq' | 'ins' | 'del';

interface DiffLine {
  type: DiffType;
  text: string;
  lineNumber?: number; 
}

interface CharDiffChunk {
  type: DiffType;
  value: string;
}

interface AlignedRow {
  type: 'eq' | 'mod' | 'del' | 'ins' | 'empty';
  left?: DiffLine;
  right?: DiffLine;
  charDiff?: {
    left: CharDiffChunk[];
    right: CharDiffChunk[];
  }
}

// --- Algorithms ---

// 1. Line-level Diff (LCS)
const computeLineDiff = (text1: string, text2: string): DiffLine[] => {
  const lines1 = text1.split(/\r?\n/);
  const lines2 = text2.split(/\r?\n/);

  const m = lines1.length;
  const n = lines2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diff.unshift({ type: 'eq', text: lines1[i - 1], lineNumber: i });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'ins', text: lines2[j - 1], lineNumber: j });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: 'del', text: lines1[i - 1], lineNumber: i });
      i--;
    }
  }

  return diff;
};

// 2. Character-level Diff (LCS) with Prefix/Suffix Optimization
const computeCharDiff = (oldText: string, newText: string): CharDiffChunk[] => {
  // Optimization: Detect common prefix and suffix to isolate the change
  // This helps visually align changes in the middle of the string (e.g. AAA vs ABA -> A [A->B] A)
  let prefixLen = 0;
  while (prefixLen < oldText.length && prefixLen < newText.length && oldText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }
  const prefix = oldText.substring(0, prefixLen);

  let suffixLen = 0;
  while (suffixLen < (oldText.length - prefixLen) && suffixLen < (newText.length - prefixLen) && 
         oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]) {
    suffixLen++;
  }
  const suffix = oldText.substring(oldText.length - suffixLen);

  const midOld = oldText.substring(prefixLen, oldText.length - suffixLen);
  const midNew = newText.substring(prefixLen, newText.length - suffixLen);

  // Perform LCS on the middle part
  const m = midOld.length;
  const n = midNew.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1) as any);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (midOld[i - 1] === midNew[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const midChanges: CharDiffChunk[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && midOld[i - 1] === midNew[j - 1]) {
      midChanges.unshift({ type: 'eq', value: midOld[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      midChanges.unshift({ type: 'ins', value: midNew[j - 1] });
      j--;
    } else {
      midChanges.unshift({ type: 'del', value: midOld[i - 1] });
      i--;
    }
  }

  // Combine results
  const result: CharDiffChunk[] = [];
  if (prefix) result.push({ type: 'eq', value: prefix });
  result.push(...midChanges);
  if (suffix) result.push({ type: 'eq', value: suffix });

  // Merge adjacent chunks of same type for cleaner rendering
  const merged: CharDiffChunk[] = [];
  if (result.length > 0) {
    let curr = result[0];
    for (let k = 1; k < result.length; k++) {
      if (result[k].type === curr.type) {
        curr.value += result[k].value;
      } else {
        merged.push(curr);
        curr = result[k];
      }
    }
    merged.push(curr);
  }
  return merged;
};

// 3. Align lines to pair deletions with insertions (detect modifications)
const alignDiffs = (diffs: DiffLine[]): AlignedRow[] => {
  const rows: AlignedRow[] = [];
  let i = 0;
  
  while (i < diffs.length) {
    const current = diffs[i];
    
    if (current.type === 'eq') {
      rows.push({ type: 'eq', left: current, right: current });
      i++;
    } else if (current.type === 'del') {
      // Look ahead to see if we have consecutive dels followed by consecutive inss
      const dels: DiffLine[] = [current];
      let j = i + 1;
      while (j < diffs.length && diffs[j].type === 'del') {
        dels.push(diffs[j]);
        j++;
      }

      const inss: DiffLine[] = [];
      let k = j;
      while (k < diffs.length && diffs[k].type === 'ins') {
        inss.push(diffs[k]);
        k++;
      }

      // If we have both dels and inss, map them as modifications
      const maxLen = Math.max(dels.length, inss.length);
      for (let m = 0; m < maxLen; m++) {
        const d = dels[m];
        const in_ = inss[m];
        
        if (d && in_) {
          // This line is Modified. Compute char diff.
          const charChanges = computeCharDiff(d.text, in_.text);
          // Split into left view (eq+del) and right view (eq+ins)
          const leftChunks = charChanges.filter(c => c.type !== 'ins');
          const rightChunks = charChanges.filter(c => c.type !== 'del');
          
          rows.push({ 
            type: 'mod', 
            left: d, 
            right: in_, 
            charDiff: { left: leftChunks, right: rightChunks }
          });
        } else if (d) {
          rows.push({ type: 'del', left: d });
        } else if (in_) {
          rows.push({ type: 'ins', right: in_ });
        }
      }
      
      i = k;
    } else if (current.type === 'ins') {
      rows.push({ type: 'ins', right: current });
      i++;
    }
  }

  return rows;
};

// --- Component ---

const DiffViewer: React.FC = () => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [alignedRows, setAlignedRows] = useState<AlignedRow[] | null>(null);
  const [stats, setStats] = useState({ add: 0, del: 0 });

  const handleCompare = () => {
    if (!leftText && !rightText) return;
    
    // 1. Get raw line diffs
    const rawDiffs = computeLineDiff(leftText, rightText);
    
    // 2. Stats
    let addCount = 0;
    let delCount = 0;
    rawDiffs.forEach(r => {
        if (r.type === 'ins') addCount++;
        if (r.type === 'del') delCount++;
    });
    setStats({ add: addCount, del: delCount });

    // 3. Align and Compute sub-diffs
    const aligned = alignDiffs(rawDiffs);
    setAlignedRows(aligned);
  };

  const handleClear = () => {
      setLeftText('');
      setRightText('');
      setAlignedRows(null);
  };

  // Helper to render text with highlighted chunks
  const renderHighlightedText = (chunks?: CharDiffChunk[], baseClass: string = "") => {
    if (!chunks) return null;
    return (
      <span className={baseClass}>
        {chunks.map((chunk, idx) => {
           let className = "";
           // Stronger colors for better visibility
           if (chunk.type === 'del') className = "bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100 rounded-[2px]";
           if (chunk.type === 'ins') className = "bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100 rounded-[2px]";
           
           return <span key={idx} className={className}>{chunk.value}</span>;
        })}
      </span>
    );
  };

  const renderSideBySide = () => {
    if (!alignedRows) return null;

    return (
      <div className="w-full font-mono text-xs md:text-sm overflow-auto border border-gray-300 dark:border-[#3c4043] rounded-md bg-white dark:bg-[#1e1e1e]">
         <table className="w-full border-collapse table-fixed">
            <colgroup>
                <col className="w-[40px] bg-gray-50 dark:bg-[#2d2e31] border-r border-gray-200 dark:border-[#3c4043]" />
                <col className="w-[50%]" />
                <col className="w-[40px] bg-gray-50 dark:bg-[#2d2e31] border-r border-gray-200 dark:border-[#3c4043] border-l" />
                <col className="w-[50%]" />
            </colgroup>
            <tbody>
                {alignedRows.map((row, idx) => {
                    const { type, left, right, charDiff } = row;
                    
                    let rowClass = "border-b border-gray-100 dark:border-[#3c4043]/30 hover:bg-gray-50 dark:hover:bg-[#2a2b2e]";
                    let leftCellClass = "whitespace-pre-wrap break-all p-1 px-2 align-top h-full";
                    let rightCellClass = "whitespace-pre-wrap break-all p-1 px-2 align-top h-full";
                    
                    // Base Colors for the whole line (Light)
                    if (type === 'del') {
                        leftCellClass += " bg-red-50 dark:bg-[#3c1618] text-red-900 dark:text-[#E8EAED]";
                        rightCellClass += " bg-gray-50/50 dark:bg-black/20"; // Empty filler
                    } else if (type === 'ins') {
                        leftCellClass += " bg-gray-50/50 dark:bg-black/20"; // Empty filler
                        rightCellClass += " bg-green-50 dark:bg-[#0c2b15] text-green-900 dark:text-[#E8EAED]";
                    } else if (type === 'mod') {
                        leftCellClass += " bg-red-50/50 dark:bg-[#3c1618]/50 text-gray-800 dark:text-[#E8EAED]";
                        rightCellClass += " bg-green-50/50 dark:bg-[#0c2b15]/50 text-gray-800 dark:text-[#E8EAED]";
                    } else {
                        leftCellClass += " text-gray-700 dark:text-[#E8EAED]";
                        rightCellClass += " text-gray-700 dark:text-[#E8EAED]";
                    }

                    return (
                        <tr key={idx} className={rowClass}>
                            {/* Left Line Number */}
                            <td className="text-right text-gray-400 select-none p-1 pr-2 align-top text-[10px] pt-1.5">
                                {left?.lineNumber}
                            </td>
                            
                            {/* Left Content */}
                            <td className={leftCellClass}>
                                {type === 'mod' && charDiff ? (
                                    renderHighlightedText(charDiff.left)
                                ) : (
                                    left?.text
                                )}
                            </td>

                            {/* Right Line Number */}
                            <td className="text-right text-gray-400 select-none p-1 pr-2 align-top text-[10px] pt-1.5">
                                {right?.lineNumber}
                            </td>
                            
                            {/* Right Content */}
                            <td className={rightCellClass}>
                                {type === 'mod' && charDiff ? (
                                    renderHighlightedText(charDiff.right)
                                ) : (
                                    right?.text
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
         </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#18181a] border border-gray-200 dark:border-[#3c4043] p-4 rounded-xl shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-[#E8EAED] flex items-center gap-2">
                <span className="text-2xl">⚖️</span> 文件比對工具
            </h2>
            <p className="text-sm text-gray-500 dark:text-[#9AA0A6] mt-1">
                比較兩段文字的差異。支援行內文字差異高亮。
            </p>
        </div>
        
        {alignedRows && (
            <div className="flex items-center gap-3 text-sm font-medium bg-gray-100 dark:bg-[#202124] px-4 py-2 rounded-full border border-gray-200 dark:border-[#3c4043]">
                <span className="text-green-600 dark:text-green-400">+{stats.add} 新增</span>
                <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
                <span className="text-red-600 dark:text-red-400">-{stats.del} 刪除</span>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px]">
         <div className="flex flex-col h-full">
            <TextArea 
                label="📄 原始文件 (Original)"
                placeholder="貼上原始文字..."
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                className="h-full resize-none" 
            />
         </div>
         <div className="flex flex-col h-full">
            <TextArea 
                label="📝 修改後文件 (Modified)"
                placeholder="貼上修改後的文字..."
                value={rightText}
                onChange={(e) => setRightText(e.target.value)}
                className="h-full"
            />
         </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center md:justify-start">
        <Button onClick={handleCompare} variant="primary">
            🔍 開始比對
        </Button>
        <Button onClick={handleClear} variant="secondary">
            🗑️ 清空
        </Button>
      </div>

      {/* Results Area */}
      {alignedRows && (
        <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
            <h3 className="text-sm font-medium text-gray-700 dark:text-[#E8EAED]">📊 比對結果</h3>
            {renderSideBySide()}
        </div>
      )}
    </div>
  );
};

export default DiffViewer;