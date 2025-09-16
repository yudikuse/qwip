import { NextRequest, NextResponse } from 'next/server';

type ConsentBody = {
  analytics?: boolean;
  marketing?: boolean;
};

// Lê cookie atual (opcional)
export async function GET() {
  const res = NextResponse.json({ ok: true });
  return res;
}

export async function POST(req: NextRequest) {
  let json: ConsentBody | null = null;
  try {
    json = (await req.json()) as ConsentBody;
  } catch {
    json = null;
  }

  const analytics = Boolean(json?.analytics);
  const marketing = Boolean(json?.marketing);

  const value = JSON.stringify({
    v: 1,
    essential: true,
    analytics,
    marketing,
    ts: new Date().toISOString(),
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('qwip_consent', value, {
    httpOnly: false, // precisa ser lido no client
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 ano
  });

  return res;
}
