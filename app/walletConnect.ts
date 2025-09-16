import { createWalletClient, custom, type EIP1193Provider } from 'viem';
import { mainnet } from 'viem/chains';

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export const walletConnectClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum!),
});
