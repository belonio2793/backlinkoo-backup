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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Palette, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import ImprovedBlogThemesService, { DomainThemeSettings } from '@/services/improvedBlogThemesService';
import { ThemeConfig } from '@/types/blogTemplateTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Domain {
  id: string;
  domain: string;
  blog_enabled: boolean;
  blog_subdirectory: string;
}

interface SimpleBlogTemplateManagerProps {
  domains: Domain[];
  onThemeUpdate?: (domainId: string, themeId: string) => void;
}

interface SaveStatus {
  isLoading: boolean;
  lastSaved?: Date;
  hasError: boolean;
  errorMessage?: string;
}

export function SimpleBlogTemplateManager({ 
  domains, 
  onThemeUpdate 
}: SimpleBlogTemplateManagerProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('minimal');
  const [customStyles, setCustomStyles] = useState<Partial<ThemeConfig['styles']>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ isLoading: false, hasError: false });

  const blogEnabledDomains = domains.filter(d => d.blog_enabled);
  const allThemes = ImprovedBlogThemesService.getAllThemes();

  // Initialize with first domain if available
  useEffect(() => {
    if (blogEnabledDomains.length > 0 && !selectedDomain) {
      const firstDomain = blogEnabledDomains[0];
      setSelectedDomain(firstDomain.id);
      
      // Load saved theme for this domain
      const savedSettings = loadDomainSettings(firstDomain.id);
      if (savedSettings) {
        setSelectedTheme(savedSettings.theme_id);
        setCustomStyles(savedSettings.custom_styles || {});
      } else {
        // Set defaults
        setSelectedTheme('minimal');
        setCustomStyles({});
      }
    }
  }, [blogEnabledDomains]);

  // Load theme when domain changes
  useEffect(() => {
    if (selectedDomain) {
      const savedSettings = loadDomainSettings(selectedDomain);
      if (savedSettings) {
        console.log('🔄 Loading saved theme for domain:', selectedDomain, savedSettings.theme_id);
        setSelectedTheme(savedSettings.theme_id);
        setCustomStyles(savedSettings.custom_styles || {});
      } else {
        console.log('🔄 No saved theme for domain:', selectedDomain, 'using defaults');
        setSelectedTheme('minimal');
        setCustomStyles({});
      }
    }
  }, [selectedDomain]);

  const loadDomainSettings = (domainId: string): DomainThemeSettings | null => {
    try {
      const savedSettings = localStorage.getItem('domain-blog-theme-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings[domainId] || null;
      }
    } catch (error) {
      console.error('Error loading domain settings:', error);
    }
    return null;
  };

  const saveDomainSettings = (domainId: string, themeId: string, styles: any): boolean => {
    try {
      // Get current settings
      const currentSettings = JSON.parse(localStorage.getItem('domain-blog-theme-settings') || '{}');
      
      // Create new setting
      const newSetting: DomainThemeSettings = {
        domain_id: domainId,
        theme_id: themeId,
        custom_styles: styles || {},
        updated_at: new Date().toISOString()
      };

      currentSettings[domainId] = newSetting;
      
      // Save back to localStorage
      localStorage.setItem('domain-blog-theme-settings', JSON.stringify(currentSettings));
      
      console.log('✅ Settings saved for domain:', domainId, themeId);
      return true;
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      return false;
    }
  };

  const handleDomainChange = (domainId: string) => {
    console.log('🏠 Domain changed to:', domainId);
    setSelectedDomain(domainId);
    // The useEffect will handle loading the theme for this domain
  };

  const handleThemeChange = (themeId: string) => {
    console.log('🎨 Theme changed to:', themeId);
    setSelectedTheme(themeId);
    
    // Reset custom styles when changing theme
    const theme = ImprovedBlogThemesService.getThemeById(themeId);
    if (theme) {
      setCustomStyles({});
    }
  };

  const handleStyleChange = (property: keyof ThemeConfig['styles'], value: string) => {
    console.log('🎨 Style change:', property, value);
    setCustomStyles(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const saveThemeSettings = async () => {
    if (!selectedDomain || !selectedTheme) {
      toast({
        title: "Selection Required",
        description: "Please select both a domain and theme before saving",
        variant: "destructive"
      });
      return;
    }

    setSaveStatus({ isLoading: true, hasError: false });
    console.log('💾 Saving theme settings:', { selectedDomain, selectedTheme, customStyles });

    try {
      const success = saveDomainSettings(selectedDomain, selectedTheme, customStyles);
      
      if (success) {
        setSaveStatus({ isLoading: false, hasError: false, lastSaved: new Date() });
        onThemeUpdate?.(selectedDomain, selectedTheme);
        
        toast({
          title: "Theme Saved",
          description: `Successfully saved ${getThemeName(selectedTheme)} theme`,
        });
      } else {
        throw new Error('Failed to save to localStorage');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Save failed:', errorMessage);
      
      setSaveStatus({ isLoading: false, hasError: true, errorMessage });
      toast({
        title: "Save Failed",
        description: `Failed to save theme settings: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const getThemeName = (themeId: string): string => {
    const theme = ImprovedBlogThemesService.getThemeById(themeId);
    return theme?.name || 'Unknown Theme';
  };

  const getCurrentThemeForDomain = (domainId: string): string => {
    const settings = loadDomainSettings(domainId);
    return settings?.theme_id || 'minimal';
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
            <Badge variant="outline">Local Storage</Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Customize the look and feel of your domain blogs with professional themes
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domain Selection */}
          <div className="space-y-2">
            <Label>Select Domain</Label>
            <Select value={selectedDomain} onValueChange={handleDomainChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a domain to customize" />
              </SelectTrigger>
              <SelectContent>
                {blogEnabledDomains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{domain.domain}</span>
                      <Badge variant="secondary" className="ml-2">
                        {getThemeName(getCurrentThemeForDomain(domain.id))}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Choose Theme</Label>
              <Badge variant="outline" className="text-xs">
                {allThemes.length} themes available
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allThemes.map(theme => (
                <Card
                  key={theme.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedTheme === theme.id
                      ? 'ring-2 ring-blue-500 border-blue-500 shadow-md bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  {/* Theme Preview */}
                  <div className="relative h-32 overflow-hidden rounded-t-lg">
                    <div
                      className="absolute inset-0 p-3 text-xs"
                      style={{
                        backgroundColor: theme.styles.backgroundColor,
                        color: theme.styles.textColor,
                        fontFamily: theme.styles.bodyFont
                      }}
                    >
                      <div
                        className="font-bold mb-1"
                        style={{
                          color: theme.styles.primaryColor,
                          fontFamily: theme.styles.headingFont
                        }}
                      >
                        Sample Title
                      </div>
                      <div className="text-xs opacity-75 mb-2">
                        This is how your content will look with this theme...
                      </div>
                      <div
                        className="w-8 h-1 rounded"
                        style={{ backgroundColor: theme.styles.accentColor }}
                      />
                    </div>

                    {selectedTheme === theme.id && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                          Selected
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h4 className="font-semibold text-base mb-1">{theme.name}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{theme.description}</p>
                    </div>

                    {/* Features */}
                    <div className="flex gap-1 flex-wrap mb-3">
                      {theme.features.slice(0, 3).map(feature => (
                        <Badge key={feature} variant="secondary" className="text-xs px-2 py-0.5">
                          {feature.replace('_', ' ')}
                        </Badge>
                      ))}
                      {theme.features.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{theme.features.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Color Palette */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: theme.styles.primaryColor }}
                          title="Primary Color"
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: theme.styles.accentColor }}
                          title="Accent Color"
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: theme.styles.backgroundColor }}
                          title="Background Color"
                        />
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {theme.layout.contentWidth} · {theme.layout.spacing}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Theme Customization */}
          {selectedTheme && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Customize Colors</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customStyles.primaryColor || ImprovedBlogThemesService.getThemeById(selectedTheme)?.styles.primaryColor}
                      onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={customStyles.primaryColor || ImprovedBlogThemesService.getThemeById(selectedTheme)?.styles.primaryColor}
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
                      value={customStyles.accentColor || ImprovedBlogThemesService.getThemeById(selectedTheme)?.styles.accentColor}
                      onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={customStyles.accentColor || ImprovedBlogThemesService.getThemeById(selectedTheme)?.styles.accentColor}
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
                      value={customStyles.backgroundColor || ImprovedBlogThemesService.getThemeById(selectedTheme)?.styles.backgroundColor}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={customStyles.backgroundColor || ImprovedBlogThemesService.getThemeById(selectedTheme)?.styles.backgroundColor}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              onClick={saveThemeSettings}
              className="flex items-center gap-2"
              disabled={saveStatus.isLoading || !selectedDomain || !selectedTheme}
            >
              {saveStatus.isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveStatus.isLoading ? 'Saving...' : 'Save Theme Settings'}
            </Button>
          </div>

          {/* Save Status Messages */}
          {saveStatus.hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Save failed: {saveStatus.errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {saveStatus.lastSaved && !saveStatus.hasError && (
            <Alert variant="default" className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Theme settings saved successfully at {saveStatus.lastSaved.toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Domain Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Themes Summary</CardTitle>
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
                    {getThemeName(getCurrentThemeForDomain(domain.id))}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDomainChange(domain.id)}
                  >
                    Edit
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

export default SimpleBlogTemplateManager;
