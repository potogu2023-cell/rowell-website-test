import { invokeLLM } from './server/_core/llm.ts';
import { handleAIChat } from './server/ai/chat-handler.ts';
import { testEncryption } from './server/ai/encryption.ts';
import { testCacheUtilities } from './server/ai/cache.ts';

console.log('=== Testing AI Advisor Backend ===\n');

// Test 1: Encryption
console.log('1. Testing Encryption...');
const encryptionOk = testEncryption();
console.log(encryptionOk ? '✅ Encryption test passed\n' : '❌ Encryption test failed\n');

// Test 2: Cache utilities
console.log('2. Testing Cache Utilities...');
const cacheOk = testCacheUtilities();
console.log(cacheOk ? '✅ Cache test passed\n' : '❌ Cache test failed\n');

// Test 3: AI Chat Handler
console.log('3. Testing AI Chat Handler...');
try {
  const testQuestion = "What is the best HPLC column for peptide separation?";
  console.log(`Question: "${testQuestion}"\n`);
  
  const response = await handleAIChat(undefined, testQuestion);
  
  console.log('Response:');
  console.log('- Answer:', response.answer.substring(0, 200) + '...');
  console.log('- Source:', response.source);
  console.log('- Session ID:', response.sessionId);
  console.log('✅ AI Chat test passed\n');
} catch (error) {
  console.error('❌ AI Chat test failed:', error.message);
}

console.log('=== All Tests Complete ===');
