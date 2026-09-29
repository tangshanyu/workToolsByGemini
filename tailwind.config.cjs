module.exports = {
  darkMode: 'class',
  content: ['./index.html', './*.tsx', './components/**/*.tsx', './pages/**/*.tsx'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI"', '"Microsoft JhengHei"', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', 'Consolas', '"SFMono-Regular"', 'monospace'],
      },
    },
  },
  plugins: [],
};
