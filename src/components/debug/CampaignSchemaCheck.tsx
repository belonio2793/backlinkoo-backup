import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export function CampaignSchemaCheck() {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>('');

  const requiredColumns = [
    { name: 'links_built', type: 'integer', required: true },
    { name: 'available_sites', type: 'integer', required: true },
    { name: 'target_sites_used', type: 'ARRAY', required: true },
    { name: 'published_articles', type: 'jsonb', required: true },
    { name: 'started_at', type: 'timestamp with time zone', required: true },
    { name: 'current_platform', type: 'text', required: false },
    { name: 'execution_progress', type: 'jsonb', required: false }
  ];

  const checkSchema = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'automation_campaigns')
        .eq('table_schema', 'public');

      if (error) throw error;

      setColumns(data || []);
      setLastCheck(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('Failed to check schema:', error);
      toast.error('Failed to check database schema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSchema();
  }, []);

  const getColumnStatus = (requiredCol: typeof requiredColumns[0]) => {
    const column = columns.find(col => col.column_name === requiredCol.name);
    
    if (!column) {
      return { status: 'missing', color: 'destructive', icon: XCircle };
    }
    
    const typeMatch = column.data_type.toLowerCase().includes(requiredCol.type.toLowerCase()) ||
                     (requiredCol.type === 'ARRAY' && column.data_type === 'ARRAY');
    
    if (!typeMatch) {
      return { status: 'type_mismatch', color: 'warning', icon: AlertTriangle };
    }
    
    return { status: 'ok', color: 'success', icon: CheckCircle };
  };

  const allRequiredPresent = requiredColumns
    .filter(col => col.required)
    .every(col => {
      const status = getColumnStatus(col);
      return status.status === 'ok';
    });

  const testCampaignCreation = async () => {
    try {
      // Test if we can create a minimal campaign record
      const testData = {
        name: 'Schema Test Campaign',
        keywords: ['test'],
        anchor_texts: ['test link'],
        target_url: 'https://example.com',
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        status: 'draft',
        links_built: 0,
        available_sites: 4,
        target_sites_used: [],
        published_articles: []
      };

      const { error } = await supabase
        .from('automation_campaigns')
        .insert(testData)
        .select()
        .single();

      if (error) {
        if (error.message.includes('expected JSON array')) {
          toast.error('❌ "Expected JSON array" error still present - schema fix needed');
        } else {
          toast.error(`Schema test failed: ${error.message}`);
        }
      } else {
        toast.success('✅ Schema test passed - campaign creation should work');
        // Clean up test record
        await supabase
          .from('automation_campaigns')
          .delete()
          .eq('name', 'Schema Test Campaign');
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Schema test failed');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Campaign Schema Status
        </CardTitle>
        <CardDescription>
          Debug tool for the "Failed to create campaign: [object Object]" error
          {lastCheck && <span className="block text-xs mt-1">Last checked: {lastCheck}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={checkSchema}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Schema
          </Button>
          
          <Button
            onClick={testCampaignCreation}
            disabled={!allRequiredPresent}
            size="sm"
            variant="outline"
          >
            Test Campaign Creation
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Required Columns Status</h4>
          <div className="grid gap-2">
            {requiredColumns.map((requiredCol) => {
              const status = getColumnStatus(requiredCol);
              const StatusIcon = status.icon;
              
              return (
                <div key={requiredCol.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${
                      status.status === 'ok' ? 'text-green-500' : 
                      status.status === 'missing' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <span className="font-mono text-sm">{requiredCol.name}</span>
                    <span className="text-xs text-gray-500">({requiredCol.type})</span>
                  </div>
                  <Badge 
                    variant={status.status === 'ok' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {status.status === 'ok' ? 'OK' : 
                     status.status === 'missing' ? 'Missing' : 'Type Mismatch'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {!allRequiredPresent && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-800">Schema Fix Required</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Missing columns are causing the campaign creation error. Run the schema fix SQL in your Supabase dashboard.
            </p>
            <div className="text-xs text-red-600">
              File: <code>URGENT_CAMPAIGN_SCHEMA_FIX.sql</code>
            </div>
          </div>
        )}

        {allRequiredPresent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-800">Schema Looks Good!</span>
            </div>
            <p className="text-sm text-green-700">
              All required columns are present. Campaign creation should work.
            </p>
          </div>
        )}

        <details className="text-xs">
          <summary className="cursor-pointer font-medium">View All Columns ({columns.length})</summary>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {columns.map((col) => (
              <div key={col.column_name} className="flex justify-between">
                <span className="font-mono">{col.column_name}</span>
                <span className="text-gray-500">{col.data_type}</span>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
