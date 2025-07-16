#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Quick Fix - Automated Warning Resolution\n');

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

// Fix 1: Remove unused imports (most common)
function removeUnusedImports(content) {
  const lines = content.split('\n');
  let modified = false;
  
  // Remove unused lucide-react imports
  lines.forEach((line, index) => {
    if (line.includes("from 'lucide-react'") && line.includes('{')) {
      const match = line.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"`]lucide-react['"`]/);
      if (match) {
        const imports = match[1].split(',').map(imp => imp.trim());
        const codeContent = lines.slice(index + 1).join('\n');
        
        const usedImports = imports.filter(imp => {
          const importName = imp.split(' as ')[0].trim();
          return codeContent.includes(importName);
        });
        
        if (usedImports.length === 0) {
          lines[index] = '';
          modified = true;
        } else if (usedImports.length < imports.length) {
          lines[index] = `import { ${usedImports.join(', ')} } from 'lucide-react'`;
          modified = true;
        }
      }
    }
    
    // Remove unused next/navigation imports
    if (line.includes("from 'next/navigation'") && line.includes('useRouter')) {
      const codeContent = lines.slice(index + 1).join('\n');
      if (!codeContent.includes('useRouter') && !codeContent.includes('router')) {
        lines[index] = '';
        modified = true;
      }
    }
    
    // Remove unused date-fns imports
    if (line.includes("from 'date-fns'") && line.includes('{')) {
      const match = line.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"`]date-fns['"`]/);
      if (match) {
        const imports = match[1].split(',').map(imp => imp.trim());
        const codeContent = lines.slice(index + 1).join('\n');
        
        const usedImports = imports.filter(imp => {
          const importName = imp.split(' as ')[0].trim();
          return codeContent.includes(importName);
        });
        
        if (usedImports.length === 0) {
          lines[index] = '';
          modified = true;
        } else if (usedImports.length < imports.length) {
          lines[index] = `import { ${usedImports.join(', ')} } from 'date-fns'`;
          modified = true;
        }
      }
    }
  });
  
  if (modified) {
    // Clean up empty lines at the beginning
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift();
    }
    return lines.join('\n');
  }
  
  return content;
}

// Fix 2: Remove unused variables (simple cases)
function removeUnusedVariables(content) {
  let modified = content;
  
  // Remove unused router variables
  modified = modified.replace(/const\s+router\s*=\s*useRouter\(\)\s*\n/g, '');
  
  // Remove unused destructured variables that are clearly not used
  const unusedPatterns = [
    /const\s+{\s*notifications,\s*[^}]*\s*}\s*=\s*[^;]+;?\s*\n/g,
    /const\s+\[([^\]]*),\s*set[A-Z][^,\]]*\]\s*=\s*useState[^;]+;?\s*\n/g
  ];
  
  // This is conservative - only remove obvious unused variables
  return modified;
}

// Fix 3: Replace require() with import
function fixRequireImports(content) {
  return content.replace(
    /const\s+(\w+)\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g,
    "import $1 from '$2'"
  );
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
      let modified = content;
      
      // Apply fixes
      modified = removeUnusedImports(modified);
      modified = removeUnusedVariables(modified);
      modified = fixRequireImports(modified);
      
      if (modified !== content) {
        fs.writeFileSync(file, modified, 'utf8');
        console.log(`✅ Fixed: ${file.replace(srcDir, 'src')}`);
        totalFixed++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  });
  
  console.log(`\n🎉 Successfully processed ${totalFixed} files!`);
  
  // Run lint to check improvements
  console.log('\n🔍 Running lint to check improvements...');
  try {
    const result = execSync('npm run build 2>&1 | grep -c "Warning:" || echo "0"', { encoding: 'utf8' });
    console.log(`Remaining warnings: ${result.trim()}`);
  } catch (err) {
    console.log('Build check completed');
  }
}

if (require.main === module) {
  main();
} 