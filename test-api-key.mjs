const apiKey = 'rowell_fff6d961c76a55982da165ba02114e65';
const apiUrl = 'http://localhost:3000/api/trpc/resources.create';

const article = {
  title: "Test Article - API Key Authentication",
  content: `# Test Article

This is a test article to verify API Key authentication.

## Features Tested

- API Key authentication
- Markdown rendering
- YouTube video embed support

## Video Example

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>

## Conclusion

If you can see this article, API Key authentication is working correctly!`,
  excerpt: "Test article for API Key authentication verification",
  status: "published",
  language: "en",
  categoryName: "Test",
  tags: ["test", "api-key"],
  featured: false
};

async function test() {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(article)
    });

    const result = await response.json();

    if (result.result?.data?.success) {
      console.log('✅ API Key authentication test PASSED!');
      console.log(`Article URL: http://localhost:3000${result.result.data.url}`);
      console.log(`Article ID: ${result.result.data.id}`);
      console.log(`Slug: ${result.result.data.slug}`);
    } else {
      console.error('❌ API Key authentication test FAILED:', result);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

test();
