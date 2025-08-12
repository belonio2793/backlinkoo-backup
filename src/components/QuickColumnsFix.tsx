import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function QuickColumnsFix() {
  const [copied, setCopied] = useState(false);

  const sqlFix = `-- Fix Missing Columns
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;

-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start');`;

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlFix);
      setCopied(true);
      toast.success('SQL copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  const openSupabase = () => {
    window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/templates', '_blank');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Missing Database Columns Fix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Missing columns:</strong> started_at, completed_at, auto_start
            <br />
            These columns are required for the automation system to work properly.
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
          {sqlFix}
        </div>

        <div className="flex gap-3">
          <Button onClick={copySQL} className="flex items-center gap-2">
            {copied ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy SQL'}
          </Button>
          
          <Button onClick={openSupabase} variant="outline" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Supabase
          </Button>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Quick Fix Steps:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click "Copy SQL" above</li>
              <li>Click "Open Supabase" to go to your database</li>
              <li>Navigate to SQL Editor</li>
              <li>Paste and run the SQL</li>
              <li>Refresh this page to verify the fix</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
