import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://broqzhrkmjvjzatiwhvp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyb3F6aHJrbWp2anphdGl3aHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzMzMzMsImV4cCI6MjA2NzMwOTMzM30.1iHGCCEibySNklrekkp-1AFvfIpY2ePtDdIMqi3TS2U";

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
    } catch (error: any) {
      console.error('IPFS upload failed:', error);
      
      // Provide more helpful error messages
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.includes('IPFS service not configured') || errorMessage.includes('Pinata API keys')) {
        throw new Error(
          'IPFS service is not configured. Please set up Pinata API keys in your Supabase project.\n\n' +
          'Steps to fix:\n' +
          '1. Get your Pinata API keys from https://app.pinata.cloud/\n' +
          '2. Go to your Supabase project dashboard\n' +
          '3. Navigate to Settings > Edge Functions > Secrets\n' +
          '4. Add PINATA_API_KEY and PINATA_SECRET_KEY\n' +
          '5. Redeploy the ipfs-upload edge function\n\n' +
          'See IPFS_SETUP.md for detailed instructions.'
        );
      }
      
      throw new Error(`Failed to upload file to IPFS: ${errorMessage}`);
    }
  }

  private async uploadViaPinataEdgeFunction(file: File): Promise<UploadResult> {
    console.log('Uploading via Pinata edge function...', file.name, file.size);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      // Try using Supabase client first (preferred method)
      try {
        // Create a fresh FormData instance for the Supabase client
        const clientFormData = new FormData();
        clientFormData.append('file', file);
        clientFormData.append('fileName', file.name);
        
        const { data, error } = await supabase.functions.invoke('ipfs-upload', {
          body: clientFormData,
        });

        if (error) {
          throw error;
        }

        if (data?.error) {
          return { success: false, error: data.error };
        }

        if (data?.hash) {
          return { success: true, hash: data.hash };
        }

        return { success: false, error: 'Unknown error: No hash returned' };
      } catch (supabaseError: any) {
        // If Supabase client fails with 403, try direct fetch as fallback
        if (supabaseError.message?.includes('403') || 
            supabaseError.status === 403 ||
            supabaseError.message?.includes('non-2xx')) {
          console.warn('Supabase client returned 403, trying direct fetch...');
          
          // Fallback: Use direct fetch with explicit headers
          // Note: Even with verify_jwt=false, Supabase may require apikey header
          const functionUrl = `${SUPABASE_URL}/functions/v1/ipfs-upload`;
          console.log('Attempting direct fetch to:', functionUrl);
          
          // Create a new FormData to ensure it's fresh
          const freshFormData = new FormData();
          freshFormData.append('file', file);
          freshFormData.append('fileName', file.name);
          
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              // Explicitly DO NOT set Content-Type - browser must set it with boundary for FormData
            },
            body: freshFormData,
          });
          
          console.log('Direct fetch response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            allHeaders: Object.fromEntries(response.headers.entries())
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Direct fetch error response:', {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: errorText
            });
            
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.error) {
                errorMessage = errorJson.error;
              } else if (errorJson.message) {
                errorMessage = errorJson.message;
              }
            } catch {
              if (errorText) {
                errorMessage = errorText.substring(0, 200); // Limit length
              }
            }
            
            // If still 403 even with direct fetch, check if it's a CORS or auth issue
            if (response.status === 403) {
              // Check response headers for clues
              const contentType = response.headers.get('content-type');
              console.error('403 Response details:', {
                contentType,
                errorText,
                url: `${SUPABASE_URL}/functions/v1/ipfs-upload`
              });
              
              return { 
                success: false, 
                error: `403 Forbidden from Supabase. This may be a function configuration issue. Please verify in Supabase dashboard that the function allows public access. Response: ${errorMessage}` 
              };
            }
            
            return { success: false, error: errorMessage };
          }

          const result = await response.json();
          if (result.hash) {
            return { success: true, hash: result.hash };
          }
          if (result.error) {
            return { success: false, error: result.error };
          }
          return { success: false, error: 'Unknown response format' };
        }
        
        // Re-throw if it's not a 403 error - handle it below
        throw supabaseError;
      }
    } catch (error: any) {
      console.error('Edge function error:', error);
      
      // Check for 403 Forbidden error specifically
      const statusCode = error.status || error.statusCode || 
                        (error.context?.status) || 
                        (typeof error === 'object' && 'status' in error ? (error as any).status : null);
      
      const errorMessage = error.message || error.toString() || '';
      
      if (statusCode === 403 || 
          errorMessage.includes('403') || 
          errorMessage.includes('Forbidden') ||
          errorMessage.includes('non-2xx status code')) {
        return { 
          success: false, 
          error: 'Edge function returned 403 Forbidden. This may indicate an authentication issue. Please check: 1) Verify JWT is disabled in dashboard, 2) Function is deployed, 3) Try refreshing the page.' 
        };
      }
      
      // Check for 404 Not Found
      if (errorMessage.includes('404') || errorMessage.includes('Not Found') ||
          statusCode === 404) {
        return { 
          success: false, 
          error: 'Edge function not found (404): The ipfs-upload function is not deployed. Please deploy it using: `supabase functions deploy ipfs-upload`' 
        };
      }
      
      // Provide more specific error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Network error: Unable to reach the IPFS service. Please check your internet connection and ensure the Supabase edge function is deployed.' 
        };
      }
      
      if (errorMessage.includes('IPFS service not configured') || errorMessage.includes('Pinata credentials')) {
        return { 
          success: false, 
          error: 'IPFS service not configured: Pinata API keys are missing. Please configure PINATA_API_KEY and PINATA_SECRET_KEY in your Supabase project settings.' 
        };
      }
      
      return { success: false, error: errorMessage || `Edge function error occurred (Status: ${statusCode || 'unknown'})` };
    }
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

  // Check if IPFS service is configured by attempting a test call
  async checkServiceStatus(): Promise<{ configured: boolean; error?: string }> {
    try {
      // Create a minimal test file (1 byte)
      const testFile = new File(['x'], 'test.txt', { type: 'text/plain' });
      
      // Try to upload (this will fail gracefully if not configured)
      const result = await this.uploadViaPinataEdgeFunction(testFile);
      
      // Check for 403/404 errors first (function not deployed)
      if (result.error?.includes('403') || 
          result.error?.includes('Forbidden') ||
          result.error?.includes('Access denied') ||
          result.error?.includes('not be deployed') ||
          result.error?.includes('not found (404)')) {
        return { 
          configured: false, 
          error: 'Edge function is not deployed. Please deploy it using: `supabase functions deploy ipfs-upload`' 
        };
      }
      
      // Check for configuration errors
      if (result.error?.includes('IPFS service not configured') || 
          result.error?.includes('Pinata credentials') ||
          result.error?.includes('Pinata API keys')) {
        return { 
          configured: false, 
          error: 'Pinata API keys are not configured in Supabase edge function secrets' 
        };
      }
      
      // If we got a hash, service is definitely configured
      if (result.success && result.hash) {
        return { configured: true };
      }
      
      // If we got an error but it's not about configuration, 
      // the service might be configured but has other issues
      if (result.error) {
        // Network errors suggest the function might not be deployed
        if (result.error.includes('Network error') || 
            result.error.includes('Failed to fetch') ||
            result.error.includes('Unable to reach')) {
          return { 
            configured: false, 
            error: 'Edge function may not be deployed or network error occurred' 
          };
        }
        // Other errors might indicate configuration issues
        return { configured: false, error: result.error };
      }
      
      return { configured: false, error: 'Unknown status' };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      // Check for 403/404 errors
      if (errorMessage.includes('403') || 
          errorMessage.includes('Forbidden') ||
          errorMessage.includes('Access denied') ||
          errorMessage.includes('not be deployed')) {
        return { 
          configured: false, 
          error: 'Edge function is not deployed. Deploy it using: `supabase functions deploy ipfs-upload`' 
        };
      }
      
      // Check for configuration-related errors
      if (errorMessage.includes('IPFS service not configured') || 
          errorMessage.includes('Pinata API keys') ||
          errorMessage.includes('Pinata credentials')) {
        return { 
          configured: false, 
          error: 'Pinata API keys are not configured' 
        };
      }
      
      // Network errors
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('Network error')) {
        return { 
          configured: false, 
          error: 'Cannot reach IPFS service. Check if edge function is deployed.' 
        };
      }
      
      // Other errors
      return { configured: false, error: errorMessage };
    }
  }
}

export const ipfsService = new IPFSService();

