import Web3 from 'web3';

// Enhanced file sharing contract ABI with blacklist/whitelist features
const FILE_SHARING_ABI = [
  {
    "inputs": [{"name": "_fileHash", "type": "string"}],
    "name": "uploadFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "grantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "revokeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "addToBlacklist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "removeFromBlacklist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "addToWhitelist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "removeFromWhitelist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}],
    "name": "toggleWhitelistMode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "hasAccess",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}],
    "name": "getFileOwner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}],
    "name": "getAuthorizedUsers",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}],
    "name": "getBlacklistedUsers",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}],
    "name": "getWhitelistedUsers",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}],
    "name": "isWhitelistModeEnabled",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "isUserBlacklisted",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_fileHash", "type": "string"}, {"name": "_user", "type": "address"}],
    "name": "isUserWhitelisted",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract address - you'll need to deploy the contract and update this
const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b8D7389Cd64E6b1A8D';

export interface FilePermission {
  fileHash: string;
  owner: string;
  authorizedUsers: string[];
  blacklistedUsers: string[];
  whitelistedUsers: string[];
  isWhitelistMode: boolean;
}

class ContractService {
  private web3: Web3 | null = null;
  private contract: any = null;
  private isInitialized = false;

  initialize(web3: Web3) {
    this.web3 = web3;
    this.contract = new web3.eth.Contract(FILE_SHARING_ABI, CONTRACT_ADDRESS);
    this.isInitialized = true;
    console.log('Contract service initialized with address:', CONTRACT_ADDRESS);
  }

  private ensureInitialized() {
    if (!this.isInitialized || !this.contract || !this.web3) {
      throw new Error('Contract not initialized. Please connect your wallet first.');
    }
  }

  async registerFile(fileHash: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log('Registering file:', fileHash, 'from account:', account);
      
      const gasEstimate = await this.contract.methods.uploadFile(fileHash).estimateGas({ from: account });
      console.log('Gas estimate:', gasEstimate);
      
      const result = await this.contract.methods.uploadFile(fileHash).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
      });

      console.log('File registered successfully:', result);
      return true;
    } catch (error) {
      console.error('Error registering file:', error);
      if (error.message?.includes('revert')) {
        throw new Error('Transaction reverted. The file may already be registered.');
      }
      throw error;
    }
  }

  async grantFileAccess(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const gasEstimate = await this.contract.methods.grantAccess(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.grantAccess(fileHash, userAddress).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
      });

      console.log('Access granted to:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error granting access:', error);
      throw error;
    }
  }

  async revokeFileAccess(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const gasEstimate = await this.contract.methods.revokeAccess(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.revokeAccess(fileHash, userAddress).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
      });

      console.log('Access revoked from:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      throw error;
    }
  }

  async checkFileAccess(fileHash: string, userAddress: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const hasAccess = await this.contract.methods.hasAccess(fileHash, userAddress).call();
      console.log('Access check for', userAddress, 'on file', fileHash, ':', hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  async getFileOwner(fileHash: string): Promise<string> {
    this.ensureInitialized();

    try {
      const owner = await this.contract.methods.getFileOwner(fileHash).call();
      console.log('File owner for', fileHash, ':', owner);
      return owner;
    } catch (error) {
      console.error('Error getting file owner:', error);
      // Return zero address if file doesn't exist or other error
      return '0x0000000000000000000000000000000000000000';
    }
  }

  async getAuthorizedUsers(fileHash: string): Promise<string[]> {
    this.ensureInitialized();

    try {
      const users = await this.contract.methods.getAuthorizedUsers(fileHash).call();
      return users;
    } catch (error) {
      console.error('Error getting authorized users:', error);
      return [];
    }
  }

  async addToBlacklist(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const gasEstimate = await this.contract.methods.addToBlacklist(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.addToBlacklist(fileHash, userAddress).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
      });

      console.log('User blacklisted:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error blacklisting user:', error);
      throw error;
    }
  }

  async removeFromBlacklist(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const gasEstimate = await this.contract.methods.removeFromBlacklist(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.removeFromBlacklist(fileHash, userAddress).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
      });

      console.log('User removed from blacklist:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error removing user from blacklist:', error);
      throw error;
    }
  }

  async addToWhitelist(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const gasEstimate = await this.contract.methods.addToWhitelist(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.addToWhitelist(fileHash, userAddress).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
      });

      console.log('User whitelisted:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error whitelisting user:', error);
      throw error;
    }
  }

  async removeFromWhitelist(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const gasEstimate = await this.contract.methods.removeFromWhitelist(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.removeFromWhitelist(fileHash, userAddress).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
      });

      console.log('User removed from whitelist:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error removing user from whitelist:', error);
      throw error;
    }
  }

  async toggleWhitelistMode(fileHash: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const gasEstimate = await this.contract.methods.toggleWhitelistMode(fileHash).estimateGas({ from: account });
      
      await this.contract.methods.toggleWhitelistMode(fileHash).send({
        from: account,
        gas: Math.floor(gasEstimate * 1.2),
      });

      console.log('Whitelist mode toggled for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error toggling whitelist mode:', error);
      throw error;
    }
  }

  async getBlacklistedUsers(fileHash: string): Promise<string[]> {
    this.ensureInitialized();

    try {
      const users = await this.contract.methods.getBlacklistedUsers(fileHash).call();
      return users;
    } catch (error) {
      console.error('Error getting blacklisted users:', error);
      return [];
    }
  }

  async getWhitelistedUsers(fileHash: string): Promise<string[]> {
    this.ensureInitialized();

    try {
      const users = await this.contract.methods.getWhitelistedUsers(fileHash).call();
      return users;
    } catch (error) {
      console.error('Error getting whitelisted users:', error);
      return [];
    }
  }

  async isWhitelistModeEnabled(fileHash: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const isEnabled = await this.contract.methods.isWhitelistModeEnabled(fileHash).call();
      return isEnabled;
    } catch (error) {
      console.error('Error checking whitelist mode:', error);
      return false;
    }
  }

  async isUserBlacklisted(fileHash: string, userAddress: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const isBlacklisted = await this.contract.methods.isUserBlacklisted(fileHash, userAddress).call();
      return isBlacklisted;
    } catch (error) {
      console.error('Error checking if user is blacklisted:', error);
      return false;
    }
  }

  async isUserWhitelisted(fileHash: string, userAddress: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const isWhitelisted = await this.contract.methods.isUserWhitelisted(fileHash, userAddress).call();
      return isWhitelisted;
    } catch (error) {
      console.error('Error checking if user is whitelisted:', error);
      return false;
    }
  }

  // Method to check if contract is deployed and accessible
  async isContractDeployed(): Promise<boolean> {
    if (!this.contract || !this.web3) {
      return false;
    }

    try {
      const code = await this.web3.eth.getCode(CONTRACT_ADDRESS);
      return code !== '0x';
    } catch (error) {
      console.error('Error checking contract deployment:', error);
      return false;
    }
  }
}

export const contractService = new ContractService();
