const https = require('https');

const serviceUrl = 'rptsgohwqmqvgcqyhehq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdHNnb2h3cW1xdmdjcXloZWhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MjA1NywiZXhwIjoyMDkyMzQ4MDU3fQ.RZTgUAvp_XAqqGkCvSysdAhzzw7kr-zaXehOJeGAWfM';

const userId = 'b32cfe63-c4c7-4306-901a-f7efd61ad26a';

const data = JSON.stringify({ role: 'admin' });

const options = {
  hostname: serviceUrl,
  path: `/rest/v1/profiles?id=eq.${userId}`,
  method: 'PATCH',
  headers: {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Prefer': 'return=minimal'
  }
};

const req = https.request(options, (res) => {
  let result = '';
  res.on('data', chunk => result += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', result);
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('\n✅ SUCCESS!');
      console.log('Email: admin@haisan.local');
      console.log('Password: Admin@123');
      console.log('Vai trò: ADMIN - Có quyền quản lý tất cả user khác');
    }
  });
});

req.write(data);
req.end();