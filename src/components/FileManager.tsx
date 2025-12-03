import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, Download, ExternalLink, Clock, Hash, HardDrive, Shield, Share2, Lock, Loader2, UserMinus, Users } from 'lucide-react';
import { IPFSFile, ipfsService } from '@/services/ipfsService';
import { contractService } from '@/services/contractService';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdvancedFileSharing from './AdvancedFileSharing';

interface FileManagerProps {
  files: IPFSFile[];
  onFileRegistered?: () => void;
  viewMode: 'my-files' | 'shared-with-me';
  onViewModeChange: (mode: 'my-files' | 'shared-with-me') => void;
}

const FileManager: React.FC<FileManagerProps> = ({ files, onFileRegistered, viewMode, onViewModeChange }) => {
  const { web3, account, isConnected } = useWeb3();
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [registeringFiles, setRegisteringFiles] = useState<Set<string>>(new Set());
  const [unregisteringFiles, setUnregisteringFiles] = useState<Set<string>>(new Set());
  const [sharingFile, setSharingFile] = useState<string | null>(null);
  const [fileAccess, setFileAccess] = useState<Map<string, boolean>>(new Map());
  const [registrationStatus, setRegistrationStatus] = useState<Map<string, boolean>>(new Map());
  const [loadingStatus, setLoadingStatus] = useState<Map<string, boolean>>(new Map());
  const [sharedFiles, setSharedFiles] = useState<IPFSFile[]>([]);
  const [loadingSharedFiles, setLoadingSharedFiles] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (web3 && account && isConnected) {
      contractService.initialize(web3);
      checkFileAccess();
    }
  }, [web3, account, isConnected, files]);

  useEffect(() => {
    if (viewMode === 'shared-with-me' && account && isConnected) {
      fetchSharedFiles();
    }
  }, [viewMode, account, isConnected]);

  const fetchSharedFiles = async () => {
    if (!account) {
      console.log('No account connected, cannot fetch shared files');
      return;
    }
    
    setLoadingSharedFiles(true);
    console.log('Fetching shared files for wallet:', account);
    
    try {
      // Query file_access table for files shared with this wallet address
      // Use the connected wallet address directly (normalized to lowercase)
      const walletAddress = account.toLowerCase();
      console.log('Querying file_access for wallet:', walletAddress);

      const { data: accessRecords, error } = await supabase
        .from('file_access')
        .select(`
          file_id,
          access_type,
          is_active,
          user_address,
          files:file_id (
            id,
            ipfs_cid,
            file_name,
            file_size,
            file_type,
            created_at,
            user_id
          )
        `)
        .eq('user_address', walletAddress)
        .eq('access_type', 'authorized')
        .eq('is_active', true);

      console.log('Access records query result:', { accessRecords, error });

      if (error) {
        console.error('Error fetching access records:', error);
        throw error;
      }

      if (!accessRecords || accessRecords.length === 0) {
        console.log('No access records found for wallet:', walletAddress);
        setSharedFiles([]);
        return;
      }

      console.log('Found', accessRecords.length, 'access records');

      // Convert to IPFSFile format
      const accessibleFiles: IPFSFile[] = [];
      const accessMap = new Map<string, boolean>();
      const registrationMap = new Map<string, boolean>();

      for (const record of accessRecords) {
        const file = record.files as any;
        if (!file) {
          console.log('No file data for record:', record);
          continue;
        }

        console.log('Processing shared file:', file.file_name, 'CID:', file.ipfs_cid);

        // Add file to the list - database record is source of truth for shared files
        // Blockchain verification is optional (might fail if contract not deployed)
        accessibleFiles.push({
          hash: file.ipfs_cid,
          name: file.file_name,
          size: file.file_size,
          type: file.file_type,
          uploadedAt: new Date(file.created_at || Date.now())
        });
        
        // Mark as having database access
        accessMap.set(file.ipfs_cid, true);
        registrationMap.set(file.ipfs_cid, true);

        // Try blockchain verification but don't block on failure
        try {
          const hasBlockchainAccess = await contractService.checkFileAccess(file.ipfs_cid, account);
          console.log('Blockchain access check for', file.ipfs_cid, ':', hasBlockchainAccess);
        } catch (blockchainError) {
          console.log('Blockchain check failed (non-critical):', blockchainError);
        }
      }

      console.log('Setting shared files:', accessibleFiles.length, 'files');
      setSharedFiles(accessibleFiles);
      setFileAccess(prev => new Map([...prev, ...accessMap]));
      setRegistrationStatus(prev => new Map([...prev, ...registrationMap]));
    } catch (error) {
      console.error('Error fetching shared files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shared files",
        variant: "destructive",
      });
    } finally {
      setLoadingSharedFiles(false);
    }
  };

  const checkFileAccess = async () => {
    if (!account || !isConnected || files.length === 0) return;

    console.log('Checking file access for', files.length, 'files');
    
    const accessMap = new Map<string, boolean>();
    const registrationMap = new Map<string, boolean>();
    const loadingMap = new Map<string, boolean>();
    
    for (const file of files) {
      try {
        loadingMap.set(file.hash, true);
        setLoadingStatus(new Map(loadingMap));
        
        console.log('Checking file:', file.hash);
        
        // Check if file is registered on blockchain
        const owner = await contractService.getFileOwner(file.hash);
        console.log('File owner:', owner);
        
        const isRegistered = owner && owner !== '0x0000000000000000000000000000000000000000';
        registrationMap.set(file.hash, isRegistered);
        
        if (isRegistered) {
          const hasAccess = await contractService.checkFileAccess(file.hash, account);
          const isOwner = owner.toLowerCase() === account.toLowerCase();
          accessMap.set(file.hash, hasAccess || isOwner);
          console.log(`File ${file.hash}: owner=${owner}, isOwner=${isOwner}, hasAccess=${hasAccess}`);
        } else {
          // File not registered, no blockchain access control
          accessMap.set(file.hash, false);
          console.log(`File ${file.hash}: not registered`);
        }
        
        loadingMap.set(file.hash, false);
        setLoadingStatus(new Map(loadingMap));
        
      } catch (error) {
        console.error('Error checking access for file:', file.hash, error);
        // If contract call fails, assume file is not registered
        registrationMap.set(file.hash, false);
        accessMap.set(file.hash, false);
        loadingMap.set(file.hash, false);
        setLoadingStatus(new Map(loadingMap));
      }
    }
    
    console.log('Registration status:', registrationMap);
    console.log('Access status:', accessMap);
    
    setRegistrationStatus(registrationMap);
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
    if (!account && isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to download files",
        variant: "destructive",
      });
      return;
    }

    const hasAccess = fileAccess.get(file.hash);
    const isRegistered = registrationStatus.get(file.hash);
    
    if (isConnected && isRegistered && !hasAccess) {
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

      // Log access history
      const { data: dbFile } = await supabase
        .from('files')
        .select('id')
        .eq('ipfs_cid', file.hash)
        .maybeSingle();

      if (dbFile && account) {
        const { data: user } = await supabase.auth.getUser();
        await supabase.from('file_access_history').insert({
          file_id: dbFile.id,
          user_address: account.toLowerCase(),
          user_id: user.user?.id,
          access_type: 'download',
        });
      }

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

  const openInGateway = async (file: IPFSFile) => {
    const hasAccess = fileAccess.get(file.hash);
    const isRegistered = registrationStatus.get(file.hash);
    
    if (isConnected && isRegistered && !hasAccess) {
      toast({
        title: "Access denied",
        description: "You don't have permission to view this file",
        variant: "destructive",
      });
      return;
    }

    // Log access history
    if (account) {
      const { data: dbFile } = await supabase
        .from('files')
        .select('id')
        .eq('ipfs_cid', file.hash)
        .maybeSingle();

      if (dbFile) {
        const { data: user } = await supabase.auth.getUser();
        await supabase.from('file_access_history').insert({
          file_id: dbFile.id,
          user_address: account.toLowerCase(),
          user_id: user.user?.id,
          access_type: 'view',
        });
      }
    }

    const url = ipfsService.getFileUrl(file.hash);
    window.open(url, '_blank');
  };

  const handleRegisterFile = async (file: IPFSFile) => {
    if (!account || !isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register files",
        variant: "destructive",
      });
      return;
    }

    setRegisteringFiles(prev => new Set(prev).add(file.hash));
    
    try {
      console.log('Registering file:', file.hash);
      
      toast({
        title: "Registering file...",
        description: "Please confirm the transaction in your wallet",
      });

      await contractService.registerFile(file.hash, account);
      
      // Update the registration status immediately for better UX
      setRegistrationStatus(prev => new Map(prev).set(file.hash, true));
      setFileAccess(prev => new Map(prev).set(file.hash, true));
      
      // Wait a shorter time for the transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the file access status
      await checkFileAccess();
      
      // Notify parent component if callback provided
      onFileRegistered?.();
      
      toast({
        title: "File registered!",
        description: "File has been registered on the blockchain for secure access control",
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Reset the optimistic update on error
      setRegistrationStatus(prev => new Map(prev).set(file.hash, false));
      setFileAccess(prev => new Map(prev).set(file.hash, false));
      
      toast({
        title: "Registration failed",
        description: "Could not register file on blockchain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegisteringFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.hash);
        return newSet;
      });
    }
  };

  const handleUnregisterFile = async (file: IPFSFile) => {
    if (!account || !isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to unregister files",
        variant: "destructive",
      });
      return;
    }

    setUnregisteringFiles(prev => new Set(prev).add(file.hash));
    
    try {
      toast({
        title: "Note",
        description: "File unregistration is not implemented in the current contract. This would require a new contract method.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Unregistration error:', error);
      toast({
        title: "Unregistration failed",
        description: "Could not unregister file from blockchain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUnregisteringFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.hash);
        return newSet;
      });
    }
  };

  const displayFiles = viewMode === 'my-files' ? files : sharedFiles;
  const isEmpty = displayFiles.length === 0;

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <HardDrive className="h-5 w-5" />
                Secure File Manager
              </CardTitle>
              <CardDescription>
                {viewMode === 'my-files' 
                  ? `${files.length} file${files.length !== 1 ? 's' : ''} stored on IPFS` 
                  : `${sharedFiles.length} file${sharedFiles.length !== 1 ? 's' : ''} shared with you`}
              </CardDescription>
            </div>
          </div>
          
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-files">
                <HardDrive className="h-4 w-4 mr-2" />
                My Files
              </TabsTrigger>
              <TabsTrigger value="shared-with-me">
                <Users className="h-4 w-4 mr-2" />
                Shared With Me
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSharedFiles && viewMode === 'shared-with-me' ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading shared files...</p>
            </div>
          ) : isEmpty ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">
                {viewMode === 'my-files' 
                  ? 'No files uploaded yet' 
                  : 'No files shared with you yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'my-files' 
                  ? 'Upload your first file to get started' 
                  : 'Files that others share with your wallet will appear here'}
              </p>
            </div>
          ) : (
            displayFiles.map((file, index) => {
            const hasAccess = fileAccess.get(file.hash);
            const isRegistered = registrationStatus.get(file.hash);
            const isLoading = loadingStatus.get(file.hash);
            const isRegistering = registeringFiles.has(file.hash);
            const isUnregistering = unregisteringFiles.has(file.hash);
            const isOwner = isConnected && isRegistered && hasAccess;
            
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
                            {isLoading ? (
                              <Badge className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/50">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Checking...
                              </Badge>
                            ) : isRegistered ? (
                              hasAccess ? (
                                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/50">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Registered & Authorized
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/50">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Registered - No Access
                                </Badge>
                              )
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
                      {/* Show Register/Unregister button for wallet-connected users */}
                      {isConnected && !isLoading && (
                        <>
                          {!isRegistered ? (
                            <Button
                              size="sm"
                              onClick={() => handleRegisterFile(file)}
                              disabled={isRegistering}
                              className="cosmic-gradient text-xs"
                            >
                              {isRegistering ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Shield className="h-3 w-3 mr-1" />
                              )}
                              {isRegistering ? 'Registering...' : 'Register'}
                            </Button>
                          ) : hasAccess && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnregisterFile(file)}
                              disabled={isUnregistering}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                            >
                              {isUnregistering ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <UserMinus className="h-3 w-3 mr-1" />
                              )}
                              {isUnregistering ? 'Unregistering...' : 'Unregister'}
                            </Button>
                          )}
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSecureDownload(file)}
                        disabled={downloadingFiles.has(file.hash) || (isConnected && isRegistered && !hasAccess)}
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInGateway(file)}
                        disabled={isConnected && isRegistered && !hasAccess}
                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      
                      {/* Show Share button for registered files that user owns */}
                      {isConnected && isRegistered && hasAccess && !isLoading && (
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
                  
                  {/* Advanced File Sharing Panel */}
                  {sharingFile === file.hash && isConnected && isRegistered && hasAccess && (
                    <div className="mt-4">
                      <AdvancedFileSharing 
                        file={file} 
                        onAccessUpdated={() => checkFileAccess()}
                      />
                    </div>
                  )}
                </div>
                
                {index < files.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileManager;
