const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

async function updateToAdmin() {
  // First, find the user
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.zerofire2905@gmail.com`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    }
  });
  
  const profiles = await response.json();
  console.log('Found profiles:', profiles);
  
  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    
    // Update to admin
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ role: 'admin' })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Đã set user zerofire2905@gmail.com thành Admin!');
    } else {
      console.log('❌ Lỗi:', updateResponse.statusText);
    }
  } else {
    console.log('❌ Không tìm thấy user');
  }
}

updateToAdmin();