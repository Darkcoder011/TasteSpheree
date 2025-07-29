import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  console.log('Chat Flow Implementation Verification');
  console.log('====================================');

  // Check ChatService
  const chatServicePath = resolve('./src/services/chatService.js');
  const chatServiceContent = readFileSync(chatServicePath, 'utf-8');
  
  const chatServiceChecks = {
    'ChatService class': chatServiceContent.includes('export class ChatService'),
    'processUserInput method': chatServiceContent.includes('processUserInput'),
    'Entity extraction integration': chatServiceContent.includes('geminiService.extractEntities'),
    'Recommendation fetching': chatServiceContent.includes('qlooService.getRecommendations'),
    'Retry logic': chatServiceContent.includes('WithRetry'),
    'Error handling': chatServiceContent.includes('onError'),
    'Callback system': chatServiceContent.includes('onAnalysisStart'),
    'Fallback response': chatServiceContent.includes('generateFallbackResponse')
  };

  console.log('\nChatService Implementation:');
  console.log('==========================');
  Object.entries(chatServiceChecks).forEach(([feature, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${feature}`);
  });

  // Check ChatInterface updates
  const chatInterfacePath = resolve('./src/components/ChatInterface.jsx');
  const chatInterfaceContent = readFileSync(chatInterfacePath, 'utf-8');
  
  const chatInterfaceChecks = {
    'ChatService integration': chatInterfaceContent.includes('chatService'),
    'handleInputSubmit': chatInterfaceContent.includes('handleInputSubmit'),
    'Processing callbacks': chatInterfaceContent.includes('onAnalysisStart'),
    'Error handling': chatInterfaceContent.includes('onError'),
    'Retry functionality': chatInterfaceContent.includes('handleRetry'),
    'Loading states': chatInterfaceContent.includes('isProcessing'),
    'Message updates': chatInterfaceContent.includes('updateMessage'),
    'Recommendations handling': chatInterfaceContent.includes('setRecommendations')
  };

  console.log('\nChatInterface Updates:');
  console.log('=====================');
  Object.entries(chatInterfaceChecks).forEach(([feature, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${feature}`);
  });

  // Check MessageBubble enhancements
  const messageBubblePath = resolve('./src/components/MessageBubble.jsx');
  const messageBubbleContent = readFileSync(messageBubblePath, 'utf-8');
  
  const messageBubbleChecks = {
    'Status prop handling': messageBubbleContent.includes('status'),
    'Recommendations prop': messageBubbleContent.includes('recommendations'),
    'Retry button': messageBubbleContent.includes('onRetry'),
    'Processing states': messageBubbleContent.includes('isProcessing'),
    'Error states': messageBubbleContent.includes('isError'),
    'Loading indicators': messageBubbleContent.includes('animate-bounce'),
    'Recommendations preview': messageBubbleContent.includes('recommendation')
  };

  console.log('\nMessageBubble Enhancements:');
  console.log('==========================');
  Object.entries(messageBubbleChecks).forEach(([feature, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${feature}`);
  });

  // Check InputBox integration
  const inputBoxPath = resolve('./src/components/InputBox.jsx');
  const inputBoxContent = readFileSync(inputBoxPath, 'utf-8');
  
  const inputBoxChecks = {
    'onSubmit prop': inputBoxContent.includes('onSubmit'),
    'Validation': inputBoxContent.includes('validateInput'),
    'Error handling': inputBoxContent.includes('validationError'),
    'Loading states': inputBoxContent.includes('isSubmitting'),
    'Context integration': inputBoxContent.includes('useAppState')
  };

  console.log('\nInputBox Integration:');
  console.log('====================');
  Object.entries(inputBoxChecks).forEach(([feature, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${feature}`);
  });

  // Overall assessment
  const allChecks = [
    ...Object.values(chatServiceChecks),
    ...Object.values(chatInterfaceChecks),
    ...Object.values(messageBubbleChecks),
    ...Object.values(inputBoxChecks)
  ];
  
  const passedCount = allChecks.filter(Boolean).length;
  const totalCount = allChecks.length;
  const passRate = (passedCount / totalCount * 100).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log(`Overall Implementation: ${passedCount}/${totalCount} checks passed (${passRate}%)`);
  
  if (passRate >= 90) {
    console.log('🎉 Chat flow implementation is complete!');
  } else if (passRate >= 75) {
    console.log('⚠️  Chat flow implementation is mostly complete with minor issues');
  } else {
    console.log('❌ Chat flow implementation needs more work');
  }

  process.exit(passRate >= 90 ? 0 : 1);

} catch (error) {
  console.error('❌ Error verifying chat flow:', error.message);
  process.exit(1);
}