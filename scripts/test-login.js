import http from 'http';

const data = JSON.stringify({
  username: 'InJ',
  password: 'Revenger2004',
  audience: 'web',
});

console.log('Sending login request to http://localhost:3000/auth/login ...');

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('HTTP Status Code:', res.statusCode);
      console.log('Set-Cookie Header:', res.headers['set-cookie']);
      console.log('Response Body:');
      try {
        console.log(JSON.stringify(JSON.parse(body), null, 2));
      } catch {
        console.log(body);
      }
    });
  },
);

req.on('error', (e) => {
  console.error('Connection error:', e.message);
});

req.write(data);
req.end();
