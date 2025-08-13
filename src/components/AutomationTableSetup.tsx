import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Database, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { checkAutomationPostsTable, AUTOMATION_TABLE_SQL } from '@/utils/automationTableSetup';

interface AutomationTableSetupProps {
  onTableReady?: () => void;
}

export function AutomationTableSetup({ onTableReady }: AutomationTableSetupProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckTable = async () => {
    setIsChecking(true);
    try {
      const result = await checkAutomationPostsTable();
      
      if (result.exists) {
        toast.success('Database table is ready!');
        onTableReady?.();
      } else {
        toast.error('Database table not found. Setup required.');
        setShowSetupModal(true);
      }
    } catch (error) {
      toast.error('Failed to check database table');
    } finally {
      setIsChecking(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(AUTOMATION_TABLE_SQL);
    toast.success('SQL copied to clipboard!');
  };

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Database className="h-5 w-5" />
            Database Setup Required
          </CardTitle>
          <CardDescription className="text-orange-700">
            The automation_posts table needs to be created for post tracking to work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-orange-700">
            Content generation will work, but posts won't be saved to your history without the database table.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={handleCheckTable}
              variant="outline"
              size="sm"
              disabled={isChecking}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Check Table
                </>
              )}
            </Button>
            <Button 
              onClick={() => setShowSetupModal(true)}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Setup Instructions
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Table Setup
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Setup Instructions</span>
              </div>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Copy the SQL code below</li>
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Paste and run the SQL</li>
                <li>Come back and click "Check Table" to verify</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">SQL Code:</h4>
                <Button 
                  onClick={copySQL}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy SQL
                </Button>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {AUTOMATION_TABLE_SQL}
                </pre>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">What This Creates</span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• automation_posts table for storing generated content</li>
                <li>• Row Level Security (RLS) for user data protection</li>
                <li>• Indexes for optimal performance</li>
                <li>• Automated timestamp management</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCheckTable}
                disabled={isChecking}
                className="flex-1"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Check Table Status
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setShowSetupModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
