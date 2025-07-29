/**
 * Blog Content Migrator Component
 * Admin interface for migrating existing blog posts to consistent HTML formatting
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Eye, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  FileText,
  Zap
} from 'lucide-react';
import BlogContentMigrationService, { type MigrationResult } from '@/services/blogContentMigration';

interface AnalysisData {
  totalPosts: number;
  postsWithIssues: number;
  commonIssues: Record<string, number>;
  averageSeoScore: number;
  details: {
    slug: string;
    title: string;
    seoScore: number;
    issues: string[];
    wordCount: number;
  }[];
}

export default function BlogContentMigrator() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await BlogContentMigrationService.analyzeBlogContent();
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const result = await BlogContentMigrationService.previewMigration();
      setPreviewData(result);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const result = await BlogContentMigrationService.migrateAllBlogPosts();
      setMigrationResult(result);
      // Refresh analysis after migration
      if (result.success) {
        await handleAnalyze();
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>Blog Content Migration Tool</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Fix HTML formatting, SEO structure, and ensure consistent content organization across all blog posts.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Content'}</span>
            </Button>

            <Button
              onClick={handlePreview}
              disabled={isPreviewing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Eye className={`h-4 w-4 ${isPreviewing ? 'animate-pulse' : ''}`} />
              <span>{isPreviewing ? 'Loading Preview...' : 'Preview Changes'}</span>
            </Button>

            <Button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Play className={`h-4 w-4 ${isMigrating ? 'animate-pulse' : ''}`} />
              <span>{isMigrating ? 'Migrating...' : 'Run Migration'}</span>
            </Button>
          </div>

          {/* Migration Progress */}
          {isMigrating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Migration Progress</span>
                <span className="text-sm text-gray-600">Processing...</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Content Analysis Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalPosts}</div>
                <div className="text-sm text-blue-800">Total Posts</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{analysis.postsWithIssues}</div>
                <div className="text-sm text-amber-800">Need Updates</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analysis.averageSeoScore}</div>
                <div className="text-sm text-green-800">Avg SEO Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((analysis.totalPosts - analysis.postsWithIssues) / analysis.totalPosts * 100)}%
                </div>
                <div className="text-sm text-purple-800">Properly Formatted</div>
              </div>
            </div>

            {/* Common Issues */}
            {Object.keys(analysis.commonIssues).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Common Issues Found:</h4>
                <div className="space-y-2">
                  {Object.entries(analysis.commonIssues).map(([issue, count]) => (
                    <div key={issue} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{issue}</span>
                      <Badge variant="secondary">{count} posts</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts with Issues */}
            {analysis.details.filter(p => p.issues.length > 0).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Posts Needing Updates:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analysis.details
                    .filter(p => p.issues.length > 0)
                    .slice(0, 10)
                    .map(post => (
                      <div key={post.slug} className="p-3 border border-gray-200 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{post.title}</span>
                          <Badge variant={post.seoScore >= 70 ? 'default' : 'destructive'}>
                            SEO: {post.seoScore}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {post.issues.slice(0, 3).map((issue, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                          {post.issues.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.issues.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  {analysis.details.filter(p => p.issues.length > 0).length > 10 && (
                    <p className="text-sm text-gray-600 text-center">
                      ...and {analysis.details.filter(p => p.issues.length > 0).length - 10} more posts
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Results */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span>Migration Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {previewData.posts.slice(0, 15).map((post: any) => (
                <div key={post.slug} className="p-3 border border-gray-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{post.title}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {post.currentSeoScore} → {post.newSeoScore}
                      </Badge>
                      {post.newSeoScore > post.currentSeoScore && (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  {post.fixes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.fixes.map((fix: string, i: number) => (
                        <Badge key={i} variant="default" className="text-xs">
                          {fix}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {migrationResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span>Migration Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={migrationResult.success ? 'default' : 'destructive'}>
              <AlertDescription>
                <strong>
                  {migrationResult.success ? 'Migration Completed Successfully!' : 'Migration Failed'}
                </strong>
                <br />
                Processed: {migrationResult.processed} posts, Updated: {migrationResult.updated} posts
                {migrationResult.errors.length > 0 && (
                  <>
                    <br />
                    Errors: {migrationResult.errors.length}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Success Details */}
            {migrationResult.success && migrationResult.details.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Updated Posts:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {migrationResult.details
                    .filter(d => d.fixes.length > 0)
                    .slice(0, 10)
                    .map(detail => (
                      <div key={detail.postId} className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{detail.title}</span>
                          <Badge variant="default">
                            {detail.seoScoreBefore} → {detail.seoScoreAfter}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {detail.fixes.map((fix, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {fix}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Error Details */}
            {migrationResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Errors:</h4>
                <div className="space-y-1">
                  {migrationResult.errors.map((error, i) => (
                    <Alert key={i} variant="destructive">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <span>What This Tool Does</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Analyze Content:</strong> Scans all blog posts for SEO and formatting issues</p>
            <p><strong>Preview Changes:</strong> Shows what will be fixed without making changes</p>
            <p><strong>Run Migration:</strong> Applies fixes to ensure consistent HTML structure:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Ensures only one H1 tag per post (converts extras to H2)</li>
              <li>Fixes heading hierarchy (H1 → H2 → H3)</li>
              <li>Adds proper paragraph structure</li>
              <li>Integrates anchor text with proper links</li>
              <li>Enhances SEO elements and scoring</li>
              <li>Adds proper HTML structure tags</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
