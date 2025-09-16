// config/wagmi.ts
import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'

// Get projectId from https://dashboard.reown.com
export const projectId = "ef3acb7df7c6a0b603342103b0e59fd7";

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [mainnet, sepolia]

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, sepolia],
  // defaultNetwork: mainnet, // Remove this line
  metadata: {
    name: 'Crypto Wallet Connect',
    description: 'Connect your wallet and view your balance',
    url: 'https://yourapp.com',
    icons: ['https://yourapp.com/icon.png']
  },
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})