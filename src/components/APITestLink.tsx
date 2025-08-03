import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, Zap, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function APITestLink() {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TestTube className="h-5 w-5 text-blue-600" />
          OpenAI API Testing Suite
          <Badge variant="secondary" className="ml-auto">Dev Tools</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Test the three specific OpenAI query patterns for blog post generation with backlinks.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>✅ Generate blog post on keyword including anchor text hyperlinked</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>✅ Write blog post with hyperlinked anchor text linked to URL</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>✅ Produce blog post that links anchor text</span>
          </div>
          <Button 
            onClick={() => navigate('/test-openai')} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Run API Tests
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
