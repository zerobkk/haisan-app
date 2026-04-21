const https = require('https');

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '');
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

const options = {
  hostname: serviceUrl,
  path: '/rest/v1/profiles?select=*',
  method: 'GET',
  headers: {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey
  }
};

const req = https.request(options, (res) => {
  let result = '';
  res.on('data', chunk => result += chunk);
  res.on('end', () => {
    console.log('All profiles:');
    console.log(result);
  });
});
req.end();