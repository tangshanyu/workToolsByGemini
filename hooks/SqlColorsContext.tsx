import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_WORD_COLORS, isWordColors, type WordColors } from '../utils/wordColors';
import { readPreference, writePreference } from '../utils/preferences';

const SqlColorsContext = createContext<{ colors: WordColors; setColors: (colors: WordColors) => void } | null>(null);
export function SqlColorsProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState(() => readPreference('sql-toolkit.word-colors', DEFAULT_WORD_COLORS, isWordColors));
  useEffect(() => { writePreference('sql-toolkit.word-colors', colors); }, [colors]);
  const value = useMemo(() => ({ colors, setColors }), [colors]);
  return <SqlColorsContext.Provider value={value}>{children}</SqlColorsContext.Provider>;
}
export function useSqlColors() {
  const context = useContext(SqlColorsContext);
  if (!context) throw new Error('SQL colors must be used inside SqlColorsProvider');
  return context;
}
