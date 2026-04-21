const https = require('https');

const serviceUrl = 'rptsgohwqmqvgcqyhehq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdHNnb2h3cW1xdmdjcXloZWhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MjA1NywiZXhwIjoyMDkyMzQ4MDU3fQ.RZTgUAvp_XAqqGkCvSysdAhzzw7kr-zaXehOJeGAWfM';

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: serviceUrl,
      path: path,
      method: method,
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json'
      }
    };
    if (data) {
      options.headers['Content-Length'] = data.length;
    }
    if (body) {
      options.headers['Prefer'] = 'return=minimal';
    }

    const req = https.request(options, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        console.log(`Response (${res.statusCode}):`, result.substring(0, 500));
        resolve({ status: res.statusCode, body: result });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const email = 'zerofire2905@gmail.com';
  
  // 1. Get user
  console.log('\n1. Getting user...');
  const encodedEmail = encodeURIComponent(email);
  const getResult = await makeRequest(`/rest/v1/profiles?email=eq.${encodedEmail}`, 'GET');
  
  if (getResult.status === 200) {
    const profiles = JSON.parse(getResult.body);
    if (profiles && profiles.length > 0) {
      const userId = profiles[0].id;
      console.log(`Found user ID: ${userId}`);
      
      // 2. Update to admin
      console.log('\n2. Setting to Admin...');
      const updateResult = await makeRequest(`/rest/v1/profiles?id=eq.${userId}`, 'PATCH', { role: 'admin' });
      
      if (updateResult.status === 204 || updateResult.status === 200) {
        console.log('\n✅ SUCCESS: zerofire2905@gmail.com is now Admin!');
      } else {
        console.log('\n❌ Update failed:', updateResult.body);
      }
    } else {
      console.log('❌ User not found');
    }
  } else {
    console.log('❌ Query failed:', getResult.body);
  }
}

main().catch(console.error);