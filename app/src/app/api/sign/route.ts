import { NextRequest, NextResponse } from 'next/server';
import { serializeCheckInMsg } from '../../../lib/checkInMsg';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { event_id: string; user_address: string };

    if (!body.event_id || !body.user_address) {
      return NextResponse.json(
        { error: 'Missing event_id or user_address' },
        { status: 400 },
      );
    }

    const adminKey = process.env.ADMIN_SECRET_KEY;
    if (!adminKey) {
      return NextResponse.json({ error: 'Admin key not configured' }, { status: 500 });
    }

    const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
    const { toBase64 } = await import('@mysten/sui/utils');

    const msgBytes = serializeCheckInMsg({
      eventId: body.event_id,
      userAddress: body.user_address,
    });

    // Support both Bech32 (suiprivkey1...) and base64 formats
    const kp = adminKey.startsWith('suiprivkey') 
      ? Ed25519Keypair.fromSecretKey(adminKey)
      : await (async () => {
          const { fromBase64 } = await import('@mysten/sui/utils');
          return Ed25519Keypair.fromSecretKey(fromBase64(adminKey));
        })();
    const signatureBytes = await kp.sign(msgBytes);

    return NextResponse.json({
      signature: toBase64(signatureBytes),
      msg: toBase64(msgBytes),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
