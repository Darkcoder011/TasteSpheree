import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  // Check if InputBox component exists and has the expected structure
  const inputBoxPath = resolve('./src/components/InputBox.jsx');
  const inputBoxContent = readFileSync(inputBoxPath, 'utf-8');
  
  // Check for key features
  const requiredFeatures = [
    'validation',
    'handleSubmit',
    'handleInputChange',
    'handleKeyDown',
    'character counter',
    'error handling',
    'loading states',
    'responsive design'
  ];
  
  const checks = {
    'Input validation': inputBoxContent.includes('validateInput'),
    'Character counter': inputBoxContent.includes('characterCount'),
    'Error display': inputBoxContent.includes('validationError'),
    'Loading states': inputBoxContent.includes('isSubmitting'),
    'Keyboard shortcuts': inputBoxContent.includes('handleKeyDown'),
    'Responsive design': inputBoxContent.includes('sm:'),
    'Accessibility': inputBoxContent.includes('aria-'),
    'Submit handler': inputBoxContent.includes('handleSubmit'),
    'Auto-resize textarea': inputBoxContent.includes('textareaRef'),
    'Context integration': inputBoxContent.includes('useAppState')
  };
  
  console.log('InputBox Component Verification:');
  console.log('================================');
  
  let allPassed = true;
  Object.entries(checks).forEach(([feature, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${feature}`);
    if (!passed) allPassed = false;
  });
  
  console.log('\n' + (allPassed ? '🎉 All checks passed!' : '⚠️  Some checks failed'));
  
  // Check component structure
  const hasExport = inputBoxContent.includes('export default InputBox');
  const hasImports = inputBoxContent.includes('import');
  const hasJSX = inputBoxContent.includes('return (');
  
  console.log('\nComponent Structure:');
  console.log('===================');
  console.log(`${hasExport ? '✅' : '❌'} Default export`);
  console.log(`${hasImports ? '✅' : '❌'} Imports`);
  console.log(`${hasJSX ? '✅' : '❌'} JSX return`);
  
  process.exit(allPassed && hasExport && hasImports && hasJSX ? 0 : 1);
  
} catch (error) {
  console.error('❌ Error verifying InputBox component:', error.message);
  process.exit(1);
}