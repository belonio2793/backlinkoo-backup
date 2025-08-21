import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Palette, Eye, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface BlogTheme {
  id: string;
  name: string;
  description: string;
  style: string;
  preview: string;
  features: string[];
  recommended?: boolean;
}

interface DomainBlogThemeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  onThemeSelected: (themeId: string) => void;
}

const blogThemes: BlogTheme[] = [
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Clean, professional design perfect for business content',
    style: 'Modern minimalist with clean typography',
    preview: 'Clean white background with excellent readability',
    features: ['SEO Optimized', 'Fast Loading', 'Mobile Responsive', 'Professional Layout'],
    recommended: true
  },
  {
    id: 'tech-focus',
    name: 'Tech Focus',
    description: 'Technical blog theme with code highlighting',
    style: 'Developer-friendly with syntax highlighting',
    preview: 'Dark/light modes with code block support',
    features: ['Code Highlighting', 'Technical Layout', 'Developer Tools', 'Documentation Style']
  },
  {
    id: 'elegant-editorial',
    name: 'Elegant Editorial',
    description: 'Magazine-style layout for content marketing',
    style: 'Editorial design with rich typography',
    preview: 'Magazine-style with featured images',
    features: ['Rich Typography', 'Featured Images', 'Social Sharing', 'Editorial Layout']
  },
  {
    id: 'modern-business',
    name: 'Modern Business',
    description: 'Professional theme for business blogs',
    style: 'Corporate design with brand focus',
    preview: 'Business-oriented with call-to-actions',
    features: ['Brand Integration', 'CTA Buttons', 'Professional Design', 'Lead Generation']
  }
];

export default function DomainBlogThemeSelector({
  open,
  onOpenChange,
  domain,
  onThemeSelected
}: DomainBlogThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleSaveTheme = async () => {
    if (!selectedTheme) {
      toast.error('Please select a theme');
      return;
    }

    setSaving(true);
    try {
      // Here you would save the theme to the database
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onThemeSelected(selectedTheme);
      toast.success(`✅ Blog theme "${blogThemes.find(t => t.id === selectedTheme)?.name}" configured for ${domain}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save blog theme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Select Blog Theme for {domain}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Choose a default blog theme that will be used for all blog posts generated from your campaigns on this domain.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogThemes.map((theme) => (
              <Card
                key={theme.id}
                className={`cursor-pointer transition-all ${
                  selectedTheme === theme.id
                    ? 'ring-2 ring-blue-500 border-blue-200'
                    : 'hover:border-gray-300'
                } ${theme.recommended ? 'border-blue-200 bg-blue-50/30' : ''}`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {selectedTheme === theme.id && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                      {theme.name}
                    </span>
                    {theme.recommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{theme.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">Style:</div>
                    <p className="text-xs text-gray-600">{theme.style}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">Preview:</div>
                    <p className="text-xs text-gray-600">{theme.preview}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {theme.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Theme preview coming soon!');
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview Theme
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTheme} disabled={!selectedTheme || saving}>
              {saving ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Configuring...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Set as Default Theme
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
