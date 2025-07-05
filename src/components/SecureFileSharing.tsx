
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Share2, UserCheck, UserX, Shield, Copy, Check } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { contractService } from '@/services/contractService';
import { useToast } from '@/hooks/use-toast';
import { IPFSFile } from '@/services/ipfsService';

interface SecureFileSharingProps {
  file: IPFSFile;
  onAccessUpdated?: () => void;
}

const SecureFileSharing: React.FC<SecureFileSharingProps> = ({ file, onAccessUpdated }) => {
  const { web3, account, isConnected } = useWeb3();
  const [newUserAddress, setNewUserAddress] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (web3 && account) {
      contractService.initialize(web3);
      loadFilePermissions();
    }
  }, [web3, account, file.hash]);

  const loadFilePermissions = async () => {
    if (!account) return;

    try {
      const owner = await contractService.getFileOwner(file.hash);
      const users = await contractService.getAuthorizedUsers(file.hash);
      
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      setAuthorizedUsers(users);
    } catch (error) {
      console.error('Error loading file permissions:', error);
    }
  };

  const handleGrantAccess = async () => {
    if (!account || !newUserAddress.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await contractService.grantFileAccess(file.hash, newUserAddress.trim(), account);
      setNewUserAddress('');
      await loadFilePermissions();
      onAccessUpdated?.();
      
      toast({
        title: "Access granted!",
        description: `User ${newUserAddress.slice(0, 6)}...${newUserAddress.slice(-4)} can now access this file`,
      });
    } catch (error) {
      toast({
        title: "Failed to grant access",
        description: "Please try again or check the wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (userAddress: string) => {
    if (!account) return;

    setIsLoading(true);
    try {
      await contractService.revokeFileAccess(file.hash, userAddress, account);
      await loadFilePermissions();
      onAccessUpdated?.();
      
      toast({
        title: "Access revoked",
        description: `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)} no longer has access`,
      });
    } catch (error) {
      toast({
        title: "Failed to revoke access",
        description: "Please try again or check the wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyFileHash = async () => {
    try {
      await navigator.clipboard.writeText(file.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "File hash copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the hash manually",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <Shield className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400">Connect your wallet to manage file permissions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-green-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Share2 className="h-5 w-5" />
          Secure File Sharing
        </CardTitle>
        <CardDescription>
          Manage blockchain-based access control for: {file.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Info */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">File Hash (IPFS)</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-black/20 rounded text-xs font-mono break-all">
              {file.hash}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={copyFileHash}
              className="border-gray-500/50"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Access Control - Only show if user is owner */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <Label className="text-green-400">You own this file</Label>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="user-address">Grant Access to New User</Label>
              <div className="flex gap-2">
                <Input
                  id="user-address"
                  placeholder="0x742d35Cc6634C0532925a3b8D7389Cd64E6b1A8D"
                  value={newUserAddress}
                  onChange={(e) => setNewUserAddress(e.target.value)}
                  className="bg-black/20"
                />
                <Button
                  onClick={handleGrantAccess}
                  disabled={isLoading || !newUserAddress.trim()}
                  className="cosmic-gradient"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Grant
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Authorized Users List */}
        {authorizedUsers.length > 0 && (
          <div className="space-y-3">
            <Label>Authorized Users ({authorizedUsers.length})</Label>
            <div className="space-y-2">
              {authorizedUsers.map((userAddress) => (
                <div key={userAddress} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-400" />
                    <code className="text-sm font-mono">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </code>
                    {userAddress.toLowerCase() === account?.toLowerCase() && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  {isOwner && userAddress.toLowerCase() !== account?.toLowerCase() && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeAccess(userAddress)}
                      disabled={isLoading}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <UserX className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isOwner && authorizedUsers.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">No access permissions found for this file</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecureFileSharing;
