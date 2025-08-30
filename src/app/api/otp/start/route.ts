import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const serviceSid = process.env.TWILIO_VERIFY_SID!;

export async function POST(req: Request) {
  try {
    const { to, channel = 'sms' } = await req.json(); // to em E.164: +55DDDNUMERO
    const v = await client.verify.v2.services(serviceSid).verifications.create({ to, channel });
    return NextResponse.json({ status: v.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 400 });
  }
}
