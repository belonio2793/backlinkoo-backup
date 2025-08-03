import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BlogTemplateSelector } from '@/components/BlogTemplateSelector';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Palette,
  User,
  Bell,
  Shield,
  Database,
  ArrowLeft,
  Save,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates');

  const handleResetSettings = () => {
    localStorage.removeItem('preferred_blog_template');
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleExportSettings = () => {
    const settings = {
      preferredBlogTemplate: localStorage.getItem('preferred_blog_template'),
      exportDate: new Date().toISOString(),
      userEmail: user?.email
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backlink-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: "Your settings have been downloaded as a JSON file",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      
      {/* Page Header */}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6" />
                  Settings & Preferences
                </h1>
                <p className="text-gray-600 mt-1">Customize your Backlink ∞ experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExportSettings}>
                <Save className="h-4 w-4 mr-2" />
                Export Settings
              </Button>
              <Button variant="outline" onClick={handleResetSettings}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
            </TabsList>

            {/* Blog Templates */}
            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <BlogTemplateSelector />
                </div>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Enhanced Template</span>
                          <Badge variant="outline">Current</Badge>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>✓ Claim system integration</li>
                          <li>✓ Admin features</li>
                          <li>✓ Social sharing</li>
                          <li>✓ Action buttons</li>
                        </ul>
                      </div>
                      
                      <hr className="border-gray-100" />
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Beautiful Template</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            New
                          </Badge>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>✓ Reading progress bar</li>
                          <li>✓ Table of contents</li>
                          <li>✓ Enhanced typography</li>
                          <li>✓ Clean, focused design</li>
                          <li>✓ Mobile optimized</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Use different URLs to access each template:</p>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-1 font-mono text-xs">
                          <div><strong>Enhanced:</strong> /blog/your-post-slug</div>
                          <div><strong>Beautiful:</strong> /article/your-post-slug</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            {user.email}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Account Type</label>
                          <div className="mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Standard User
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Member Since</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">Please log in to view profile information.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Notification settings will be available in a future update.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Privacy controls will be available in a future update.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Local Storage Data</h3>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Your preferences are stored locally in your browser.</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleExportSettings}>
                            Export Settings
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleResetSettings}>
                            Clear All Data
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
