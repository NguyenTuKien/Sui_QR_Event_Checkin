'use client';

import { useCallback, useMemo, useState } from 'react';

import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import toast from 'react-hot-toast';

type Props = {
  packageId: string;
  eventObjectId: string;
  onSuccess?: () => void;
  ticket?: { signature: string; msg: string } | null;
};

export function CheckInButton({ packageId, eventObjectId, onSuccess, ticket }: Props) {
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
      let signature: string;
      let msg: string;

      if (ticket?.signature && ticket?.msg) {
        signature = ticket.signature;
        msg = ticket.msg;
      } else {
        const res = await fetch('/api/sign', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            event_id: eventObjectId,
            user_address: account.address,
          }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { signature: string; msg: string };
        signature = data.signature;
        msg = data.msg;
      }

      const signatureBytes = fromBase64(signature);
      const msgBytes = fromBase64(msg);

      console.log('🔐 Transaction Data:');
      console.log('  Target:', target);
      console.log('  Event ID:', eventObjectId);
      console.log('  Signature (base64):', signature);
      console.log('  Signature (bytes):', signatureBytes, 'Length:', signatureBytes.length);
      console.log('  Msg (base64):', msg);
      console.log('  Msg (bytes):', msgBytes, 'Length:', msgBytes.length);

      const tx = new Transaction();
      
      // Set sender to ensure transaction is properly formed
      if (account?.address) {
        tx.setSender(account.address);
      }

      tx.moveCall({
        target,
        arguments: [
          tx.object(eventObjectId),
          tx.pure.vector('u8', Array.from(signatureBytes)),
          tx.pure.vector('u8', Array.from(msgBytes)),
          tx.object('0x6'),
        ],
      });

      console.log('📦 Transaction built');
      console.log('📤 Sending to wallet...');

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Transaction successful:', result);
            toast.success('Check-in successful');
            onSuccess?.();
          },
          onError: (e: unknown) => {
            console.error('❌ Transaction error:', e);
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            toast.error(msg);
          },
        },
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(msg);
    }
  }, [account?.address, eventObjectId, onSuccess, signAndExecute, target, ticket]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Check-in</h2>
        <p className="text-xs text-zinc-400">Submit your signed ticket to mint Attendance NFT</p>
      </div>

      <input type="hidden" name="signature" value={ticket?.signature ?? ''} readOnly />
      <input type="hidden" name="msg" value={ticket?.msg ?? ''} readOnly />

      <button
        onClick={onClick}
        disabled={isPending}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 px-5 py-4 text-base font-semibold text-black shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{
          background:
            'radial-gradient(600px 200px at 50% 0%, rgba(255,255,255,0.35), transparent 60%)',
        }} />
        {isPending ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            Checking in…
          </>
        ) : (
          'Check-in Now'
        )}
      </button>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <div>
          Ticket: {ticket?.signature && ticket?.msg ? (
            <span className="text-emerald-300">loaded</span>
          ) : (
            <span>will be requested from server</span>
          )}
        </div>
        <div className="font-mono">
          {eventObjectId.slice(0, 6)}…{eventObjectId.slice(-4)}
        </div>
      </div>

      {error ? <div className="mt-3 text-xs text-rose-200">{error}</div> : null}
    </section>
  );
}
