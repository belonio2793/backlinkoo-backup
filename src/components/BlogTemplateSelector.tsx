import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Layout, 
  Sparkles, 
  BookOpen, 
  Settings, 
  Eye,
  Palette
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  features: string[];
  preview: string;
  route: string;
}

const templates: Template[] = [
  {
    id: 'enhanced',
    name: 'Enhanced Blog Post',
    description: 'Feature-rich template with claim system and social features',
    features: ['Claim system', 'Social sharing', 'Action buttons', 'Admin features'],
    preview: '/blog',
    route: '/blog'
  },
  {
    id: 'beautiful',
    name: 'Beautiful Article Template',
    description: 'Clean, focused reading experience with modern UI',
    features: ['Reading progress', 'Table of contents', 'Clean typography', 'Social sharing'],
    preview: '/article',
    route: '/article'
  }
];

export function BlogTemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState('enhanced');
  const [previewSlug, setPreviewSlug] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('preferred_blog_template');
    if (saved && templates.find(t => t.id === saved)) {
      setSelectedTemplate(saved);
    }
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    localStorage.setItem('preferred_blog_template', templateId);
    toast({
      title: "Template Updated",
      description: `Blog template preference saved: ${templates.find(t => t.id === templateId)?.name}`,
    });
  };

  const handlePreview = (template: Template) => {
    if (!previewSlug) {
      toast({
        title: "Preview Slug Required",
        description: "Enter a blog post slug to preview the template",
        variant: "destructive"
      });
      return;
    }
    
    const url = `${template.route}/${previewSlug}`;
    window.open(url, '_blank');
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Blog Template Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Selection */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900">Current Template</h3>
              <Badge className="bg-blue-600 text-white">Active</Badge>
            </div>
            <p className="text-blue-800">{currentTemplate?.name}</p>
            <p className="text-sm text-blue-600 mt-1">{currentTemplate?.description}</p>
          </div>

          {/* Template Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Choose Template</h3>
            <RadioGroup value={selectedTemplate} onValueChange={handleTemplateChange}>
              {templates.map((template) => (
                <div key={template.id} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={template.id} id={template.id} />
                    <Label 
                      htmlFor={template.id} 
                      className="flex-1 cursor-pointer"
                    >
                      <Card className={`transition-all duration-200 ${
                        selectedTemplate === template.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">{template.name}</h4>
                              {template.id === 'beautiful' && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            
                            {/* Features */}
                            <div className="flex flex-wrap gap-2">
                              {template.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Preview Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview Templates
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter blog post slug (e.g., 'example-post-abc123')"
                value={previewSlug}
                onChange={(e) => setPreviewSlug(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(template)}
                  disabled={!previewSlug}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  Preview {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Route Information */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Template Routes
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Enhanced Template:</span>
                <code className="text-blue-600">/blog/&lt;slug&gt;</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Beautiful Template:</span>
                <code className="text-blue-600">/article/&lt;slug&gt;</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
