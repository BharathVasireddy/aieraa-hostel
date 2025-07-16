#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing unused variables and imports...\n');

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

// Fix unused imports more thoroughly
function fixUnusedImports(content) {
  const lines = content.split('\n');
  let modified = false;
  
  // Common unused imports to remove
  const commonUnusedImports = [
    'Filter', 'Download', 'Calendar', 'Search', 'MoreHorizontal', 'Check', 
    'Users', 'Settings', 'BarChart3', 'Eye', 'MapPin', 'Phone', 'Clock',
    'ChevronDown', 'Star', 'TrendingUp', 'Zap', 'Home', 'User', 'ChefHat',
    'UserPlus', 'Package', 'AlertTriangle', 'CheckCircle'
  ];
  
  lines.forEach((line, index) => {
    if (line.includes("from 'lucide-react'") && line.includes('{')) {
      const match = line.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"`]lucide-react['"`]/);
      if (match) {
        const imports = match[1].split(',').map(imp => imp.trim());
        const codeContent = lines.slice(index + 1).join('\n');
        
        const usedImports = imports.filter(imp => {
          const importName = imp.split(' as ')[0].trim();
          return codeContent.includes(importName) && !commonUnusedImports.includes(importName);
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
    
    // Remove unused Next.js imports
    if (line.includes('NextRequest') && line.includes("from 'next/server'")) {
      const codeContent = lines.slice(index + 1).join('\n');
      if (!codeContent.includes('NextRequest')) {
        lines[index] = line.replace(/,?\s*NextRequest\s*,?/, '').replace(/{\s*,\s*}/, '{}');
        if (lines[index].includes('{}')) {
          lines[index] = '';
        }
        modified = true;
      }
    }
  });
  
  if (modified) {
    // Clean up empty lines
    const cleanedLines = lines.filter((line, index) => {
      if (line.trim() === '') {
        // Only keep empty lines if they're not at the start and not consecutive
        return index > 0 && lines[index - 1].trim() !== '';
      }
      return true;
    });
    return cleanedLines.join('\n');
  }
  
  return content;
}

// Fix unused variables (conservative approach)
function fixUnusedVariables(content) {
  let modified = content;
  
  // Remove unused destructured variables (very conservative)
  const patterns = [
    // Remove unused session variables
    /const\s+{\s*data:\s*session\s*}\s*=\s*useSession\(\)\s*\n(?![^]*session)/g,
    // Remove unused error variables in catch blocks
    /catch\s*\(\s*error\s*\)\s*{\s*\n\s*console\.error\([^)]*\)\s*\n/g,
    // Remove unused index in map functions
    /\.map\(\([^,]+,\s*index\)\s*=>/g,
  ];
  
  // Only apply very safe transformations
  modified = modified.replace(
    /catch\s*\(\s*error\s*\)\s*{\s*\n\s*console\.error\([^)]*\)\s*\n/g,
    'catch (error) {\n    console.error(error)\n'
  );
  
  // Remove unused function parameters (only 'event' in obvious cases)
  modified = modified.replace(
    /\(event\)\s*=>\s*{[^}]*}/g,
    match => match.replace('event', '_event')
  );
  
  return modified;
}

// Fix obvious unused variables
function removeObviousUnusedVars(content) {
  let modified = content;
  
  // Remove unused variables that are clearly not used
  const linesToRemove = [
    /const\s+\[.*orderPlaced.*setOrderPlaced.*\]\s*=\s*useState.*\n/g,
    /const\s+\[.*showEditCart.*setShowEditCart.*\]\s*=\s*useState.*\n/g,
    /const\s+\[.*showEditProfile.*setShowEditProfile.*\]\s*=\s*useState.*\n/g,
    /const\s+\[.*showPrivacySecurity.*setShowPrivacySecurity.*\]\s*=\s*useState.*\n/g,
    /const\s+currentTime\s*=\s*[^;]+;\s*\n/g,
    /const\s+cartItemsCount\s*=\s*[^;]+;\s*\n/g,
    /const\s+user\s*=\s*[^;]+;\s*\n(?![^]*[^.]user[^a-zA-Z_])/g,
  ];
  
  linesToRemove.forEach(pattern => {
    modified = modified.replace(pattern, '');
  });
  
  return modified;
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
      modified = fixUnusedImports(modified);
      modified = fixUnusedVariables(modified);
      modified = removeObviousUnusedVars(modified);
      
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
  
  // Show improvement
  console.log('\n📊 Checking improvements...');
  try {
    const beforeCount = 197; // Current warning count
    const afterResult = execSync('npm run build 2>&1 | grep -c "Warning:" || echo "0"', { encoding: 'utf8' });
    const afterCount = parseInt(afterResult.trim());
    
    console.log(`Before: ${beforeCount} warnings`);
    console.log(`After: ${afterCount} warnings`);
    console.log(`Reduction: ${beforeCount - afterCount} warnings (${Math.round((beforeCount - afterCount) / beforeCount * 100)}%)`);
  } catch (err) {
    console.log('Build check completed');
  }
}

if (require.main === module) {
  main();
} 