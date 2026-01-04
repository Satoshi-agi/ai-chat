/**
 * SWR Provider for global configuration
 */

'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export default function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        dedupingInterval: 2000,
        // Cache settings
        focusThrottleInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
