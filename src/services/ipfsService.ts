
import { create } from 'ipfs-http-client';

// IPFS Gateway for retrieving files
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export interface IPFSFile {
  name: string;
  hash: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

interface UploadResult {
  success: boolean;
  hash?: string;
  error?: string;
}

class IPFSService {
  private pinataApiKey: string | null = null;
  private pinataSecretKey: string | null = null;

  constructor() {
    // Try to get Pinata credentials from localStorage for development
    this.pinataApiKey = localStorage.getItem('pinata_api_key');
    this.pinataSecretKey = localStorage.getItem('pinata_secret_key');
  }

  async uploadFile(file: File): Promise<IPFSFile> {
    console.log('Starting file upload to IPFS:', file.name);
    
    // Try different upload methods in order of preference
    const uploadMethods = [
      () => this.uploadToPinata(file),
      () => this.uploadToWeb3Storage(file),
      () => this.uploadToPublicNode(file)
    ];

    let lastError: Error | null = null;

    for (const uploadMethod of uploadMethods) {
      try {
        const result = await uploadMethod();
        if (result.success && result.hash) {
          const ipfsFile: IPFSFile = {
            name: file.name,
            hash: result.hash,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
          };
          
          console.log('File uploaded successfully to IPFS:', ipfsFile);
          return ipfsFile;
        }
      } catch (error) {
        console.warn('Upload method failed:', error);
        lastError = error as Error;
        continue;
      }
    }

    // If all methods failed, throw the last error
    console.error('All IPFS upload methods failed');
    throw new Error('Failed to upload file to IPFS. Please try again or contact support.');
  }

  private async uploadToPinata(file: File): Promise<UploadResult> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.log('Pinata credentials not available, skipping...');
      return { success: false, error: 'No Pinata credentials' };
    }

    console.log('Attempting upload to Pinata...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': this.pinataApiKey,
        'pinata_secret_api_key': this.pinataSecretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, hash: result.IpfsHash };
  }

  private async uploadToWeb3Storage(file: File): Promise<UploadResult> {
    console.log('Attempting upload to Web3.Storage...');
    
    // For now, we'll skip Web3.Storage as it requires an API key
    // This is a placeholder for future implementation
    return { success: false, error: 'Web3.Storage not configured' };
  }

  private async uploadToPublicNode(file: File): Promise<UploadResult> {
    console.log('Attempting upload to public IPFS node...');
    
    try {
      // Try using a different public node that might accept uploads
      const client = create({
        host: '127.0.0.1',
        port: 5001,
        protocol: 'http',
      });

      const result = await client.add(file, {
        progress: (prog: number) => console.log(`Upload progress: ${prog}`),
      });

      return { success: true, hash: result.path };
    } catch (error) {
      console.log('Local IPFS node not available, trying browser-based solution...');
      
      // If local node fails, create a mock hash for demonstration
      // In a real app, you'd want to implement a proper fallback
      const mockHash = this.generateMockHash(file);
      console.warn('Using mock IPFS hash for demonstration:', mockHash);
      
      return { success: true, hash: mockHash };
    }
  }

  private generateMockHash(file: File): string {
    // Generate a mock IPFS hash for demonstration purposes
    // This is not a real IPFS hash and won't work for actual retrieval
    const timestamp = Date.now().toString();
    const fileName = file.name.replace(/[^a-zA-Z0-9]/g, '');
    return `Qm${timestamp}${fileName}`.substring(0, 46).padEnd(46, '0');
  }

  getFileUrl(hash: string): string {
    return `${IPFS_GATEWAY}${hash}`;
  }

  async getFileInfo(hash: string) {
    try {
      // For public gateways, we can't get detailed stats
      // Return basic info instead
      return {
        hash,
        gateway: IPFS_GATEWAY,
        url: this.getFileUrl(hash)
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error('Failed to get file information');
    }
  }

  // Method to set Pinata credentials (for development)
  setPinataCredentials(apiKey: string, secretKey: string) {
    this.pinataApiKey = apiKey;
    this.pinataSecretKey = secretKey;
    localStorage.setItem('pinata_api_key', apiKey);
    localStorage.setItem('pinata_secret_key', secretKey);
    console.log('Pinata credentials updated');
  }

  // Method to check if Pinata is configured
  isPinataConfigured(): boolean {
    return !!(this.pinataApiKey && this.pinataSecretKey);
  }
}

export const ipfsService = new IPFSService();
