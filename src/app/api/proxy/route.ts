import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) { 
    const { searchParams } = new URL(req.url); 
    const targetUrl = searchParams.get('url'); 
    
    if (!targetUrl) { return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 }); }

    try { 
        const fetchRes = await fetch(targetUrl); 
        const text = await fetchRes.text(); 
        return new NextResponse(text, { status: fetchRes.status, headers: { 'Content-Type': 'text/plain' }, }); }
     catch (err: any)
      { return NextResponse.json({ error: err.message }, { status: 500 }); }
}