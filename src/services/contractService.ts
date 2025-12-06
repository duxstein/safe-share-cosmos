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
const CONTRACT_ADDRESS = '0x7CE5863E0Cc31dc7FE4A3A18a5191653515D1304';

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
  private registeredFiles = new Map<string, { owner: string; timestamp: number }>();

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

  private convertBigIntToNumber(value: any): number {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return typeof value === 'number' ? value : parseInt(value.toString());
  }

  async registerFile(fileHash: string, account: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log('Registering file:', fileHash, 'from account:', account);
      
      const gasEstimate = await this.contract.methods.uploadFile(fileHash).estimateGas({ from: account });
      console.log('Gas estimate:', gasEstimate);
      
      const gasLimit = Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2);
      console.log('Gas limit:', gasLimit);
      
      const result = await this.contract.methods.uploadFile(fileHash).send({
        from: account,
        gas: gasLimit,
      });

      console.log('File registered successfully:', result);
      
      // Store in local cache immediately after successful registration
      this.registeredFiles.set(fileHash, {
        owner: account,
        timestamp: Date.now()
      });
      
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
        gas: Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2),
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
        gas: Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2),
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
      // First check local cache for recently registered files
      const cached = this.registeredFiles.get(fileHash);
      if (cached && cached.owner.toLowerCase() === userAddress.toLowerCase()) {
        console.log('File access granted from cache (owner):', fileHash);
        return true;
      }

      const hasAccess = await this.contract.methods.hasAccess(fileHash, userAddress).call();
      console.log('Access check for', userAddress, 'on file', fileHash, ':', hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('Error checking access:', error);
      
      // If it's an ABI error and we have the file in cache, check ownership
      if (error.message?.includes('Parameter decoding error') || error.message?.includes('AbiError')) {
        const cached = this.registeredFiles.get(fileHash);
        if (cached && cached.owner.toLowerCase() === userAddress.toLowerCase()) {
          console.log('File access granted from cache due to ABI error (owner):', fileHash);
          return true;
        }
      }
      
      return false;
    }
  }

  async getFileOwner(fileHash: string): Promise<string> {
    this.ensureInitialized();

    try {
      // First check local cache
      const cached = this.registeredFiles.get(fileHash);
      if (cached) {
        console.log('File owner from cache:', fileHash, ':', cached.owner);
        return cached.owner;
      }

      const owner = await this.contract.methods.getFileOwner(fileHash).call();
      console.log('File owner for', fileHash, ':', owner);
      
      // Cache the result if it's not the zero address
      if (owner && owner !== '0x0000000000000000000000000000000000000000') {
        this.registeredFiles.set(fileHash, {
          owner: owner,
          timestamp: Date.now()
        });
      }
      
      return owner;
    } catch (error) {
      console.error('Error getting file owner:', error);
      
      // If it's an ABI error, check cache first
      if (error.message?.includes('Parameter decoding error') || error.message?.includes('AbiError')) {
        const cached = this.registeredFiles.get(fileHash);
        if (cached) {
          console.log('File owner from cache due to ABI error:', fileHash, ':', cached.owner);
          return cached.owner;
        }
        console.log('File not found in cache and ABI error occurred, treating as unregistered:', fileHash);
      }
      
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
        gas: Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2),
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
        gas: Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2),
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
        gas: Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2),
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
        gas: Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2),
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
        gas: Math.floor(this.convertBigIntToNumber(gasEstimate) * 1.2),
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

  // Method to clear cache (useful for testing)
  clearCache() {
    this.registeredFiles.clear();
  }
}

export const contractService = new ContractService();
