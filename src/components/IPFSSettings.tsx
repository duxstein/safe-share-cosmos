import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Cloud, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { ipfsService } from '@/services/ipfsService';
import { Button } from '@/components/ui/button';

const IPFSSettings: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const status = await ipfsService.checkServiceStatus();
      setIsConfigured(status.configured);
      setError(status.error || null);
    } catch (err: any) {
      setIsConfigured(false);
      setError(err?.message || 'Failed to check IPFS configuration');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="glass-card border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Cloud className="h-5 w-5" />
          IPFS Configuration
        </CardTitle>
        <CardDescription>
          Decentralized file storage settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChecking ? (
          <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <div>
              <p className="font-medium text-blue-400">Checking IPFS Configuration...</p>
              <p className="text-sm text-muted-foreground">
                Verifying Pinata API keys and service status
              </p>
            </div>
          </div>
        ) : isConfigured ? (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-400">IPFS Storage Configured</p>
              <p className="text-sm text-muted-foreground">
                Files are stored on IPFS via Pinata for decentralized, permanent storage.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="font-medium text-red-400">IPFS Service Not Configured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error || 'Pinata API keys are missing. IPFS uploads will not work until configured.'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-400 mb-2">Setup Instructions:</p>
              {error?.includes('not deployed') ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    The edge function needs to be deployed first. Run these commands:
                  </p>
                  <div className="bg-black/30 p-3 rounded font-mono text-xs space-y-1">
                    <div className="text-cyan-400"># Install Supabase CLI (if needed)</div>
                    <div className="text-gray-300">npm install -g supabase</div>
                    <div className="text-cyan-400 mt-2"># Login to Supabase</div>
                    <div className="text-gray-300">supabase login</div>
                    <div className="text-cyan-400 mt-2"># Link your project</div>
                    <div className="text-gray-300">supabase link --project-ref broqzhrkmjvjzatiwhvp</div>
                    <div className="text-cyan-400 mt-2"># Deploy the function</div>
                    <div className="text-gray-300">supabase functions deploy ipfs-upload</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    See <code className="bg-black/20 px-1 rounded">DEPLOY_EDGE_FUNCTION.md</code> for detailed instructions.
                  </p>
                </div>
              ) : (
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Get your Pinata API keys from <a href="https://app.pinata.cloud/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">Pinata Dashboard <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Settings → Edge Functions → Secrets</li>
                  <li>Add <code className="bg-black/20 px-1 rounded">PINATA_API_KEY</code> and <code className="bg-black/20 px-1 rounded">PINATA_SECRET_KEY</code></li>
                  <li>Deploy the <code className="bg-black/20 px-1 rounded">ipfs-upload</code> edge function (if not already deployed)</li>
                </ol>
              )}
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button
                  onClick={checkConfiguration}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Recheck Configuration
                </Button>
                <Button
                  onClick={() => window.open('https://app.pinata.cloud/', '_blank')}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Open Pinata Dashboard
                </Button>
                {error?.includes('not deployed') && (
                  <Button
                    onClick={() => window.open('https://app.supabase.com/project/broqzhrkmjvjzatiwhvp/functions', '_blank')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Open Supabase Functions
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {isConfigured && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Files are pinned to IPFS for permanent availability</p>
            <p>• Multiple gateways ensure reliable access</p>
            <p>• Content-addressed storage ensures data integrity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IPFSSettings;
