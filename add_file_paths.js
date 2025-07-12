const fs = require('fs');
const path = require('path');

// Function to process each file
function processFile(filePath) {
    // Skip if not a TypeScript/JavaScript file
    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return;
    
    // Skip node_modules
    if (filePath.includes('node_modules')) return;

    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if file already has a path comment
    if (content.startsWith('// ' + filePath)) {
        console.log(`Skipping (already processed): ${filePath}`);
        return;
    }
    
    // Create the path comment (relative to src directory)
    const srcIndex = filePath.indexOf('src');
    const relativePath = srcIndex >= 0 ? filePath.substring(srcIndex) : filePath;
    const pathComment = `// ${relativePath.replace(/\\/g, '/')}\n\n`;
    
    // Add the comment at the beginning of the file
    const newContent = pathComment + content;
    
    // Write the file back
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
}

// Function to walk through directories
function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else {
            processFile(fullPath);
        }
    });
}

// Start processing from the src directory
const srcDir = path.join(__dirname, 'src');
console.log('Adding file path comments to all TypeScript/JavaScript files...');
walkDir(srcDir);
console.log('Done!');
