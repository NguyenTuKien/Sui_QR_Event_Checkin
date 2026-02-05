'use client';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ReactNode } from 'react';

import '@mysten/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

const networks = {
  devnet: { url: 'https://fullnode.devnet.sui.io:443' },
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="devnet">
        <WalletProvider autoConnect>
          {children}
          <Toaster position="bottom-right" />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
