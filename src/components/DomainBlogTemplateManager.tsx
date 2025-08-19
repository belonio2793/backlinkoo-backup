import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Palette, 
  Eye, 
  Settings, 
  Save,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import BlogThemesService, { BlogTheme, DomainThemeSettings } from '@/services/blogThemesService';
import { DomainBlogTemplateService, DomainThemeRecord } from '@/services/domainBlogTemplateService';

interface Domain {
  id: string;
  domain: string;
  blog_enabled: boolean;
  blog_subdirectory: string;
}

interface DomainBlogTemplateManagerProps {
  domains: Domain[];
  onThemeUpdate?: (domainId: string, themeId: string) => void;
}

export function DomainBlogTemplateManager({ 
  domains, 
  onThemeUpdate 
}: DomainBlogTemplateManagerProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('minimal');
  const [customStyles, setCustomStyles] = useState<Partial<BlogTheme['styles']>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [domainThemeSettings, setDomainThemeSettings] = useState<Record<string, DomainThemeSettings>>({});
  const [domainThemeRecords, setDomainThemeRecords] = useState<Record<string, DomainThemeRecord>>({});
  const [isLoading, setIsLoading] = useState(false);

  const blogEnabledDomains = domains.filter(d => d.blog_enabled);
  const allThemes = BlogThemesService.getAllThemes();

  useEffect(() => {
    if (blogEnabledDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(blogEnabledDomains[0].id);
    }
  }, [blogEnabledDomains]);

  // Load domain themes from database
  useEffect(() => {
    const loadDomainThemes = async () => {
      if (blogEnabledDomains.length === 0) return;

      setIsLoading(true);
      try {
        const themeRecords: Record<string, DomainThemeRecord> = {};

        for (const domain of blogEnabledDomains) {
          try {
            const themeRecord = await DomainBlogTemplateService.getDomainTheme(domain.id);
            if (themeRecord) {
              themeRecords[domain.id] = themeRecord;
            } else {
              // Ensure default theme if none exists
              await DomainBlogTemplateService.ensureDefaultTheme(domain.id);
              const defaultTheme = await DomainBlogTemplateService.getDomainTheme(domain.id);
              if (defaultTheme) {
                themeRecords[domain.id] = defaultTheme;
              }
            }
          } catch (domainError) {
            // Log error but continue with other domains
            console.warn(`⚠️ Could not load theme for domain ${domain.domain}:`, domainError);

            // Create a fallback theme record for this domain
            themeRecords[domain.id] = {
              id: `fallback_${domain.id}`,
              domain_id: domain.id,
              theme_id: 'minimal',
              theme_name: 'Minimal Clean (Fallback)',
              custom_styles: {},
              custom_settings: {},
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        }

        setDomainThemeRecords(themeRecords);

        // Set selected theme based on loaded data
        if (selectedDomain && themeRecords[selectedDomain]) {
          setSelectedTheme(themeRecords[selectedDomain].theme_id);
          setCustomStyles(themeRecords[selectedDomain].custom_styles || {});
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message :
                            error && typeof error === 'object' ? JSON.stringify(error) :
                            String(error);
        console.error('Error loading domain themes:', errorMessage, error);

        // Check if this is a database setup issue
        if (errorMessage.includes('does not exist') || errorMessage.includes('domain_blog_themes')) {
          toast({
            title: "Database Setup Required",
            description: "Domain themes database not set up. Run setupDomainDatabase() in console or connect to Supabase MCP.",
            variant: "destructive",
            action: (
              <button
                onClick={async () => {
                  const { setupDomainDatabase } = await import('@/utils/setupDomainDatabase');
                  const result = await setupDomainDatabase();
                  if (result.success) {
                    toast({
                      title: "Setup Complete",
                      description: "Database set up successfully. Refreshing...",
                    });
                    window.location.reload();
                  } else {
                    toast({
                      title: "Setup Failed",
                      description: result.message,
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Auto Setup
              </button>
            )
          });
        } else {
          toast({
            title: "Error Loading Themes",
            description: `Failed to load domain theme settings: ${errorMessage}`,
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDomainThemes();
  }, [blogEnabledDomains, selectedDomain]);

  useEffect(() => {
    if (selectedTheme) {
      generatePreview();
    }
  }, [selectedTheme, customStyles]);

  const generatePreview = () => {
    const theme = BlogThemesService.getThemeById(selectedTheme);
    if (theme) {
      const html = BlogThemesService.generateThemePreview(theme);
      setPreviewHtml(html);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    const theme = BlogThemesService.getThemeById(themeId);
    if (theme) {
      setCustomStyles({}); // Reset custom styles when changing theme
    }
  };

  const handleStyleChange = (property: keyof BlogTheme['styles'], value: string) => {
    setCustomStyles(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const saveThemeSettings = async () => {
    if (!selectedDomain || !selectedTheme) {
      toast({
        title: "Selection Required",
        description: "Please select both a domain and theme",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await DomainBlogTemplateService.setDomainTheme(
        selectedDomain,
        selectedTheme,
        customStyles,
        {} // custom settings can be added later
      );

      if (success) {
        // Update local state
        const settings: DomainThemeSettings = {
          domain_id: selectedDomain,
          theme_id: selectedTheme,
          custom_styles: customStyles,
          updated_at: new Date().toISOString()
        };

        setDomainThemeSettings(prev => ({
          ...prev,
          [selectedDomain]: settings
        }));

        // Reload theme record
        const updatedTheme = await DomainBlogTemplateService.getDomainTheme(selectedDomain);
        if (updatedTheme) {
          setDomainThemeRecords(prev => ({
            ...prev,
            [selectedDomain]: updatedTheme
          }));
        }

        onThemeUpdate?.(selectedDomain, selectedTheme);

        toast({
          title: "Theme Saved",
          description: "Blog theme settings have been saved to database",
        });
      } else {
        throw new Error('Failed to save theme to database');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :
                          error && typeof error === 'object' ? JSON.stringify(error) :
                          String(error);
      console.error('Error saving theme:', errorMessage, error);
      toast({
        title: "Save Failed",
        description: `Failed to save theme settings: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDevicePreviewStyle = () => {
    switch (devicePreview) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '600px' };
    }
  };

  const getCurrentThemeForDomain = (domainId: string): string => {
    return domainThemeRecords[domainId]?.theme_id || domainThemeSettings[domainId]?.theme_id || 'minimal';
  };

  if (blogEnabledDomains.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Blog Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No blog-enabled domains found</p>
            <p className="text-sm text-gray-500">Enable blogging for your domains to access template customization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Blog Template Manager
          </CardTitle>
          <p className="text-sm text-gray-600">
            Customize the look and feel of your domain blogs with professional themes
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domain Selection */}
          <div className="space-y-2">
            <Label>Select Domain</Label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a domain to customize" />
              </SelectTrigger>
              <SelectContent>
                {blogEnabledDomains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{domain.domain}</span>
                      <Badge variant="secondary" className="ml-2">
                        {getCurrentThemeForDomain(domain.id)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Selection */}
          <div className="space-y-4">
            <Label>Choose Theme</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allThemes.map(theme => (
                <Card 
                  key={theme.id} 
                  className={`cursor-pointer transition-all ${
                    selectedTheme === theme.id 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{theme.name}</h4>
                        <p className="text-sm text-gray-600">{theme.description}</p>
                      </div>
                      {selectedTheme === theme.id && (
                        <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {theme.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.styles.primaryColor }}
                        title="Primary Color"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.styles.accentColor }}
                        title="Accent Color"
                      />
                      <span className="text-xs text-gray-500 ml-auto">
                        {theme.layout.contentWidth} • {theme.layout.spacing}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Theme Customization */}
          {selectedTheme && (
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
              </TabsList>
              
              <TabsContent value="colors" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customStyles.primaryColor || BlogThemesService.getThemeById(selectedTheme)?.styles.primaryColor}
                        onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                        className="w-12 h-8 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={customStyles.primaryColor || BlogThemesService.getThemeById(selectedTheme)?.styles.primaryColor}
                        onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customStyles.accentColor || BlogThemesService.getThemeById(selectedTheme)?.styles.accentColor}
                        onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                        className="w-12 h-8 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={customStyles.accentColor || BlogThemesService.getThemeById(selectedTheme)?.styles.accentColor}
                        onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customStyles.backgroundColor || BlogThemesService.getThemeById(selectedTheme)?.styles.backgroundColor}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        className="w-12 h-8 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={customStyles.backgroundColor || BlogThemesService.getThemeById(selectedTheme)?.styles.backgroundColor}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        className="flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="typography" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heading Font</Label>
                    <Select 
                      value={customStyles.headingFont || BlogThemesService.getThemeById(selectedTheme)?.styles.headingFont}
                      onValueChange={(value) => handleStyleChange('headingFont', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                        <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                        <SelectItem value="JetBrains Mono, monospace">JetBrains Mono</SelectItem>
                        <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Body Font</Label>
                    <Select 
                      value={customStyles.bodyFont || BlogThemesService.getThemeById(selectedTheme)?.styles.bodyFont}
                      onValueChange={(value) => handleStyleChange('bodyFont', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                        <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                        <SelectItem value="System UI, sans-serif">System UI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview Theme
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl h-5/6">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Theme Preview</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={devicePreview === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDevicePreview('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={devicePreview === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDevicePreview('tablet')}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={devicePreview === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDevicePreview('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                  <div 
                    className="bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
                    style={getDevicePreviewStyle()}
                  >
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full border-0"
                      title="Theme Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={saveThemeSettings}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Saving...' : 'Save Theme Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain Theme Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Domain Theme Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blogEnabledDomains.map(domain => (
              <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{domain.domain}</div>
                  <div className="text-sm text-gray-600">/{domain.blog_subdirectory}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getCurrentThemeForDomain(domain.id)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDomain(domain.id)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DomainBlogTemplateManager;
