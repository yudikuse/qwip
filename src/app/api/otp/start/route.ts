import { NextResponse } from 'next/server';
import twilio, { Twilio } from 'twilio';

function getTwilioFromEnv(): { client: Twilio; serviceSid: string } {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SID,
  } = process.env as Record<string, string | undefined>;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    throw new Error(
      'Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID).'
    );
  }

  return {
    client: twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
    serviceSid: TWILIO_VERIFY_SID,
  };
}

type StartBody = { to: string };

function isE164(phone: string): boolean {
  // E.164 simples: começa com + e 8–15 dígitos
  return /^\+\d{8,15}$/.test(phone);
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json();
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const maybe = raw as Partial<StartBody>;
    const to = typeof maybe.to === 'string' ? maybe.to.trim() : '';

    if (!to) {
      return NextResponse.json({ error: '`to` is required' }, { status: 400 });
    }
    if (!isE164(to)) {
      return NextResponse.json(
        { error: 'Phone must be in E.164 format, e.g. +5511999998888' },
        { status: 400 }
      );
    }

    const { client, serviceSid } = getTwilioFromEnv();

    // Força canal WhatsApp (não SMS)
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to, channel: 'whatsapp' });

    return NextResponse.json({
      status: verification.status, // pending quando enviado
      to: verification.to,
      channel: verification.channel,
      sid: verification.sid,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

