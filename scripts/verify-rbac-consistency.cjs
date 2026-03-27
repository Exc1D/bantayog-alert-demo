#!/usr/bin/env node
/**
 * Verify RBAC consistency between Firestore rules and JS config.
 *
 * Compares:
 * - ADMIN_ROLES in rbacConfig.js vs isAdmin() in firestore.rules
 * - MODERATOR_ROLES in rbacConfig.js vs isModerator() in firestore.rules
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

let errors = 0;

// Check rbacConfig.js
try {
  const rbacConfig = readFile('src/utils/rbacConfig.js');

  // Extract ADMIN_ROLES
  const adminMatch = rbacConfig.match(/ADMIN_ROLES\s*=\s*\[(.*?)\]/);
  if (!adminMatch) {
    console.error('❌ Could not find ADMIN_ROLES in rbacConfig.js');
    errors++;
  }

  // Extract MODERATOR_ROLES
  const modMatch = rbacConfig.match(/MODERATOR_ROLES\s*=\s*\[(.*?)\]/);
  if (!modMatch) {
    console.error('❌ Could not find MODERATOR_ROLES in rbacConfig.js');
    errors++;
  }

  console.log('✅ rbacConfig.js parsed OK');
} catch (e) {
  console.error('❌ Error reading rbacConfig.js:', e.message);
  errors++;
}

// Check firestore.rules for admin pattern consistency
try {
  const rules = readFile('firestore.rules');

  // Verify isAdmin function exists
  if (!rules.includes('function isAdmin()')) {
    console.error('❌ isAdmin() function not found in firestore.rules');
    errors++;
  } else {
    console.log('✅ isAdmin() found in firestore.rules');
  }

  // Verify isModerator function exists
  if (!rules.includes('function isModerator()')) {
    console.error('❌ isModerator() function not found in firestore.rules');
    errors++;
  } else {
    console.log('✅ isModerator() found in firestore.rules');
  }

  // Check for if/else statements (NOT allowed in Firestore Rules)
  const ifElseMatches = rules.match(/\bif\s*\(/g);
  if (ifElseMatches && ifElseMatches.length > 0) {
    // Filter out comments
    const lines = rules.split('\n');
    const realIfs = lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*') && l.includes('if (')).length;
    if (realIfs > 0) {
      console.error(`❌ firestore.rules contains ${realIfs} if() statements — Firestore Rules only supports ternary expressions!`);
      errors++;
    }
  }

  console.log('✅ firestore.rules structure OK');
} catch (e) {
  console.error('❌ Error reading firestore.rules:', e.message);
  errors++;
}

if (errors > 0) {
  console.error(`\n❌ RBAC consistency check failed with ${errors} error(s)`);
  process.exit(1);
} else {
  console.log('\n✅ RBAC consistency check passed');
  process.exit(0);
}
