
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Share2, 
  UserCheck, 
  UserX, 
  Shield, 
  Copy, 
  Check, 
  Ban, 
  CheckCircle,
  Settings,
  Users,
  UserMinus,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useAuth } from '@/contexts/AuthContext';
import { contractService } from '@/services/contractService';
import { useToast } from '@/hooks/use-toast';
import { IPFSFile } from '@/services/ipfsService';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationMember } from './OrganizationManager';

interface AdvancedFileSharingProps {
  file: IPFSFile;
  onAccessUpdated?: () => void;
}

const AdvancedFileSharing: React.FC<AdvancedFileSharingProps> = ({ file, onAccessUpdated }) => {
  const { web3, account, isConnected } = useWeb3();
  const { user } = useAuth();
  const [newUserAddress, setNewUserAddress] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [blacklistedUsers, setBlacklistedUsers] = useState<string[]>([]);
  const [whitelistedUsers, setWhitelistedUsers] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isWhitelistMode, setIsWhitelistMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('access');
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (web3 && account) {
      contractService.initialize(web3);
      loadFilePermissions();
    }
  }, [web3, account, file.hash]);

  useEffect(() => {
    if (user) {
      loadOrgMembers();
    }
  }, [user]);

  const loadFilePermissions = async () => {
    if (!account) return;

    try {
      const [owner, users, blacklisted, whitelisted, whitelistMode] = await Promise.all([
        contractService.getFileOwner(file.hash),
        contractService.getAuthorizedUsers(file.hash),
        contractService.getBlacklistedUsers(file.hash),
        contractService.getWhitelistedUsers(file.hash),
        contractService.isWhitelistModeEnabled(file.hash)
      ]);
      
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      setAuthorizedUsers(users);
      setBlacklistedUsers(blacklisted);
      setWhitelistedUsers(whitelisted);
      setIsWhitelistMode(whitelistMode);
    } catch (error) {
      console.error('Error loading file permissions:', error);
    }
  };

  const loadOrgMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setOrgMembers(data || []);
    } catch (error) {
      console.error('Error loading organization members:', error);
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
      
      // Sync to database
      if (user) {
        const { data: dbFile } = await supabase
          .from('files')
          .select('id')
          .eq('ipfs_cid', file.hash)
          .single();

        if (dbFile) {
          await supabase.from('file_access').insert({
            file_id: dbFile.id,
            user_address: newUserAddress.trim().toLowerCase(),
            access_type: 'authorized',
            granted_by: user.id,
          });
        }
      }
      
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
      
      // Sync to database
      if (user) {
        const { data: dbFile } = await supabase
          .from('files')
          .select('id')
          .eq('ipfs_cid', file.hash)
          .single();

        if (dbFile) {
          await supabase
            .from('file_access')
            .update({ is_active: false, revoked_at: new Date().toISOString() })
            .eq('file_id', dbFile.id)
            .eq('user_address', userAddress.toLowerCase())
            .eq('access_type', 'authorized');
        }
      }
      
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

  const handleBlacklistUser = async () => {
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
      await contractService.addToBlacklist(file.hash, newUserAddress.trim(), account);
      setNewUserAddress('');
      await loadFilePermissions();
      onAccessUpdated?.();
      
      toast({
        title: "User blacklisted",
        description: `User ${newUserAddress.slice(0, 6)}...${newUserAddress.slice(-4)} has been blacklisted`,
      });
    } catch (error) {
      toast({
        title: "Failed to blacklist user",
        description: "Please try again or check the wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromBlacklist = async (userAddress: string) => {
    if (!account) return;

    setIsLoading(true);
    try {
      await contractService.removeFromBlacklist(file.hash, userAddress, account);
      await loadFilePermissions();
      onAccessUpdated?.();
      
      toast({
        title: "User removed from blacklist",
        description: `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)} can now request access again`,
      });
    } catch (error) {
      toast({
        title: "Failed to remove from blacklist",
        description: "Please try again or check the wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhitelistUser = async () => {
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
      await contractService.addToWhitelist(file.hash, newUserAddress.trim(), account);
      setNewUserAddress('');
      await loadFilePermissions();
      onAccessUpdated?.();
      
      toast({
        title: "User whitelisted",
        description: `User ${newUserAddress.slice(0, 6)}...${newUserAddress.slice(-4)} has been added to whitelist`,
      });
    } catch (error) {
      toast({
        title: "Failed to whitelist user",
        description: "Please try again or check the wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWhitelist = async (userAddress: string) => {
    if (!account) return;

    setIsLoading(true);
    try {
      await contractService.removeFromWhitelist(file.hash, userAddress, account);
      await loadFilePermissions();
      onAccessUpdated?.();
      
      toast({
        title: "User removed from whitelist",
        description: `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)} removed from whitelist`,
      });
    } catch (error) {
      toast({
        title: "Failed to remove from whitelist",
        description: "Please try again or check the wallet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWhitelistMode = async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      await contractService.toggleWhitelistMode(file.hash, account);
      await loadFilePermissions();
      onAccessUpdated?.();
      
      toast({
        title: "Whitelist mode toggled",
        description: `Whitelist mode is now ${!isWhitelistMode ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Failed to toggle whitelist mode",
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

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleGrantAccessToSelected = async () => {
    if (selectedMembers.size === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    const selectedMembersList = orgMembers.filter(m => selectedMembers.has(m.id));

    for (const member of selectedMembersList) {
      if (!member.wallet_address) {
        failCount++;
        continue;
      }

      try {
        await contractService.grantFileAccess(file.hash, member.wallet_address, account!);
        
        // Sync to database
        if (user) {
          const { data: dbFile } = await supabase
            .from('files')
            .select('id')
            .eq('ipfs_cid', file.hash)
            .maybeSingle();

          if (dbFile) {
            await supabase.from('file_access').insert({
              file_id: dbFile.id,
              user_address: member.wallet_address.toLowerCase(),
              access_type: 'authorized',
              granted_by: user.id,
            });
          }
        }
        
        successCount++;
      } catch (error) {
        console.error(`Failed to grant access to ${member.name}:`, error);
        failCount++;
      }
    }

    await loadFilePermissions();
    onAccessUpdated?.();
    setSelectedMembers(new Set());
    setIsLoading(false);

    toast({
      title: "Access granted",
      description: `Successfully granted access to ${successCount} member(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`,
      variant: failCount > 0 ? "destructive" : "default",
    });
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
          Advanced File Sharing
        </CardTitle>
        <CardDescription>
          Manage blockchain-based access control with blacklist/whitelist for: {file.name}
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

        {/* Owner Status and Whitelist Mode */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <Label className="text-green-400">You own this file</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Whitelist Mode:</Label>
                <Button
                  size="sm"
                  variant={isWhitelistMode ? "default" : "outline"}
                  onClick={handleToggleWhitelistMode}
                  disabled={isLoading}
                  className={isWhitelistMode ? "cosmic-gradient" : ""}
                >
                  {isWhitelistMode ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
            
            {isWhitelistMode && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">Whitelist Mode Active</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only whitelisted users can access this file. Regular access grants are ignored.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tabs for different management sections */}
        {isOwner && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="access">
                <Users className="h-4 w-4 mr-1" />
                Access
              </TabsTrigger>
              <TabsTrigger value="organization">
                <Building2 className="h-4 w-4 mr-1" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="whitelist">
                <CheckCircle className="h-4 w-4 mr-1" />
                Whitelist
              </TabsTrigger>
              <TabsTrigger value="blacklist">
                <Ban className="h-4 w-4 mr-1" />
                Blacklist
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="access" className="space-y-4">
              <div className="space-y-3">
                <Label>Grant Access to New User</Label>
                <div className="flex gap-2">
                  <Input
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
                        {userAddress.toLowerCase() !== account?.toLowerCase() && (
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
            </TabsContent>

            <TabsContent value="organization" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Organization Members</Label>
                  <Badge variant="secondary">{selectedMembers.size} selected</Badge>
                </div>

                {orgMembers.length > 0 ? (
                  <>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-2">
                      {orgMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={selectedMembers.has(member.id)}
                              onCheckedChange={() => handleToggleMember(member.id)}
                              disabled={!member.wallet_address}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{member.name}</p>
                              <div className="flex gap-2 mt-1">
                                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                  {member.employee_id}
                                </code>
                                {member.department && (
                                  <Badge variant="outline" className="text-xs">
                                    {member.department}
                                  </Badge>
                                )}
                                {member.wallet_address && (
                                  <code className="text-xs text-muted-foreground">
                                    {member.wallet_address.slice(0, 6)}...{member.wallet_address.slice(-4)}
                                  </code>
                                )}
                              </div>
                              {!member.wallet_address && (
                                <p className="text-xs text-yellow-500 mt-1">
                                  No wallet address
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleGrantAccessToSelected}
                      disabled={isLoading || selectedMembers.size === 0}
                      className="w-full cosmic-gradient"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Grant Access to Selected ({selectedMembers.size})
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No organization members found</p>
                    <p className="text-xs mt-1">
                      Go to Settings to import organization members
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="whitelist" className="space-y-4">
              <div className="space-y-3">
                <Label>Add User to Whitelist</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0x742d35Cc6634C0532925a3b8D7389Cd64E6b1A8D"
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                    className="bg-black/20"
                  />
                  <Button
                    onClick={handleWhitelistUser}
                    disabled={isLoading || !newUserAddress.trim()}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Whitelist
                  </Button>
                </div>
              </div>

              {/* Whitelisted Users List */}
              {whitelistedUsers.length > 0 && (
                <div className="space-y-3">
                  <Label>Whitelisted Users ({whitelistedUsers.length})</Label>
                  <div className="space-y-2">
                    {whitelistedUsers.map((userAddress) => (
                      <div key={userAddress} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <code className="text-sm font-mono">
                            {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                          </code>
                          {userAddress.toLowerCase() === account?.toLowerCase() && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                        {userAddress.toLowerCase() !== account?.toLowerCase() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromWhitelist(userAddress)}
                            disabled={isLoading}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="blacklist" className="space-y-4">
              <div className="space-y-3">
                <Label>Add User to Blacklist</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0x742d35Cc6634C0532925a3b8D7389Cd64E6b1A8D"
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                    className="bg-black/20"
                  />
                  <Button
                    onClick={handleBlacklistUser}
                    disabled={isLoading || !newUserAddress.trim()}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Blacklist
                  </Button>
                </div>
              </div>

              {/* Blacklisted Users List */}
              {blacklistedUsers.length > 0 && (
                <div className="space-y-3">
                  <Label>Blacklisted Users ({blacklistedUsers.length})</Label>
                  <div className="space-y-2">
                    {blacklistedUsers.map((userAddress) => (
                      <div key={userAddress} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Ban className="h-4 w-4 text-red-400" />
                          <code className="text-sm font-mono">
                            {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFromBlacklist(userAddress)}
                          disabled={isLoading}
                          className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-black/20 rounded-lg space-y-3">
                  <Label className="text-base font-medium">Access Control Mode</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Whitelist Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Only whitelisted users can access the file
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isWhitelistMode ? "default" : "outline"}
                        onClick={handleToggleWhitelistMode}
                        disabled={isLoading}
                        className={isWhitelistMode ? "cosmic-gradient" : ""}
                      >
                        {isWhitelistMode ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/20 rounded-lg space-y-3">
                  <Label className="text-base font-medium">Statistics</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{authorizedUsers.length}</div>
                      <div className="text-sm text-muted-foreground">Authorized</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{whitelistedUsers.length}</div>
                      <div className="text-sm text-muted-foreground">Whitelisted</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-red-400">{blacklistedUsers.length}</div>
                      <div className="text-sm text-muted-foreground">Blacklisted</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">
                        {isWhitelistMode ? "Strict" : "Open"}
                      </div>
                      <div className="text-sm text-muted-foreground">Mode</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!isOwner && (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">
              You are {authorizedUsers.some(user => user.toLowerCase() === account?.toLowerCase()) ? 'authorized to access' : 'not authorized to access'} this file
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedFileSharing;
