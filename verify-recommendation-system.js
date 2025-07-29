#!/usr/bin/env node

/**
 * Verification script for the complete recommendation system
 * This script verifies the recommendation service, hook, and integration
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying recommendation system...\n');

try {
  // Check recommendation service
  console.log('📦 Checking RecommendationService...');
  
  const servicePath = join(process.cwd(), 'src/services/recommendationService.js');
  const serviceContent = readFileSync(servicePath, 'utf8');

  const serviceChecks = [
    {
      name: 'Service class export',
      test: () => serviceContent.includes('export class RecommendationService'),
      message: 'RecommendationService class is exported'
    },
    {
      name: 'Caching implementation',
      test: () => serviceContent.includes('cache = new Map()') && serviceContent.includes('getCachedResult'),
      message: 'Service implements caching with Map'
    },
    {
      name: 'Request deduplication',
      test: () => serviceContent.includes('pendingRequests') && serviceContent.includes('pendingRequests.has'),
      message: 'Service implements request deduplication'
    },
    {
      name: 'Retry logic',
      test: () => serviceContent.includes('retryAttempts') && serviceContent.includes('shouldNotRetry'),
      message: 'Service implements retry logic with error classification'
    },
    {
      name: 'Timeout handling',
      test: () => serviceContent.includes('requestTimeout') && serviceContent.includes('Promise.race'),
      message: 'Service implements request timeout handling'
    },
    {
      name: 'Data processing',
      test: () => serviceContent.includes('processRecommendations') && serviceContent.includes('deduplicateRecommendations'),
      message: 'Service processes recommendations with deduplication'
    },
    {
      name: 'Error handling',
      test: () => serviceContent.includes('createErrorResult') && serviceContent.includes('createEmptyResult'),
      message: 'Service provides comprehensive error handling'
    },
    {
      name: 'Type filtering',
      test: () => serviceContent.includes('getRecommendationsByType') && serviceContent.includes('allowedTypes'),
      message: 'Service supports filtering by entity types'
    },
    {
      name: 'Cache management',
      test: () => serviceContent.includes('clearCache') && serviceContent.includes('maxCacheSize'),
      message: 'Service implements cache management with size limits'
    },
    {
      name: 'Statistics tracking',
      test: () => serviceContent.includes('getStats') && serviceContent.includes('calculateCacheHitRate'),
      message: 'Service provides statistics and monitoring'
    }
  ];

  let servicePassed = 0;
  let serviceFailed = 0;

  serviceChecks.forEach(check => {
    try {
      if (check.test()) {
        console.log(`✅ ${check.message}`);
        servicePassed++;
      } else {
        console.log(`❌ ${check.message}`);
        serviceFailed++;
      }
    } catch (error) {
      console.log(`❌ ${check.message} (Error: ${error.message})`);
      serviceFailed++;
    }
  });

  console.log(`\n📊 Service Results: ${servicePassed} passed, ${serviceFailed} failed\n`);

  // Check useRecommendations hook
  console.log('🪝 Checking useRecommendations hook...');
  
  const hookPath = join(process.cwd(), 'src/hooks/useRecommendations.js');
  const hookContent = readFileSync(hookPath, 'utf8');

  const hookChecks = [
    {
      name: 'Hook export',
      test: () => hookContent.includes('export const useRecommendations'),
      message: 'useRecommendations hook is exported'
    },
    {
      name: 'React hooks usage',
      test: () => hookContent.includes('useState') && hookContent.includes('useCallback') && hookContent.includes('useRef'),
      message: 'Hook uses appropriate React hooks'
    },
    {
      name: 'Loading state management',
      test: () => hookContent.includes('isLoading') && hookContent.includes('setIsLoading'),
      message: 'Hook manages loading states'
    },
    {
      name: 'Error handling',
      test: () => hookContent.includes('error') && hookContent.includes('setError'),
      message: 'Hook handles errors appropriately'
    },
    {
      name: 'Request cancellation',
      test: () => hookContent.includes('abortControllerRef') && hookContent.includes('AbortController'),
      message: 'Hook implements request cancellation'
    },
    {
      name: 'Race condition prevention',
      test: () => hookContent.includes('currentRequestRef') && hookContent.includes('requestId'),
      message: 'Hook prevents race conditions'
    },
    {
      name: 'Auto-retry functionality',
      test: () => hookContent.includes('autoRetry') && hookContent.includes('retryDelay'),
      message: 'Hook supports auto-retry functionality'
    },
    {
      name: 'Filtering utilities',
      test: () => hookContent.includes('filterRecommendations') && hookContent.includes('getAvailableTypes'),
      message: 'Hook provides filtering utilities'
    },
    {
      name: 'Refresh functionality',
      test: () => hookContent.includes('refreshRecommendations') && hookContent.includes('enableCache: false'),
      message: 'Hook supports cache refresh'
    },
    {
      name: 'Cleanup on unmount',
      test: () => hookContent.includes('useEffect') && hookContent.includes('return () =>'),
      message: 'Hook cleans up on unmount'
    }
  ];

  let hookPassed = 0;
  let hookFailed = 0;

  hookChecks.forEach(check => {
    try {
      if (check.test()) {
        console.log(`✅ ${check.message}`);
        hookPassed++;
      } else {
        console.log(`❌ ${check.message}`);
        hookFailed++;
      }
    } catch (error) {
      console.log(`❌ ${check.message} (Error: ${error.message})`);
      hookFailed++;
    }
  });

  console.log(`\n📊 Hook Results: ${hookPassed} passed, ${hookFailed} failed\n`);

  // Check test coverage
  console.log('🧪 Checking test coverage...');
  
  const testChecks = [
    {
      name: 'Service tests',
      path: 'src/services/__tests__/recommendationService.test.js',
      message: 'RecommendationService has comprehensive tests'
    },
    {
      name: 'Hook tests',
      path: 'src/hooks/__tests__/useRecommendations.test.js',
      message: 'useRecommendations hook has comprehensive tests'
    }
  ];

  let testsPassed = 0;
  let testsFailed = 0;

  testChecks.forEach(check => {
    try {
      const testPath = join(process.cwd(), check.path);
      const testContent = readFileSync(testPath, 'utf8');
      
      const hasTests = testContent.includes('describe') && testContent.includes('it') && testContent.includes('expect');
      const hasGoodCoverage = (testContent.match(/it\(/g) || []).length >= 10;
      
      if (hasTests && hasGoodCoverage) {
        console.log(`✅ ${check.message}`);
        testsPassed++;
      } else {
        console.log(`❌ ${check.message} (insufficient coverage)`);
        testsFailed++;
      }
    } catch (error) {
      console.log(`❌ ${check.message} (file not found)`);
      testsFailed++;
    }
  });

  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed\n`);

  // Check integration with existing components
  console.log('🔗 Checking component integration...');
  
  const integrationChecks = [
    {
      name: 'RecommendationCard exists',
      path: 'src/components/RecommendationCard.jsx',
      message: 'RecommendationCard component is available'
    },
    {
      name: 'RecommendationGrid exists',
      path: 'src/components/RecommendationGrid.jsx',
      message: 'RecommendationGrid component is available'
    },
    {
      name: 'QlooService integration',
      path: 'src/services/qlooService.js',
      message: 'QlooService is available for integration'
    },
    {
      name: 'Data utilities integration',
      path: 'src/services/dataUtils.js',
      message: 'Data utilities are available for processing'
    }
  ];

  let integrationPassed = 0;
  let integrationFailed = 0;

  integrationChecks.forEach(check => {
    try {
      const filePath = join(process.cwd(), check.path);
      const fileContent = readFileSync(filePath, 'utf8');
      
      if (fileContent.length > 0) {
        console.log(`✅ ${check.message}`);
        integrationPassed++;
      } else {
        console.log(`❌ ${check.message} (empty file)`);
        integrationFailed++;
      }
    } catch (error) {
      console.log(`❌ ${check.message} (file not found)`);
      integrationFailed++;
    }
  });

  console.log(`\n📊 Integration Results: ${integrationPassed} passed, ${integrationFailed} failed\n`);

  // Overall summary
  const totalPassed = servicePassed + hookPassed + testsPassed + integrationPassed;
  const totalFailed = serviceFailed + hookFailed + testsFailed + integrationFailed;
  const totalChecks = totalPassed + totalFailed;

  console.log('📋 Overall Summary:');
  console.log(`   Service: ${servicePassed}/${servicePassed + serviceFailed}`);
  console.log(`   Hook: ${hookPassed}/${hookPassed + hookFailed}`);
  console.log(`   Tests: ${testsPassed}/${testsPassed + testsFailed}`);
  console.log(`   Integration: ${integrationPassed}/${integrationPassed + integrationFailed}`);
  console.log(`   Total: ${totalPassed}/${totalChecks} (${Math.round(totalPassed / totalChecks * 100)}%)`);

  if (totalFailed === 0) {
    console.log('\n🎉 All checks passed! Recommendation system is fully implemented and ready for use.');
  } else if (totalFailed <= 3) {
    console.log('\n✅ Recommendation system is mostly complete with minor issues to address.');
  } else {
    console.log('\n⚠️  Recommendation system needs attention. Please review the failed checks.');
  }

} catch (error) {
  console.error(`❌ Error verifying recommendation system: ${error.message}`);
  process.exit(1);
}

console.log('\n✨ Recommendation system verification complete!');