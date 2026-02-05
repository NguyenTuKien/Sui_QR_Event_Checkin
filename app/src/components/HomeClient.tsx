'use client';

import { ConnectButton } from '@mysten/dapp-kit';

import { CheckInButton } from './CheckInButton';
import { CreateEventForm } from './CreateEventForm';
import { GetQRTicket } from './GetQRTicket';
import { MyAttendanceNFTs } from './MyAttendanceNFTs';

import { useEffect, useMemo, useState } from 'react';

export function HomeClient() {
  const envPackageId = process.env.NEXT_PUBLIC_PACKAGE_ID || '';
  const envEventObjectId = process.env.NEXT_PUBLIC_EVENT_OBJECT_ID || '';

  // Keep the initial render deterministic across SSR + first client render.
  // URL params / localStorage are applied after hydration.
  const [packageId, setPackageId] = useState(envPackageId);
  const [eventObjectId, setEventObjectId] = useState(envEventObjectId);

  const [nftRefreshSignal, setNftRefreshSignal] = useState(0);
  const [ticket, setTicket] = useState<{ signature: string; msg: string } | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);

    const eventFromUrl = sp.get('event') || sp.get('event_id');
    const signature = sp.get('signature');
    const msg = sp.get('msg');

    if (!envPackageId) {
      const storedPackageId = window.localStorage.getItem('packageId');
      if (storedPackageId) setPackageId(storedPackageId);
    }

    if (eventFromUrl) {
      setEventObjectId(eventFromUrl);
    } else if (!envEventObjectId) {
      const storedEventObjectId = window.localStorage.getItem('eventObjectId');
      if (storedEventObjectId) setEventObjectId(storedEventObjectId);
    }

    if (signature && msg) {
      setTicket({ signature, msg });
    }
  }, [envEventObjectId, envPackageId]);

  const ready = useMemo(() => Boolean(packageId && eventObjectId), [packageId, eventObjectId]);

  return (
    <div className="bg-futuristic min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500/30 to-cyan-400/10 ring-1 ring-white/10 shadow-glow" />
            <div>
              <div className="text-lg font-semibold tracking-tight">SuiEvent</div>
              <div className="text-xs text-zinc-400">Devnet check-in dApp</div>
            </div>
          </div>

          <div className="[&_*]:!font-medium [&_button]:!rounded-full [&_button]:!bg-gradient-to-r [&_button]:from-sky-500 [&_button]:to-cyan-400 [&_button]:!text-black [&_button]:hover:!opacity-90 [&_button]:!px-4 [&_button]:!py-2 [&_button]:!shadow-glow">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Event Check-in</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300">
            Generate a signed QR ticket, then check-in on-chain. Your Attendance NFTs will appear in your collection.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Event Config</h2>
                  <p className="text-xs text-zinc-400">Package + shared Event object</p>
                </div>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs text-zinc-400">Package ID</span>
                  <input
                    value={packageId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPackageId(v);
                      window.localStorage.setItem('packageId', v);
                    }}
                    placeholder="0x…"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/30"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs text-zinc-400">Event Object ID (shared)</span>
                  <input
                    value={eventObjectId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventObjectId(v);
                      window.localStorage.setItem('eventObjectId', v);
                    }}
                    placeholder="0x…"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/30"
                  />
                </label>

                {!packageId ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                    Publish your Move package first, then paste the Package ID here.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Admin Console</h2>
                <p className="text-xs text-zinc-400">Create a new shared Event</p>
              </div>

              {packageId ? (
                <CreateEventForm
                  packageId={packageId}
                  onCreated={(_, createdId) => {
                    if (createdId) {
                      setEventObjectId(createdId);
                      window.localStorage.setItem('eventObjectId', createdId);
                    }
                  }}
                />
              ) : (
                <div className="text-sm text-zinc-400">Add a Package ID to enable admin actions.</div>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {eventObjectId ? (
              <GetQRTicket
                eventObjectId={eventObjectId}
                onTicket={(t) => {
                  if (!t.signature || !t.msg) {
                    setTicket(null);
                    return;
                  }
                  setTicket(t);
                }}
              />
            ) : (
              <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
                <h2 className="text-base font-semibold">User Action</h2>
                <p className="mt-2 text-sm text-zinc-400">Paste an Event Object ID to generate a ticket.</p>
              </section>
            )}

            {ready ? (
              <CheckInButton
                packageId={packageId}
                eventObjectId={eventObjectId}
                ticket={ticket?.signature && ticket?.msg ? ticket : null}
                onSuccess={() => setNftRefreshSignal((x) => x + 1)}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 text-sm text-zinc-400">
                Add Package ID and Event Object ID to enable check-in.
              </div>
            )}

            <MyAttendanceNFTs packageId={packageId} refreshSignal={nftRefreshSignal} />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-zinc-400">
          <div suppressHydrationWarning>© {new Date().getFullYear()} SuiEvent</div>
          <div className="text-zinc-500">Built on Sui Devnet</div>
        </div>
      </footer>
    </div>
  );
}
