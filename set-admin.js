const https = require('https');

const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rptsgohwqmqvgcqyhehq.supabase.co';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function main() {
  // First, get the user
  const getOptions = {
    hostname: supabaseUrl.replace('https://', ''),
    path: '/rest/v1/profiles?email=eq.zerofire2905%40gmail.com',
    method: 'GET',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey
    }
  };

  const response = await makeRequest(getOptions);
  const profiles = JSON.parse(response);
  console.log('Found profiles:', profiles);

  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    console.log('User ID:', userId);

    // Update to admin
    const updateOptions = {
      hostname: supabaseUrl.replace('https://', ''),
      path: '/rest/v1/profiles?id=eq.' + userId,
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const updateResponse = await makeRequest(updateOptions, JSON.stringify({ role: 'admin' }));
    console.log('Update response:', updateResponse);
    console.log('✅ Đã set zerofire2905@gmail.com thành Admin!');
  } else {
    console.log('❌ Không tìm thấy user');
  }
}

main().catch(console.error);