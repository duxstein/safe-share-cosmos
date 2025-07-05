
import Web3 from 'web3';

// Simple file sharing contract ABI
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
  }
];

// You'll need to deploy this contract and update this address
const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b8D7389Cd64E6b1A8D'; // Placeholder address

export interface FilePermission {
  fileHash: string;
  owner: string;
  authorizedUsers: string[];
}

class ContractService {
  private web3: Web3 | null = null;
  private contract: any = null;

  initialize(web3: Web3) {
    this.web3 = web3;
    this.contract = new web3.eth.Contract(FILE_SHARING_ABI, CONTRACT_ADDRESS);
  }

  async registerFile(fileHash: string, account: string): Promise<boolean> {
    if (!this.contract || !this.web3) {
      throw new Error('Contract not initialized');
    }

    try {
      const gasEstimate = await this.contract.methods.uploadFile(fileHash).estimateGas({ from: account });
      
      await this.contract.methods.uploadFile(fileHash).send({
        from: account,
        gas: gasEstimate,
      });

      console.log('File registered on blockchain:', fileHash);
      return true;
    } catch (error) {
      console.error('Error registering file:', error);
      throw error;
    }
  }

  async grantFileAccess(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    if (!this.contract || !this.web3) {
      throw new Error('Contract not initialized');
    }

    try {
      const gasEstimate = await this.contract.methods.grantAccess(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.grantAccess(fileHash, userAddress).send({
        from: account,
        gas: gasEstimate,
      });

      console.log('Access granted to:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error granting access:', error);
      throw error;
    }
  }

  async revokeFileAccess(fileHash: string, userAddress: string, account: string): Promise<boolean> {
    if (!this.contract || !this.web3) {
      throw new Error('Contract not initialized');
    }

    try {
      const gasEstimate = await this.contract.methods.revokeAccess(fileHash, userAddress).estimateGas({ from: account });
      
      await this.contract.methods.revokeAccess(fileHash, userAddress).send({
        from: account,
        gas: gasEstimate,
      });

      console.log('Access revoked from:', userAddress, 'for file:', fileHash);
      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      throw error;
    }
  }

  async checkFileAccess(fileHash: string, userAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hasAccess = await this.contract.methods.hasAccess(fileHash, userAddress).call();
      return hasAccess;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  async getFileOwner(fileHash: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const owner = await this.contract.methods.getFileOwner(fileHash).call();
      return owner;
    } catch (error) {
      console.error('Error getting file owner:', error);
      throw error;
    }
  }

  async getAuthorizedUsers(fileHash: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const users = await this.contract.methods.getAuthorizedUsers(fileHash).call();
      return users;
    } catch (error) {
      console.error('Error getting authorized users:', error);
      return [];
    }
  }
}

export const contractService = new ContractService();
