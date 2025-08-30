import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const serviceSid = process.env.TWILIO_VERIFY_SID!;

type CheckBody = { to?: string; code?: string };

export async function POST(req: Request) {
  try {
    const body: CheckBody = await req.json();
    const to = body?.to;
    const code = body?.code;

    if (!to || !code) {
      return NextResponse.json({ error: 'to and code are required' }, { status: 400 });
    }

    const c = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to, code });

    return NextResponse.json({ status: c.status, valid: c.valid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
