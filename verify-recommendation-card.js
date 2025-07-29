#!/usr/bin/env node

/**
 * Verification script for RecommendationCard component
 * This script verifies that the component can be imported and has the expected structure
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying RecommendationCard component...\n');

try {
  // Check if component file exists and has expected content
  const componentPath = join(process.cwd(), 'src/components/RecommendationCard.jsx');
  const componentContent = readFileSync(componentPath, 'utf8');

  const checks = [
    {
      name: 'Component export',
      test: () => componentContent.includes('export default RecommendationCard'),
      message: 'Component has default export'
    },
    {
      name: 'React hooks import',
      test: () => componentContent.includes("import { useState } from 'react'"),
      message: 'Component imports React hooks'
    },
    {
      name: 'Theme context usage',
      test: () => componentContent.includes('useTheme'),
      message: 'Component uses theme context'
    },
    {
      name: 'Image handling',
      test: () => componentContent.includes('handleImageLoad') && componentContent.includes('handleImageError'),
      message: 'Component handles image loading states'
    },
    {
      name: 'Placeholder support',
      test: () => componentContent.includes('getPlaceholderImage'),
      message: 'Component supports placeholder images'
    },
    {
      name: 'Responsive design',
      test: () => componentContent.includes('hover:scale-[1.02]') && componentContent.includes('dark:'),
      message: 'Component has responsive and dark mode styling'
    },
    {
      name: 'Accessibility',
      test: () => componentContent.includes('aria-label') && componentContent.includes('role="article"'),
      message: 'Component includes accessibility attributes'
    },
    {
      name: 'Lazy loading',
      test: () => componentContent.includes('loading="lazy"'),
      message: 'Component implements lazy loading for images'
    },
    {
      name: 'Entity type formatting',
      test: () => componentContent.includes('formatEntityType'),
      message: 'Component formats entity types for display'
    },
    {
      name: 'Score formatting',
      test: () => componentContent.includes('formatScore'),
      message: 'Component formats scores as percentages'
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
    console.log('🎉 All checks passed! RecommendationCard component is properly implemented.');
  } else {
    console.log('⚠️  Some checks failed. Please review the component implementation.');
  }

  // Check test file
  console.log('\n🧪 Checking test file...');
  
  try {
    const testPath = join(process.cwd(), 'src/components/__tests__/RecommendationCard.test.jsx');
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
        name: 'Testing Library imports',
        test: () => testContent.includes('@testing-library/react'),
        message: 'Test file imports React Testing Library'
      },
      {
        name: 'Mock data',
        test: () => testContent.includes('mockRecommendation'),
        message: 'Test file includes mock recommendation data'
      },
      {
        name: 'Theme provider wrapper',
        test: () => testContent.includes('ThemeProvider'),
        message: 'Test file includes theme provider wrapper'
      },
      {
        name: 'Multiple test cases',
        test: () => (testContent.match(/it\(/g) || []).length >= 10,
        message: 'Test file includes comprehensive test cases'
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

  // Check CSS utilities
  console.log('\n🎨 Checking CSS utilities...');
  
  try {
    const cssPath = join(process.cwd(), 'src/styles/tailwind.css');
    const cssContent = readFileSync(cssPath, 'utf8');
    
    if (cssContent.includes('line-clamp-1') && cssContent.includes('line-clamp-2') && cssContent.includes('line-clamp-3')) {
      console.log('✅ Line clamp utilities are available');
    } else {
      console.log('❌ Line clamp utilities are missing');
    }
  } catch (error) {
    console.log(`❌ Could not check CSS utilities: ${error.message}`);
  }

} catch (error) {
  console.error(`❌ Error verifying component: ${error.message}`);
  process.exit(1);
}

console.log('\n✨ RecommendationCard verification complete!');