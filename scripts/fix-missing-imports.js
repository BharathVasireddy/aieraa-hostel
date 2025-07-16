#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing missing imports...\n');

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

// Fix missing Lucide React imports
function fixMissingLucideImports(content) {
  // List of common Lucide React icons
  const lucideIcons = [
    'TrendingUp', 'TrendingDown', 'Users', 'DollarSign', 'ShoppingCart', 'Clock', 
    'Target', 'RefreshCw', 'Download', 'BarChart3', 'PieChart', 'ArrowLeft', 
    'Save', 'Building', 'Filter', 'Search', 'MoreHorizontal', 'Check', 'Settings',
    'Eye', 'MapPin', 'Phone', 'ChevronDown', 'Star', 'Home', 'User', 'Calendar',
    'ChefHat', 'Package', 'CheckCircle', 'AlertTriangle', 'UserPlus', 'Plus',
    'Trash2', 'Edit', 'LogOut', 'Bell', 'Menu', 'X', 'ChevronRight', 'ChevronLeft',
    'Mail', 'Book', 'Bug', 'MessageCircle', 'Zap'
  ];
  
  // Find existing lucide-react import line
  const lucideImportMatch = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"`]lucide-react['"`]/);
  if (!lucideImportMatch) return content;
  
  const currentImports = lucideImportMatch[1].split(',').map(imp => imp.trim());
  const usedIcons = new Set(currentImports);
  
  // Check which icons are used in the code
  lucideIcons.forEach(icon => {
    if (content.includes(`<${icon}`) || content.includes(`{${icon}}`)) {
      usedIcons.add(icon);
    }
  });
  
  // Create new import statement
  const newImports = Array.from(usedIcons).sort().join(', ');
  const newImportLine = `import { ${newImports} } from 'lucide-react'`;
  
  // Replace the import line
  return content.replace(lucideImportMatch[0], newImportLine);
}

// Fix missing other imports
function fixMissingOtherImports(content) {
  let modified = content;
  
  // Check for missing useRouter import
  if (modified.includes('useRouter') && !modified.includes("import { useRouter") && !modified.includes("import {useRouter")) {
    // Add useRouter to next/navigation import or create new one
    const nextNavMatch = modified.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"`]next\/navigation['"`]/);
    if (nextNavMatch) {
      const currentImports = nextNavMatch[1].split(',').map(imp => imp.trim());
      if (!currentImports.includes('useRouter')) {
        currentImports.push('useRouter');
        const newImports = currentImports.join(', ');
        modified = modified.replace(nextNavMatch[0], `import { ${newImports} } from 'next/navigation'`);
      }
    }
  }
  
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
      modified = fixMissingLucideImports(modified);
      modified = fixMissingOtherImports(modified);
      
      if (modified !== content) {
        fs.writeFileSync(file, modified, 'utf8');
        console.log(`✅ Fixed imports in: ${file.replace(srcDir, 'src')}`);
        totalFixed++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  });
  
  console.log(`\n🎉 Successfully processed ${totalFixed} files!`);
  
  // Check if build works now
  console.log('\n📊 Testing build...');
  try {
    execSync('npm run build > /dev/null 2>&1');
    console.log('✅ Build successful!');
  } catch (err) {
    console.log('❌ Build still has issues - checking...');
    const result = execSync('npm run build 2>&1 | grep -c "Error:" || echo "0"', { encoding: 'utf8' });
    console.log(`Errors remaining: ${result.trim()}`);
  }
}

if (require.main === module) {
  main();
} 