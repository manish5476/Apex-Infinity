const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'app');

function getFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, filesList);
        } else {
            if (fullPath.endsWith('.html') || fullPath.endsWith('.ts')) {
                filesList.push(fullPath);
            }
        }
    }
    return filesList;
}

const files = getFiles(srcDir);
let updatedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix <p-dialog>
    content = content.replace(/<p-dialog([^>]*?)>/g, (match, attrs) => {
        let newAttrs = attrs;
        if (!newAttrs.includes('appendTo=')) newAttrs += ' appendTo="body"';
        if (!newAttrs.includes('[blockScroll]=')) newAttrs += ' [blockScroll]="true"';
        if (!newAttrs.includes('[breakpoints]=')) newAttrs += ` [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"`;
        // Keep dismissableMask if present, add if not
        if (!newAttrs.includes('dismissableMask')) newAttrs += ' [dismissableMask]="true"';
        newAttrs = newAttrs.replace(/\s*styleClass="(premium-dialog|glass-dialog-spacious|modern-confirm|glass-confirm-dialog|premium-confirm|modern-confirm)"\s*/g, ' ');
        return `<p-dialog${newAttrs}>`;
    });

    // Fix <p-confirmDialog>
    content = content.replace(/<p-confirmDialog([^>]*?)>/g, (match, attrs) => {
        if (match.endsWith('/>')) return match;
        let newAttrs = attrs;
        if (!newAttrs.includes('appendTo=')) newAttrs += ' appendTo="body"';
        if (!newAttrs.includes('[breakpoints]=')) newAttrs += ` [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"`;
        newAttrs = newAttrs.replace(/\s*styleClass="(premium-dialog|glass-dialog-spacious|modern-confirm|glass-confirm-dialog|premium-confirm|modern-confirm)"\s*/g, ' ');
        return `<p-confirmDialog${newAttrs}>`;
    });

    content = content.replace(/<p-confirmDialog\s*\/>/g, `<p-confirmDialog appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>`);

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFiles++;
    }
}

console.log(`Finished updating ${updatedFiles} files.`);
