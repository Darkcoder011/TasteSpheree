/**
 * Debug script to test actual API response
 */

const API_KEY = 'qzuLeMriOgE8HuaHslZkpSs5fTu-VU4-iukY6dD6J8k';
const BASE_URL = 'https://hackathon.api.qloo.com';

async function testApiCall() {
  console.log('🔍 Testing Qloo API with actual HTTP request...\n');

  const testUrls = [
    `${BASE_URL}/v2/insights?filter.type=urn:entity:movie&signal.interests.entities=FCE8B172-4795-43E4-B222-3B550DC05FD9&take=3`,
    `${BASE_URL}/v2/insights?filter.type=urn:entity:artist&signal.interests.entities=FCE8B172-4795-43E4-B222-3B550DC05FD9&take=3`,
    `${BASE_URL}/v2/insights?filter.type=urn:entity:book&signal.interests.entities=FCE8B172-4795-43E4-B222-3B550DC05FD9&take=3`
  ];

  for (const url of testUrls) {
    try {
      console.log(`📡 Testing: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success! Response structure:`);
        console.log(`      - Top level keys: ${Object.keys(data).join(', ')}`);

        // Check different possible data locations
        if (data.results) {
          console.log(`      - Has results: ${Array.isArray(data.results)} (${data.results.length} items)`);
        }
        if (data.data) {
          console.log(`      - Has data: ${Array.isArray(data.data)} (${data.data.length} items)`);
        }
        if (data.recommendations) {
          console.log(`      - Has recommendations: ${Array.isArray(data.recommendations)} (${data.recommendations.length} items)`);
        }
        if (data.insights) {
          console.log(`      - Has insights: ${Array.isArray(data.insights)} (${data.insights.length} items)`);
        }

        // If it's an array at the top level
        if (Array.isArray(data)) {
          console.log(`      - Response is array with ${data.length} items`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }

      console.log('');
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}\n`);
    }
  }
}

// Run the test
testApiCall().catch(console.error);