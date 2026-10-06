const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = Array.from({ length: 13 }, (_, i) => fs.readFileSync(path.join(root, `sunoapp-i18n-${i + 1}.js`), 'utf8')).join('');
fs.writeFileSync(path.join(root, 'sunoapp-i18n-browser.js'), source);
