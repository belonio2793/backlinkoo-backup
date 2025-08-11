/**
 * Comprehensive Spacing Issues Finder and Fixer
 * This script identifies and fixes common spacing issues throughout the application
 */

const fs = require('fs');
const path = require('path');

// Patterns to find and fix
const spacingPatterns = [
  // Credits formatting
  {
    pattern: /\{([^}]*credits[^}]*)\}Credits/gi,
    replacement: (match, group) => `{${group} Credits}`,
    description: 'Fix missing space before Credits'
  },
  {
    pattern: /\{([^}]*)\}Credits(?!\s)/gi,
    replacement: (match, group) => `{${group}} Credits`,
    description: 'Fix missing space between variable and Credits'
  },
  {
    pattern: /([0-9]+)Credits/g,
    replacement: '$1 Credits',
    description: 'Fix number directly attached to Credits'
  },
  
  // Per credit formatting
  {
    pattern: /\$([0-9]+\.?[0-9]*)per\s+credit/gi,
    replacement: '$$$1 per credit',
    description: 'Fix missing space between price and per credit'
  },
  {
    pattern: /\$([0-9]+\.?[0-9]*)per credit/gi,
    replacement: '$$$1 per credit',
    description: 'Fix price directly attached to per'
  },
  
  // Price formatting
  {
    pattern: /\$([0-9]+)\/month/g,
    replacement: '$$$1/month',
    description: 'Ensure price/month formatting is consistent'
  },
  {
    pattern: /\$([0-9]+)\/year/g,
    replacement: '$$$1/year',
    description: 'Ensure price/year formatting is consistent'
  },
  
  // Links and campaigns
  {
    pattern: /([0-9]+)links/gi,
    replacement: '$1 links',
    description: 'Fix number directly attached to links'
  },
  {
    pattern: /([0-9]+)campaigns/gi,
    replacement: '$1 campaigns',
    description: 'Fix number directly attached to campaigns'
  },
  
  // Common CSS class spacing issues
  {
    pattern: /className="([^"]*)\s{2,}([^"]*)"/g,
    replacement: 'className="$1 $2"',
    description: 'Fix multiple spaces in className'
  },
  
  // Template literal improvements
  {
    pattern: /\{([^}]*[0-9]+[^}]*)\}\s*Credits/g,
    replacement: '{`$1 Credits`}',
    description: 'Convert to template literal for proper spacing'
  },
  {
    pattern: /\{([^}]*)\}\s*per\s+credit/g,
    replacement: '{`$1 per credit`}',
    description: 'Convert per credit to template literal'
  }
];

// File extensions to process
const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];

// Directories to process
const directories = ['src/components', 'src/pages', 'src/services'];

function findFiles(dir, extensions) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(findFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

function fixSpacingInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let changesLog = [];
    
    for (const pattern of spacingPatterns) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        const before = content;
        content = content.replace(pattern.pattern, pattern.replacement);
        if (content !== before) {
          hasChanges = true;
          changesLog.push({
            description: pattern.description,
            matches: matches.length,
            examples: matches.slice(0, 3) // Show first 3 examples
          });
        }
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed spacing issues in: ${filePath}`);
      changesLog.forEach(change => {
        console.log(`   - ${change.description} (${change.matches} instances)`);
        change.examples.forEach(example => {
          console.log(`     Example: "${example}"`);
        });
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Scanning for spacing issues...\n');
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.warn(`Warning: Directory ${dir} does not exist, skipping...`);
      continue;
    }
    
    const files = findFiles(dir, fileExtensions);
    console.log(`📁 Processing ${files.length} files in ${dir}/`);
    
    for (const file of files) {
      totalFiles++;
      if (fixSpacingInFile(file)) {
        fixedFiles++;
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files with fixes: ${fixedFiles}`);
  console.log(`   Files without issues: ${totalFiles - fixedFiles}`);
  
  if (fixedFiles > 0) {
    console.log(`\n✨ All spacing issues have been fixed!`);
    console.log(`   Please review the changes and test the application.`);
  } else {
    console.log(`\n✅ No spacing issues found!`);
  }
}

// Manual fixes for specific known issues
const manualFixes = [
  {
    file: 'src/components/EnhancedUnifiedPaymentModal.tsx',
    fixes: [
      {
        find: '{plan.credits} Credits',
        replace: '{`${plan.credits} Credits`}'
      },
      {
        find: '${plan.pricePerCredit} per credit',
        replace: '${`${plan.pricePerCredit} per credit`}'
      }
    ]
  },
  {
    file: 'src/components/PricingModal.tsx',
    fixes: [
      {
        find: '{plan.credits} Credits',
        replace: '{`${plan.credits} Credits`}'
      }
    ]
  },
  {
    file: 'src/pages/Index.tsx',
    fixes: [
      {
        find: '{plan.credits} Credits',
        replace: '{`${plan.credits} Credits`}'
      }
    ]
  }
];

function applyManualFixes() {
  console.log('\n🔧 Applying manual fixes...');
  
  for (const manual of manualFixes) {
    if (fs.existsSync(manual.file)) {
      let content = fs.readFileSync(manual.file, 'utf8');
      let hasChanges = false;
      
      for (const fix of manual.fixes) {
        if (content.includes(fix.find)) {
          content = content.replace(new RegExp(fix.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        fs.writeFileSync(manual.file, content, 'utf8');
        console.log(`✅ Applied manual fixes to: ${manual.file}`);
      }
    }
  }
}

// Run the fixes
main();
applyManualFixes();

console.log('\n🎉 Spacing issue fixing complete!');
