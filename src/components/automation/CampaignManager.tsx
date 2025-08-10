import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  Target,
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
  Share2
} from 'lucide-react';

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState([
    {
      id: 'camp_001',
      name: 'Tech Blog Outreach',
      status: 'active',
      progress: 68,
      totalTasks: 150,
      completedTasks: 102,
      failedTasks: 8,
      engines: ['blog-commenting', 'guest-posting'],
      created: '2024-01-15',
      target: 'Technology blogs and developer forums',
      budget: 500
    },
    {
      id: 'camp_002', 
      name: 'Social Media Campaign',
      status: 'paused',
      progress: 35,
      totalTasks: 200,
      completedTasks: 70,
      failedTasks: 15,
      engines: ['social-media', 'blog-posting'],
      created: '2024-01-20',
      target: 'Social media platforms',
      budget: 300
    },
    {
      id: 'camp_003',
      name: 'Forum Engagement',
      status: 'completed',
      progress: 100,
      totalTasks: 80,
      completedTasks: 75,
      failedTasks: 5,
      engines: ['forum-profiles', 'blog-commenting'],
      created: '2024-01-10',
      target: 'Marketing and SEO forums',
      budget: 200
    }
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    target: '',
    engines: {},
    keywords: '',
    budget: 0
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const engineOptions = [
    { id: 'blog-commenting', name: 'Blog Commenting', icon: MessageSquare },
    { id: 'blog-posting', name: 'Blog Posting', icon: Edit },
    { id: 'forum-profiles', name: 'Forum Profiles', icon: Users },
    { id: 'social-media', name: 'Social Media', icon: Share2 },
    { id: 'web2', name: 'Web 2.0', icon: Target },
    { id: 'guest-posting', name: 'Guest Posting', icon: Calendar }
  ];

  const handleCreateCampaign = () => {
    const campaign = {
      id: `camp_${Date.now()}`,
      name: newCampaign.name,
      status: 'active',
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      engines: Object.keys(newCampaign.engines).filter(key => newCampaign.engines[key]),
      created: new Date().toISOString().split('T')[0],
      target: newCampaign.target,
      budget: newCampaign.budget
    };

    setCampaigns([...campaigns, campaign]);
    setShowCreateDialog(false);
    setNewCampaign({ name: '', target: '', engines: {}, keywords: '', budget: 0 });
  };

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns(campaigns.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: campaign.status === 'active' ? 'paused' : 'active' }
        : campaign
    ));
  };

  const deleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>
          <p className="text-gray-600">Create and manage automation campaigns</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Configure your new automation campaign with specific engines and targets.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Tech Blog Outreach"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="500"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({...newCampaign, budget: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Description</Label>
                <Textarea
                  id="target"
                  placeholder="Describe your target audience, websites, or platforms..."
                  value={newCampaign.target}
                  onChange={(e) => setNewCampaign({...newCampaign, target: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="SEO, digital marketing, content marketing"
                  value={newCampaign.keywords}
                  onChange={(e) => setNewCampaign({...newCampaign, keywords: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label>Automation Engines</Label>
                <div className="grid grid-cols-2 gap-3">
                  {engineOptions.map((engine) => {
                    const IconComponent = engine.icon;
                    return (
                      <div key={engine.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Switch
                          id={engine.id}
                          checked={newCampaign.engines[engine.id] || false}
                          onCheckedChange={(checked) => 
                            setNewCampaign({
                              ...newCampaign, 
                              engines: {...newCampaign.engines, [engine.id]: checked}
                            })
                          }
                        />
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Label htmlFor={engine.id}>{engine.name}</Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign} disabled={!newCampaign.name}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign List */}
      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(campaign.status)}`} />
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.target}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCampaignStatus(campaign.id)}
                    disabled={campaign.status === 'completed'}
                  >
                    {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCampaign(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{campaign.progress}%</span>
                  </div>
                  <Progress value={campaign.progress} className="h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-blue-600">{campaign.totalTasks}</p>
                    <p className="text-xs text-gray-600">Total Tasks</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-600">{campaign.completedTasks}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-red-600">{campaign.failedTasks}</p>
                    <p className="text-xs text-gray-600">Failed</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-purple-600">${campaign.budget}</p>
                    <p className="text-xs text-gray-600">Budget</p>
                  </div>
                </div>

                {/* Engines */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Engines:</span>
                  <div className="flex gap-1">
                    {campaign.engines.map((engineId) => {
                      const engine = engineOptions.find(e => e.id === engineId);
                      if (!engine) return null;
                      const IconComponent = engine.icon;
                      return (
                        <Badge key={engineId} variant="outline" className="flex items-center gap-1">
                          <IconComponent className="h-3 w-3" />
                          {engine.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Created: {campaign.created}</span>
                  <span>Success Rate: {((campaign.completedTasks / Math.max(campaign.totalTasks, 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Create your first automation campaign to get started.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
