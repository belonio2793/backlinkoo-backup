import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  CheckCircle2, 
  Globe, 
  Users, 
  Zap, 
  Brain,
  Shield,
  Infinity,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function GlobalOpenAISuccess() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Available to all visitors on backlinkoo.com',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Universal Usage',
      description: 'No user restrictions or limitations',
      color: 'text-green-600'
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Direct OpenAI API calls for maximum speed',
      color: 'text-yellow-600'
    },
    {
      icon: Shield,
      title: 'Secure Implementation',
      description: 'Centrally managed configuration',
      color: 'text-purple-600'
    },
    {
      icon: Brain,
      title: 'GPT-3.5 Turbo',
      description: 'Latest AI model for content generation',
      color: 'text-orange-600'
    },
    {
      icon: Infinity,
      title: 'Unlimited Capacity',
      description: 'No generation limits or restrictions',
      color: 'text-indigo-600'
    }
  ];

  const integrations = [
    { name: 'Homepage Blog Generator', path: '/', status: 'Active' },
    { name: 'AI Live Testing', path: '/ai-live', status: 'Active' },
    { name: 'Admin Dashboard', path: '/admin', status: 'Active' },
    { name: 'User Dashboard', path: '/dashboard', status: 'Active' },
    { name: 'Blog Creator', path: '/blog/create', status: 'Active' },
    { name: 'All Blog Components', path: null, status: 'Active' }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <Brain className="h-12 w-12 text-blue-600" />
            <CheckCircle2 className="h-6 w-6 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Global OpenAI Configuration Active!
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        
        {/* Success Alert */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 text-lg">
            ✅ <strong>Success!</strong> OpenAI API key has been synced globally and is now available 
            for all users visiting backlinkoo.com. Content generation is now unlimited and permanent.
          </AlertDescription>
        </Alert>

        {/* Features Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Global Features Enabled
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-3">
                  <feature.icon className={`h-5 w-5 ${feature.color} mt-0.5`} />
                  <div>
                    <div className="font-medium text-sm">{feature.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{feature.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Status */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Integration Status
          </h3>
          <div className="space-y-2">
            {integrations.map((integration, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{integration.name}</span>
                  {integration.path && (
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{integration.path}</code>
                  )}
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {integration.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
          <Button onClick={() => navigate('/')} className="flex items-center gap-2">
            Test Homepage Generator
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" onClick={() => navigate('/ai-live')} className="flex items-center gap-2">
            Open AI Live Testing
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" onClick={() => navigate('/admin')} className="flex items-center gap-2">
            View Admin Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-600" />
            Technical Implementation
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• <strong>API Key:</strong> Permanently stored in environment variables</div>
            <div>• <strong>Service:</strong> Global OpenAI Configuration Service</div>
            <div>• <strong>Fallback:</strong> Direct API calls with Netlify function backup</div>
            <div>• <strong>Model:</strong> GPT-3.5 Turbo for optimal performance</div>
            <div>• <strong>Security:</strong> Centralized key management with masked display</div>
            <div>• <strong>Availability:</strong> 24/7 global access for all users</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
