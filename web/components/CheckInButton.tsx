'use client';

import { useCallback, useMemo, useState } from 'react';

import { Transaction } from '@mysten/sui/transactions';
import { fromB64 } from '@mysten/sui/utils';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

type Props = {
  packageId: string;
  eventObjectId: string; // Shared Event object id
};

export function CheckInButton({ packageId, eventObjectId }: Props) {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [error, setError] = useState<string | null>(null);

  const target = useMemo(
    () => `${packageId}::event_manager::check_in_secure`,
    [packageId],
  );

  const onClick = useCallback(async () => {
    setError(null);

    if (!account?.address) {
      setError('Connect wallet first');
      return;
    }

    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_id: eventObjectId,
          user_address: account.address,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const { signature, msg } = (await res.json()) as { signature: string; msg: string };

      const signatureBytes = fromB64(signature);
      const msgBytes = fromB64(msg);

      const tx = new Transaction();
      tx.moveCall({
        target,
        arguments: [
          tx.object(eventObjectId),
          tx.pure.vector('u8', Array.from(signatureBytes)),
          tx.pure.vector('u8', Array.from(msgBytes)),
          tx.object('0x6'), // Clock shared object
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            // Optionally refetch event state
          },
          onError: (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
        },
      );
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
    }
  }, [account?.address, eventObjectId, signAndExecute, target]);

  return (
    <div>
      <button onClick={onClick} disabled={isPending}>
        {isPending ? 'Checking in…' : 'Check-in'}
      </button>
      {error ? <div style={{ color: 'red' }}>{error}</div> : null}
    </div>
  );
}
