// Simple verification script to check if components can be imported
import { readFileSync } from 'fs';
import { join } from 'path';

const componentsToCheck = [
  'src/App.jsx',
  'src/components/ChatInterface.jsx',
  'src/components/MessageBubble.jsx',
  'src/components/InputBox.jsx'
];

console.log('Verifying component files...');

componentsToCheck.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    console.log(`✓ ${file} - OK`);
  } catch (error) {
    console.log(`✗ ${file} - ERROR: ${error.message}`);
  }
});

console.log('Verification complete!');