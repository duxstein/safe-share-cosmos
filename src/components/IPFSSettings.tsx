import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Cloud } from 'lucide-react';

const IPFSSettings: React.FC = () => {
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
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium text-green-400">IPFS Storage Configured</p>
            <p className="text-sm text-muted-foreground">
              Files are stored on IPFS via Pinata for decentralized, permanent storage.
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>• Files are pinned to IPFS for permanent availability</p>
          <p>• Multiple gateways ensure reliable access</p>
          <p>• Content-addressed storage ensures data integrity</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IPFSSettings;
