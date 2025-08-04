import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BarChart3,
  TrendingUp,
  Eye,
  FileText,
  Hash,
  Settings,
  BookOpen,
  Globe,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Crown,
  Star
} from 'lucide-react';
import { SEOAnalyzer, type SEOAnalysisResult } from '@/services/seoAnalyzer';

interface SEOScoreDisplayProps {
  score: number;
  title?: string;
  content?: string;
  metaDescription?: string;
  targetKeyword?: string;
  showDetails?: boolean;
}

export function SEOScoreDisplay({
  score,
  title,
  content,
  metaDescription,
  targetKeyword,
  showDetails = true
}: SEOScoreDisplayProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysisResult | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score === 100) return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-300 shadow-md animate-pulse';
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const runAnalysis = () => {
    if (title && content) {
      const result = SEOAnalyzer.analyzeBlogPost(title, content, metaDescription, targetKeyword);
      setAnalysis(result);
      setShowAnalysis(true);
    }
  };

  const getStatusIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`px-3 py-1 cursor-help ${getScoreBadgeColor(score)}`}>
              <TrendingUp className="mr-1 h-3 w-3" />
              SEO Score: {score}/100
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {score === 100 ? (
              <div className="space-y-2 max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                  <p className="font-semibold text-green-600">Perfect SEO Score! 🎉</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  This content achieves the highest SEO optimization possible!
                </p>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
                  <p className="font-semibold text-blue-800 mb-2">🚀 Upgrade to Premium Plan</p>
                  <div className="space-y-1 text-xs text-blue-700">
                    <p>• Claim unlimited high-quality blog posts</p>
                    <p>• Access to 100-score optimized content</p>
                    <p>• Advanced SEO analytics & insights</p>
                    <p>• Priority content generation</p>
                    <p>• Custom keyword targeting</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p>Search Engine Optimization Score</p>
                <p className="text-xs">Higher scores indicate better SEO optimization</p>
              </div>
            )}
          </TooltipContent>
        </Tooltip>

        {showDetails && title && content && (
          <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={runAnalysis}
                className="h-8 px-3 text-xs"
              >
                <BarChart3 className="mr-1 h-3 w-3" />
                Analyze
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  SEO Analysis Report
                </DialogTitle>
                <DialogDescription>
                  Comprehensive analysis of your content's SEO optimization
                </DialogDescription>
              </DialogHeader>

              {analysis && (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className={`rounded-full p-2 ${analysis.overallScore >= 80 ? 'bg-green-100' : analysis.overallScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                          {getStatusIcon(analysis.overallScore)}
                        </div>
                        Overall SEO Score: {analysis.overallScore}/100
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={analysis.overallScore} className="h-3 mb-4" />
                      <p className={`text-sm ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore >= 80 ? 'Excellent SEO optimization!' :
                         analysis.overallScore >= 60 ? 'Good SEO with room for improvement' :
                         'Needs significant SEO improvements'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Title Optimization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{analysis.titleScore}</span>
                          {getStatusIcon(analysis.titleScore)}
                        </div>
                        <Progress value={analysis.titleScore} className="h-2" />
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Length ({analysis.details.title.length} chars)</span>
                            {analysis.details.title.optimalLength ? '✓' : '✗'}
                          </div>
                          <div className="flex justify-between">
                            <span>Has Keywords</span>
                            {analysis.details.title.hasKeywords ? '✓' : '✗'}
                          </div>
                          <div className="flex justify-between">
                            <span>Descriptive</span>
                            {analysis.details.title.isDescriptive ? '✓' : '✗'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Content Quality
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{analysis.contentScore}</span>
                          {getStatusIcon(analysis.contentScore)}
                        </div>
                        <Progress value={analysis.contentScore} className="h-2" />
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Length ({analysis.details.content.wordCount} words)</span>
                            {analysis.details.content.optimalLength ? '��' : '✗'}
                          </div>
                          <div className="flex justify-between">
                            <span>Has Headings</span>
                            {analysis.details.content.hasHeadings ? '✓' : '✗'}
                          </div>
                          <div className="flex justify-between">
                            <span>Keyword Density</span>
                            <span>{analysis.details.content.keywordDensity.toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Structure
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{analysis.structureScore}</span>
                          {getStatusIcon(analysis.structureScore)}
                        </div>
                        <Progress value={analysis.structureScore} className="h-2" />
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>H1 Tag</span>
                            {analysis.details.structure.hasH1 ? '✓' : '✗'}
                          </div>
                          <div className="flex justify-between">
                            <span>H2 Tags</span>
                            {analysis.details.structure.hasH2 ? '✓' : '✗'}
                          </div>
                          <div className="flex justify-between">
                            <span>Paragraphs</span>
                            <span>{analysis.details.structure.paragraphCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Readability
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{analysis.readabilityScore}</span>
                          {getStatusIcon(analysis.readabilityScore)}
                        </div>
                        <Progress value={analysis.readabilityScore} className="h-2" />
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Reading Level</span>
                            <span>{analysis.details.content.readingLevel}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Keywords
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{analysis.keywordScore}</span>
                          {getStatusIcon(analysis.keywordScore)}
                        </div>
                        <Progress value={analysis.keywordScore} className="h-2" />
                        <div className="mt-2 text-xs">
                          <div className="flex justify-between">
                            <span>Density</span>
                            <span>{analysis.details.content.keywordDensity.toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Meta Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{analysis.metaScore}</span>
                          {getStatusIcon(analysis.metaScore)}
                        </div>
                        <Progress value={analysis.metaScore} className="h-2" />
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Meta Description</span>
                            {analysis.details.meta.hasMetaDescription ? '✓' : '✗'}
                          </div>
                          <div className="flex justify-between">
                            <span>Length</span>
                            <span>{analysis.details.meta.metaDescriptionLength}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          SEO Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysis.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-yellow-800">{recommendation}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
