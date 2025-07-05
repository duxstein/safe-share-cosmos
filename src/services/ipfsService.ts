
import { create } from 'ipfs-http-client';

// Using Infura's IPFS service (you can replace with your own IPFS node)
const IPFS_API_URL = 'https://ipfs.infura.io:5001/api/v0';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export interface IPFSFile {
  name: string;
  hash: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

class IPFSService {
  private client: any;

  constructor() {
    // Initialize IPFS client
    this.client = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
    });
  }

  async uploadFile(file: File): Promise<IPFSFile> {
    try {
      console.log('Uploading file to IPFS:', file.name);
      
      const result = await this.client.add(file, {
        progress: (prog: number) => console.log(`Upload progress: ${prog}`),
      });

      const ipfsFile: IPFSFile = {
        name: file.name,
        hash: result.path,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      };

      console.log('File uploaded to IPFS:', ipfsFile);
      return ipfsFile;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  getFileUrl(hash: string): string {
    return `${IPFS_GATEWAY}${hash}`;
  }

  async getFileInfo(hash: string) {
    try {
      const stats = await this.client.object.stat(hash);
      return stats;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error('Failed to get file information');
    }
  }
}

export const ipfsService = new IPFSService();
