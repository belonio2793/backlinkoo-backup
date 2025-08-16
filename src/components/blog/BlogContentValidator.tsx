/**
 * Blog Content Validator Component
 * 
 * Provides a user interface for managing blog content validation and auto-adjustment.
 * Shows content quality metrics, allows manual and batch adjustments, and provides
 * real-time monitoring of blog content health.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Scan,
  Wand2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  BarChart3,
  FileText,
  Zap,
  Eye,
  Settings
} from 'lucide-react';
import { BlogAutoAdjustmentService } from '@/services/blogAutoAdjustmentService';
import { BlogQualityMonitor } from '@/utils/blogQualityMonitor';
import type { BlogPost } from '@/services/blogService';

interface ValidationStats {
  totalPosts: number;
  excellentPosts: number;
  goodPosts: number;
  poorPosts: number;
  criticalPosts: number;
  malformedPosts: number;
}

interface AdjustmentTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  post: BlogPost;
  progress: number;
  result?: any;
}

export function BlogContentValidator() {
  const [isScanning, setIsScanning] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [needsAdjustment, setNeedsAdjustment] = useState<BlogPost[]>([]);
  const [highPriority, setHighPriority] = useState<BlogPost[]>([]);
  const [scanReport, setScanReport] = useState<string>('');
  const [adjustmentTasks, setAdjustmentTasks] = useState<AdjustmentTask[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Scan for malformed content on component mount
  useEffect(() => {
    performContentScan();
  }, []);

  const performContentScan = async () => {
    setIsScanning(true);
    try {
      const result = await BlogAutoAdjustmentService.scanForMalformedContent();
      
      setNeedsAdjustment(result.needsAdjustment);
      setHighPriority(result.highPriority);
      setScanReport(result.report);
      
      // Calculate stats
      const total = result.needsAdjustment.length + result.highPriority.length;
      setStats({
        totalPosts: total,
        excellentPosts: 0, // These would be calculated in the scan
        goodPosts: 0,
        poorPosts: result.needsAdjustment.length - result.highPriority.length,
        criticalPosts: result.highPriority.length,
        malformedPosts: result.needsAdjustment.filter(p => 
          BlogQualityMonitor.analyzeContent(p.content || '').hasMalformedPatterns
        ).length
      });

      toast({
        title: "Content Scan Completed",
        description: `Found ${result.needsAdjustment.length} posts needing adjustment`,
      });

    } catch (error) {
      console.error('Scan failed:', error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Unable to scan blog content for issues",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const performBatchAdjustment = async () => {
    if (selectedPosts.size === 0 && needsAdjustment.length === 0) {
      toast({
        variant: "destructive",
        title: "No Posts Selected",
        description: "Select posts to adjust or run a scan first",
      });
      return;
    }

    setIsAdjusting(true);
    
    const postsToAdjust = selectedPosts.size > 0 
      ? needsAdjustment.filter(p => selectedPosts.has(p.id))
      : needsAdjustment;

    // Initialize adjustment tasks
    const tasks: AdjustmentTask[] = postsToAdjust.map(post => ({
      id: post.id,
      status: 'pending',
      post,
      progress: 0
    }));
    setAdjustmentTasks(tasks);

    try {
      const result = await BlogAutoAdjustmentService.batchAutoAdjustBlogPosts(postsToAdjust, {
        maxConcurrent: 3,
        updateDatabase: true
      });

      // Update task statuses
      setAdjustmentTasks(prev => prev.map(task => {
        const taskResult = result.results.find(r => r.originalContent === task.post.content);
        return {
          ...task,
          status: taskResult?.success ? 'completed' : 'failed',
          progress: 100,
          result: taskResult
        };
      }));

      toast({
        title: "Batch Adjustment Completed",
        description: `Adjusted ${result.adjustedPosts}/${result.totalPosts} posts successfully`,
      });

      // Refresh scan after adjustment
      setTimeout(performContentScan, 1000);

    } catch (error) {
      console.error('Batch adjustment failed:', error);
      toast({
        variant: "destructive",
        title: "Adjustment Failed",
        description: "Unable to complete batch adjustment",
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const adjustSinglePost = async (post: BlogPost) => {
    const task: AdjustmentTask = {
      id: post.id,
      status: 'processing',
      post,
      progress: 50
    };
    
    setAdjustmentTasks(prev => [...prev, task]);

    try {
      const result = await BlogAutoAdjustmentService.autoAdjustBlogPost(post, {
        updateDatabase: true,
        forceAdjustment: true
      });

      setAdjustmentTasks(prev => prev.map(t => 
        t.id === post.id 
          ? { ...t, status: result.success ? 'completed' : 'failed', progress: 100, result }
          : t
      ));

      toast({
        title: result.success ? "Post Adjusted" : "Adjustment Failed",
        description: result.success 
          ? `Quality improved from ${result.qualityScore.before} to ${result.qualityScore.after}`
          : "Unable to adjust this post",
        variant: result.success ? "default" : "destructive"
      });

      if (result.success) {
        setTimeout(performContentScan, 500);
      }

    } catch (error) {
      console.error('Single post adjustment failed:', error);
      setAdjustmentTasks(prev => prev.map(t => 
        t.id === post.id 
          ? { ...t, status: 'failed', progress: 100 }
          : t
      ));
    }
  };

  const getQualityBadge = (post: BlogPost) => {
    const metrics = BlogQualityMonitor.analyzeContent(post.content || '', post.target_url);
    const score = metrics.qualityScore;
    
    if (score >= 80) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-blue-500">Good</Badge>;
    if (score >= 40) return <Badge variant="default" className="bg-yellow-500">Poor</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  const getIssuesList = (post: BlogPost) => {
    const metrics = BlogQualityMonitor.analyzeContent(post.content || '', post.target_url);
    return [...metrics.issues, ...metrics.warnings];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Blog Content Validator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Button 
              onClick={performContentScan} 
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
              {isScanning ? 'Scanning...' : 'Scan Content'}
            </Button>
            
            <Button 
              onClick={performBatchAdjustment}
              disabled={isAdjusting || needsAdjustment.length === 0}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isAdjusting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isAdjusting ? 'Adjusting...' : 'Auto-Adjust All'}
            </Button>

            <Button 
              onClick={() => performBatchAdjustment()}
              disabled={selectedPosts.size === 0 || isAdjusting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Adjust Selected ({selectedPosts.size})
            </Button>

            <Button 
              onClick={() => setSelectedPosts(new Set())}
              variant="ghost"
              disabled={selectedPosts.size === 0}
            >
              Clear Selection
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
                      <p className="text-2xl font-bold">{stats.totalPosts}</p>
                    </div>
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical Issues</p>
                      <p className="text-2xl font-bold text-red-600">{stats.criticalPosts}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Needs Fixing</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.poorPosts}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Malformed</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.malformedPosts}</p>
                    </div>
                    <Settings className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">High Priority</p>
                      <p className="text-2xl font-bold text-purple-600">{highPriority.length}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="issues">Issues ({needsAdjustment.length})</TabsTrigger>
              <TabsTrigger value="report">Scan Report</TabsTrigger>
              <TabsTrigger value="tasks">Adjustment Tasks ({adjustmentTasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-4">
              {needsAdjustment.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedPosts.size === needsAdjustment.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPosts(new Set(needsAdjustment.map(p => p.id)));
                            } else {
                              setSelectedPosts(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {needsAdjustment.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedPosts.has(post.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedPosts);
                              if (e.target.checked) {
                                newSelected.add(post.id);
                              } else {
                                newSelected.delete(post.id);
                              }
                              setSelectedPosts(newSelected);
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {post.title}
                        </TableCell>
                        <TableCell>
                          {getQualityBadge(post)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getIssuesList(post).slice(0, 2).map((issue, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {issue.length > 20 ? issue.substring(0, 20) + '...' : issue}
                              </Badge>
                            ))}
                            {getIssuesList(post).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{getIssuesList(post).length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {highPriority.includes(post) ? (
                            <Badge variant="destructive">High</Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => adjustSinglePost(post)}
                              disabled={isAdjusting}
                            >
                              <Wand2 className="h-3 w-3 mr-1" />
                              Fix
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>All Clear!</AlertTitle>
                  <AlertDescription>
                    No blog posts found with formatting issues. Your content is in great shape!
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="report">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Scan Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <pre className="whitespace-pre-wrap text-sm">{scanReport}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              {adjustmentTasks.length > 0 ? (
                <div className="space-y-4">
                  {adjustmentTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{task.post.title}</h4>
                          <div className="flex items-center gap-2">
                            {task.status === 'processing' && <RefreshCw className="h-4 w-4 animate-spin" />}
                            {task.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {task.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'failed' ? 'destructive' : 'secondary'
                            }>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={task.progress} className="mb-2" />
                        {task.result && (
                          <div className="text-sm text-muted-foreground">
                            {task.result.wasAdjusted ? (
                              <span className="text-green-600">
                                ✅ Quality improved: {task.result.qualityScore.before} → {task.result.qualityScore.after}
                              </span>
                            ) : (
                              <span>No adjustment needed</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No Active Tasks</AlertTitle>
                  <AlertDescription>
                    Start an adjustment process to see task progress here.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
