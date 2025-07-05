
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Key, ExternalLink } from 'lucide-react';
import { ipfsService } from '@/services/ipfsService';
import { useToast } from '@/hooks/use-toast';

const IPFSSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(ipfsService.isPinataConfigured());
  const { toast } = useToast();

  const handleSaveCredentials = () => {
    if (!apiKey.trim() || !secretKey.trim()) {
      toast({
        title: "Invalid credentials",
        description: "Please enter both API key and secret key",
        variant: "destructive",
      });
      return;
    }

    ipfsService.setPinataCredentials(apiKey.trim(), secretKey.trim());
    setIsConfigured(true);
    setApiKey('');
    setSecretKey('');

    toast({
      title: "Credentials saved!",
      description: "Pinata IPFS service is now configured",
    });
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('pinata_api_key');
    localStorage.removeItem('pinata_secret_key');
    setIsConfigured(false);
    
    toast({
      title: "Credentials cleared",
      description: "Pinata credentials have been removed",
    });
  };

  return (
    <Card className="glass-card border-purple-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <Settings className="h-5 w-5" />
          IPFS Configuration
        </CardTitle>
        <CardDescription>
          Configure Pinata credentials for reliable IPFS uploads. 
          Without these, the app will use fallback methods with limited functionality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-green-400 text-sm">✓ Pinata IPFS service is configured</p>
            </div>
            <Button 
              onClick={handleClearCredentials}
              variant="outline"
              className="w-full"
            >
              Clear Credentials
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm">⚠ Using fallback IPFS methods (limited functionality)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-purple-300">Pinata API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Pinata API key"
                className="bg-black/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secret-key" className="text-purple-300">Pinata Secret Key</Label>
              <Input
                id="secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter your Pinata secret key"
                className="bg-black/20"
              />
            </div>
            
            <Button 
              onClick={handleSaveCredentials}
              className="w-full cosmic-gradient"
            >
              <Key className="mr-2 h-4 w-4" />
              Save Credentials
            </Button>
            
            <div className="text-center">
              <a 
                href="https://pinata.cloud/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
              >
                Get Pinata API keys <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IPFSSettings;
