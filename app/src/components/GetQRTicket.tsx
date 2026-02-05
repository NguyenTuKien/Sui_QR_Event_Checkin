'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import QRCode from 'react-qr-code';

type Props = {
  eventObjectId: string;
  onTicket?: (ticket: { signature: string; msg: string }) => void;
};

export function GetQRTicket({ eventObjectId, onTicket }: Props) {
  const account = useCurrentAccount();
  const [ticket, setTicket] = useState<{ signature: string; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!account?.address) {
      setError('Connect wallet first');
      return;
    }

    setLoading(true);
    setError(null);

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
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { signature: string; msg: string };
      setTicket(data);
      onTicket?.(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [account?.address, eventObjectId, onTicket]);

  useEffect(() => {
    if (account?.address && eventObjectId) {
      fetchTicket();
    }
  }, [account?.address, eventObjectId, fetchTicket]);

  const qrValue = ticket
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?event=${eventObjectId}&signature=${encodeURIComponent(ticket.signature)}&msg=${encodeURIComponent(ticket.msg)}`
    : '';

  // Debug: Log QR URL
  useEffect(() => {
    if (qrValue) {
      console.log('🎫 QR Ticket URL:', qrValue);
      console.log('📦 Event ID:', eventObjectId);
      console.log('✍️ Signature:', ticket?.signature);
      console.log('📝 Message:', ticket?.msg);
    }
  }, [qrValue, eventObjectId, ticket]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Your QR Ticket</h2>
        <p className="text-xs text-zinc-400">Scan this to check-in from another device</p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : ticket ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-4">
            <QRCode value={qrValue} size={200} />
          </div>
          <div className="text-center text-xs text-zinc-400">
            Valid for event {eventObjectId.slice(0, 6)}…{eventObjectId.slice(-4)}
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-400">Connect wallet to generate ticket</div>
      )}
    </section>
  );
}
