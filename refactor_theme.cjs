const fs = require('fs');

const cssVars = `
[data-theme='light'] {
  --card-bg: #ffffff;
  --card-border: 1px solid rgba(0,0,0,0.1);
  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  --text-main: var(--text-primary);
  --text-muted: rgba(18, 18, 18, 0.75);
  --text-sub: var(--text-primary);
  --divider-border: 1px solid rgba(0, 0, 0, 0.18);
  --card-bg-hover: rgba(0, 0, 0, 0.06);
  --dashed-border: 1px dashed rgba(0,0,0,0.1);
  --bg-secondary: #f5f5f5;
  --icon-color: rgba(0,0,0,0.15);
  --bg-tertiary: #ffffff;
  --bg-tertiary-hover: rgba(0, 0, 0, 0.04);
}

[data-theme='dark'] {
  --card-bg: #0a0a0a;
  --card-border: 1px solid rgba(230, 126, 34, 0.3);
  --card-shadow: 0 10px 30px rgba(0,0,0,0.4);
  --text-main: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.5);
  --text-sub: var(--text-secondary);
  --divider-border: 1px solid rgba(255, 255, 255, 0.18);
  --card-bg-hover: rgba(255, 255, 255, 0.05);
  --dashed-border: 1px dashed rgba(255, 255, 255, 0.2);
  --bg-secondary: #111114;
  --icon-color: rgba(255,255,255,0.15);
  --bg-tertiary: #111114;
  --bg-tertiary-hover: rgba(255, 255, 255, 0.08);
}
`;

let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('--card-bg:')) {
    css = css.replace("[data-theme='light'] {", "[data-theme='light'] {\n  --card-bg: #ffffff;\n  --card-border: 1px solid rgba(0,0,0,0.1);\n  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);\n  --text-main: var(--text-primary);\n  --text-muted: rgba(18, 18, 18, 0.75);\n  --text-sub: var(--text-primary);\n  --divider-border: 1px solid rgba(0, 0, 0, 0.18);\n  --card-bg-hover: rgba(0, 0, 0, 0.06);\n  --dashed-border: 1px dashed rgba(0,0,0,0.1);\n  --bg-secondary: #f5f5f5;\n  --icon-color: rgba(0,0,0,0.15);\n  --bg-tertiary: #ffffff;\n  --bg-tertiary-hover: rgba(0, 0, 0, 0.04);\n");
    css = css.replace("[data-theme='dark'] {", "[data-theme='dark'] {\n  --card-bg: #0a0a0a;\n  --card-border: 1px solid rgba(230, 126, 34, 0.3);\n  --card-shadow: 0 10px 30px rgba(0,0,0,0.4);\n  --text-main: #ffffff;\n  --text-muted: rgba(255, 255, 255, 0.5);\n  --text-sub: var(--text-secondary);\n  --divider-border: 1px solid rgba(255, 255, 255, 0.18);\n  --card-bg-hover: rgba(255, 255, 255, 0.05);\n  --dashed-border: 1px dashed rgba(255, 255, 255, 0.2);\n  --bg-secondary: #111114;\n  --icon-color: rgba(255,255,255,0.15);\n  --bg-tertiary: #111114;\n  --bg-tertiary-hover: rgba(255, 255, 255, 0.08);\n");
    fs.writeFileSync('src/index.css', css, 'utf8');
}

const replacements = [
  { p: /tracker\.settings\.themeMode === 'dark' \? '#0a0a0a' : '#ffffff'/g, r: "'var(--card-bg)'" },
  { p: /tracker\.settings\.themeMode === 'dark'\s*\?\s*'1px solid rgba\(230, 126, 34, 0\.3\)'\s*:\s*'1px solid rgba\(0,0,0,0\.1\)'/g, r: "'var(--card-border)'" },
  { p: /tracker\.settings\.themeMode === 'dark'\s*\?\s*'0 10px 30px rgba\(0,0,0,0\.4\)'\s*:\s*'0 10px 30px rgba\(0, 0, 0, 0\.08\)'/g, r: "'var(--card-shadow)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? '#fff' : 'var\(--text-primary\)'/g, r: "'var(--text-main)'" },
  { p: /isLight \? 'rgba\(var\(--theme-rgb\), 0\.75\)' : 'rgba\(var\(--theme-rgb\), 0\.5\)'/g, r: "'var(--text-muted)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? '1px solid rgba\(var\(--theme-rgb\), 0\.18\)' : '1px solid rgba\(0, 0, 0, 0\.18\)'/g, r: "'var(--divider-border)'" },
  { p: /isLight \? 'var\(--text-primary\)' : 'var\(--text-secondary\)'/g, r: "'var(--text-sub)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? 'rgba\(255, 255, 255, 0\.05\)' : 'rgba\(0, 0, 0, 0\.06\)'/g, r: "'var(--card-bg-hover)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? '1px dashed rgba\(var\(--theme-rgb\), 0\.2\)' : '1px dashed rgba\(0,0,0,0\.1\)'/g, r: "'var(--dashed-border)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? '#111114' : '#f5f5f5'/g, r: "'var(--bg-secondary)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? 'rgba\(255,255,255,0\.15\)' : 'rgba\(0,0,0,0\.15\)'/g, r: "'var(--icon-color)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? 'rgba\(255, 255, 255, 0\.08\)' : 'rgba\(0, 0, 0, 0\.04\)'/g, r: "'var(--bg-tertiary-hover)'" },
  { p: /tracker\.settings\.themeMode === 'dark' \? '#111114' : '#ffffff'/g, r: "'var(--bg-tertiary)'" }
];

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    for (const {p, r} of replacements) {
        content = content.replace(p, r);
    }
    fs.writeFileSync(file, content, 'utf8');
}

processFile('src/features/history/HistoryPage.tsx');
processFile('src/features/progress/ProgressPage.tsx');

console.log('Styles refactored to CSS variables successfully!');
