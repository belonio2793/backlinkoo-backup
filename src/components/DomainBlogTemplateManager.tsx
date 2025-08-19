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
import BlogTemplateStorageService from '@/services/blogTemplateStorageService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

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

        // Try a simple database connection test first
        const { data: testData, error: testError } = await supabase
          .from('domains')
          .select('id')
          .limit(1);

        if (testError && testError.message.includes('Failed to fetch')) {
          // Network connectivity issue
          console.warn('⚠️ Database connection failed. Using offline mode.');
          setDatabaseStatus('error');
          setFallbackMode(true);
          return;
        }

        // If we can connect, test the blog themes functionality
        if (blogEnabledDomains.length > 0) {
          const themeResult = await DomainBlogTemplateService.getDomainTheme(blogEnabledDomains[0].id);
          if (themeResult) {
            setDatabaseStatus('ready');
            setFallbackMode(false);
          } else {
            // Got null result but no error - database exists but may be empty
            setDatabaseStatus('ready');
            setFallbackMode(false);
          }
        } else {
          // No blog-enabled domains, but database is working
          setDatabaseStatus('ready');
          setFallbackMode(false);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Database check failed, using offline mode:', errorMessage);
        setDatabaseStatus('error');
        setFallbackMode(true);
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

        // Set selected theme based on loaded data
        if (selectedDomain && themeRecords[selectedDomain]) {
          setSelectedTheme(themeRecords[selectedDomain].theme_id);
          setCustomStyles(themeRecords[selectedDomain].custom_styles || {});
        }

        setSaveStatus({ isLoading: false, hasError: false });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message :
                            error && typeof error === 'object' ? JSON.stringify(error) :
                            String(error);
        console.warn('⚠️ Loading domain themes failed, switching to offline mode:', errorMessage);
        setSaveStatus({ isLoading: false, hasError: false }); // Don't show as error, just switch to offline
        setFallbackMode(true);
        loadFromLocalStorage();
      }
    };

    loadDomainThemes();
  }, [blogEnabledDomains, selectedDomain, fallbackMode]);

  // Load settings using improved storage service
  const loadFromLocalStorage = async () => {
    try {
      const themeRecords: Record<string, DomainThemeRecord> = {};
      const settingsRecords: Record<string, DomainThemeSettings> = {};

      for (const domain of blogEnabledDomains) {
        try {
          const savedSettings = await BlogTemplateStorageService.loadSettings(domain.id);

          if (savedSettings) {
            themeRecords[domain.id] = {
              id: `storage_${domain.id}`,
              domain_id: domain.id,
              theme_id: savedSettings.themeId,
              theme_name: BlogThemesService.getThemeById(savedSettings.themeId)?.name || 'Unknown Theme',
              custom_styles: savedSettings.customStyles,
              custom_settings: savedSettings.customSettings,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: savedSettings.lastUpdated
            };

            settingsRecords[domain.id] = {
              domain_id: domain.id,
              theme_id: savedSettings.themeId,
              custom_styles: savedSettings.customStyles,
              updated_at: savedSettings.lastUpdated
            };
          } else {
            // Create default
            themeRecords[domain.id] = createDefaultThemeRecord(domain.id);
          }
        } catch (error) {
          console.warn(`Error loading settings for domain ${domain.domain}:`, error);
          themeRecords[domain.id] = createDefaultThemeRecord(domain.id);
        }
      }

      setDomainThemeRecords(themeRecords);
      setDomainThemeSettings(settingsRecords);

      // Set selected theme based on loaded data
      if (selectedDomain && themeRecords[selectedDomain]) {
        setSelectedTheme(themeRecords[selectedDomain].theme_id);
        setCustomStyles(themeRecords[selectedDomain].custom_styles || {});
      }

      console.log(`✅ Loaded ${Object.keys(themeRecords).length} blog template settings`);
    } catch (error) {
      console.error('Error loading from storage service:', error);
      // Fallback to defaults
      const fallbackRecords: Record<string, DomainThemeRecord> = {};
      blogEnabledDomains.forEach(domain => {
        fallbackRecords[domain.id] = createDefaultThemeRecord(domain.id);
      });
      setDomainThemeRecords(fallbackRecords);
    }
  };

  // Save to localStorage as fallback
  const saveToLocalStorage = (domainId: string, themeId: string, styles: any) => {
    try {
      const currentSettings = JSON.parse(localStorage.getItem('domain-blog-theme-settings') || '{}');
      currentSettings[domainId] = {
        domain_id: domainId,
        theme_id: themeId,
        custom_styles: styles,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('domain-blog-theme-settings', JSON.stringify(currentSettings));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
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
        description: "Please select both a domain and theme",
        variant: "destructive"
      });
      return;
    }

    setSaveStatus({ isLoading: true, hasError: false });

    try {
      // Use the improved storage service
      const result = await BlogTemplateStorageService.saveSettings(
        selectedDomain,
        selectedTheme,
        customStyles,
        {}
      );

      if (result.success) {
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
          id: `${result.method}_${selectedDomain}`,
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

        // Show appropriate success message based on storage method
        if (result.method === 'database') {
          toast({
            title: "Theme Saved",
            description: "Blog theme settings have been saved to database",
          });
        } else {
          toast({
            title: "Settings Saved Locally",
            description: "Theme settings saved to browser storage. Database backup available when connection is restored.",
          });
        }
      } else {
        throw new Error(result.error || 'Failed to save theme settings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error saving theme:', errorMessage);
      setSaveStatus({ isLoading: false, hasError: true, errorMessage });
      toast({
        title: "Save Failed",
        description: `Failed to save theme settings: ${errorMessage}`,
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
      <div className="space-y-4">
        <Alert>
          <Palette className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>No blog-enabled domains found</strong></p>
              <p>Total domains: {domains.length}</p>
              <p>Blog-enabled domains: {domains.filter(d => d.blog_enabled).length}</p>
              {domains.length > 0 && (
                <div>
                  <p className="font-medium">Domain details:</p>
                  <ul className="list-disc list-inside text-sm">
                    {domains.map(domain => (
                      <li key={domain.id}>
                        {domain.domain} - Blog enabled: {domain.blog_enabled ? 'Yes' : 'No'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm mt-2">
                To enable blog templates, edit a domain above and toggle "Enable Blog" on.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Database connection unavailable. Running in offline mode - settings will be saved locally.</span>
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
              >
                Retry Connection
              </Button>
            </div>
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
              disabled={saveStatus.isLoading}
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

export default DomainBlogTemplateManager;
