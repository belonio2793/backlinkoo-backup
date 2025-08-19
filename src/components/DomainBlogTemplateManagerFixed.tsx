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
  Tablet,
  AlertCircle,
  CheckCircle,
  Database
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import BlogThemesService, { BlogTheme, DomainThemeSettings } from '@/services/blogThemesService';
import { DomainBlogTemplateService, DomainThemeRecord } from '@/services/domainBlogTemplateService';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface SaveStatus {
  isLoading: boolean;
  lastSaved?: Date;
  hasError: boolean;
  errorMessage?: string;
}

export function DomainBlogTemplateManagerFixed({ 
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ isLoading: false, hasError: false });
  const [databaseStatus, setDatabaseStatus] = useState<'checking' | 'ready' | 'missing' | 'error'>('checking');
  const [fallbackMode, setFallbackMode] = useState(false);

  const blogEnabledDomains = domains.filter(d => d.blog_enabled);
  const allThemes = BlogThemesService.getAllThemes();

  useEffect(() => {
    if (blogEnabledDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(blogEnabledDomains[0].id);
    }
  }, [blogEnabledDomains]);

  // Check database setup status
  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        setDatabaseStatus('checking');
        // Try to fetch a domain theme to test if database is set up
        if (blogEnabledDomains.length > 0) {
          await DomainBlogTemplateService.getDomainTheme(blogEnabledDomains[0].id);
          setDatabaseStatus('ready');
          setFallbackMode(false);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('does not exist') || errorMessage.includes('domain_blog_themes')) {
          setDatabaseStatus('missing');
          setFallbackMode(true);
        } else {
          setDatabaseStatus('error');
          setFallbackMode(true);
        }
        console.warn('Database status check:', errorMessage);
      }
    };

    checkDatabaseStatus();
  }, [blogEnabledDomains]);

  // Load domain themes from database or localStorage fallback
  useEffect(() => {
    const loadDomainThemes = async () => {
      if (blogEnabledDomains.length === 0) return;

      if (fallbackMode) {
        loadFromLocalStorage();
        return;
      }

      setSaveStatus(prev => ({ ...prev, isLoading: true }));
      try {
        const themeRecords: Record<string, DomainThemeRecord> = {};

        for (const domain of blogEnabledDomains) {
          try {
            const themeRecord = await DomainBlogTemplateService.getDomainTheme(domain.id);
            if (themeRecord) {
              themeRecords[domain.id] = themeRecord;
            } else {
              // Create default theme record
              themeRecords[domain.id] = createDefaultThemeRecord(domain.id);
            }
          } catch (domainError) {
            console.warn(`Could not load theme for domain ${domain.domain}:`, domainError);
            themeRecords[domain.id] = createDefaultThemeRecord(domain.id);
          }
        }

        setDomainThemeRecords(themeRecords);

        if (selectedDomain && themeRecords[selectedDomain]) {
          setSelectedTheme(themeRecords[selectedDomain].theme_id);
          setCustomStyles(themeRecords[selectedDomain].custom_styles || {});
        }

        setSaveStatus({ isLoading: false, hasError: false });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error loading domain themes:', errorMessage);
        setSaveStatus({ isLoading: false, hasError: true, errorMessage });
        setFallbackMode(true);
        loadFromLocalStorage();
      }
    };

    loadDomainThemes();
  }, [blogEnabledDomains, selectedDomain, fallbackMode]);

  // Load settings from localStorage as fallback
  const loadFromLocalStorage = () => {
    try {
      const savedSettings = localStorage.getItem('domain-blog-theme-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDomainThemeSettings(settings);
        
        // Create theme records from localStorage
        const themeRecords: Record<string, DomainThemeRecord> = {};
        blogEnabledDomains.forEach(domain => {
          const domainSettings = settings[domain.id];
          themeRecords[domain.id] = {
            id: `local_${domain.id}`,
            domain_id: domain.id,
            theme_id: domainSettings?.theme_id || 'minimal',
            theme_name: BlogThemesService.getThemeById(domainSettings?.theme_id || 'minimal')?.name || 'Minimal Clean',
            custom_styles: domainSettings?.custom_styles || {},
            custom_settings: {},
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: domainSettings?.updated_at || new Date().toISOString()
          };
        });
        setDomainThemeRecords(themeRecords);

        if (selectedDomain && themeRecords[selectedDomain]) {
          setSelectedTheme(themeRecords[selectedDomain].theme_id);
          setCustomStyles(themeRecords[selectedDomain].custom_styles || {});
        }
      } else {
        // Initialize with defaults
        const fallbackRecords: Record<string, DomainThemeRecord> = {};
        blogEnabledDomains.forEach(domain => {
          fallbackRecords[domain.id] = createDefaultThemeRecord(domain.id);
        });
        setDomainThemeRecords(fallbackRecords);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // Save to localStorage as fallback
  const saveToLocalStorage = (domainId: string, themeId: string, styles: any) => {
    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        throw new Error('localStorage is not supported in this browser');
      }

      // Get current settings
      const currentSettings = JSON.parse(localStorage.getItem('domain-blog-theme-settings') || '{}');

      // Create the new setting
      const newSetting = {
        domain_id: domainId,
        theme_id: themeId,
        custom_styles: styles || {},
        updated_at: new Date().toISOString(),
        saved_method: 'localStorage'
      };

      currentSettings[domainId] = newSetting;

      // Test write
      const testKey = 'domain-blog-theme-settings-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      // Save the actual data
      localStorage.setItem('domain-blog-theme-settings', JSON.stringify(currentSettings));

      console.log('🟢 localStorage save successful for domain:', domainId);
      return true;
    } catch (error) {
      console.error('🔴 Error saving to localStorage:', error);
      // Try to provide helpful error message
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded - storage is full');
        } else if (error.message.includes('localStorage')) {
          console.error('localStorage is not available or disabled');
        }
      }
      return false;
    }
  };

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

  const setupDatabase = async () => {
    try {
      setSaveStatus({ isLoading: true, hasError: false });
      toast({
        title: "Setting up database",
        description: "Installing blog theme database components...",
      });

      // Dynamically import the setup function
      const { setupDomainDatabase } = await import('@/utils/setupDomainDatabase');
      const result = await setupDomainDatabase();

      if (result.success) {
        setDatabaseStatus('ready');
        setFallbackMode(false);
        setSaveStatus({ isLoading: false, hasError: false });
        toast({
          title: "Database Setup Complete",
          description: "Blog theme database is now ready. Reloading settings...",
        });
        
        // Reload the component
        window.location.reload();
      } else {
        throw new Error(result.message || 'Setup failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSaveStatus({ isLoading: false, hasError: true, errorMessage });
      toast({
        title: "Setup Failed",
        description: `Failed to set up database: ${errorMessage}`,
        variant: "destructive"
      });
    }
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

    // Validate that the selected domain exists
    const domain = domains.find(d => d.id === selectedDomain);
    if (!domain) {
      toast({
        title: "Invalid Domain",
        description: "Selected domain is not valid. Please select a different domain.",
        variant: "destructive"
      });
      return;
    }

    setSaveStatus({ isLoading: true, hasError: false });
    console.log('🎨 Saving theme settings:', { selectedDomain, selectedTheme, customStyles });

    try {
      let success = false;
      let saveMethod = 'unknown';

      if (!fallbackMode && databaseStatus === 'ready') {
        // Try to save to database
        try {
          console.log('📊 Attempting database save...');
          success = await DomainBlogTemplateService.setDomainTheme(
            selectedDomain,
            selectedTheme,
            customStyles,
            {}
          );
          if (success) {
            saveMethod = 'database';
            console.log('✅ Database save successful');
          }
        } catch (dbError) {
          console.warn('❌ Database save failed, falling back to localStorage:', dbError);
          success = false;
        }
      } else {
        console.log('⚠️ Skipping database save - fallback mode or database not ready');
      }

      // Fallback to localStorage if database save failed or we're in fallback mode
      if (!success) {
        console.log('💾 Attempting localStorage save...');
        success = saveToLocalStorage(selectedDomain, selectedTheme, customStyles);
        if (success) {
          saveMethod = 'localStorage';
          console.log('✅ localStorage save successful');
          toast({
            title: "Settings Saved Locally",
            description: "Theme settings saved to browser storage. Database backup will be available when connection is restored.",
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Theme Saved",
          description: "Blog theme settings have been saved to database successfully",
        });
      }

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

        // Update theme record
        const updatedTheme: DomainThemeRecord = {
          id: `${saveMethod}_${selectedDomain}`,
          domain_id: selectedDomain,
          theme_id: selectedTheme,
          theme_name: BlogThemesService.getThemeById(selectedTheme)?.name || 'Unknown',
          custom_styles: customStyles,
          custom_settings: {},
          is_active: true,
          created_at: domainThemeRecords[selectedDomain]?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setDomainThemeRecords(prev => ({
          ...prev,
          [selectedDomain]: updatedTheme
        }));

        onThemeUpdate?.(selectedDomain, selectedTheme);
        setSaveStatus({ isLoading: false, hasError: false, lastSaved: new Date() });
        console.log('🎉 Theme settings saved successfully via', saveMethod);
      } else {
        throw new Error(`Failed to save theme settings - both database and localStorage failed`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error saving theme:', errorMessage, error);
      setSaveStatus({ isLoading: false, hasError: true, errorMessage });
      toast({
        title: "Save Failed",
        description: `Unable to save theme settings: ${errorMessage}. Please try again or contact support if the problem persists.`,
        variant: "destructive"
      });
    }
  };

  const createDefaultThemeRecord = (domainId: string): DomainThemeRecord => {
    return {
      id: `default_${domainId}`,
      domain_id: domainId,
      theme_id: 'minimal',
      theme_name: 'Minimal Clean',
      custom_styles: {},
      custom_settings: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
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
      {/* Database Status Alert */}
      {databaseStatus === 'missing' && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Blog theme database not set up. Settings will be saved locally.</span>
            <Button onClick={setupDatabase} size="sm" disabled={saveStatus.isLoading}>
              {saveStatus.isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Setup Database'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {databaseStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Database connection error. Using local storage mode. Check your connection and try refreshing.
          </AlertDescription>
        </Alert>
      )}

      {fallbackMode && saveStatus.lastSaved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Settings saved locally at {saveStatus.lastSaved.toLocaleTimeString()}. Set up database for persistent storage.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Blog Template Manager
            {fallbackMode && <Badge variant="outline">Local Mode</Badge>}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Customize the look and feel of your domain blogs with professional themes
            {fallbackMode && " (Currently using browser storage)"}
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

          {/* Save Status */}
          {saveStatus.hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Save failed: {saveStatus.errorMessage}
              </AlertDescription>
            </Alert>
          )}
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
                  {fallbackMode && domainThemeSettings[domain.id] && (
                    <Badge variant="secondary" className="text-xs">Local</Badge>
                  )}
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

export default DomainBlogTemplateManagerFixed;
