#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying DebugPanel Component Implementation...\n');

// Check if DebugPanel component exists
try {
  const debugPanelPath = join(process.cwd(), 'src/components/DebugPanel.jsx');
  const debugPanelContent = readFileSync(debugPanelPath, 'utf8');
  
  console.log('✅ DebugPanel component file exists');
  
  // Check for required features
  const requiredFeatures = [
    { name: 'useAppState hook import', pattern: /import.*useAppState.*from.*AppStateContext/ },
    { name: 'Keyboard shortcuts handling', pattern: /addEventListener.*keydown/ },
    { name: 'Panel toggle functionality', pattern: /toggleDebugPanel/ },
    { name: 'Debug mode toggle', pattern: /toggleDebugMode/ },
    { name: 'Entity analysis display', pattern: /EntityAnalysisSection/ },
    { name: 'Session information', pattern: /SessionInfoSection/ },
    { name: 'Responsive design classes', pattern: /lg:hidden|lg:block/ },
    { name: 'Animation classes', pattern: /transition.*duration/ },
    { name: 'Accessibility attributes', pattern: /aria-label|role=/ },
    { name: 'Keyboard shortcut help', pattern: /Keyboard Shortcuts/ }
  ];
  
  let passedFeatures = 0;
  
  requiredFeatures.forEach(feature => {
    if (feature.pattern.test(debugPanelContent)) {
      console.log(`✅ ${feature.name}`);
      passedFeatures++;
    } else {
      console.log(`❌ ${feature.name}`);
    }
  });
  
  console.log(`\n📊 Features implemented: ${passedFeatures}/${requiredFeatures.length}`);
  
  // Check if App.jsx imports DebugPanel
  const appPath = join(process.cwd(), 'src/App.jsx');
  const appContent = readFileSync(appPath, 'utf8');
  
  if (appContent.includes('import DebugPanel from')) {
    console.log('✅ DebugPanel imported in App.jsx');
  } else {
    console.log('❌ DebugPanel not imported in App.jsx');
  }
  
  if (appContent.includes('<DebugPanel')) {
    console.log('✅ DebugPanel component used in App.jsx');
  } else {
    console.log('❌ DebugPanel component not used in App.jsx');
  }
  
  // Check test file
  const testPath = join(process.cwd(), 'src/components/__tests__/DebugPanel.test.jsx');
  try {
    const testContent = readFileSync(testPath, 'utf8');
    console.log('✅ DebugPanel test file exists');
    
    const testFeatures = [
      { name: 'Rendering tests', pattern: /describe.*Rendering/ },
      { name: 'Keyboard shortcuts tests', pattern: /describe.*Keyboard Shortcuts/ },
      { name: 'Accessibility tests', pattern: /describe.*Accessibility/ },
      { name: 'Responsive behavior tests', pattern: /describe.*Responsive/ }
    ];
    
    let passedTests = 0;
    testFeatures.forEach(feature => {
      if (feature.pattern.test(testContent)) {
        console.log(`✅ ${feature.name}`);
        passedTests++;
      } else {
        console.log(`❌ ${feature.name}`);
      }
    });
    
    console.log(`\n📊 Test categories: ${passedTests}/${testFeatures.length}`);
    
  } catch (error) {
    console.log('❌ DebugPanel test file not found');
  }
  
  // Check AppStateContext for debug-related state
  const contextPath = join(process.cwd(), 'src/contexts/AppStateContext.jsx');
  const contextContent = readFileSync(contextPath, 'utf8');
  
  const contextFeatures = [
    { name: 'showDebugPanel state', pattern: /showDebugPanel/ },
    { name: 'debugMode state', pattern: /debugMode/ },
    { name: 'lastAnalysis state', pattern: /lastAnalysis/ },
    { name: 'toggleDebugPanel action', pattern: /toggleDebugPanel/ },
    { name: 'toggleDebugMode action', pattern: /toggleDebugMode/ }
  ];
  
  let passedContextFeatures = 0;
  contextFeatures.forEach(feature => {
    if (feature.pattern.test(contextContent)) {
      console.log(`✅ Context: ${feature.name}`);
      passedContextFeatures++;
    } else {
      console.log(`❌ Context: ${feature.name}`);
    }
  });
  
  console.log(`\n📊 Context features: ${passedContextFeatures}/${contextFeatures.length}`);
  
  // Overall assessment
  const totalFeatures = requiredFeatures.length + testFeatures.length + contextFeatures.length + 2; // +2 for App.jsx integration
  const totalPassed = passedFeatures + passedTests + passedContextFeatures + 
    (appContent.includes('import DebugPanel from') ? 1 : 0) +
    (appContent.includes('<DebugPanel') ? 1 : 0);
  
  console.log(`\n🎯 Overall Implementation: ${totalPassed}/${totalFeatures} (${Math.round(totalPassed/totalFeatures*100)}%)`);
  
  if (totalPassed >= totalFeatures * 0.8) {
    console.log('🎉 DebugPanel implementation looks good!');
  } else {
    console.log('⚠️  DebugPanel implementation needs more work');
  }
  
} catch (error) {
  console.error('❌ Error verifying DebugPanel:', error.message);
  process.exit(1);
}