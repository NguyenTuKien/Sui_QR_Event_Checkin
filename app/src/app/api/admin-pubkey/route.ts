import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey) {
    return NextResponse.json({ error: 'Admin key not configured' }, { status: 500 });
  }

  try {
    const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');

    // Support both Bech32 (suiprivkey1...) and base64 formats
    const kp = adminKey.startsWith('suiprivkey') 
      ? Ed25519Keypair.fromSecretKey(adminKey)
      : await (async () => {
          const { fromBase64 } = await import('@mysten/sui/utils');
          return Ed25519Keypair.fromSecretKey(fromBase64(adminKey));
        })();
    const pubkey = kp.getPublicKey().toBase64();

    return NextResponse.json({ publicKey: pubkey });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
