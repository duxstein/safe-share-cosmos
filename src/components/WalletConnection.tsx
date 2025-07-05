
import React from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const WalletConnection: React.FC = () => {
  const { account, isConnected, isLoading, error, connectWallet, disconnectWallet } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <Card className="glass-card neon-glow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            Connected to {formatAddress(account)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={disconnectWallet}
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-purple-500/50">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-purple-400">
          <Wallet className="h-6 w-6" />
          Connect Your Wallet
        </CardTitle>
        <CardDescription>
          Connect your MetaMask wallet to access the secure file sharing platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        
        <Button 
          onClick={connectWallet}
          disabled={isLoading}
          className="w-full cosmic-gradient hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect MetaMask
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Don't have MetaMask? <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Download here</a>
        </p>
      </CardContent>
    </Card>
  );
};

export default WalletConnection;
