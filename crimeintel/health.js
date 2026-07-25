const http = require('http');

function checkRoute(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ path, status: res.statusCode });
    });
    
    req.on('error', (e) => {
      resolve({ path, error: e.message });
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      resolve({ path, error: 'TIMEOUT' });
    });
  });
}

async function main() {
  console.log('Checking health of Next.js server...');
  const resHome = await checkRoute('/');
  console.log('Home:', resHome);
  
  const resDash = await checkRoute('/dashboard');
  console.log('Dashboard:', resDash);
  
  const resApi = await checkRoute('/api/data?table=Cases');
  console.log('API:', resApi);
}

main();
