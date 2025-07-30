/**
 * Minimal OpenAI Debug Component - Server-Side Only
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Server } from 'lucide-react';

export function OpenAIDebugMinimal() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          OpenAI Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Configuration</span>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Server-Side
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            OpenAI API calls are handled securely via Netlify functions. 
            API keys are not exposed to the client-side code.
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ✅ All API requests routed through secure server endpoints
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
