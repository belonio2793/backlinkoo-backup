import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Search, CheckCircle, XCircle, Clock, Trash2, AlertTriangle, Link, Eye, Plus, Save, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RankingResult {
  keyword: string;
  url: string;
  domain: string;
  searchEngines: {
    google: { position: number | null; found: boolean; lastChecked: string; backlinks: number; errors?: string[] };
    bing: { position: number | null; found: boolean; lastChecked: string; backlinks: number; errors?: string[] };
    yahoo: { position: number | null; found: boolean; lastChecked: string; backlinks: number; errors?: string[] };
  };
  overallBest: number | null;
  averagePosition: number | null;
  technicalIssues: string[];
}

interface SavedTarget {
  target_id: string;
  url: string;
  domain: string;
  keyword: string;
  name?: string;
  google_position: number | null;
  google_found: boolean;
  google_checked_at: string;
  google_backlinks: number;
  bing_position: number | null;
  bing_found: boolean;
  bing_checked_at: string;
  bing_backlinks: number;
  yahoo_position: number | null;
  yahoo_found: boolean;
  yahoo_checked_at: string;
  yahoo_backlinks: number;
  best_position: number;
  average_position: number;
  target_created_at?: string;
  target_updated_at?: string;
}

export const RankingTracker = () => {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  
  const [isChecking, setIsChecking] = useState(false);
  const [rankings, setRankings] = useState<RankingResult[]>([]);
  const [savedTargets, setSavedTargets] = useState<SavedTarget[]>([]);
  const [checkingProgress, setCheckingProgress] = useState<string[]>([]);
  const [currentProgressIndex, setCurrentProgressIndex] = useState(0);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [recheckingTargets, setRecheckingTargets] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Load saved targets on component mount
  useEffect(() => {
    loadSavedTargets();
  }, []);

  const loadSavedTargets = async () => {
    try {
      const { data, error } = await supabase
        .from('ranking_dashboard')
        .select('*')
        .order('target_created_at', { ascending: false });

      if (error) throw error;
      setSavedTargets(data || []);
    } catch (error) {
      console.error('Error loading saved targets:', error);
      toast({
        title: "Error",
        description: "Failed to load saved ranking targets",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Enhanced ranking check with comprehensive analysis
  const performEnhancedRankingCheck = async (url: string, keyword: string) => {
    const searchEngines = ['google', 'bing', 'yahoo'];
    const results: { [key: string]: any } = {};
    const technicalIssues: string[] = [];
    
    setCheckingProgress(['Fetching results...']);
    setCurrentProgressIndex(0);
    
    // First validate website availability with comprehensive checks
    try {
      setCheckingProgress(['Validating website accessibility and status...']);
      console.log(`Starting website validation for: ${url}`);
      
      const { data: validationData, error: validationError } = await supabase.functions.invoke('seo-analysis', {
        body: {
          type: 'website_validation',
          data: { url }
        }
      });

      console.log('Validation response:', { validationData, validationError });

      if (validationError) {
        const errorMessage = `Validation service error: ${validationError.message || 'Unknown error'}`;
        console.error('Validation service error:', validationError);
        
        toast({
          title: "Service Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { 
          results: {}, 
          technicalIssues: [errorMessage],
          websiteError: true,
          errorMessage: errorMessage
        };
      }

      if (validationData?.error || validationData?.status !== 'active') {
        const errorTitle = getErrorTitle(validationData?.status);
        const errorMessage = validationData?.error || validationData?.description || 'Website validation failed';
        
        console.log(`Website validation failed: ${errorMessage} (Status: ${validationData?.status})`);
        
        // Show specific error toast based on the error type
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        
        // Return empty results to show "No results found"
        return { 
          results: {}, 
          technicalIssues: [errorMessage],
          websiteError: true,
          errorMessage: errorMessage,
          validationStatus: validationData?.status || 'unknown'
        };
      }

      console.log('Website validation passed - proceeding with analysis');
      setCheckingProgress(['Website validation passed - starting comprehensive analysis...']);
      
    } catch (error) {
      console.error('Website validation failed with exception:', error);
      
      const errorMessage = `Website validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Show error toast and clear results
      toast({
        title: "Website Validation Failed", 
        description: "Unable to analyze website - please check URL and try again",
        variant: "destructive",
      });

      return { 
        results: {}, 
        technicalIssues: [errorMessage],
        websiteError: true,
        errorMessage: errorMessage
      };
    }
    
    // Keep static progress message
    setCheckingProgress(['Fetching results...']);
    
    for (const engine of searchEngines) {
      try {
        const { data, error } = await supabase.functions.invoke('seo-analysis', {
          body: {
            type: 'ranking_check',
            data: { url, keyword, searchEngine: engine }
          }
        });

        if (error) throw error;

        // Check for website-specific errors in the response
        if (data.websiteError) {
          results[engine] = {
            engine,
            position: null,
            found: false,
            backlinks: 0,
            errors: [data.error || 'Website unavailable'],
            competitorAnalysis: [],
            domainAge: 0,
            sslStatus: 'Unknown',
            indexingStatus: 'Error',
            websiteStatus: data.status || 'unavailable'
          };
          technicalIssues.push(data.error || 'Website unavailable');
          continue;
        }

        // Simulate enhanced data analysis
        const backlinksCount = data.backlinksCount !== undefined ? data.backlinksCount : Math.floor(Math.random() * 10000);
        const hasSSL = url.startsWith('https://');
        const domainAge = Math.floor(Math.random() * 10) + 1;
        
        const errors = [];
        if (!hasSSL) {
          errors.push('No SSL certificate detected');
          technicalIssues.push('SSL certificate missing');
        }
        
        // Handle indexing errors
        if (data.indexingError || (data.indexed === false)) {
          const indexingMessage = `Not indexed on ${engine}`;
          errors.push(indexingMessage);
          technicalIssues.push(indexingMessage);
          
          // Show specific indexing error notification
          toast({
            title: `Indexing Issue - ${engine.charAt(0).toUpperCase() + engine.slice(1)}`,
            description: `Website is not indexed on ${engine} - showing 0 links`,
            variant: "destructive",
          });
        }
        
        if (backlinksCount === 0 && !data.indexingError) {
          errors.push('No backlinks found');
          technicalIssues.push('Zero backlink count detected');
        }
        if (!data.found && data.totalResults === 0) {
          errors.push('URL not indexed by search engine');
          technicalIssues.push(`Not indexed on ${engine}`);
        }

        results[engine] = {
          engine,
          position: data.position,
          found: data.found,
          backlinks: backlinksCount,
          errors,
          competitorAnalysis: data.competitorAnalysis || [],
          domainAge,
          sslStatus: hasSSL ? 'Valid' : 'Missing',
          indexingStatus: data.indexed !== false ? (data.found ? 'Indexed' : 'Not Indexed') : 'Not Indexed',
          websiteStatus: data.indexed === false ? 'not_indexed' : 'active',
          indexedPages: data.indexedPages || 0
        };

        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`Error checking ${engine}:`, error);
        results[engine] = {
          engine,
          position: null,
          found: false,
          backlinks: 0,
          errors: ['API error occurred'],
          competitorAnalysis: [],
          domainAge: 0,
          sslStatus: 'Unknown',
          indexingStatus: 'Error',
          websiteStatus: 'api_error'
        };
        technicalIssues.push(`${engine} API error`);
      }
    }

    setCheckingProgress([]);
    setCurrentProgressIndex(0);
    return { results, technicalIssues: [...new Set(technicalIssues)] };
  };

  const saveRankingTarget = async (url: string, keyword: string, name?: string) => {
    try {
      const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
      const domain = new URL(cleanUrl).hostname;

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ranking_targets')
        .insert([{
          user_id: user.id,
          url: cleanUrl,
          domain,
          keyword: keyword.trim(),
          name: name?.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Target Saved",
        description: `Now tracking "${keyword}" for ${domain}`,
      });

      return data.id;
    } catch (error) {
      console.error('Error saving target:', error);
      toast({
        title: "Error",
        description: "Failed to save ranking target",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveRankingResults = async (targetId: string, analysisData: any) => {
    try {
      const resultEntries = Object.values(analysisData.results).map((result: any) => ({
        target_id: targetId,
        search_engine: result.engine,
        position: result.position,
        found: result.found,
        error_details: result.errors.length > 0 ? { errors: result.errors } : {},
        backlinks_count: result.backlinks || 0,
        competitor_analysis: result.competitorAnalysis || [],
        serp_features: {
          ssl_status: result.sslStatus,
          indexing_status: result.indexingStatus,
          domain_age: result.domainAge
        }
      }));

      const { error } = await supabase
        .from('ranking_results')
        .insert(resultEntries);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  const checkRanking = async () => {
    if (!url.trim() || !keyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter both URL and keyword",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
    } catch {
      toast({
        title: "Error", 
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setCheckingProgress([]);
    
    try {
      const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const domain = new URL(cleanUrl).hostname;
      
      setCheckingProgress(['Starting comprehensive ranking and technical analysis...']);
      
      const analysisData = await performEnhancedRankingCheck(cleanUrl, keyword.trim());
      
      // Analysis is now just for display, saving is done via the Save Target button

      // Process results for display
      const positions = Object.values(analysisData.results)
        .map((r: any) => r.position)
        .filter(p => p !== null) as number[];
      
      const overallBest = positions.length > 0 ? Math.min(...positions) : null;
      const averagePosition = positions.length > 0 
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
        : null;

      // Check if this is a website error case first
      if (analysisData.websiteError) {
        const errorMessage = analysisData.technicalIssues[0] || analysisData.errorMessage || 'Website unavailable';
        const errorTitle = getErrorTitle(analysisData.validationStatus);
        
        console.log(`Analysis failed due to website error: ${errorMessage}`);
        
        // Show detailed error notification
        toast({
          title: errorTitle,
          description: `No analysis possible: ${errorMessage}`,
          variant: "destructive",
        });
        
        // Clear all results and show "No results found" state
        setRankings([]);
        setShowAnalysis(false);
        setAiAnalysis("");
        return;
      }

      const resultsData = analysisData.results || {};
      const googleData = (resultsData as any)['google'] || {};
      const bingData = (resultsData as any)['bing'] || {};
      const yahooData = (resultsData as any)['yahoo'] || {};

      const newResult: RankingResult = {
        keyword: keyword.trim(),
        url: cleanUrl,
        domain: domain,
        searchEngines: {
          google: {
            position: googleData.position || null,
            found: googleData.found || false,
            lastChecked: new Date().toLocaleString(),
            backlinks: googleData.backlinks || 0,
            errors: googleData.errors || []
          },
          bing: {
            position: bingData.position || null,
            found: bingData.found || false,
            lastChecked: new Date().toLocaleString(),
            backlinks: bingData.backlinks || 0,
            errors: bingData.errors || []
          },
          yahoo: {
            position: yahooData.position || null,
            found: yahooData.found || false,
            lastChecked: new Date().toLocaleString(),
            backlinks: yahooData.backlinks || 0,
            errors: yahooData.errors || []
          }
        },
        overallBest,
        averagePosition,
        technicalIssues: analysisData.technicalIssues
      };
      
      setRankings(prev => [newResult, ...prev.slice(0, 4)]);

      // Store analysis data for the new visual report
      setAiAnalysis(JSON.stringify(analysisData));
      
      setShowAnalysis(true);

      const successMessage = "Analysis Complete";
      const foundSummary = Object.values(analysisData.results)
        .filter((r: any) => r.found)
        .map((r: any) => `${r.engine} (#${r.position})`)
        .join(', ');

      toast({
        title: successMessage,
        description: foundSummary 
          ? `Found on: ${foundSummary}`
          : analysisData.technicalIssues.length > 0 
            ? `Technical issues found: ${analysisData.technicalIssues.length}`
            : "Not ranking in top 100",
      });

    } catch (error) {
      console.error('Ranking check failed:', error);
      toast({
        title: "Error",
        description: "Failed to complete ranking analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
      setCheckingProgress([]);
    }
  };

  const deleteTarget = async (targetId: string) => {
    try {
      const { error } = await supabase
        .from('ranking_targets')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      toast({
        title: "Target Removed",
        description: "Ranking target deleted successfully",
      });

      loadSavedTargets();
    } catch (error) {
      console.error('Error deleting target:', error);
      toast({
        title: "Error",
        description: "Failed to delete ranking target",
        variant: "destructive",
      });
    }
  };

  const recheckTarget = async (target: SavedTarget) => {
    if (recheckingTargets.has(target.target_id)) return;
    
    // Add target to rechecking set
    setRecheckingTargets(prev => new Set([...prev, target.target_id]));
    
    try {
      console.log(`Rechecking target: ${target.keyword} for ${target.domain}`);
      
      // Call the SEO analysis API function directly
      const { data, error } = await supabase.functions.invoke('seo-analysis', {
        body: {
          url: target.url,
          keyword: target.keyword
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze target');
      }

      if (!data || data.websiteError) {
        toast({
          title: "Recheck Failed",
          description: `Unable to analyze ${target.domain}: ${data?.errorMessage || 'Website is not accessible'}`,
          variant: "destructive",
        });
        return;
      }

      const results = data.results || {};
      const googleData = results.google || {};
      const bingData = results.bing || {};
      const yahooData = results.yahoo || {};

      // Calculate best and average positions
      const positions = [googleData.position, bingData.position, yahooData.position]
        .filter(p => p !== null && p !== undefined) as number[];
      const bestPosition = positions.length > 0 ? Math.min(...positions) : 999;
      const averagePosition = positions.length > 0 
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
        : 999;

      // Save new ranking results to the database
      if (target.target_id) {
        const resultEntries = Object.values(results).map((result: any) => ({
          target_id: target.target_id,
          search_engine: result.engine,
          position: result.position,
          found: result.found,
          error_details: result.errors && result.errors.length > 0 ? { errors: result.errors } : {},
          backlinks_count: result.backlinks || 0,
          competitor_analysis: result.competitorAnalysis || [],
          serp_features: {
            ssl_status: result.sslStatus,
            indexing_status: result.indexingStatus,
            domain_age: result.domainAge
          }
        }));

        if (resultEntries.length > 0) {
          const { error: insertError } = await supabase
            .from('ranking_results')
            .insert(resultEntries);

          if (insertError) {
            console.error('Error saving ranking results:', insertError);
          }
        }
      }

      // Reload saved targets to reflect the update
      await loadSavedTargets();

      const foundSummary = Object.values(results)
        .filter((r: any) => r.found)
        .map((r: any) => `${r.engine} (#${r.position})`)
        .join(', ');

      toast({
        title: "Target Rechecked",
        description: foundSummary 
          ? `Updated ${target.keyword}: ${foundSummary}`
          : `Updated ${target.keyword}: No rankings found`,
      });

    } catch (error) {
      console.error('Error rechecking target:', error);
      toast({
        title: "Error",
        description: "Failed to recheck ranking target",
        variant: "destructive",
      });
    } finally {
      // Remove target from rechecking set
      setRecheckingTargets(prev => {
        const newSet = new Set(prev);
        newSet.delete(target.target_id);
        return newSet;
      });
    }
  };


  const getPositionColor = (position: number | null) => {
    if (!position) return "text-gray-500 bg-gray-50";
    if (position <= 3) return "text-green-600 bg-green-50";
    if (position <= 10) return "text-blue-600 bg-blue-50";
    if (position <= 30) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getErrorTitle = (status: string) => {
    switch (status) {
      case 'not_found': return 'Website Not Found (404)';
      case 'forbidden': return 'Access Forbidden (403)';
      case 'server_error': return 'Server Error';
      case 'parked_domain': return 'Parked Domain Detected';
      case 'minimal_content': return 'Inactive Website';
      case 'timeout': return 'Website Timeout';
      case 'dns_error': return 'Domain Not Found';
      case 'connection_refused': return 'Connection Refused';
      case 'invalid_url': return 'Invalid URL';
      case 'ssl_error': return 'SSL Certificate Error';
      case 'network_error': return 'Network Error';
      default: return 'Website Error';
    }
  };

  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case 'google': return '🔍';
      case 'bing': return '🌐';
      case 'yahoo': return '🟣';
      default: return '⚪';
    }
  };

  const saveCurrentAnalysis = async () => {
    if (rankings.length === 0) {
      toast({
        title: "Error",
        description: "No analysis results to save",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = rankings[0]; // Get the most recent result
      const targetId = await saveRankingTarget(result.url, result.keyword, `${result.keyword} - ${result.domain}`);
      
      if (targetId) {
        // Create analysis data in the expected format
        const analysisData = {
          results: {
            google: {
              engine: 'google',
              position: result.searchEngines.google.position,
              found: result.searchEngines.google.found,
              backlinks: result.searchEngines.google.backlinks,
              errors: result.searchEngines.google.errors || []
            },
            bing: {
              engine: 'bing', 
              position: result.searchEngines.bing.position,
              found: result.searchEngines.bing.found,
              backlinks: result.searchEngines.bing.backlinks,
              errors: result.searchEngines.bing.errors || []
            },
            yahoo: {
              engine: 'yahoo',
              position: result.searchEngines.yahoo.position,
              found: result.searchEngines.yahoo.found,
              backlinks: result.searchEngines.yahoo.backlinks,
              errors: result.searchEngines.yahoo.errors || []
            }
          },
          technicalIssues: result.technicalIssues
        };

        await saveRankingResults(targetId, analysisData);
        await loadSavedTargets();
        
        toast({
          title: "Analysis Saved",
          description: `Saved "${result.keyword}" analysis to your targets`,
        });
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis results",
        variant: "destructive",
      });
    }
  };

  const getHealthStatus = (target: SavedTarget) => {
    const issues = [];
    if (!target.google_found && !target.bing_found && !target.yahoo_found) {
      issues.push('Not ranking');
    }
    if (target.google_backlinks === 0 && target.bing_backlinks === 0) {
      issues.push('No backlinks');
    }
    return issues;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tracker" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">Ranking Tracker</TabsTrigger>
          <TabsTrigger value="dashboard">Saved Targets ({savedTargets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Advanced Ranking Tracker & SEO Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="keyword">Target Keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="Enter keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

              
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  onClick={checkRanking} 
                  disabled={isChecking}
                  className="w-full"
                >
                  {isChecking ? "Analyzing..." : "Analyze Rankings"}
                </Button>
              </div>
              </div>
              
              {isChecking && checkingProgress.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Deep Analysis in Progress:</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {checkingProgress.map((progress, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="animate-pulse">{progress}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Saved Ranking Targets</span>
                <Badge variant="secondary">{savedTargets.length} Tracked</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSaved ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                  <p className="text-muted-foreground">Loading saved targets...</p>
                </div>
              ) : savedTargets.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No saved ranking targets yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Use the tracker above to analyze and save your first target</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Campaign & Keyword</TableHead>
                        <TableHead className="text-center font-semibold">Google</TableHead>
                        <TableHead className="text-center font-semibold">Bing</TableHead>
                        <TableHead className="text-center font-semibold">Yahoo</TableHead>
                        <TableHead className="text-center font-semibold">Best Position</TableHead>
                        <TableHead className="text-center font-semibold">Total Backlinks</TableHead>
                        <TableHead className="text-center font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedTargets.map((target) => {
                        const healthIssues = getHealthStatus(target);
                        const totalBacklinks = (target.google_backlinks || 0) + (target.bing_backlinks || 0) + (target.yahoo_backlinks || 0);
                        
                        return (
                          <TableRow key={target.target_id} className="hover:bg-muted/30">
                            <TableCell className="max-w-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-base">{target.keyword}</span>
                                  {healthIssues.length > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {healthIssues.length}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">{target.domain}</div>
                                {target.name && (
                                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                                    {target.name}
                                  </div>
                                )}
                                {target.target_created_at && (
                                  <div className="text-xs text-muted-foreground">
                                    Added: {new Date(target.target_created_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                {target.google_position ? (
                                  <Badge className={getPositionColor(target.google_position)}>
                                    #{target.google_position}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">-</Badge>
                                )}
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                   <Link className="h-3 w-3" />
                                   {(!target.google_position || !target.google_found) 
                                     ? "0 links" 
                                     : target.google_backlinks === 0 
                                       ? "0 links" 
                                       : `${target.google_backlinks} links`}
                                 </div>
                                {target.google_checked_at && (
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(target.google_checked_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                {target.bing_position ? (
                                  <Badge className={getPositionColor(target.bing_position)}>
                                    #{target.bing_position}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">-</Badge>
                                )}
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                   <Link className="h-3 w-3" />
                                   {(!target.bing_position || !target.bing_found) 
                                     ? "0 links" 
                                     : target.bing_backlinks === 0 
                                       ? "0 links" 
                                       : `${target.bing_backlinks} links`}
                                 </div>
                                {target.bing_checked_at && (
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(target.bing_checked_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                {target.yahoo_position ? (
                                  <Badge className={getPositionColor(target.yahoo_position)}>
                                    #{target.yahoo_position}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">-</Badge>
                                )}
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                   <Link className="h-3 w-3" />
                                   {(!target.yahoo_position || !target.yahoo_found) 
                                     ? "0 links" 
                                     : target.yahoo_backlinks === 0 
                                       ? "0 links" 
                                       : `${target.yahoo_backlinks} links`}
                                 </div>
                                {target.yahoo_checked_at && (
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(target.yahoo_checked_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {target.best_position && target.best_position < 999 ? (
                                <Badge className={getPositionColor(target.best_position)}>
                                  #{target.best_position}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Not Ranking</Badge>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Link className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  {(() => {
                                    const validBacklinks = 
                                      (target.google_position && target.google_found ? target.google_backlinks || 0 : 0) +
                                      (target.bing_position && target.bing_found ? target.bing_backlinks || 0 : 0) +
                                      (target.yahoo_position && target.yahoo_found ? target.yahoo_backlinks || 0 : 0);
                                    return validBacklinks.toLocaleString();
                                  })()}
                                </span>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recheckTarget(target)}
                                  disabled={recheckingTargets.has(target.target_id)}
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {recheckingTargets.has(target.target_id) ? "Fetching..." : "Recheck"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteTarget(target.target_id)}
                                  className="text-xs"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Analysis Results</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{rankings.length} Results</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveCurrentAnalysis}
                  disabled={rankings.length === 0}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Target
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* SE Scout-style table */}
            <div className="space-y-4">
                {rankings.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {rankings.reduce((acc, r) => acc + Object.values(r.searchEngines).filter(se => se.found).length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Keywords Ranking</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(rankings.reduce((acc, r) => {
                      const positions = Object.values(r.searchEngines).map(se => se.position).filter(p => p !== null) as number[];
                      return acc + (positions.length > 0 ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length : 0);
                    }, 0) / Math.max(rankings.length, 1)) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Position</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {rankings.reduce((acc, r) => acc + Object.values(r.searchEngines).reduce((sum, se) => {
                      return sum + ((!se.position || !se.found) ? 0 : se.backlinks);
                    }, 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Backlinks</div>
                </div>
              </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-2xl font-bold text-muted-foreground mb-2">No Results Found</div>
                  <div className="text-sm text-muted-foreground">
                    Unable to analyze the website. Please check the URL and try again.
                  </div>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead className="text-center">Google</TableHead>
                      <TableHead className="text-center">Bing</TableHead>
                      <TableHead className="text-center">Yahoo</TableHead>
                      <TableHead className="text-center">Backlinks</TableHead>
                      <TableHead className="text-center">Best Position</TableHead>
                      <TableHead className="text-center">URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((result, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{result.keyword}</div>
                            <div className="text-sm text-muted-foreground">{result.domain}</div>
                            {result.technicalIssues.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                                <span className="text-xs text-orange-600">{result.technicalIssues.length} issues</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {result.searchEngines.google.position ? (
                              <Badge className={getPositionColor(result.searchEngines.google.position)}>
                                #{result.searchEngines.google.position}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">-</Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {(!result.searchEngines.google.position || !result.searchEngines.google.found) 
                                ? "0 links" 
                                : result.searchEngines.google.backlinks === 0 
                                  ? "0 links" 
                                  : `${result.searchEngines.google.backlinks} links`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {result.searchEngines.bing.position ? (
                              <Badge className={getPositionColor(result.searchEngines.bing.position)}>
                                #{result.searchEngines.bing.position}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">-</Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {(!result.searchEngines.bing.position || !result.searchEngines.bing.found) 
                                ? "0 links" 
                                : result.searchEngines.bing.backlinks === 0 
                                  ? "0 links" 
                                  : `${result.searchEngines.bing.backlinks} links`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {result.searchEngines.yahoo.position ? (
                              <Badge className={getPositionColor(result.searchEngines.yahoo.position)}>
                                #{result.searchEngines.yahoo.position}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">-</Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {(!result.searchEngines.yahoo.position || !result.searchEngines.yahoo.found) 
                                ? "0 links" 
                                : result.searchEngines.yahoo.backlinks === 0 
                                  ? "0 links" 
                                  : `${result.searchEngines.yahoo.backlinks} links`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link className="h-4 w-4" />
                            <span className="font-medium">
                              {Object.values(result.searchEngines).reduce((sum, se) => {
                                return sum + ((!se.position || !se.found) ? 0 : se.backlinks);
                              }, 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {result.overallBest ? (
                            <Badge className={getPositionColor(result.overallBest)}>
                              #{result.overallBest}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">-</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(result.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showAnalysis && aiAnalysis && rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Backlink ∞ SEO Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Backlink Strategy Card */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-primary">SEO Performance Analysis</h3>
                    <p className="text-sm text-muted-foreground">Comprehensive ranking and backlink strategy</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(rankings[0].searchEngines).filter(se => se.found).length}/3
                    </div>
                    <div className="text-sm text-muted-foreground">Search Engines Ranking</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {rankings[0].overallBest || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Best Position Found</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Object.values(rankings[0].searchEngines).reduce((sum, se) => {
                        return sum + ((!se.position || !se.found) ? 0 : se.backlinks);
                      }, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Backlinks</div>
                  </div>
                </div>

                {/* Search Engine Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {Object.entries(rankings[0].searchEngines).map(([engine, data]) => (
                    <div key={engine} className="p-4 bg-white/70 dark:bg-black/30 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getEngineIcon(engine)}</span>
                          <span className="font-semibold capitalize">{engine}</span>
                        </div>
                        {data.found ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Position:</span>
                          <span className="font-semibold">
                            {data.position ? `#${data.position}` : 'Not Found'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Backlinks:</span>
                          <span className="font-semibold text-primary">
                            {(!data.position || !data.found) ? "0" : data.backlinks.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strategic Recommendations */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Strategic Recommendations
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rankings[0].overallBest ? (
                      <>
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="font-medium text-green-800 dark:text-green-300 mb-2">✅ Currently Ranking</div>
                          <div className="text-sm text-green-700 dark:text-green-400">
                            Great job! You're ranking at position #{rankings[0].overallBest}. Continue ordering more backlinks to maintain and strengthen your current rankings.
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="font-medium text-blue-800 dark:text-blue-300 mb-2">🎯 Optimization Focus</div>
                          <div className="text-sm text-blue-700 dark:text-blue-400">
                            Target 15-25 additional high-quality backlinks to improve rankings. Consider competitor analysis and content gap identification.
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="font-medium text-red-800 dark:text-red-300 mb-2">❌ Not Currently Ranking</div>
                          <div className="text-sm text-red-700 dark:text-red-400">
                            Priority actions: Ensure proper indexing, build quality backlinks, optimize on-page SEO, and improve content relevance for target keyword.
                          </div>
                        </div>
                         <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                           <div className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">⚡ Immediate Actions</div>
                           <div className="text-sm text-yellow-700 dark:text-yellow-400">
                             Start with technical SEO audit, then focus on acquiring 30 - 50 relevant backlinks with Backlink ∞
                           </div>
                         </div>
                      </>
                    )}
                  </div>
                </div>

                {rankings[0].technicalIssues.length > 0 && (
                  <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Technical Issues Detected</h5>
                        <div className="space-y-1">
                          {rankings[0].technicalIssues.map((issue, index) => (
                            <div key={index} className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};