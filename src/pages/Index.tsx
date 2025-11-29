
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Web3Provider } from '@/contexts/Web3Context';
import WalletConnection from '@/components/WalletConnection';
import FileUpload from '@/components/FileUpload';
import FileManager from '@/components/FileManager';
import IPFSSettings from '@/components/IPFSSettings';
import { OrganizationManager } from '@/components/OrganizationManager';
import { Button } from '@/components/ui/button';
import { IPFSFile } from '@/services/ipfsService';
import { Shield, Globe, Lock, LogOut } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<IPFSFile[]>([]);
  const [viewMode, setViewMode] = useState<'my-files' | 'shared-with-me'>('my-files');

  const handleFileUploaded = (file: IPFSFile) => {
    setUploadedFiles(prev => [file, ...prev]);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Web3Provider>
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg cosmic-gradient">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    BlockVault
                  </h1>
                  <p className="text-sm text-muted-foreground">Decentralized File Sharing</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span>IPFS</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-4 w-4 text-purple-400" />
                  <span>Ethereum</span>
                </div>
                {user && (
                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
                    <span className="text-xs">
                      {user.email}
                    </span>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Secure. Decentralized. Yours.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Share files securely using IPFS and Ethereum smart contracts. 
                Your data, your control, your ownership.
              </p>
            </div>

            {/* Wallet Connection */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <WalletConnection />
              </div>
            </div>

            {/* IPFS Configuration */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <IPFSSettings />
              </div>
            </div>

            {/* File Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <FileUpload onFileUploaded={handleFileUploaded} />
              </div>
              <div>
                <FileManager 
                  files={uploadedFiles} 
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>
            </div>

            {/* Organization Management */}
            <div className="mt-8">
              <OrganizationManager />
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="glass-card p-6 text-center">
                <div className="p-3 rounded-full bg-purple-500/20 w-fit mx-auto mb-4">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
                <p className="text-sm text-muted-foreground">
                  Smart contract-based authentication ensures only authorized users can access your files.
                </p>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="p-3 rounded-full bg-blue-500/20 w-fit mx-auto mb-4">
                  <Globe className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Decentralized Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Files are stored on IPFS, ensuring they're always available and censorship-resistant.
                </p>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="p-3 rounded-full bg-cyan-500/20 w-fit mx-auto mb-4">
                  <Lock className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">True Ownership</h3>
                <p className="text-sm text-muted-foreground">
                  Your wallet, your files. No central authority can access or remove your data.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-16">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Built with React, IPFS, and Ethereum • Powered by Web3</p>
            </div>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
};

export default Index;
