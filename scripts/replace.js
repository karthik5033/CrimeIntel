const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.next' || file === '.git') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'crimeintel'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('MockDataClient') || content.includes('mockDataClient')) {
        content = content.replace(/MockDataClient/g, 'DataClient').replace(/mockDataClient/g, 'dataClient');
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
