const fs = require('fs');
const path = require('path');

const excludeFiles = ['AdminPanel.tsx', 'Console.tsx', 'SupportChatAdmin.tsx'];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            if (excludeFiles.includes(file)) {
                console.log(`Skipping: ${fullPath}`);
                continue;
            }
            
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // This matches things like text-blue-500, hover:bg-green-600/20, etc.
            // and replaces the color name with "zinc"
            const regex = /(?<=^|[\s"'\`:\[\-])(blue|green|purple|orange|brown|red|yellow|pink|indigo|teal|cyan|lime|emerald|fuchsia|violet|rose|amber)(-\d{2,3})\b/g;
            
            const newContent = content.replace(regex, 'zinc$2');
            
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

// Ensure the directory is provided
const targetDir = process.argv[2] || 'src';
processDirectory(targetDir);
console.log("Color replacement done.");
