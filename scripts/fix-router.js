#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing router variable declarations...\n');

// Get all TypeScript/JavaScript files
function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

function fixRouterDeclarations(content) {
  // Only fix if file uses router.push and imports useRouter but doesn't declare router
  if (content.includes('router.push') && 
      content.includes('useRouter') && 
      !content.includes('const router = useRouter()')) {
    
    // Look for useSession pattern and add router after it
    const sessionPattern = /const\s+{\s*data:\s*session\s*}\s*=\s*useSession\(\)/;
    const sessionMatch = content.match(sessionPattern);
    
    if (sessionMatch) {
      const replacement = sessionMatch[0] + '\n  const router = useRouter()';
      return content.replace(sessionPattern, replacement);
    }
    
    // Or look for other patterns to insert after
    const functionPattern = /export default function \w+\(\) \{\s*\n/;
    const functionMatch = content.match(functionPattern);
    
    if (functionMatch) {
      const replacement = functionMatch[0] + '  const router = useRouter()\n';
      return content.replace(functionPattern, replacement);
    }
  }
  
  return content;
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = getAllFiles(srcDir);
  
  console.log(`Processing ${files.length} files...\n`);
  
  let totalFixed = 0;
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const modified = fixRouterDeclarations(content);
      
      if (modified !== content) {
        fs.writeFileSync(file, modified, 'utf8');
        console.log(`✅ Fixed router in: ${file.replace(srcDir, 'src')}`);
        totalFixed++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  });
  
  console.log(`\n🎉 Successfully processed ${totalFixed} files!`);
}

if (require.main === module) {
  main();
} 