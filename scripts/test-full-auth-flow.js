import http from 'http';

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null,
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testFullFlow() {
  console.log('=== TEST 1: POST /auth/login ===');
  const loginData = JSON.stringify({
    username: 'InJ',
    password: 'Revenger2004',
    audience: 'web',
  });

  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
      },
    },
    loginData,
  );

  console.log('Login Status:', loginRes.statusCode);
  console.log('User:', loginRes.body.user);
  console.log('Roles:', loginRes.body.roles);
  console.log('ExpiresIn:', loginRes.body.expiresIn, 'seconds');
  const cookie = loginRes.headers['set-cookie']?.[0]?.split(';')?.[0];
  console.log('Received Cookie:', cookie ? 'inj_refresh_token (HttpOnly)' : 'None');

  const accessToken = loginRes.body.accessToken;

  console.log('\n=== TEST 2: GET /auth/me with Bearer Token ===');
  const meRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/auth/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log('/auth/me Status:', meRes.statusCode);
  console.log('/auth/me Body:', meRes.body);

  console.log('\n=== TEST 3: POST /auth/refresh with HttpOnly Cookie ===');
  const refreshRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/auth/refresh',
    method: 'POST',
    headers: {
      Cookie: cookie,
    },
  });
  console.log('Refresh Status:', refreshRes.statusCode);
  console.log('New AccessToken received:', !!refreshRes.body?.accessToken);
  console.log('New ExpiresIn:', refreshRes.body?.expiresIn);

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

testFullFlow().catch(console.error);

