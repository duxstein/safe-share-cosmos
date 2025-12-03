import { supabase } from '@/integrations/supabase/client';

// Multiple IPFS Gateways for redundancy
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

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
  async uploadFile(file: File): Promise<IPFSFile> {
    console.log('Starting file upload to IPFS via edge function:', file.name);
    
    try {
      const result = await this.uploadViaPinataEdgeFunction(file);
      
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
      
      throw new Error(result.error || 'Upload failed');
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload file to IPFS. Please check your Pinata API keys are configured correctly.');
    }
  }

  private async uploadViaPinataEdgeFunction(file: File): Promise<UploadResult> {
    console.log('Uploading via Pinata edge function...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

    const { data, error } = await supabase.functions.invoke('ipfs-upload', {
      body: formData,
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      console.error('Pinata error:', data.error);
      return { success: false, error: data.error };
    }

    if (data?.hash) {
      console.log('Upload successful, hash:', data.hash);
      return { success: true, hash: data.hash };
    }

    return { success: false, error: 'Unknown error occurred' };
  }

  getFileUrl(hash: string): string {
    // Use Pinata gateway as primary for better reliability
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }

  // Get alternative URLs for fallback
  getAlternativeUrls(hash: string): string[] {
    return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
  }

  async getFileInfo(hash: string) {
    return {
      hash,
      gateway: IPFS_GATEWAYS[0],
      url: this.getFileUrl(hash),
      alternativeUrls: this.getAlternativeUrls(hash)
    };
  }

  // Check if a hash is a valid IPFS CID (starts with Qm or bafy)
  isValidIPFSHash(hash: string): boolean {
    return hash.startsWith('Qm') && hash.length === 46 || 
           hash.startsWith('bafy') && hash.length >= 59;
  }
}

export const ipfsService = new IPFSService();
