#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing React Hook dependency warnings...\n');

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

// Fix React Hook dependencies
function fixReactHookDependencies(content) {
  let modified = content;
  
  // Pattern 1: useEffect with function calls that need dependencies
  const useEffectPatterns = [
    {
      // fetchAnalytics() in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*(\w+)\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, functionName, deps) => {
        const currentDeps = deps.trim();
        if (currentDeps && !currentDeps.includes(functionName)) {
          return match.replace(`[${currentDeps}]`, `[${currentDeps}, ${functionName}]`);
        } else if (!currentDeps) {
          return match.replace('[]', `[${functionName}]`);
        }
        return match;
      }
    },
    {
      // fetchMenuItem() in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*fetchMenuItem\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, deps) => {
        const currentDeps = deps.trim();
        if (!currentDeps.includes('fetchMenuItem')) {
          return match.replace(`[${currentDeps}]`, currentDeps ? `[${currentDeps}, fetchMenuItem]` : '[fetchMenuItem]');
        }
        return match;
      }
    },
    {
      // fetchUniversities() in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*fetchUniversities\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, deps) => {
        const currentDeps = deps.trim();
        if (!currentDeps.includes('fetchUniversities')) {
          return match.replace(`[${currentDeps}]`, currentDeps ? `[${currentDeps}, fetchUniversities]` : '[fetchUniversities]');
        }
        return match;
      }
    },
    {
      // fetchOrderDetails() in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*fetchOrderDetails\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, deps) => {
        const currentDeps = deps.trim();
        if (!currentDeps.includes('fetchOrderDetails')) {
          return match.replace(`[${currentDeps}]`, currentDeps ? `[${currentDeps}, fetchOrderDetails]` : '[fetchOrderDetails]');
        }
        return match;
      }
    },
    {
      // fetchUsers() in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*fetchUsers\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, deps) => {
        const currentDeps = deps.trim();
        if (!currentDeps.includes('fetchUsers')) {
          return match.replace(`[${currentDeps}]`, currentDeps ? `[${currentDeps}, fetchUsers]` : '[fetchUsers]');
        }
        return match;
      }
    }
  ];
  
  // Apply useEffect fixes
  useEffectPatterns.forEach(({ pattern, fix }) => {
    modified = modified.replace(pattern, fix);
  });
  
  // Pattern 2: useCallback with router dependencies
  const useCallbackPatterns = [
    {
      // Remove router from dependencies (it's stable)
      pattern: /useCallback\(([^,]+), \[([^\]]*router[^\]]*)\]\)/g,
      fix: (match, func, deps) => {
        const cleanDeps = deps.replace(/,?\s*router\s*,?/g, '').replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '');
        return `useCallback(${func}, [${cleanDeps}])`;
      }
    }
  ];
  
  // Apply useCallback fixes
  useCallbackPatterns.forEach(({ pattern, fix }) => {
    modified = modified.replace(pattern, fix);
  });
  
  // Pattern 3: useMemo with unnecessary dependencies
  const useMemoPatterns = [
    {
      // Remove currentTime from dependencies if not actually used
      pattern: /useMemo\(([^,]+), \[([^\]]*currentTime[^\]]*)\]\)/g,
      fix: (match, func, deps) => {
        if (!func.includes('currentTime')) {
          const cleanDeps = deps.replace(/,?\s*currentTime\s*,?/g, '').replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '');
          return `useMemo(${func}, [${cleanDeps}])`;
        }
        return match;
      }
    }
  ];
  
  // Apply useMemo fixes
  useMemoPatterns.forEach(({ pattern, fix }) => {
    modified = modified.replace(pattern, fix);
  });
  
  // Pattern 4: Simple missing dependencies
  const simpleDependencyFixes = [
    {
      // filterItems function in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*filterItems\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, deps) => {
        const currentDeps = deps.trim();
        if (!currentDeps.includes('filterItems')) {
          return match.replace(`[${currentDeps}]`, currentDeps ? `[${currentDeps}, filterItems]` : '[filterItems]');
        }
        return match;
      }
    },
    {
      // filterOrders function in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*filterOrders\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, deps) => {
        const currentDeps = deps.trim();
        if (!currentDeps.includes('filterOrders')) {
          return match.replace(`[${currentDeps}]`, currentDeps ? `[${currentDeps}, filterOrders]` : '[filterOrders]');
        }
        return match;
      }
    },
    {
      // applyFilters function in useEffect
      pattern: /useEffect\(\(\) => \{\s*\n\s*applyFilters\(\)\s*\n\s*\}, \[([^\]]*)\]\)/g,
      fix: (match, deps) => {
        const currentDeps = deps.trim();
        if (!currentDeps.includes('applyFilters')) {
          return match.replace(`[${currentDeps}]`, currentDeps ? `[${currentDeps}, applyFilters]` : '[applyFilters]');
        }
        return match;
      }
    }
  ];
  
  // Apply simple dependency fixes
  simpleDependencyFixes.forEach(({ pattern, fix }) => {
    modified = modified.replace(pattern, fix);
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
      const modified = fixReactHookDependencies(content);
      
      if (modified !== content) {
        fs.writeFileSync(file, modified, 'utf8');
        console.log(`✅ Fixed React hooks in: ${file.replace(srcDir, 'src')}`);
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
    const beforeCount = 188; // Current warning count
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