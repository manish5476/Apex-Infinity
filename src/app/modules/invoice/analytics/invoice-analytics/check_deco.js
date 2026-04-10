
const fs = require('fs');
const content = fs.readFileSync('d:/Apex/apex/src/app/modules/invoice/analytics/invoice-analytics/advanceInvoiceDetails.ts', 'utf8');
const lines = content.split('\n');
const decoStart = lines.findIndex(l => l.includes('@Component({'));

if (decoStart === -1) {
    console.log('Could not find decorator');
    process.exit(1);
}

const decoContent = lines.slice(decoStart).join('\n');
let braceBalance = 0;
let parenBalance = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < decoContent.length; i++) {
    const char = decoContent[i];
    const prev = decoContent[i-1];
    
    if (char === '`') {
        if (!inString) {
            inString = true;
            stringChar = '`';
        } else if (stringChar === '`' && prev !== '\\') {
            inString = false;
        }
    } else if (char === "'" || char === '"') {
        if (!inString) {
            inString = true;
            stringChar = char;
        } else if (stringChar === char && prev !== '\\') {
            inString = false;
        }
    }
    
    if (!inString) {
        if (char === '{') braceBalance++;
        if (char === '}') braceBalance--;
        if (char === '(') parenBalance++;
        if (char === ')') parenBalance--;
        
        if (braceBalance === 0 && parenBalance === 0 && i > 11) {
            console.log('Decorator ends at relative char', i);
            console.log('Snippet around end:', JSON.stringify(decoContent.substring(Math.max(0, i-40), i+40)));
            break;
        }
    }
}
