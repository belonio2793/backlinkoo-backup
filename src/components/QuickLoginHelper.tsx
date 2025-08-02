import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, Cloud } from 'lucide-react';

export function QuickLoginHelper() {
  const [copied, setCopied] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const netlifyUrl = "https://app.netlify.com";

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const openSupabase = () => {
    window.open(`${supabaseUrl}/dashboard`, '_blank');
  };

  const openNetlify = () => {
    window.open(netlifyUrl, '_blank');
  };

  return (
    <Card className="w-full max-w-md mx-auto border-2 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Database className="h-5 w-5" />
          Quick Admin Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={openSupabase}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <Database className="h-4 w-4" />
            Login to Supabase Dashboard
            <ExternalLink className="h-3 w-3" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Database management & SQL editor
          </p>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={openNetlify}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <Cloud className="h-4 w-4" />
            Login to Netlify Dashboard
            <ExternalLink className="h-3 w-3" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Deployment & functions management
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span>Supabase URL:</span>
              <Button
                onClick={() => handleCopy(supabaseUrl, 'supabase')}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                {copied === 'supabase' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs font-mono break-all">
              {supabaseUrl}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
