import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const serviceSid = process.env.TWILIO_VERIFY_SID!;

type StartBody = { to?: string };

export async function POST(req: Request) {
  try {
    const body: StartBody = await req.json();
    const to = body?.to;
    if (!to) {
      return NextResponse.json({ error: 'to is required' }, { status: 400 });
    }

    const v = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to, channel: 'whatsapp', locale: 'pt' });

    return NextResponse.json({ status: v.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
