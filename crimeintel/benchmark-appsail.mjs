import https from 'https';

const APPSAIL_URL = 'crimeintel-50044146268.development.catalystappsail.in';

// Utility to measure request time
function measureRequest(path, method = 'GET', body = null) {
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
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resolve({
          path,
          method,
          statusCode: res.statusCode,
          duration,
          responseSize: data.length,
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

// Run multiple iterations and calculate p50/p95
async function benchmark(path, method = 'GET', body = null, iterations = 10) {
  console.log(`\n🧪 Benchmarking: ${method} ${path} (${iterations} iterations)`);
  
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const result = await measureRequest(path, method, body);
      results.push(result);
      process.stdout.write(`   Run ${i + 1}/${iterations}: ${result.duration}ms\r`);
    } catch (error) {
      console.error(`   ❌ Error in iteration ${i + 1}:`, error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(''); // New line after progress
  
  if (results.length === 0) {
    return { path, error: 'All requests failed' };
  }
  
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const successRate = (results.filter(r => r.success).length / results.length) * 100;
  
  const p50Index = Math.floor(durations.length * 0.5);
  const p95Index = Math.floor(durations.length * 0.95);
  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  
  return {
    path,
    method,
    iterations: results.length,
    avg: Math.round(avg),
    p50: durations[p50Index],
    p95: durations[p95Index],
    min: durations[0],
    max: durations[durations.length - 1],
    successRate: successRate.toFixed(1)
  };
}

// Main benchmarking suite
async function runBenchmarks() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   CrimeIntel AppSail Performance Benchmarking');
  console.log('═══════════════════════════════════════════════════════════');
  
  const results = [];
  
  // 1. Homepage
  results.push(await benchmark('/', 'GET', null, 5));
  
  // 2. API Endpoints
  results.push(await benchmark('/api/catalyst-status', 'GET', null, 5));
  
  // 3. Chat API
  const chatBody = JSON.stringify({
    message: "Show me theft cases in Bengaluru",
    language: "en",
    sessionId: "benchmark-session"
  });
  results.push(await benchmark('/api/chat', 'POST', chatBody, 5));
  
  // 4. Search API
  const searchBody = JSON.stringify({
    query: "murder cases",
    filters: {}
  });
  results.push(await benchmark('/api/search', 'POST', searchBody, 5));
  
  // 5. Data API (FIR listing)
  results.push(await benchmark('/api/data?limit=50', 'GET', null, 5));
  
  // 6. Analytics API
  results.push(await benchmark('/api/analytics/districts', 'GET', null, 5));
  
  // Print Results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   BENCHMARK RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Endpoint'.padEnd(40), 'Avg'.padEnd(10), 'P50'.padEnd(10), 'P95'.padEnd(10), 'Success');
  console.log('─'.repeat(85));
  
  results.forEach(r => {
    if (r.error) {
      console.log(`${r.path.padEnd(40)} ERROR: ${r.error}`);
    } else {
      console.log(
        `${r.path.padEnd(40)} ${(r.avg + 'ms').padEnd(10)} ${(r.p50 + 'ms').padEnd(10)} ${(r.p95 + 'ms').padEnd(10)} ${r.successRate}%`
      );
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  // Summary for slide
  console.log('📊 FORMATTED FOR SLIDE:\n');
  console.log('**API Response Times (p50/p95):**');
  results.forEach(r => {
    if (!r.error && r.path.startsWith('/api')) {
      const label = r.path.replace('/api/', '').split('?')[0] || 'root';
      console.log(`- **${r.method} ${label}**: ${r.p50}ms / ${r.p95}ms`);
    }
  });
  
  console.log('\n**Page Load Times:**');
  results.forEach(r => {
    if (!r.error && !r.path.startsWith('/api')) {
      console.log(`- **${r.path}**: ${r.p50}ms (p50) / ${r.p95}ms (p95)`);
    }
  });
}

// Run benchmarks
runBenchmarks().catch(console.error);
