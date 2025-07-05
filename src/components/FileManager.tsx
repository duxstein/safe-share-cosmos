
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { File, Download, ExternalLink, Clock, Hash, HardDrive } from 'lucide-react';
import { IPFSFile, ipfsService } from '@/services/ipfsService';

interface FileManagerProps {
  files: IPFSFile[];
}

const FileManager: React.FC<FileManagerProps> = ({ files }) => {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

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

  const handleDownload = async (file: IPFSFile) => {
    setDownloadingFiles(prev => new Set(prev).add(file.hash));
    
    try {
      const url = ipfsService.getFileUrl(file.hash);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.target = '_blank';
      link.click();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.hash);
        return newSet;
      });
    }
  };

  const openInGateway = (file: IPFSFile) => {
    const url = ipfsService.getFileUrl(file.hash);
    window.open(url, '_blank');
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
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <HardDrive className="h-5 w-5" />
          File Manager
        </CardTitle>
        <CardDescription>
          {files.length} file{files.length !== 1 ? 's' : ''} stored on IPFS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.map((file, index) => (
          <div key={file.hash}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="font-medium truncate">{file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {file.type || 'Unknown'}
                    </Badge>
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
                
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFiles.has(file.hash)}
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
                </div>
              </div>
            </div>
            
            {index < files.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FileManager;
