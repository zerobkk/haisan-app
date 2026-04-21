import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email } = await request.json();
  
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 500 });
  }

  try {
    // Get user by email
    const response = await fetch(`${serviceUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    });
    
    const profiles = await response.json();
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = profiles[0].id;
    
    // Update to admin
    const updateResponse = await fetch(`${serviceUrl}/rest/v1/profiles?id=eq.${userId}`, {
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
      return NextResponse.json({ success: true, message: `Đã set ${email} thành Admin` });
    } else {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
