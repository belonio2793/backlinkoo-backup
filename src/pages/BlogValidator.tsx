/**
 * Blog Validator Page
 * 
 * Provides a dedicated interface for blog content validation and auto-adjustment.
 * This page allows users to scan their blog content, identify formatting issues,
 * and automatically fix malformed posts.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BlogContentValidator } from '@/components/blog/BlogContentValidator';
import { 
  Scan,
  Wand2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

export default function BlogValidator() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Blog Content Validator
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Automatically detect and fix malformed blog content to ensure consistent, 
                high-quality formatting across your /blog section.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Scan className="h-3 w-3" />
                Auto-Detection
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Wand2 className="h-3 w-3" />
                Auto-Repair
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scan className="h-5 w-5 text-blue-500" />
                Content Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically scans all blog posts to identify formatting issues, 
                malformed HTML, broken links, and structural problems.
              </p>
              <div className="mt-3 space-y-1">
                <div className="text-xs text-muted-foreground">• Malformed bold patterns</div>
                <div className="text-xs text-muted-foreground">• Broken HTML entities</div>
                <div className="text-xs text-muted-foreground">• Corrupted link attributes</div>
                <div className="text-xs text-muted-foreground">• Missing heading structure</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Auto-Adjustment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Intelligently repairs content using progressive formatting techniques 
                without over-processing that could corrupt the original content.
              </p>
              <div className="mt-3 space-y-1">
                <div className="text-xs text-muted-foreground">• Link attribute fixes</div>
                <div className="text-xs text-muted-foreground">• HTML structure repair</div>
                <div className="text-xs text-muted-foreground">• Content formatting</div>
                <div className="text-xs text-muted-foreground">• Quality validation</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Quality Assurance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Provides quality scoring and monitoring to ensure all blog content 
                meets high standards for readability and technical correctness.
              </p>
              <div className="mt-3 space-y-1">
                <div className="text-xs text-muted-foreground">• Quality scoring (0-100)</div>
                <div className="text-xs text-muted-foreground">• Issue categorization</div>
                <div className="text-xs text-muted-foreground">• Performance tracking</div>
                <div className="text-xs text-muted-foreground">• Batch processing</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How It Works</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              The validator scans blog content for common formatting issues and applies 
              targeted fixes. Content is processed using multiple validation layers to 
              ensure quality without compromising the original meaning or structure.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Safety Features</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              Original content is preserved before any adjustments. The system uses 
              progressive repair techniques and quality thresholds to prevent 
              over-processing that could damage well-formed content.
            </AlertDescription>
          </Alert>
        </div>

        {/* Main Validator Component */}
        <BlogContentValidator />
      </div>
    </div>
  );
}
