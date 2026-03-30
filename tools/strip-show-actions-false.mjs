import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'src');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory() && name !== 'node_modules') walk(p, acc);
    else if (/\.(html|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

let n = 0;
for (const file of walk(root)) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  s = s.replace(/\s*\[showActions\]="false"/g, '');
  if (s !== orig) {
    fs.writeFileSync(file, s);
    n++;
    console.log(file);
  }
}
console.log('Updated files:', n);
