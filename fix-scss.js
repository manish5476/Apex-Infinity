const fs = require('fs');
const path = require('path');
const targetDir = 'd:/Apex/apex/src/app/modules/storefront-public';

function processFile(filePath) {
  let css = fs.readFileSync(filePath, 'utf8');
  let original = css;

  // Replace background whites
  css = css.replace(/background(-color)?:\s*#fff(fff)?\b/gi, 'background$1: var(--bg-primary)');
  css = css.replace(/background(-color)?:\s*white\b/gi, 'background$1: var(--bg-primary)');
  
  // Replace background blacks
  css = css.replace(/background(-color)?:\s*#000(000)?\b/gi, 'background$1: var(--text-primary)');
  css = css.replace(/background(-color)?:\s*black\b/gi, 'background$1: var(--text-primary)');

  // Replace color whites
  css = css.replace(/color:\s*#fff(fff)?\b/gi, 'color: var(--text-primary)');
  css = css.replace(/color:\s*white\b/gi, 'color: var(--text-primary)');

  // Replace color blacks
  css = css.replace(/color:\s*#000(000)?\b/gi, 'color: var(--text-primary)');
  css = css.replace(/color:\s*black\b/gi, 'color: var(--text-primary)');
  
  // Replace border whites/blacks
  css = css.replace(/border(-color)?:\s*#fff(fff)?\b/gi, 'border$1: var(--border-secondary)');
  css = css.replace(/border(-color)?:\s*#000(000)?\b/gi, 'border$1: var(--border-secondary)');
  
  // APX Tokens
  css = css.replace(/--apx-color-surface/g, '--bg-secondary');
  css = css.replace(/--apx-color-ink/g, '--text-primary');
  css = css.replace(/--apx-color-muted/g, '--text-secondary');
  css = css.replace(/--apx-color-border/g, '--border-secondary');
  css = css.replace(/--apx-color-accent/g, '--accent-primary');
  css = css.replace(/--apx-color-primary-soft/g, '--component-bg-hover');
  css = css.replace(/--apx-color-primary/g, '--color-primary');
  css = css.replace(/--apx-shadow-md/g, '--shadow-md');
  css = css.replace(/--apx-shadow-lg/g, '--shadow-lg');
  css = css.replace(/--apx-shadow-xl/g, '--shadow-xl');

  if (css !== original) {
    fs.writeFileSync(filePath, css);
    console.log('Updated ' + filePath);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.scss')) {
      processFile(fullPath);
    }
  });
}

walk(targetDir);
