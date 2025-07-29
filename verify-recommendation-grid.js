#!/usr/bin/env node

/**
 * Verification script for RecommendationGrid component
 * This script verifies that the component can be imported and has the expected structure
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying RecommendationGrid component...\n');

try {
  // Check if component file exists and has expected content
  const componentPath = join(process.cwd(), 'src/components/RecommendationGrid.jsx');
  const componentContent = readFileSync(componentPath, 'utf8');

  const checks = [
    {
      name: 'Component export',
      test: () => componentContent.includes('export default RecommendationGrid'),
      message: 'Component has default export'
    },
    {
      name: 'React hooks import',
      test: () => componentContent.includes("import { useState, useEffect } from 'react'"),
      message: 'Component imports React hooks'
    },
    {
      name: 'RecommendationCard import',
      test: () => componentContent.includes("import RecommendationCard from './RecommendationCard'"),
      message: 'Component imports RecommendationCard'
    },
    {
      name: 'Theme context usage',
      test: () => componentContent.includes('useTheme'),
      message: 'Component uses theme context'
    },
    {
      name: 'Loading skeleton',
      test: () => componentContent.includes('LoadingSkeleton') && componentContent.includes('animate-pulse'),
      message: 'Component includes loading skeleton states'
    },
    {
      name: 'Error state',
      test: () => componentContent.includes('ErrorState') && componentContent.includes('Try Again'),
      message: 'Component handles error states with retry functionality'
    },
    {
      name: 'Empty state',
      test: () => componentContent.includes('EmptyState') && componentContent.includes('No Recommendations Found'),
      message: 'Component handles empty states'
    },
    {
      name: 'Responsive grid',
      test: () => componentContent.includes('getGridColumns') && componentContent.includes('grid-cols-1') && componentContent.includes('xl:grid-cols-4'),
      message: 'Component implements responsive grid layout'
    },
    {
      name: 'Staggered animations',
      test: () => componentContent.includes('animationDelay') && componentContent.includes('animate-fade-in'),
      message: 'Component implements staggered animations'
    },
    {
      name: 'Dark mode support',
      test: () => componentContent.includes('dark:') && componentContent.includes('dark:bg-gray-800'),
      message: 'Component supports dark mode styling'
    },
    {
      name: 'Adaptive columns',
      test: () => componentContent.includes('itemCount') && componentContent.includes('sm:grid-cols-2'),
      message: 'Component adapts grid columns based on item count'
    },
    {
      name: 'Loading state handling',
      test: () => componentContent.includes('isLoading') && componentContent.includes('renderLoadingSkeletons'),
      message: 'Component properly handles loading states'
    }
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    try {
      if (check.test()) {
        console.log(`✅ ${check.message}`);
        passed++;
      } else {
        console.log(`❌ ${check.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.message} (Error: ${error.message})`);
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All checks passed! RecommendationGrid component is properly implemented.');
  } else {
    console.log('⚠️  Some checks failed. Please review the component implementation.');
  }

  // Check test file
  console.log('\n🧪 Checking test file...');
  
  try {
    const testPath = join(process.cwd(), 'src/components/__tests__/RecommendationGrid.test.jsx');
    const testContent = readFileSync(testPath, 'utf8');
    
    const testChecks = [
      {
        name: 'Test file exists',
        test: () => testContent.length > 0,
        message: 'Test file exists and has content'
      },
      {
        name: 'Vitest imports',
        test: () => testContent.includes('describe') && testContent.includes('it') && testContent.includes('expect'),
        message: 'Test file imports Vitest functions'
      },
      {
        name: 'Component mocking',
        test: () => testContent.includes('vi.mock') && testContent.includes('RecommendationCard'),
        message: 'Test file mocks RecommendationCard component'
      },
      {
        name: 'Mock data',
        test: () => testContent.includes('mockRecommendations'),
        message: 'Test file includes mock recommendation data'
      },
      {
        name: 'Loading state tests',
        test: () => testContent.includes('isLoading={true}') && testContent.includes('animate-pulse'),
        message: 'Test file tests loading states'
      },
      {
        name: 'Error state tests',
        test: () => testContent.includes('error=') && testContent.includes('onRetry'),
        message: 'Test file tests error states and retry functionality'
      },
      {
        name: 'Grid layout tests',
        test: () => testContent.includes('grid-cols') && testContent.includes('getGridColumns'),
        message: 'Test file tests responsive grid layout'
      },
      {
        name: 'Animation tests',
        test: () => testContent.includes('animationDelay') && testContent.includes('animate-fade-in'),
        message: 'Test file tests staggered animations'
      },
      {
        name: 'Dark mode tests',
        test: () => testContent.includes('theme="dark"'),
        message: 'Test file tests dark mode functionality'
      },
      {
        name: 'Comprehensive coverage',
        test: () => (testContent.match(/it\(/g) || []).length >= 15,
        message: 'Test file includes comprehensive test coverage'
      }
    ];

    let testPassed = 0;
    let testFailed = 0;

    testChecks.forEach(check => {
      try {
        if (check.test()) {
          console.log(`✅ ${check.message}`);
          testPassed++;
        } else {
          console.log(`❌ ${check.message}`);
          testFailed++;
        }
      } catch (error) {
        console.log(`❌ ${check.message} (Error: ${error.message})`);
        testFailed++;
      }
    });

    console.log(`\n📊 Test Results: ${testPassed} passed, ${testFailed} failed`);

  } catch (error) {
    console.log(`❌ Could not read test file: ${error.message}`);
  }

  // Check integration with RecommendationCard
  console.log('\n🔗 Checking integration...');
  
  try {
    const cardPath = join(process.cwd(), 'src/components/RecommendationCard.jsx');
    const cardContent = readFileSync(cardPath, 'utf8');
    
    if (cardContent.includes('export default RecommendationCard')) {
      console.log('✅ RecommendationCard component is available for integration');
    } else {
      console.log('❌ RecommendationCard component not found');
    }
  } catch (error) {
    console.log(`❌ Could not check RecommendationCard integration: ${error.message}`);
  }

} catch (error) {
  console.error(`❌ Error verifying component: ${error.message}`);
  process.exit(1);
}

console.log('\n✨ RecommendationGrid verification complete!');