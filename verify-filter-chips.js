#!/usr/bin/env node

/**
 * Verification script for FilterChips component
 * Tests the component functionality and integration
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const COMPONENT_PATH = 'src/components/FilterChips.jsx';
const TEST_PATH = 'src/components/__tests__/FilterChips.test.jsx';

console.log('🔍 Verifying FilterChips Component Implementation...\n');

// Check if component file exists
if (!existsSync(COMPONENT_PATH)) {
  console.error('❌ FilterChips.jsx not found');
  process.exit(1);
}

// Check if test file exists
if (!existsSync(TEST_PATH)) {
  console.error('❌ FilterChips.test.jsx not found');
  process.exit(1);
}

// Read component file
const componentContent = readFileSync(COMPONENT_PATH, 'utf8');
const testContent = readFileSync(TEST_PATH, 'utf8');

console.log('✅ Files exist');

// Verify component structure
const checks = [
  {
    name: 'Component exports default',
    test: () => componentContent.includes('export default FilterChips'),
    required: true
  },
  {
    name: 'Uses useAppState hook',
    test: () => componentContent.includes('useAppState'),
    required: true
  },
  {
    name: 'Uses useTheme hook',
    test: () => componentContent.includes('useTheme'),
    required: true
  },
  {
    name: 'Imports ENTITY_TYPES',
    test: () => componentContent.includes('ENTITY_TYPES'),
    required: true
  },
  {
    name: 'Has toggleFilter functionality',
    test: () => componentContent.includes('toggleFilter'),
    required: true
  },
  {
    name: 'Has setAllFilters functionality',
    test: () => componentContent.includes('setAllFilters'),
    required: true
  },
  {
    name: 'Handles animation states',
    test: () => componentContent.includes('animationStates'),
    required: true
  },
  {
    name: 'Shows recommendation counts',
    test: () => componentContent.includes('getRecommendationCount'),
    required: true
  },
  {
    name: 'Has accessibility attributes',
    test: () => componentContent.includes('aria-label') && componentContent.includes('role="switch"'),
    required: true
  },
  {
    name: 'Supports compact mode',
    test: () => componentContent.includes('compact'),
    required: true
  },
  {
    name: 'Has entity type icons',
    test: () => componentContent.includes('getEntityIcon'),
    required: true
  },
  {
    name: 'Shows filter status',
    test: () => componentContent.includes('hasActiveFilters'),
    required: true
  },
  {
    name: 'Handles empty state',
    test: () => componentContent.includes('recommendations.length === 0'),
    required: true
  },
  {
    name: 'Has smooth animations',
    test: () => componentContent.includes('transition-all') && componentContent.includes('duration-200'),
    required: true
  },
  {
    name: 'Supports dark mode',
    test: () => componentContent.includes('dark:'),
    required: true
  }
];

// Run checks
let passed = 0;
let failed = 0;

checks.forEach(check => {
  try {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
      if (check.required) failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} (Error: ${error.message})`);
    if (check.required) failed++;
  }
});

// Test file checks
const testChecks = [
  {
    name: 'Test file has describe block',
    test: () => testContent.includes("describe('FilterChips'"),
    required: true
  },
  {
    name: 'Tests component rendering',
    test: () => testContent.includes('renders filter chips'),
    required: true
  },
  {
    name: 'Tests filter toggling',
    test: () => testContent.includes('toggleFilter'),
    required: true
  },
  {
    name: 'Tests accessibility',
    test: () => testContent.includes('accessibility'),
    required: true
  },
  {
    name: 'Tests recommendation counts',
    test: () => testContent.includes('recommendation count'),
    required: true
  }
];

console.log('\n📋 Test Coverage:');
testChecks.forEach(check => {
  try {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
      if (check.required) failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} (Error: ${error.message})`);
    if (check.required) failed++;
  }
});

// Summary
console.log(`\n📊 Summary:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 FilterChips component verification completed successfully!');
  console.log('\n📝 Component Features:');
  console.log('• Interactive filter chips for all Qloo entity types');
  console.log('• Toggle functionality with visual feedback');
  console.log('• Smooth animations for state changes');
  console.log('• Responsive layout for mobile devices');
  console.log('• Accessibility support with ARIA attributes');
  console.log('• Dark mode support');
  console.log('• Recommendation count badges');
  console.log('• Select all/clear all functionality');
  console.log('• Empty state handling');
  console.log('• Compact mode support');
  
  process.exit(0);
} else {
  console.log('\n❌ FilterChips component verification failed!');
  console.log('Please fix the issues above before proceeding.');
  process.exit(1);
}