const fs = require('node:fs');
const path = require('node:path');
const asar = require('@electron/asar');
const manifest = require('../package.json');
const allowed = new Set(manifest.build.files);
const forbidden = /[a-z]:[\\/]Users[\\/]|[\w.+-]+@(?:gmail|hotmail|outlook|icloud|yahoo)\.[a-z]+|ghp_[a-z0-9]{30,}|github_pat_[a-z0-9_]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/i;
let checked = 0;
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === 'app.asar') {
      for (const name of asar.listPackage(file)) {
        const relative = name.replace(/^[\\/]/, '').replaceAll('\\', '/');
        if (!allowed.has(relative)) throw new Error(`Unexpected packaged file: ${relative}`);
        const bytes = asar.extractFile(file, relative);
        if (forbidden.test(bytes.toString('utf8'))) throw new Error(`Privacy pattern found in: ${relative}`);
      }
      checked++;
    }
  }
}
walk(path.resolve(__dirname, '../dist'));
if (!checked) throw new Error('No application archive checked');
console.log(`Checked ${checked} application archive(s): allowlisted files only, no matching personal data or secret patterns.`);
