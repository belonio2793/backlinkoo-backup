import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Globe, 
  TrendingUp, 
  Activity,
  Target,
  MapPin,
  Calendar,
  BarChart3,
  Trophy,
  Zap,
  Crown,
  Flag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CampaignLedgerEntry {
  id: string;
  campaign_name: string;
  user_location_country: string;
  user_location_country_code: string;
  backlinks_delivered: number;
  keyword_difficulty_avg: number;
  keywords_count: number;
  completed_at: string;
}

const countryFlags: Record<string, string> = {
  'US': '🇺🇸',
  'GB': '🇬🇧', 
  'CA': '🇨🇦',
  'AU': '🇦🇺',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'NL': '🇳🇱',
  'SE': '🇸🇪',
  'JP': '🇯🇵',
  'SG': '🇸🇬'
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty < 50) return 'text-green-600 bg-green-50 dark:bg-green-950/20';
  if (difficulty < 70) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
  if (difficulty < 85) return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
  return 'text-red-600 bg-red-50 dark:bg-red-950/20';
};

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty < 50) return 'Easy';
  if (difficulty < 70) return 'Medium';
  if (difficulty < 85) return 'Hard';
  return 'Extreme';
};

export function Community() {
  const [ledgerEntries, setLedgerEntries] = useState<CampaignLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalBacklinks: 0,
    averageDifficulty: 0,
    activeCountries: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadLedgerData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_campaign_ledger'
        },
        (payload) => {
          console.log('New campaign completed!', payload);
          const newEntry = payload.new as CampaignLedgerEntry;
          setLedgerEntries(prev => [newEntry, ...prev]);
          
          // Show toast notification
          toast({
            title: '🎉 New Campaign Completed!',
            description: `${newEntry.campaign_name} from ${newEntry.user_location_country} just delivered ${newEntry.backlinks_delivered} backlinks!`,
            duration: 5000,
          });
          
          // Update stats
          setStats(prev => ({
            totalCampaigns: prev.totalCampaigns + 1,
            totalBacklinks: prev.totalBacklinks + newEntry.backlinks_delivered,
            averageDifficulty: prev.averageDifficulty, // Will be recalculated on next load
            activeCountries: prev.activeCountries
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const loadLedgerData = async () => {
    try {
      const { data, error } = await supabase
        .from('global_campaign_ledger')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLedgerEntries(data || []);
      
      // Calculate stats
      if (data && data.length > 0) {
        const totalBacklinks = data.reduce((sum, entry) => sum + entry.backlinks_delivered, 0);
        const avgDifficulty = data.reduce((sum, entry) => sum + entry.keyword_difficulty_avg, 0) / data.length;
        const uniqueCountries = new Set(data.map(entry => entry.user_location_country_code)).size;
        
        setStats({
          totalCampaigns: data.length,
          totalBacklinks,
          averageDifficulty: Math.round(avgDifficulty * 10) / 10,
          activeCountries: uniqueCountries
        });
      }
    } catch (error) {
      console.error('Error loading ledger data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Global Community</h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    Real-time feed of completed campaigns worldwide
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Live Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">{stats.activeCountries} Countries Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">{stats.totalCampaigns} Campaigns Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Campaigns', 
            value: stats.totalCampaigns, 
            icon: BarChart3, 
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
            change: 'Real-time'
          },
          { 
            title: 'Backlinks Delivered', 
            value: stats.totalBacklinks, 
            icon: Target, 
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
            change: 'Growing'
          },
          { 
            title: 'Avg. Difficulty', 
            value: `${stats.averageDifficulty}%`, 
            icon: Zap, 
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20',
            change: 'Challenging'
          },
          { 
            title: 'Active Countries', 
            value: stats.activeCountries, 
            icon: Globe, 
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20',
            change: 'Worldwide'
          }
        ].map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover-scale">
            <CardContent className="p-6">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Activity Feed */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Campaign Completions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Live feed of completed backlink campaigns from users around the world
          </p>
        </CardHeader>
        <CardContent>
          {ledgerEntries.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No completed campaigns yet</h3>
              <p className="text-muted-foreground">
                Campaign completions will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 rounded-t-lg font-medium text-sm text-muted-foreground">
                <div className="col-span-2">Country</div>
                <div className="col-span-4">Campaign Details</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-2 text-center">Backlinks</div>
                <div className="col-span-2 text-center">Difficulty</div>
              </div>
              
              {/* Table Rows */}
              <div className="space-y-1">
                {ledgerEntries.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="group grid grid-cols-12 gap-4 p-4 rounded-lg bg-gradient-to-r from-card via-card to-card/50 border hover:shadow-md transition-all duration-300 hover-scale items-center"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Country Column */}
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-xl" title={entry.user_location_country}>
                        {countryFlags[entry.user_location_country_code] || '🌍'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-muted-foreground truncate">
                          {entry.user_location_country}
                        </p>
                      </div>
                    </div>
                    
                    {/* Campaign Details Column */}
                    <div className="col-span-4">
                      <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {entry.campaign_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {entry.keywords_count} keywords
                        </span>
                      </div>
                    </div>
                    
                    {/* Time Column */}
                    <div className="col-span-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(entry.completed_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {/* Backlinks Column */}
                    <div className="col-span-2 text-center">
                      <div className="text-lg font-bold text-primary">
                        {entry.backlinks_delivered}
                      </div>
                      <div className="text-xs text-muted-foreground">Links</div>
                    </div>
                    
                    {/* Difficulty Column */}
                    <div className="col-span-2 text-center">
                      <Badge 
                        variant="secondary" 
                        className={`${getDifficultyColor(entry.keyword_difficulty_avg)} font-semibold text-xs px-3 py-1`}
                      >
                        {getDifficultyLabel(entry.keyword_difficulty_avg)}
                        <span className="ml-1 opacity-80">
                          {Math.round(entry.keyword_difficulty_avg)}%
                        </span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
