/**
 * Enhanced Blog Form with Title Autosuggest
 * 
 * Provides a complete blog creation/editing form with intelligent title suggestions,
 * content validation, and security processing.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { TitleAutosuggest } from './TitleAutosuggest';
import { BlogSecurityMiddleware } from '@/utils/blogSecurityMiddleware';
import { BlogTitleService } from '@/services/blogTitleService';
import { blogService } from '@/services/blogService';
import {
  Save,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  FileText,
  Link,
  Hash
} from 'lucide-react';

interface BlogFormData {
  title: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  targetUrl: string;
  anchorText: string;
  status: 'draft' | 'published';
}

interface EnhancedBlogFormProps {
  blogPost?: any;
  onSave?: (data: BlogFormData) => void;
  onPreview?: (data: BlogFormData) => void;
  isEditing?: boolean;
  showPreview?: boolean;
}

export function EnhancedBlogForm({
  blogPost,
  onSave,
  onPreview,
  isEditing = false,
  showPreview = true
}: EnhancedBlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>({
    title: blogPost?.title || '',
    content: blogPost?.content || '',
    metaDescription: blogPost?.meta_description || '',
    keywords: blogPost?.keywords || [],
    targetUrl: blogPost?.target_url || '',
    anchorText: blogPost?.anchor_text || '',
    status: blogPost?.status || 'draft'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const { toast } = useToast();

  // Validate content security when content changes
  useEffect(() => {
    if (formData.content.trim()) {
      const validation = BlogSecurityMiddleware.validateForStorage(
        formData.content, 
        formData.title
      );
      setSecurityStatus(validation);
    } else {
      setSecurityStatus(null);
    }
  }, [formData.content, formData.title]);

  // Validate form
  useEffect(() => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push('Title is required');
    }
    
    if (!formData.content.trim()) {
      errors.push('Content is required');
    }
    
    if (formData.content.length < 100) {
      errors.push('Content should be at least 100 characters');
    }
    
    if (!formData.metaDescription.trim()) {
      errors.push('Meta description is recommended for SEO');
    }
    
    if (formData.keywords.length === 0) {
      errors.push('At least one keyword is recommended');
    }
    
    setValidationErrors(errors);
  }, [formData]);

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      handleInputChange('keywords', [...formData.keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    const newKeywords = formData.keywords.filter((_, i) => i !== index);
    handleInputChange('keywords', newKeywords);
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Errors",
        description: "Please fix the validation errors before saving.",
        variant: "destructive"
      });
      return;
    }

    if (securityStatus && !securityStatus.isValid) {
      toast({
        title: "Security Issues",
        description: "Content contains security issues that must be resolved.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Apply title corrections if needed
      const titleAnalysis = BlogTitleService.analyzeTitleCorrections(formData.title);
      const finalData = {
        ...formData,
        title: titleAnalysis.corrected,
        content: securityStatus?.sanitizedContent || formData.content
      };

      onSave?.(finalData);
      
      toast({
        title: "Blog Post Saved",
        description: titleAnalysis.corrections.length > 0 
          ? `Saved with ${titleAnalysis.corrections.length} title correction(s)`
          : "Blog post saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    const titleAnalysis = BlogTitleService.analyzeTitleCorrections(formData.title);
    const previewData = {
      ...formData,
      title: titleAnalysis.corrected,
      content: securityStatus?.sanitizedContent || formData.content
    };
    onPreview?.(previewData);
  };

  const isValid = validationErrors.length === 0 && (!securityStatus || securityStatus.isValid);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Title with Autosuggest */}
          <div className="space-y-4">
            <TitleAutosuggest
              initialTitle={formData.title}
              onTitleChange={(title) => handleInputChange('title', title)}
              onTitleSelect={(title) => handleInputChange('title', title)}
              blogPostId={blogPost?.id}
              placeholder="Enter your blog post title..."
              showVariations={true}
            />
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your blog post content here..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formData.content.length} characters</span>
              <span>{Math.ceil(formData.content.length / 5)} words (estimated)</span>
            </div>
          </div>

          {/* Security Status */}
          {securityStatus && (
            <Card className={`border-2 ${
              securityStatus.isValid 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`h-4 w-4 ${
                    securityStatus.isValid ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`font-medium ${
                    securityStatus.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Content Security {securityStatus.isValid ? 'Validated' : 'Issues Detected'}
                  </span>
                </div>
                
                {securityStatus.warnings.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                    <ul className="text-xs space-y-1">
                      {securityStatus.warnings.map((warning: string, index: number) => (
                        <li key={index} className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {securityStatus.errors.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm font-medium text-red-800">Errors:</p>
                    <ul className="text-xs space-y-1">
                      {securityStatus.errors.map((error: string, index: number) => (
                        <li key={index} className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => handleInputChange('metaDescription', e.target.value)}
              placeholder="Brief description for search engines..."
              className="h-20"
              maxLength={160}
            />
            <div className="text-xs text-gray-500">
              {formData.metaDescription.length}/160 characters
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Keywords
            </Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button type="button" onClick={handleAddKeyword} size="sm">
                Add
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* SEO Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Target URL
              </Label>
              <Input
                id="targetUrl"
                type="url"
                value={formData.targetUrl}
                onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anchorText">Anchor Text</Label>
              <Input
                id="anchorText"
                value={formData.anchorText}
                onChange={(e) => handleInputChange('anchorText', e.target.value)}
                placeholder="Link text..."
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-1">
                  <p className="font-medium">Please address these issues:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              {isValid ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to save
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {validationErrors.length} issue(s) to fix
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {showPreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!formData.title || !formData.content}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              
              <Button
                type="button"
                onClick={handleSave}
                disabled={!isValid || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update' : 'Save'} Blog Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
