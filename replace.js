const fs = require('fs');
const path = require('path');

const replacements = {
    '#131314': '#0C0A09',
    '#1e1f20': '#1C1917',
    '#1a1a1c': 'stone-900',
    '#282a2c': 'stone-800',
    '#e3e3e3': 'stone-50',
    '#b4b4b4': 'stone-400',
    '#3c4043': 'stone-800',
    '#8ab4f8': 'amber-500', 
    '#f28b82': 'rose-500',
    '#4285f4': 'amber-500',
    '#9b72cb': 'rose-500',
    '#000000/20': 'stone-800',
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    for (const [oldVal, newVal] of Object.entries(replacements)) {
        // We replace occurrences that look like class names mostly, or directly match
        // if they are standard hex values.
        const regex = new RegExp(oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        newContent = newContent.replace(regex, newVal);
    }
    
    // Some specific tailwind class fixes because direct hex to name replacement might break things
    // e.g. text-stone-50 instead of text-[#e3e3e3] -> text-[stone-50] which is invalid tailwind
    newContent = newContent.replace(/\[stone-900\]/g, 'stone-900');
    newContent = newContent.replace(/\[stone-800\]/g, 'stone-800');
    newContent = newContent.replace(/\[stone-50\]/g, 'stone-50');
    newContent = newContent.replace(/\[stone-400\]/g, 'stone-400');
    newContent = newContent.replace(/\[amber-500\]/g, 'amber-500');
    newContent = newContent.replace(/\[rose-500\]/g, 'rose-500');

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log('Updated', filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            processFile(fullPath);
        }
    }
}

walkDir('./app');
walkDir('./components');
console.log('Done replacing colors.');
