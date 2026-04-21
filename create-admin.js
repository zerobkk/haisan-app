const https = require('https');

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '');
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: serviceUrl,
      path: path,
      method: method,
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    if (data) {
      options.headers['Content-Length'] = data.length;
      options.headers['Prefer'] = 'return=representation';
    }

    const req = https.request(options, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: result });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Create auth user
  const authData = JSON.stringify({
    email: 'admin@haisan.local',
    password: 'Admin@123',
    email_confirm: true
  });

  const authOptions = {
    hostname: serviceUrl,
    path: '/auth/v1/admin/users',
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      'Content-Length': authData.length
    }
  };

  console.log('Creating admin user...');

  const req = https.request(authOptions, (res) => {
    let result = '';
    res.on('data', chunk => result += chunk);
    res.on('end', async () => {
      console.log('Auth response:', res.statusCode, result.substring(0, 500));

      if (res.statusCode === 200 || res.statusCode === 201) {
        const userData = JSON.parse(result);
        const userId = userData.id;
        console.log('User ID:', userId);

        // Create profile with admin role
        const profileData = JSON.stringify({
          id: userId,
          email: 'admin@haisan.local',
          role: 'admin'
        });

        const profileOptions = {
          hostname: serviceUrl,
          path: '/rest/v1/profiles',
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': 'Bearer ' + serviceKey,
            'Content-Type': 'application/json',
            'Content-Length': profileData.length,
            'Prefer': 'return=representation'
          }
        };

        const profileReq = https.request(profileOptions, (profileRes) => {
          let profileResult = '';
          profileRes.on('data', chunk => profileResult += chunk);
          profileRes.on('end', () => {
            console.log('Profile response:', profileRes.statusCode, profileResult);
            console.log('\n✅ Admin user created!');
            console.log('Email: admin@haisan.local');
            console.log('Password: Admin@123');
            console.log('Role: Admin');
          });
        });
        profileReq.write(profileData);
        profileReq.end();
      }
    });
  });
  req.write(authData);
  req.end();
}

main().catch(console.error);