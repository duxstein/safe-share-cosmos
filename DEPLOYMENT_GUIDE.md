
# Secure File Sharing Smart Contract Deployment Guide

## Prerequisites
- MetaMask wallet with testnet ETH (Sepolia recommended)
- Remix IDE (https://remix.ethereum.org/) or Hardhat setup

## Quick Deployment with Remix IDE

### Step 1: Deploy the Contract
1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file called `FileSharing.sol`
3. Copy the contract code from `contracts/FileSharing.sol`
4. Compile the contract (Solidity version 0.8.0 or higher)
5. Deploy to Sepolia testnet using MetaMask
6. Copy the deployed contract address

### Step 2: Update the Frontend
1. Replace the `CONTRACT_ADDRESS` in `src/services/contractService.ts` with your deployed contract address
2. Make sure you're connected to the same network (Sepolia) in MetaMask

### Step 3: Get Testnet ETH
- Get Sepolia ETH from: https://sepoliafaucet.com/
- You'll need ETH for gas fees when registering files and granting access

## Contract Functions

### Core Functions:
- `uploadFile(fileHash)` - Register a file on the blockchain
- `grantAccess(fileHash, userAddress)` - Give access to a user
- `revokeAccess(fileHash, userAddress)` - Remove access from a user
- `hasAccess(fileHash, userAddress)` - Check if user has access
- `getFileOwner(fileHash)` - Get the owner of a file
- `getAuthorizedUsers(fileHash)` - Get all authorized users

### Events:
- `FileUploaded` - Emitted when a file is registered
- `AccessGranted` - Emitted when access is granted
- `AccessRevoked` - Emitted when access is revoked

## How It Works

1. **File Upload**: When you upload a file, it's stored on IPFS and the hash is registered on the blockchain
2. **Access Control**: Only the file owner can grant/revoke access to other users
3. **Secure Download**: Files can only be downloaded by authorized users
4. **Decentralized**: Files are stored on IPFS, access control on Ethereum

## Security Features

- **Owner-only access control**: Only file owners can manage permissions
- **Immutable file registration**: Once registered, files cannot be deleted (only access can be managed)
- **Transparent permissions**: All access grants/revokes are logged on-chain
- **No central authority**: Fully decentralized file sharing

## Gas Costs (Approximate on Sepolia)
- Register file: ~100,000 gas
- Grant access: ~50,000 gas  
- Revoke access: ~30,000 gas
- Check access: Free (view function)

## Production Deployment

For mainnet deployment:
1. Use a more gas-efficient deployment strategy
2. Consider using Layer 2 solutions (Polygon, Arbitrum) for lower costs
3. Implement additional security measures
4. Add file encryption for sensitive data
5. Consider IPFS pinning services for file persistence

## Troubleshooting

**Contract not responding:**
- Check if you're on the correct network
- Verify the contract address is correct
- Ensure you have sufficient ETH for gas

**File access denied:**
- Make sure the file is registered on the blockchain
- Check if you're authorized by the file owner
- Verify your wallet is connected

**High gas fees:**
- Use testnets for development
- Consider Layer 2 solutions for production
- Batch operations when possible
