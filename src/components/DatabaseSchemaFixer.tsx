import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Wrench,
  Terminal
} from 'lucide-react';

interface SchemaFixResult {
  success: boolean;
  message: string;
  missingColumns?: string[];
  results?: Array<{
    column: string;
    status: string;
    message: string;
  }>;
  finalColumns?: string[];
}

const DatabaseSchemaFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<SchemaFixResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const fixSchema = async () => {
    setIsFixing(true);
    setResult(null);
    setLogs([]);
    
    addLog('Starting schema fix...');

    try {
      addLog('Calling schema fix function...');
      const response = await fetch('/.netlify/functions/fix-published-links-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog('✅ Schema fix completed successfully');
        setResult(data);
      } else {
        addLog(`❌ Schema fix failed: ${data.error}`);
        setResult({
          success: false,
          message: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Network error: ${errorMessage}`);
      setResult({
        success: false,
        message: `Network error: ${errorMessage}`
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Schema Fixer
          <Badge variant="outline" className="ml-2">
            Published Links Table
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool fixes missing columns in the automation_published_links table that prevent published links from being saved and displayed.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={fixSchema}
            disabled={isFixing}
            className="flex items-center gap-2"
          >
            {isFixing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wrench className="w-4 h-4" />
            )}
            {isFixing ? 'Fixing Schema...' : 'Fix Schema'}
          </Button>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="font-medium text-sm">Logs</span>
            </div>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-32 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
              <div className="space-y-2">
                <div className="font-medium">{result.message}</div>
                
                {result.missingColumns && result.missingColumns.length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Missing columns found:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.missingColumns.map(col => (
                        <Badge key={col} variant="outline" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.results && result.results.length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Column fix results:</div>
                    <div className="space-y-1 mt-1">
                      {result.results.map((res, index) => (
                        <div key={index} className="text-xs flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            res.status === 'success' ? 'bg-green-500' :
                            res.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="font-mono">{res.column}:</span>
                          <span>{res.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.finalColumns && (
                  <div>
                    <div className="text-sm font-medium">Final table columns:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.finalColumns.map(col => (
                        <Badge key={col} variant="secondary" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            After running the schema fix, refresh the page and try creating a new campaign to test if published links now appear correctly.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DatabaseSchemaFixer;
