import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { ipfsService, IPFSFile } from '@/services/ipfsService';
import { contractService } from '@/services/contractService';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFileUploaded: (file: IPFSFile) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const { web3, account, isConnected } = useWeb3();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<IPFSFile | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (web3 && account) {
      contractService.initialize(web3);
    }
  }, [web3, account]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload to IPFS
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const ipfsFile = await ipfsService.uploadFile(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Don't auto-register, let user choose
      setUploadedFile(ipfsFile);
      onFileUploaded(ipfsFile);

      // Store metadata in Supabase so it can be discovered later
      if (user) {
        try {
          const mimeType = file.type || 'application/octet-stream';
          await supabase.from('files').insert({
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || 'unknown',
            mime_type: mimeType,
            title: file.name,
            description: null,
            tags: null,
            categories: null,
            thumbnail_url: null,
            ipfs_cid: ipfsFile.hash,
            cdn_url: null,
            blockchain_tx_id: null,
            license: null,
            user_id: user.id,
            is_public: true,
          });
        } catch (error) {
          console.error('Failed to save file metadata:', error);
        }
      }

      if (isConnected) {
        toast({
          title: 'File uploaded to IPFS!',
          description: `${file.name} has been uploaded. You can register it on the blockchain for secure access control.`,
        });
      } else {
        toast({
          title: 'File uploaded!',
          description: `${file.name} has been uploaded to IPFS. Connect your wallet to enable secure access control.`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadedFile(null);
      }, 3000);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileUpload(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB limit
  });

  return (
    <Card className="glass-card border-cyan-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Upload className="h-5 w-5" />
          Secure File Upload
        </CardTitle>
        <CardDescription>
          Upload files to IPFS with blockchain-based access control.
          {isConnected
            ? ' Files can be registered for secure sharing after upload.'
            : ' Connect your wallet for secure access control.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragActive
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-gray-600 hover:border-cyan-500 hover:bg-cyan-500/5'
            }
          `}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-cyan-400 animate-spin" />
              <p className="text-cyan-400">Uploading to IPFS...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400" />
              <p className="text-green-400">Upload successful!</p>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-sm font-mono break-all">IPFS Hash: {uploadedFile.hash}</p>
                {isConnected && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Shield className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Ready for blockchain registration</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <File className="h-12 w-12 mx-auto text-gray-400" />
              {isDragActive ? (
                <p className="text-cyan-400">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-gray-300">Drag & drop a file here, or click to select</p>
                  <p className="text-sm text-muted-foreground mt-2">Maximum file size: 100MB</p>
                  {isConnected ? (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Shield className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-400">Ready for blockchain registration</span>
                    </div>
                  ) : (
                    <p className="text-xs text-yellow-400 mt-2">Connect wallet for blockchain security</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {!isUploading && !uploadedFile && (
          <Button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) handleFileUpload(Array.from(files));
              };
              input.click();
            }}
            className="w-full mt-4 cosmic-gradient"
          >
            <Upload className="mr-2 h-4 w-4" />
            Select File
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
