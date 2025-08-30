import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const serviceSid = process.env.TWILIO_VERIFY_SID!;

export async function POST(req: Request) {
  try {
    const { to, code } = await req.json();
    if (!to || !code) return NextResponse.json({ error: 'to and code are required' }, { status: 400 });

    const c = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to, code });

    return NextResponse.json({ status: c.status, valid: c.valid }); // valid = true/false
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'error' }, { status: 400 });
  }
}
