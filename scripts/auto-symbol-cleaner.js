#!/usr/bin/env node

/**
 * Automatic Symbol Cleaner
 * Removes the Unicode replacement character "�" from all source files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replacement character to remove
const REPLACEMENT_CHAR = '�';
const REPLACEMENT_CHAR_UNICODE = '\uFFFD';

// File extensions to process
const VALID_EXTENSIONS = [
  '.tsx', '.jsx', '.ts', '.js', 
  '.md', '.json', '.css', '.html',
  '.txt', '.yml', '.yaml'
];

// Directories to exclude
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.nyc_output'
];

let totalFilesProcessed = 0;
let totalFilesModified = 0;
let totalReplacementsFound = 0;

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  const dirName = path.dirname(filePath);
  
  // Check extension
  if (!VALID_EXTENSIONS.includes(ext)) {
    return false;
  }
  
  // Check if in excluded directory
  for (const excludedDir of EXCLUDED_DIRS) {
    if (dirName.includes(excludedDir)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Clean symbols from text content
 */
function cleanSymbols(content) {
  const original = content;
  
  // Remove replacement character
  content = content.replace(/�/g, '');
  content = content.replace(/\uFFFD/g, '');
  
  // Count replacements
  const replacements = (original.length - content.length);
  
  return {
    content,
    replacements,
    wasModified: original !== content
  };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = cleanSymbols(content);
    
    totalFilesProcessed++;
    
    if (result.wasModified) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      totalFilesModified++;
      totalReplacementsFound += result.replacements;
      
      console.log(`✅ Cleaned: ${filePath} (${result.replacements} symbols removed)`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDED_DIRS.includes(item)) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        if (shouldProcessFile(fullPath)) {
          processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🧹 Starting automatic symbol cleaner...');
  console.log(`Removing character: "${REPLACEMENT_CHAR}" (Unicode: U+FFFD)`);
  console.log('');
  
  const startTime = Date.now();
  const rootDir = process.cwd();
  
  processDirectory(rootDir);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log('🎉 Symbol cleaning complete!');
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${totalFilesProcessed}`);
  console.log(`   Files modified: ${totalFilesModified}`);
  console.log(`   Symbols removed: ${totalReplacementsFound}`);
  console.log(`   Duration: ${duration}s`);
  
  if (totalFilesModified > 0) {
    console.log('');
    console.log('💡 Tip: Run this script regularly or add it to your build process');
    console.log('   npm run clean:symbols');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  cleanSymbols,
  processFile,
  processDirectory,
  main
};
