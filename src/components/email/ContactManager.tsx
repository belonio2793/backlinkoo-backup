import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  Mail
} from 'lucide-react';

interface ContactManagerProps {
  onContactCountChange: (count: number) => void;
  currentCount: number;
}

interface Contact {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  status: 'valid' | 'invalid' | 'pending';
  source: string;
}

export function ContactManager({ onContactCountChange, currentCount }: ContactManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid' | 'pending'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sample template data
  const sampleContacts = [
    'email,firstName,lastName,company',
    'john.doe@example.com,John,Doe,Example Corp',
    'jane.smith@company.com,Jane,Smith,Company Inc',
    'mike.wilson@startup.io,Mike,Wilson,Startup IO',
    'sarah.jones@business.net,Sarah,Jones,Business Net'
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain a header row and at least one data row');
      }

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIndex = headers.findIndex(h => h.includes('email'));
      
      if (emailIndex === -1) {
        throw new Error('CSV must contain an email column');
      }

      const newContacts: Contact[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const email = values[emailIndex];
        
        if (email && email.includes('@')) {
          newContacts.push({
            email,
            firstName: values[headers.findIndex(h => h.includes('first'))] || '',
            lastName: values[headers.findIndex(h => h.includes('last'))] || '',
            company: values[headers.findIndex(h => h.includes('company'))] || '',
            status: 'pending',
            source: file.name
          });
        }
      }

      setContacts(prev => [...prev, ...newContacts]);
      onContactCountChange(contacts.length + newContacts.length);

      toast({
        title: 'Upload Successful',
        description: `Imported ${newContacts.length} contacts from ${file.name}`,
      });

      // Auto-validate after upload
      setTimeout(() => validateEmails(newContacts), 1000);

    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process CSV file',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const validateEmails = async (contactsToValidate: Contact[] = contacts) => {
    setIsValidating(true);
    setValidationProgress(0);

    try {
      const total = contactsToValidate.length;
      const updated = [...contacts];

      for (let i = 0; i < contactsToValidate.length; i++) {
        const contact = contactsToValidate[i];
        
        // Simulate email validation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mock validation logic
        const isValid = contact.email.includes('@') && 
                        contact.email.includes('.') && 
                        !contact.email.includes('invalid') &&
                        Math.random() > 0.2; // 80% success rate
        
        const contactIndex = updated.findIndex(c => 
          c.email === contact.email && c.source === contact.source
        );
        
        if (contactIndex !== -1) {
          updated[contactIndex].status = isValid ? 'valid' : 'invalid';
        }
        
        setValidationProgress(Math.round(((i + 1) / total) * 100));
      }

      setContacts(updated);
      
      const validCount = updated.filter(c => c.status === 'valid').length;
      const invalidCount = updated.filter(c => c.status === 'invalid').length;
      
      toast({
        title: 'Validation Complete',
        description: `${validCount} valid, ${invalidCount} invalid emails found.`,
      });

    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: 'Failed to validate email addresses',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
      setValidationProgress(0);
    }
  };

  const downloadTemplate = () => {
    const csvContent = sampleContacts.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contact-template.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded to your computer.',
    });
  };

  const clearContacts = () => {
    setContacts([]);
    onContactCountChange(0);
    toast({
      title: 'Contacts Cleared',
      description: 'All contacts have been removed.',
    });
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || contact.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: contacts.length,
    valid: contacts.filter(c => c.status === 'valid').length,
    invalid: contacts.filter(c => c.status === 'invalid').length,
    pending: contacts.filter(c => c.status === 'pending').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contact Management</h2>
          <p className="text-muted-foreground">
            Upload and manage your email contact lists
          </p>
        </div>
        
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {stats.valid.toLocaleString()} valid contacts
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valid Emails</p>
                <p className="text-2xl font-bold text-green-600">{stats.valid.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invalid Emails</p>
                <p className="text-2xl font-bold text-red-600">{stats.invalid.toLocaleString()}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending.toLocaleString()}</p>
              </div>
              <Loader2 className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium">Upload CSV File</p>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with email addresses and contact information
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading contacts...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {isValidating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Validating email addresses...</span>
                <span>{validationProgress}%</span>
              </div>
              <Progress value={validationProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact List
            </CardTitle>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => validateEmails()}
                disabled={isValidating || contacts.length === 0}
                size="sm"
              >
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Validate All
              </Button>
              
              <Button
                variant="outline"
                onClick={clearContacts}
                disabled={contacts.length === 0}
                size="sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Contacts Table */}
          {filteredContacts.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Company</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact, index) => (
                      <tr key={`${contact.email}-${contact.source}-${index}`} className="border-t">
                        <td className="p-3 font-mono text-sm">{contact.email}</td>
                        <td className="p-3">
                          {contact.firstName || contact.lastName ? 
                            `${contact.firstName} ${contact.lastName}`.trim() : 
                            '-'
                          }
                        </td>
                        <td className="p-3">{contact.company || '-'}</td>
                        <td className="p-3">
                          <Badge 
                            variant={contact.status === 'valid' ? 'default' : 
                                   contact.status === 'invalid' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {contact.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{contact.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No contacts found</p>
              <p className="text-sm text-muted-foreground">
                {contacts.length === 0 ? 'Upload a CSV file to get started' : 'Try adjusting your search or filter'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
