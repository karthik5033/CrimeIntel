import https from 'https';

const APPSAIL_URL = 'crimeintel-50044146268.development.catalystappsail.in';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: APPSAIL_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          duration,
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function testConcurrentUsers(userCount) {
  console.log(`\n🧪 Testing with ${userCount} concurrent users...`);
  
  const chatBody = JSON.stringify({
    message: "Show me recent theft cases",
    language: "en",
    sessionId: `concurrent-test-${Date.now()}`
  });
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < userCount; i++) {
    promises.push(makeRequest('/api/chat', 'POST', chatBody));
  }
  
  try {
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    const successCount = results.filter(r => r.success).length;
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    console.log(`   ✅ Completed in ${totalTime}ms`);
    console.log(`   📊 Success Rate: ${successCount}/${userCount} (${((successCount/userCount)*100).toFixed(1)}%)`);
    console.log(`   ⏱️  Average Response: ${Math.round(avgDuration)}ms`);
    console.log(`   📈 Min/Max: ${durations[0]}ms / ${durations[durations.length-1]}ms`);
    
    return {
      userCount,
      totalTime,
      avgDuration: Math.round(avgDuration),
      successRate: ((successCount/userCount)*100).toFixed(1),
      min: durations[0],
      max: durations[durations.length-1]
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { userCount, error: error.message };
  }
}

async function runConcurrentTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Concurrent User Load Testing');
  console.log('═══════════════════════════════════════════════════════════');
  
  const results = [];
  
  // Test with increasing concurrent users
  for (const users of [1, 5, 10]) {
    const result = await testConcurrentUsers(users);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Cool down between tests
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   CONCURRENT LOAD SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Users'.padEnd(12), 'Avg Response'.padEnd(18), 'Success Rate');
  console.log('─'.repeat(50));
  
  results.forEach(r => {
    if (!r.error) {
      console.log(
        `${r.userCount.toString().padEnd(12)} ${(r.avgDuration + 'ms').padEnd(18)} ${r.successRate}%`
      );
    }
  });
  
  // Calculate degradation
  if (results.length >= 2 && !results[0].error && !results[results.length-1].error) {
    const baseline = results[0].avgDuration;
    const highLoad = results[results.length-1].avgDuration;
    const degradation = ((highLoad - baseline) / baseline * 100).toFixed(1);
    
    console.log(`\n📊 Performance Impact: +${degradation}% response time increase under ${results[results.length-1].userCount} concurrent users`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

runConcurrentTests().catch(console.error);
