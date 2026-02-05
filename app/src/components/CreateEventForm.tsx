'use client';

import { useCallback, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import toast from 'react-hot-toast';

type Props = {
  packageId: string;
  onCreated?: (txDigest: string, createdId?: string) => void;
};

export function CreateEventForm({ packageId, onCreated }: Props) {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [eventName, setEventName] = useState('');
  const [location, setLocation] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('100');

  const handleCreate = useCallback(async () => {
    if (!account?.address) {
      toast.error('Connect wallet first');
      return;
    }

    if (!eventName.trim() || !location.trim()) {
      toast.error('Fill in event name and location');
      return;
    }

    const capacity = parseInt(maxCapacity, 10);
    if (isNaN(capacity) || capacity <= 0) {
      toast.error('Max capacity must be > 0');
      return;
    }

    const target = `${packageId}::event_manager::create_event`;

    const tx = new Transaction();
    tx.moveCall({
      target,
      arguments: [
        tx.pure.string(eventName),
        tx.pure.string(location),
        tx.pure.u64(capacity),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          toast.success('Event created successfully');

          const createdId = result.effects?.created?.[0]?.reference?.objectId;
          onCreated?.(result.digest, createdId);

          setEventName('');
          setLocation('');
          setMaxCapacity('100');
        },
        onError: (e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          toast.error(msg);
        },
      },
    );
  }, [account?.address, eventName, location, maxCapacity, onCreated, packageId, signAndExecute]);

  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-xs text-zinc-400">Event Name</span>
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="My Awesome Event"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/30"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs text-zinc-400">Location</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="San Francisco, CA"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/30"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs text-zinc-400">Max Capacity</span>
        <input
          type="number"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/30"
        />
      </label>

      <button
        onClick={handleCreate}
        disabled={isPending || !account}
        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create Event'}
      </button>
    </div>
  );
}
