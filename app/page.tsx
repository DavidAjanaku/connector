'use client';

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { connect, connectors, error, isPending } = useConnect();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance, isLoading: balanceLoading } = useBalance({ 
    address: address as `0x${string}` | undefined,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Crypto Wallet
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Connect your wallet to view your balance
        </p>

        {!isConnected ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 text-center">
              Connect Your Wallet
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    !isPending 
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span className="font-medium">
                    {connector.name}
                    {isPending && ' (connecting...)'}
                  </span>
                  {connector.icon && (
                    <img
                      src={connector.icon}
                      alt={connector.name}
                      className="h-6 w-6"
                    />
                  )}
                </button>
              ))}
            </div>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg mt-4">
                {error.message}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h2 className="text-green-800 font-semibold text-center">
                Wallet Connected
              </h2>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">
                Wallet Address
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg break-all font-mono text-sm flex justify-between items-center">
                <span>{formatAddress(address)}</span>
                <button 
                  onClick={() => address && navigator.clipboard.writeText(address)}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  Copy
                </button>
              </div>
            </div>

            {chain && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-700">Network</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {chain.name} (ID: {chain.id})
                </div>
              </div>
            )}

            {balance && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-700">Balance</h3>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  {balanceLoading ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-gray-800">
                        {parseFloat(balance.formatted).toFixed(4)}
                      </span>
                      <span className="text-gray-600 ml-2">{balance.symbol}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => disconnect()}
              className="w-full py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Made with Next.js and Tailwind CSS</p>
      </footer>
    </main>
  );
}