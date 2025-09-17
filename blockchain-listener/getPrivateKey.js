const { ethers } = require('ethers');
require('dotenv').config();

// Your mnemonic from the .env file
const mnemonic = process.env.PRIVATE_KEY;

// Derive the wallet from the mnemonic
const wallet = ethers.Wallet.fromPhrase(mnemonic);

console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);