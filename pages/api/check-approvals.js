import { scanHistoricalApprovals, checkNewApprovals } from '../../blockchain-listener/index';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // You can add logic here to determine if you want to scan historical blocks
    // or just check for new approvals since the last check
    
    // For now, let's just check the last 1000 blocks for new approvals
    const currentBlock = await provider.getBlockNumber();
    const sinceBlock = currentBlock - 1000;
    
    const results = await checkNewApprovals(sinceBlock);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error checking approvals:', error);
    res.status(500).json({ error: error.message });
  }
}