
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { File, Download, ExternalLink, Clock, Hash, HardDrive, Shield, Share2, Lock } from 'lucide-react';
import { IPFSFile, ipfsService } from '@/services/ipfsService';
import { contractService } from '@/services/contractService';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/hooks/use-toast';
import SecureFileSharing from './SecureFileSharing';

interface FileManagerProps {
  files: IPFSFile[];
}

const FileManager: React.FC<FileManagerProps> = ({ files }) => {
  const { web3, account, isConnected } = useWeb3();
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [sharingFile, setSharingFile] = useState<string | null>(null);
  const [fileAccess, setFileAccess] = useState<Map<string, boolean>>(new Map());
  const { toast } = useToast();

  React.useEffect(() => {
    if (web3 && account) {
      contractService.initialize(web3);
      checkFileAccess();
    }
  }, [web3, account, files]);

  const checkFileAccess = async () => {
    if (!account || files.length === 0) return;

    const accessMap = new Map<string, boolean>();
    
    for (const file of files) {
      try {
        const hasAccess = await contractService.checkFileAccess(file.hash, account);
        const owner = await contractService.getFileOwner(file.hash);
        const isOwner = owner.toLowerCase() === account.toLowerCase();
        
        accessMap.set(file.hash, hasAccess || isOwner);
      } catch (error) {
        // If contract call fails, assume no access (file might not be registered)
        console.warn('Could not check access for file:', file.hash);
        accessMap.set(file.hash, false);
      }
    }
    
    setFileAccess(accessMap);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleSecureDownload = async (file: IPFSFile) => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to download files",
        variant: "destructive",
      });
      return;
    }

    const hasAccess = fileAccess.get(file.hash);
    if (!hasAccess) {
      toast({
        title: "Access denied",
        description: "You don't have permission to download this file",
        variant: "destructive",
      });
      return;
    }

    setDownloadingFiles(prev => new Set(prev).add(file.hash));
    
    try {
      const url = ipfsService.getFileUrl(file.hash);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.target = '_blank';
      link.click();

      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      });
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.hash);
        return newSet;
      });
    }
  };

  const openInGateway = (file: IPFSFile) => {
    const hasAccess = fileAccess.get(file.hash);
    if (!hasAccess && isConnected) {
      toast({
        title: "Access denied",
        description: "You don't have permission to view this file",
        variant: "destructive",
      });
      return;
    }

    const url = ipfsService.getFileUrl(file.hash);
    window.open(url, '_blank');
  };

  const handleRegisterFile = async (file: IPFSFile) => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register files",
        variant: "destructive",
      });
      return;
    }

    try {
      await contractService.registerFile(file.hash, account);
      await checkFileAccess();
      
      toast({
        title: "File registered!",
        description: "File has been registered on the blockchain for secure access control",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "Could not register file on blockchain. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (files.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400">No files uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload your first file to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <HardDrive className="h-5 w-5" />
            Secure File Manager
          </CardTitle>
          <CardDescription>
            {files.length} file{files.length !== 1 ? 's' : ''} stored on IPFS with blockchain access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.map((file, index) => {
            const hasAccess = fileAccess.get(file.hash);
            const isRegistered = fileAccess.has(file.hash);
            
            return (
              <div key={file.hash}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <File className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <span className="font-medium truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.type || 'Unknown'}
                        </Badge>
                        
                        {isConnected && (
                          <>
                            {hasAccess ? (
                              <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/50">
                                <Shield className="h-3 w-3 mr-1" />
                                Authorized
                              </Badge>
                            ) : isRegistered ? (
                              <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/50">
                                <Lock className="h-3 w-3 mr-1" />
                                No Access
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                                Not Registered
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(file.size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(file.uploadedAt)}
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <Hash className="h-3 w-3 flex-shrink-0" />
                          <span className="font-mono text-xs truncate">{file.hash}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4 flex-wrap">
                      {isConnected && !isRegistered && (
                        <Button
                          size="sm"
                          onClick={() => handleRegisterFile(file)}
                          className="cosmic-gradient text-xs"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Register
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSecureDownload(file)}
                        disabled={downloadingFiles.has(file.hash) || (isConnected && !hasAccess)}
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInGateway(file)}
                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      
                      {isConnected && hasAccess && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSharingFile(sharingFile === file.hash ? null : file.hash)}
                          className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* File Sharing Panel */}
                  {sharingFile === file.hash && (
                    <div className="mt-4">
                      <SecureFileSharing 
                        file={file} 
                        onAccessUpdated={() => checkFileAccess()}
                      />
                    </div>
                  )}
                </div>
                
                {index < files.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileManager;
