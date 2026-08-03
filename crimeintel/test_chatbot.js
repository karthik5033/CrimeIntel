const http = require('http');

const queries = [
  "Show me FIRs in bengaluru",
  "Are there any vehicle theft cases?",
  "Give me details of FIR 200120146202400001",
  "How many pending cases are there?",
  "Tell me about cases near College Road.",
  "Summarize the recent murder attempts.",
  "What cases happened in DIST_1?",
  "Any financial fraud FIRs recently?",
  "Who is the suspect in case 202400001?",
  "Give me a summary of all recent crimes."
];

async function testQuery(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: query,
      language: 'en',
      sessionId: 'test-123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed.text_summary || "NO SUMMARY");
        } catch (e) {
          resolve("JSON PARSE ERROR: " + responseData);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("Starting 10 FIR related question tests...");
  for (let i = 0; i < queries.length; i++) {
    console.log(`\n--- Test ${i+1} ---`);
    console.log(`Q: ${queries[i]}`);
    try {
      const answer = await testQuery(queries[i]);
      console.log(`A: ${answer.substring(0, 300)}...`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    // Wait 4 seconds between requests to prevent Gemini API 429 errors
    await new Promise(r => setTimeout(r, 4000));
  }
}

runTests();
