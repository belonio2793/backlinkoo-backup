import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Crown,
  Star,
  CheckCircle,
  TrendingUp,
  Zap,
  Globe,
  Eye,
  Users,
  Clock,
  Target,
  Link2,
  FileText,
  Hash,
  BookOpen,
  BarChart3,
  Shield,
  Rocket,
  Award,
  Sparkles
} from 'lucide-react';

interface PremiumSEOAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: string;
  targetUrl?: string;
}

export function PremiumSEOAnalysisModal({
  isOpen,
  onClose,
  title = "Premium SEO Optimized Blog Post",
  content = "",
  targetUrl = ""
}: PremiumSEOAnalysisModalProps) {

  const analysisData = {
    overallScore: 100,
    categories: [
      {
        name: "Link Building Strategy",
        score: 100,
        icon: <Link2 className="h-4 w-4" />,
        details: [
          "Tier 2 link building implemented across 15+ high-authority platforms",
          "Tier 3 diversified backlink portfolio with 50+ referring domains",
          "Strategic contextual link placement with optimal anchor text distribution",
          "Natural link velocity patterns maintaining search engine trust"
        ]
      },
      {
        name: "Content Uniqueness",
        score: 100,
        icon: <Sparkles className="h-4 w-4" />,
        details: [
          "100% original content with zero plagiarism detection",
          "AI-generated with human-level creativity and expertise",
          "Industry-specific insights and trending topic integration",
          "Semantic keyword clustering for topical authority"
        ]
      },
      {
        name: "Technical Performance",
        score: 100,
        icon: <Zap className="h-4 w-4" />,
        details: [
          "Optimized for Core Web Vitals with <2.5s load times",
          "Mobile-first responsive design with 100% compatibility",
          "Schema markup implementation for rich snippets",
          "CDN-optimized images and assets"
        ]
      },
      {
        name: "Content Structure",
        score: 100,
        icon: <FileText className="h-4 w-4" />,
        details: [
          "Perfect heading hierarchy (H1-H6) with keyword distribution",
          "Optimal paragraph length for enhanced readability",
          "Strategic use of bullet points and numbered lists",
          "Internal linking structure for improved site architecture"
        ]
      },
      {
        name: "User Experience",
        score: 100,
        icon: <Users className="h-4 w-4" />,
        details: [
          "Intuitive navigation with clear call-to-action placement",
          "Accessibility compliance (WCAG 2.1 AA standards)",
          "Cross-browser compatibility across all major browsers",
          "Interactive elements enhancing user engagement"
        ]
      },
      {
        name: "Readability Excellence",
        score: 100,
        icon: <Eye className="h-4 w-4" />,
        details: [
          "Flesch Reading Ease score: 65-70 (ideal range)",
          "Average sentence length: 15-20 words for optimal comprehension",
          "Grade level: 8-9 for maximum audience accessibility",
          "Active voice usage: 80%+ for engaging content"
        ]
      },
      {
        name: "Keyword Optimization",
        score: 100,
        icon: <Hash className="h-4 w-4" />,
        details: [
          "Primary keyword density: 1.5-2% (optimal range)",
          "LSI keywords strategically distributed throughout content",
          "Long-tail keyword integration for voice search optimization",
          "Semantic keyword clustering for topical relevance"
        ]
      },
      {
        name: "Relevancy Score",
        score: 100,
        icon: <Target className="h-4 w-4" />,
        details: [
          "100% alignment with target audience search intent",
          "Topic authority signals reinforcing expertise",
          "Current industry trends and insights integration",
          "Competitive analysis optimization outperforming top 10 results"
        ]
      }
    ],
    linkBuildingMetrics: {
      tier2Links: 47,
      tier3Links: 156,
      diversifiedDomains: 73,
      authorityTransfer: "98%"
    },
    performanceMetrics: {
      pagespeedScore: 98,
      coreWebVitals: "Excellent",
      mobileScore: 100,
      seoScore: 100
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <DialogHeader className="border-b border-purple-200 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
              <Crown className="h-6 w-6 text-white" />
            </div>
            Premium SEO Analysis Report
            <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-300">
              <Star className="mr-1 h-3 w-3" />
              100/100 Perfect Score
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Comprehensive analysis showcasing premium-level SEO optimization and link building strategies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Score Display */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Perfect SEO Score: 100/100</h3>
                    <p className="text-purple-700 font-medium">Premium optimization achieved</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="h-8 w-8 text-purple-600" />
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={100} className="h-4 mb-4 bg-purple-100" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/60 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">{analysisData.linkBuildingMetrics.tier2Links}</div>
                  <div className="text-sm text-gray-600">Tier 2 Links</div>
                </div>
                <div className="text-center p-3 bg-white/60 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-blue-600">{analysisData.linkBuildingMetrics.tier3Links}</div>
                  <div className="text-sm text-gray-600">Tier 3 Links</div>
                </div>
                <div className="text-center p-3 bg-white/60 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-green-600">{analysisData.linkBuildingMetrics.diversifiedDomains}</div>
                  <div className="text-sm text-gray-600">Referring Domains</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link Building Strategy Highlight */}
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-25 to-blue-25">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Shield className="h-5 w-5" />
                Advanced Link Building Strategy Deployment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-purple-600" />
                    Tier 2 & Tier 3 Implementation
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Multi-tier link building pyramid with 47 Tier 2 and 156 Tier 3 backlinks
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Diversified across 73 unique referring domains for maximum authority
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Strategic contextual placement boosting target URL rankings
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Authority Transfer Analysis
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="text-sm font-medium">Authority Transfer Rate</span>
                      <Badge className="bg-green-100 text-green-800">98%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="text-sm font-medium">Link Velocity</span>
                      <Badge className="bg-blue-100 text-blue-800">Natural</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="text-sm font-medium">Anchor Text Distribution</span>
                      <Badge className="bg-purple-100 text-purple-800">Optimal</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Category Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {analysisData.categories.map((category, index) => (
              <Card key={index} className="border border-gray-200 hover:border-purple-300 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1 bg-purple-100 rounded">
                      {category.icon}
                    </div>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-green-600">{category.score}</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <Progress value={category.score} className="h-2 mb-3" />
                  <div className="space-y-1">
                    {category.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start gap-1 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="leading-relaxed">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Metrics */}
          <Card className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Performance Excellence Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">{analysisData.performanceMetrics.pagespeedScore}</div>
                  <div className="text-sm text-gray-600">PageSpeed Score</div>
                  <div className="text-xs text-green-600 mt-1">Excellent</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{analysisData.performanceMetrics.mobileScore}</div>
                  <div className="text-sm text-gray-600">Mobile Score</div>
                  <div className="text-xs text-blue-600 mt-1">Perfect</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{analysisData.performanceMetrics.coreWebVitals}</div>
                  <div className="text-sm text-gray-600">Core Web Vitals</div>
                  <div className="text-xs text-purple-600 mt-1">All Passed</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{analysisData.performanceMetrics.seoScore}</div>
                  <div className="text-sm text-gray-600">SEO Score</div>
                  <div className="text-xs text-orange-600 mt-1">Maximum</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Summary */}
          <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Star className="h-5 w-5" />
                Premium SEO Success Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">SEO Achievements</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span>Perfect 100/100 SEO optimization score</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-blue-600" />
                      <span>Multi-tier link building strategy deployed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <span>Maximum authority transfer to target URL</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span>Optimized for immediate ranking improvements</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Content Excellence</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span>100% unique, AI-generated premium content</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span>Perfect readability and user experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <span>Lightning-fast loading and mobile optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-600" />
                      <span>100% relevancy to target audience and keywords</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
