import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface OrganizationMember {
  id: string;
  name: string;
  employee_id: string;
  department?: string;
  email?: string;
  wallet_address?: string;
  created_at: string;
}

export const OrganizationManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadMembers();
    }
  }, [user]);

  const loadMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Error loading members",
        description: "Failed to load organization members",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const membersToInsert = results.data.map((row: any) => ({
            user_id: user.id,
            name: row.name || row.Name || '',
            employee_id: row.employee_id || row['Employee ID'] || row.id || '',
            department: row.department || row.Department || null,
            email: row.email || row.Email || null,
            wallet_address: row.wallet_address || row['Wallet Address'] || null,
          }));

          const { error } = await supabase
            .from('organization_members')
            .upsert(membersToInsert, {
              onConflict: 'user_id,employee_id',
              ignoreDuplicates: false,
            });

          if (error) throw error;

          await loadMembers();
          toast({
            title: "Success!",
            description: `Imported ${membersToInsert.length} members`,
          });
        } catch (error: any) {
          console.error('Error importing members:', error);
          toast({
            title: "Import failed",
            description: error.message || "Failed to import members",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          event.target.value = '';
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: "Invalid CSV",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
        setIsLoading(false);
        event.target.value = '';
      },
    });
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await loadMembers();
      toast({
        title: "Member removed",
        description: "Organization member has been deleted",
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const template = 'name,employee_id,department,email,wallet_address\nJohn Doe,EMP001,Engineering,john@example.com,0x742d35Cc6634C0532925a3b8D7389Cd64E6b1A8D\nJane Smith,EMP002,Marketing,jane@example.com,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organization_members_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Organization Members
        </CardTitle>
        <CardDescription>
          Import and manage your organization members for easy access control
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                  <Upload className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Upload CSV File</p>
                    <p className="text-xs text-muted-foreground">
                      Click to select a CSV file with member data
                    </p>
                  </div>
                </div>
              </Label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
            </div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="self-start mt-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>

          {members.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Imported Members</Label>
                <Badge variant="secondary">{members.length} members</Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {member.employee_id}
                          </code>
                        </TableCell>
                        <TableCell>{member.department || '-'}</TableCell>
                        <TableCell className="text-sm">{member.email || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {members.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No members imported yet</p>
              <p className="text-xs">Upload a CSV file to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
