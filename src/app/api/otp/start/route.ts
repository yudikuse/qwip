import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const serviceSid = process.env.TWILIO_VERIFY_SID!;

export async function POST(req: Request) {
  try {
    const { to } = await req.json(); // to = "+55DDDNÚMERO"
    if (!to) return NextResponse.json({ error: 'to is required' }, { status: 400 });

    const v = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to, channel: 'whatsapp', locale: 'pt' });

    return NextResponse.json({ status: v.status }); // "pending"
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'error' }, { status: 400 });
  }
}
