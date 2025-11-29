#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PrimusHomePro setup...\n');

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  '.gitignore',
  '.env.example',
  'README.md',
  'frontend/package.json',
  'frontend/tsconfig.json',
  'frontend/next.config.js',
  'frontend/app/layout.tsx',
  'frontend/app/page.tsx',
  'frontend/app/globals.css',
  'backend/package.json',
  'backend/tsconfig.json',
  'backend/.env.example',
  'backend/src/index.ts',
  'backend/src/config/index.ts',
];

const requiredDirs = [
  'frontend',
  'frontend/app',
  'frontend/components',
  'frontend/lib',
  'frontend/public',
  'backend',
  'backend/src',
  'backend/src/config',
  'backend/src/routes',
  'backend/src/services',
  'backend/src/models',
  'backend/src/utils',
  'scripts',
];

let allGood = true;

console.log('📁 Checking directories...');
requiredDirs.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, '..', dir));
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allGood = false;
});

console.log('\n📄 Checking files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All checks passed! Setup is complete.');
  console.log('\n📋 Next steps:');
  console.log('  1. npm install');
  console.log('  2. cd frontend && npm install');
  console.log('  3. cd ../backend && npm install');
  console.log('  4. Copy .env.example to .env and configure');
  console.log('  5. npm run dev');
} else {
  console.log('❌ Some files or directories are missing.');
  process.exit(1);
}
