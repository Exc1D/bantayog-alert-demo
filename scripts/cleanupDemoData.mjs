/**
 * Demo Data Cleanup Script for Bantayog Alert
 *
 * This script cleans up demo reports in Firestore:
 * 1. Fix or remove reports with empty weather data
 * 2. Remove all reports with disaster type 'Unclassified'
 *
 * Usage:
 *   node scripts/cleanupDemoData.mjs [--dry-run] [--fix-weather]
 *
 * Options:
 *   --dry-run     Show what would be deleted without actually deleting
 *   --fix-weather Fix empty weather data instead of deleting (if possible)
 *
 * Prerequisites:
 *   Firebase Admin SDK credentials must be available via
 *   GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FIX_WEATHER = args.includes('--fix-weather');

console.log('===========================================');
console.log('Bantayog Alert - Demo Data Cleanup');
console.log('===========================================');
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE RUN'}`);
console.log(`Weather fix: ${FIX_WEATHER ? 'enabled' : 'disabled (will delete instead)'}`);
console.log('===========================================\n');

// Initialize Firebase Admin
let db;
try {
  // Try to use Application Default Credentials
  initializeApp({
    projectId: 'bantayog-alert-demo-36b27'
  });
  db = getFirestore();
  console.log('Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  console.error('\nTo run this script, you need:');
  console.error('1. A service account key file set as GOOGLE_APPLICATION_CREDENTIALS');
  console.error('2. Or run `gcloud auth application-default login` for local development');
  process.exit(1);
}

/**
 * Valid municipalities in Camarines Norte
 */
const VALID_MUNICIPALITIES = [
  'Basud', 'Capalonga', 'Daet', 'Jose Panganiban', 'Labo',
  'Mercedes', 'Paracale', 'San Lorenzo Ruiz', 'San Vicente',
  'Santa Elena', 'Talisay', 'Vinzons'
];

/**
 * Valid disaster types (from firestore.rules)
 */
const VALID_DISASTER_TYPES = [
  'flood', 'landslide', 'fire', 'earthquake', 'typhoon',
  'health', 'road_incident', 'infrastructure', 'environmental',
  'security', 'other', 'pending'
];

