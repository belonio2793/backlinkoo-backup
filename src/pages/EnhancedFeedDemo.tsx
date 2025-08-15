import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnhancedRealTimeFeed from '@/components/EnhancedRealTimeFeed';
import { 
  Activity, 
  Play, 
  Eye, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  Globe,
  FileText,
  Target,
  Zap
} from 'lucide-react';

// Mock campaign data
const mockCampaigns = [
  {
    id: 'campaign-1',
    name: 'SEO Campaign for TechCorp',
    status: 'active',
    keywords: ['best software development'],
    target_url: 'https://techcorp.com',
    anchor_texts: ['leading software company']
  },
  {
    id: 'campaign-2', 
    name: 'Marketing Campaign for StartupXYZ',
    status: 'active',
    keywords: ['innovative startup solutions'],
    target_url: 'https://startupxyz.com',
    anchor_texts: ['cutting-edge startup']
  }
];

export const EnhancedFeedDemo: React.FC = () => {
  const [showEnhancedFeed, setShowEnhancedFeed] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState(mockCampaigns);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-4">
                Enhanced UI Experience
              </Badge>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Enhanced Real Time Feed
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Experience the next generation of real-time campaign monitoring with our enhanced, widescreen feed interface. 
                Built for better visibility, enhanced details, and improved user experience.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowEnhancedFeed(true)}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Open Enhanced Feed
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => window.location.href = '/automation'}
              >
                <Eye className="h-5 w-5 mr-2" />
                View in Automation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-gray-800">What's Enhanced?</h2>
          <p className="text-lg text-gray-600">
            Compare the improvements in the new Real Time Feed interface
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Before */}
          <Card className="border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Activity className="h-5 w-5" />
                Previous Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Basic event display</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Limited detail visibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Fixed small size</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Basic filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>No search functionality</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* After */}
          <Card className="border-green-200 ring-2 ring-green-100">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Sparkles className="h-5 w-5" />
                Enhanced Feed
                <Badge className="bg-green-600 text-white text-xs">NEW</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>Widescreen layout</strong> for better visibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>Rich event details</strong> with expandable info</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>Draggable window</strong> positioning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>Advanced filtering</strong> by type and level</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>Real-time search</strong> across all events</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>Export functionality</strong> for data analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>Enhanced UX controls</strong> and settings</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Key Features</h2>
            <p className="text-lg text-gray-600">
              Everything you need for comprehensive campaign monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Events</h3>
              <p className="text-sm text-gray-600">Live monitoring of campaign activities and system events</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Rich Details</h3>
              <p className="text-sm text-gray-600">Comprehensive event information with expandable details</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Smart Filtering</h3>
              <p className="text-sm text-gray-600">Advanced filters and search to find exactly what you need</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Enhanced UX</h3>
              <p className="text-sm text-gray-600">Draggable, resizable interface with modern design</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Active Campaigns Status */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Active Demo Campaigns</h2>
          <p className="text-lg text-gray-600">
            Sample campaigns running for demonstration purposes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockCampaigns.map((campaign, index) => (
            <Card key={campaign.id} className="border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <Play className="h-3 w-3 mr-1" />
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">Keyword:</span>
                    <span className="font-medium">"{campaign.keywords[0]}"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium break-all">{campaign.target_url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-600">Anchor:</span>
                    <span className="font-medium">"{campaign.anchor_texts[0]}"</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8">
          <h2 className="text-4xl font-bold">Experience the Enhanced Feed</h2>
          <p className="text-xl opacity-90">
            Open the enhanced feed to see real-time campaign monitoring in action
          </p>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setShowEnhancedFeed(true)}
            >
              <Activity className="h-5 w-5 mr-2" />
              Open Enhanced Feed
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          <div className="text-sm opacity-75">
            💡 Tip: The feed is draggable - move it around to see different parts of the interface!
          </div>
        </div>
      </div>

      {/* Enhanced Feed Modal */}
      <EnhancedRealTimeFeed
        isOpen={showEnhancedFeed}
        onClose={() => setShowEnhancedFeed(false)}
        activeCampaigns={activeCampaigns}
      />
    </div>
  );
};

export default EnhancedFeedDemo;
