import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Save, 
  X, 
  TestTube, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Key
} from 'lucide-react';

interface APIKeyCardProps {
  apiKey: {
    id: string;
    name: string;
    key: string;
    service: string;
    status: 'testing' | 'valid' | 'invalid' | 'unknown';
    lastTested?: Date;
    description?: string;
    isSecret: boolean;
  };
  onTest: (keyId: string) => void;
  onSave: (keyId: string, newValue: string) => void;
}

export function APIKeyCard({ apiKey, onTest, onSave }: APIKeyCardProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(apiKey.key);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey.key);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard'
    });
  };

  const handleSave = () => {
    onSave(apiKey.id, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(apiKey.key);
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (apiKey.status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Key className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      valid: 'bg-green-100 text-green-800 border-green-300',
      invalid: 'bg-red-100 text-red-800 border-red-300',
      testing: 'bg-blue-100 text-blue-800 border-blue-300',
      unknown: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    return (
      <Badge className={variants[apiKey.status]}>
        {apiKey.status}
      </Badge>
    );
  };

  const getCardBorder = () => {
    switch (apiKey.status) {
      case 'valid':
        return 'border-green-200';
      case 'invalid':
        return 'border-red-200';
      case 'testing':
        return 'border-blue-200';
      default:
        return 'border-gray-200';
    }
  };

  const maskKey = (key: string) => {
    if (!apiKey.isSecret || showSecret) return key;
    if (key.length <= 20) return '•'.repeat(key.length);
    return `${key.substring(0, 8)}${'•'.repeat(Math.max(key.length - 16, 8))}${key.slice(-8)}`;
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md border-2 ${getCardBorder()}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{apiKey.service} API</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusBadge()}
            </div>
          </div>

          {/* API Key Value */}
          <div className="space-y-2">
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="Enter API key..."
                />
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="font-mono text-sm bg-gray-50 p-3 rounded-lg border break-all">
                  {maskKey(apiKey.key)}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1 mt-2">
                  {apiKey.isSecret && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showSecret ? 'Hide' : 'Show'}
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTest(apiKey.id)}
                    disabled={apiKey.status === 'testing'}
                  >
                    {apiKey.status === 'testing' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {apiKey.description && (
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              {apiKey.description}
            </p>
          )}

          {/* Last Tested */}
          {apiKey.lastTested && (
            <p className="text-xs text-gray-500">
              Last tested: {apiKey.lastTested.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
