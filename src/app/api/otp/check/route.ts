import { NextResponse } from 'next/server';
import twilio, { Twilio } from 'twilio';

type Env = {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SID?: string;
};

function getTwilio(env: Env): { client: Twilio; serviceSid: string } {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    throw new Error('Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID).');
  }
  return {
    client: twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
    serviceSid: TWILIO_VERIFY_SID,
  };
}

type CheckBody = { to: string; code: string };

export async function POST(req: Request) {
  try {
    // valida JSON sem usar "any"
    const raw: unknown = await req.json();
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const maybe = raw as Partial<CheckBody>;
    const to = typeof maybe.to === 'string' ? maybe.to : '';
    const code = typeof maybe.code === 'string' ? maybe.code : '';

    if (!to || !code) {
      return NextResponse.json({ error: '`to` and `code` are required' }, { status: 400 });
    }

    const { client, serviceSid } = getTwilio(process.env);

    const result = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to, code });

    return NextResponse.json({ status: result.status, valid: result.valid });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

