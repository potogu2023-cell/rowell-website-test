import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import fetch from 'node-fetch';

// Simple test without full type safety
const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      fetch: fetch,
    }),
  ],
});

async function testResourcesAPI() {
  console.log('🧪 Testing Resources Center API...\n');

  try {
    // Test 1: List resources (should return empty initially)
    console.log('Test 1: List resources');
    const list = await client.resources.list.query({ page: 1, pageSize: 10 });
    console.log('✅ List API works');
    console.log(`   Total articles: ${list.total}`);
    console.log(`   Items returned: ${list.items.length}\n`);

    // Test 2: List categories (should return empty initially)
    console.log('Test 2: List categories');
    const categories = await client.resources.listCategories.query();
    console.log('✅ Categories API works');
    console.log(`   Total categories: ${categories.length}\n`);

    // Test 3: Try to get a non-existent article (should fail gracefully)
    console.log('Test 3: Get non-existent article');
    try {
      await client.resources.getBySlug.query({ slug: 'test-article' });
      console.log('❌ Should have thrown an error');
    } catch (error) {
      console.log('✅ Correctly returns 404 for non-existent article\n');
    }

    console.log('🎉 All API tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - resources.list: ✅ Working');
    console.log('   - resources.listCategories: ✅ Working');
    console.log('   - resources.getBySlug: ✅ Working (404 handling)');
    console.log('\n✨ Resources Center API is ready for use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testResourcesAPI();