async function cleanupReports() {
  console.log('Scanning reports collection...\n');

  const reportsRef = db.collection('reports');
  const snapshot = await reportsRef.get();

  console.log(`Found ${snapshot.size} total reports\n`);

  // Track issues
  const issues = {
    emptyWeather: [],
    unclassified: [],
    invalidMunicipality: [],
    invalidDisasterType: []
  };

  // Analyze each report
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const reportId = doc.id;

    // Check for empty weather data
    const weatherContext = data.weatherContext || {};
    if (Object.keys(weatherContext).length === 0 ||
        (weatherContext.temp === undefined && weatherContext.weather === undefined)) {
      issues.emptyWeather.push({ id: reportId, data });
    }

    // Check for 'Unclassified' disaster type
    if (data.disaster?.type === 'Unclassified') {
      issues.unclassified.push({ id: reportId, data });
    }

    // Check for invalid municipality
    if (data.location?.municipality &&
        !VALID_MUNICIPALITIES.includes(data.location.municipality)) {
      issues.invalidMunicipality.push({
        id: reportId,
        municipality: data.location.municipality
      });
    }

    // Check for invalid disaster type
    if (data.disaster?.type &&
        !VALID_DISASTER_TYPES.includes(data.disaster.type)) {
      issues.invalidDisasterType.push({
        id: reportId,
        type: data.disaster.type
      });
    }
  }

  // Report findings
  console.log('========== FINDINGS ==========\n');

  console.log(`Reports with empty weather data: ${issues.emptyWeather.length}`);
  if (issues.emptyWeather.length > 0 && !FIX_WEATHER) {
    console.log('  (Run with --fix-weather to attempt fixing these)');
  }
  issues.emptyWeather.slice(0, 5).forEach(r => {
    console.log(`  - ${r.id} (${r.data.disaster?.type || 'unknown'})`);
  });
  if (issues.emptyWeather.length > 5) {
    console.log(`  ... and ${issues.emptyWeather.length - 5} more`);
  }
  console.log('');

  console.log(`Reports with 'Unclassified' disaster type: ${issues.unclassified.length}`);
  issues.unclassified.slice(0, 5).forEach(r => {
    console.log(`  - ${r.id}: ${r.data.disaster?.description?.substring(0, 50) || 'no description'}...`);
  });
  if (issues.unclassified.length > 5) {
    console.log(`  ... and ${issues.unclassified.length - 5} more`);
  }
  console.log('');

  console.log(`Reports with invalid municipality: ${issues.invalidMunicipality.length}`);
  issues.invalidMunicipality.slice(0, 5).forEach(r => {
    console.log(`  - ${r.id}: "${r.municipality}"`);
  });
  if (issues.invalidMunicipality.length > 5) {
    console.log(`  ... and ${issues.invalidMunicipality.length - 5} more`);
  }
  console.log('');

  console.log(`Reports with invalid disaster type: ${issues.invalidDisasterType.length}`);
  issues.invalidDisasterType.slice(0, 5).forEach(r => {
    console.log(`  - ${r.id}: "${r.type}"`);
  });
  if (issues.invalidDisasterType.length > 5) {
    console.log(`  ... and ${issues.invalidDisasterType.length - 5} more`);
  }
  console.log('');

  // Perform cleanup
  console.log('========== CLEANUP ACTIONS ==========\n');

  let deletedCount = 0;
  let fixedCount = 0;

  if (DRY_RUN) {
    console.log('[DRY RUN] Would delete reports with Unclassified type:');
    for (const report of issues.unclassified) {
      console.log(`  - Delete: ${report.id}`);
    }

    console.log('\n[DRY RUN] Would delete/report reports with empty weather:');
    for (const report of issues.emptyWeather) {
      console.log(`  - ${report.id}: ${FIX_WEATHER ? 'would attempt fix' : 'would delete'}`);
    }
  } else {
    // Delete Unclassified reports
    console.log(`Deleting ${issues.unclassified.length} reports with 'Unclassified' type...`);
    for (const report of issues.unclassified) {
      try {
        await db.collection('reports').doc(report.id).delete();
        deletedCount++;
        console.log(`  Deleted: ${report.id}`);
      } catch (error) {
        console.error(`  Failed to delete ${report.id}: ${error.message}`);
      }
    }

    // Handle empty weather reports
    console.log(`\nHandling ${issues.emptyWeather.length} reports with empty weather data...`);
    for (const report of issues.emptyWeather) {
      try {
        if (FIX_WEATHER) {
          // Update with minimal valid weather context
          await db.collection('reports').doc(report.id).update({
            weatherContext: {
              source: 'cleanup-script',
              cleanedAt: new Date().toISOString(),
              note: 'Weather data was empty, added placeholder'
            }
          });
          fixedCount++;
          console.log(`  Fixed: ${report.id}`);
        } else {
          // Just log it - don't delete without explicit confirmation
          console.log(`  Skipped (not deleted): ${report.id} - empty weather, needs manual review`);
        }
      } catch (error) {
        console.error(`  Failed to fix ${report.id}: ${error.message}`);
      }
    }
  }

  // Summary
  console.log('\n========== SUMMARY ==========\n');
  console.log(`Total reports scanned: ${snapshot.size}`);
  console.log(`Unclassified reports deleted: ${DRY_RUN ? issues.unclassified.length + ' (dry run)' : deletedCount}`);
  console.log(`Empty weather reports fixed: ${DRY_RUN ? issues.emptyWeather.length + ' (dry run)' : fixedCount}`);
  console.log('');

  if (!DRY_RUN && (deletedCount > 0 || fixedCount > 0)) {
    console.log('Cleanup completed successfully.');
  } else if (DRY_RUN) {
    console.log('Run without --dry-run to execute the cleanup.');
  }
}

// Run cleanup
cleanupReports().catch(error => {
  console.error('\nCleanup failed with error:', error);
  process.exit(1);
});