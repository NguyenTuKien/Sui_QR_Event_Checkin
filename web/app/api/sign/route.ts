import { NextResponse } from 'next/server';

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  toB64,
} from '@mysten/sui/utils';

import { serializeCheckInMsg } from '../../../lib/checkInMsg';

export const runtime = 'nodejs';

type SignRequest = {
  event_id: string;
  user_address: string;
};

export async function POST(req: Request) {
  let body: SignRequest;
  try {
    body = (await req.json()) as SignRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event_id, user_address } = body || ({} as SignRequest);

  if (!event_id || !isValidSuiObjectId(event_id)) {
    return NextResponse.json({ error: 'Invalid event_id' }, { status: 400 });
  }
  if (!user_address || !isValidSuiAddress(user_address)) {
    return NextResponse.json({ error: 'Invalid user_address' }, { status: 400 });
  }

  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Missing ADMIN_SECRET_KEY' }, { status: 500 });
  }

  // ADMIN_SECRET_KEY recommended format: "suiprivkey..." (Sui CLI exported key)
  const decoded = decodeSuiPrivateKey(secret);
  if (decoded.schema !== 'ED25519') {
    return NextResponse.json({ error: 'ADMIN_SECRET_KEY must be ED25519' }, { status: 500 });
  }

  const keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);

  const msgBytes = serializeCheckInMsg({ eventId: event_id, userAddress: user_address });
  const signatureBytes = keypair.signData(msgBytes);

  return NextResponse.json({
    // Return base64 for compact transport; frontend can `fromB64` to Uint8Array.
    signature: toB64(signatureBytes),
    msg: toB64(msgBytes),
  });
}
