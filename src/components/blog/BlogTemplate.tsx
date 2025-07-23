import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  FileText,
  Settings,
  Code
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: string;
  seoElements: string[];
  htmlTemplate: string;
  isDefault: boolean;
}

export function BlogTemplate() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'How-To Guide',
      description: 'Perfect for step-by-step tutorials and instructional content',
      category: 'Educational',
      structure: 'Introduction → Problem → Solution Steps → Conclusion → CTA',
      seoElements: ['H1-H3 headings', 'Internal links', 'Bold keywords', 'Meta description'],
      htmlTemplate: `<h1>{{title}}</h1>
<p class="lead">{{introduction}}</p>
<h2>Understanding {{primaryKeyword}}</h2>
<p>{{problem_description}}</p>
<h2>Step-by-Step Guide</h2>
<h3>Step 1: {{step1_title}}</h3>
<p>{{step1_content}}</p>
<h3>Step 2: {{step2_title}}</h3>
<p>{{step2_content}}</p>
<h2>Best Practices</h2>
<ul>{{best_practices_list}}</ul>
<h2>Conclusion</h2>
<p>{{conclusion}}</p>
<p><a href="{{targetUrl}}" target="_blank"><strong>Learn more about {{primaryKeyword}}</strong></a></p>`,
      isDefault: true
    },
    {
      id: '2',
      name: 'Product Review',
      description: 'Comprehensive product reviews with pros, cons, and recommendations',
      category: 'Review',
      structure: 'Overview → Features → Pros/Cons → Comparison → Verdict → CTA',
      seoElements: ['Star ratings', 'Comparison tables', 'Feature lists', 'CTA buttons'],
      htmlTemplate: `<h1>{{title}}</h1>
<div class="rating">{{star_rating}}</div>
<p class="lead">{{overview}}</p>
<h2>Key Features of {{productName}}</h2>
<ul>{{features_list}}</ul>
<h2>Pros and Cons</h2>
<h3>✅ Pros</h3>
<ul>{{pros_list}}</ul>
<h3>❌ Cons</h3>
<ul>{{cons_list}}</ul>
<h2>Our Verdict</h2>
<p>{{verdict}}</p>
<p><a href="{{targetUrl}}" target="_blank" class="cta-button"><strong>Check Latest Price</strong></a></p>`,
      isDefault: false
    },
    {
      id: '3',
      name: 'Listicle',
      description: 'Numbered lists and top 10 style articles',
      category: 'List',
      structure: 'Introduction → List Items → Summary → CTA',
      seoElements: ['Numbered headings', 'Summary boxes', 'Jump links', 'Featured snippets'],
      htmlTemplate: `<h1>{{title}}</h1>
<p class="lead">{{introduction}}</p>
<div class="table-of-contents">{{toc}}</div>
<h2>1. {{item1_title}}</h2>
<p>{{item1_description}}</p>
<h2>2. {{item2_title}}</h2>
<p>{{item2_description}}</p>
<h2>Summary</h2>
<p>{{summary}}</p>
<p><a href="{{targetUrl}}" target="_blank"><em>Discover more {{primaryKeyword}} tips</em></a></p>`,
      isDefault: false
    }
  ]);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    structure: '',
    htmlTemplate: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.htmlTemplate) {
      toast({
        title: "Missing Information",
        description: "Please provide template name and HTML structure",
        variant: "destructive"
      });
      return;
    }

    const template: Template = {
      id: Date.now().toString(),
      ...newTemplate,
      seoElements: ['Custom elements'],
      isDefault: false
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: '', description: '', category: '', structure: '', htmlTemplate: '' });
    setIsCreating(false);

    toast({
      title: "Template Created",
      description: "New blog template has been saved successfully",
    });
  };

  const duplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      isDefault: false
    };
    setTemplates([...templates, newTemplate]);
    
    toast({
      title: "Template Duplicated",
      description: "Template has been duplicated successfully",
    });
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "Template has been removed successfully",
    });
  };

  const setAsDefault = (templateId: string) => {
    setTemplates(templates.map(t => ({
      ...t,
      isDefault: t.id === templateId
    })));
    toast({
      title: "Default Template Set",
      description: "This template will be used as the default for new posts",
    });
  };

  return (
    <div className="space-y-6">
      {/* Create New Template */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Blog Templates
            </CardTitle>
            <Button onClick={() => setIsCreating(!isCreating)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        {isCreating && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Product Comparison"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateCategory">Category</Label>
                <Input
                  id="templateCategory"
                  placeholder="e.g., Review, Tutorial, News"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Input
                id="templateDescription"
                placeholder="Brief description of when to use this template"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateStructure">Content Structure</Label>
              <Input
                id="templateStructure"
                placeholder="e.g., Introduction → Main Content → Conclusion → CTA"
                value={newTemplate.structure}
                onChange={(e) => setNewTemplate({ ...newTemplate, structure: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateHtml">HTML Template</Label>
              <Textarea
                id="templateHtml"
                placeholder="Enter HTML template with {{variables}} for dynamic content..."
                value={newTemplate.htmlTemplate}
                onChange={(e) => setNewTemplate({ ...newTemplate, htmlTemplate: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use variables like {{title}}, {{primaryKeyword}}, {{targetUrl}}, etc.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Existing Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={template.isDefault ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {template.name}
                    {template.isDefault && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Category</p>
                <Badge variant="outline">{template.category}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Structure</p>
                <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                  {template.structure}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">SEO Elements</p>
                <div className="flex flex-wrap gap-1">
                  {template.seoElements.map((element, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  HTML Template Preview
                </p>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                  {template.htmlTemplate}
                </pre>
              </div>

              <div className="flex gap-2 pt-2">
                {!template.isDefault && (
                  <Button size="sm" onClick={() => setAsDefault(template.id)}>
                    Set as Default
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => duplicateTemplate(template)}>
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {!template.isDefault && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Variables Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Template Variables Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Basic Variables</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><code>{{title}}</code> - Post title</li>
                <li><code>{{primaryKeyword}}</code> - Main keyword</li>
                <li><code>{{targetUrl}}</code> - Target URL for backlink</li>
                <li><code>{{metaDescription}}</code> - SEO description</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Content Variables</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><code>{{introduction}}</code> - Opening paragraph</li>
                <li><code>{{conclusion}}</code> - Closing content</li>
                <li><code>{{mainContent}}</code> - Body content</li>
                <li><code>{{summary}}</code> - Content summary</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Special Variables</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><code>{{toc}}</code> - Table of contents</li>
                <li><code>{{authorName}}</code> - Author name</li>
                <li><code>{{publishDate}}</code> - Publication date</li>
                <li><code>{{backlink}}</code> - Auto backlink HTML</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
