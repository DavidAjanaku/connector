import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';

export const walletConnectClient = createWalletClient({
  chain: mainnet,
  transport: custom((window as any).ethereum)
});