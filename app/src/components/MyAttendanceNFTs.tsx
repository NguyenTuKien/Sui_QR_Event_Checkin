'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

type Props = {
  packageId: string;
  refreshSignal?: number;
};

type NFT = {
  objectId: string;
  eventName: string;
  location: string;
  timestamp: string;
};

export function MyAttendanceNFTs({ packageId, refreshSignal }: Props) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account?.address || !packageId) return;

    const fetchNFTs = async () => {
      setLoading(true);
      try {
        const objects = await client.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${packageId}::event_manager::AttendanceNFT`,
          },
          options: {
            showContent: true,
            showType: true,
          },
        });

        const nftList: NFT[] = objects.data
          .map((obj) => {
            const content = obj.data?.content;
            if (content && 'fields' in content) {
              const fields = content.fields as any;
              return {
                objectId: obj.data!.objectId,
                eventName: fields.event_name || 'Unknown',
                location: fields.location || 'Unknown',
                timestamp: fields.timestamp ? new Date(parseInt(fields.timestamp)).toLocaleString() : 'Unknown',
              };
            }
            return null;
          })
          .filter((nft): nft is NFT => nft !== null);

        setNfts(nftList);
      } catch (e) {
        console.error('Failed to fetch NFTs:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [account?.address, client, packageId, refreshSignal]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold">My Attendance NFTs</h2>
        <p className="text-xs text-zinc-400">Your collected event attendance badges</p>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400" />
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-sm text-zinc-400">No attendance NFTs yet. Check-in to your first event!</div>
      ) : (
        <div className="grid gap-3">
          {nfts.map((nft) => (
            <div
              key={nft.objectId}
              className="rounded-xl border border-white/10 bg-black/40 p-3"
            >
              <div className="text-sm font-medium text-zinc-100">{nft.eventName}</div>
              <div className="mt-1 text-xs text-zinc-400">{nft.location}</div>
              <div className="mt-1 text-xs text-zinc-500">{nft.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
