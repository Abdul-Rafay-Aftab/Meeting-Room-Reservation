const http = require('http');

function testAdminUsers() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed response:', jsonData);
      } catch (e) {
        console.log('Could not parse JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

console.log('Testing admin users API...');
testAdminUsers(); 