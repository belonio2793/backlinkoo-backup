import html2pdf from 'html2pdf.js';

export interface DocumentConfig {
  title: string;
  content: string;
  targetUrl: string;
  anchorText: string;
  keyword: string;
  format: 'pdf' | 'html' | 'docx' | 'txt';
  template: DocumentTemplate;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
    description?: string;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  format: 'pdf' | 'html' | 'docx';
  htmlTemplate: string;
  styling: string;
  placeholders: string[];
  seoOptimized: boolean;
  platformOptimized: string[];
}

export interface GeneratedDocument {
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
  htmlContent?: string;
  metadata: DocumentConfig['metadata'];
}

class DocumentGenerationService {
  private templates: DocumentTemplate[];

  constructor() {
    this.templates = this.initializeTemplates();
  }

  private initializeTemplates(): DocumentTemplate[] {
    return [
      {
        id: 'professional-article',
        name: 'Professional Article',
        description: 'Clean, professional document format for business content',
        format: 'pdf',
        htmlTemplate: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{TITLE}}</title>
            <meta name="description" content="{{DESCRIPTION}}">
            <meta name="keywords" content="{{KEYWORDS}}">
            <meta name="author" content="{{AUTHOR}}">
          </head>
          <body>
            <header>
              <h1>{{TITLE}}</h1>
              <div class="meta">
                <span class="author">By {{AUTHOR}}</span>
                <span class="date">{{DATE}}</span>
                <span class="topic">{{KEYWORD}}</span>
              </div>
            </header>
            <main>
              <article>
                {{CONTENT}}
              </article>
              <footer>
                <div class="references">
                  <h3>References & Resources</h3>
                  <ul>
                    <li><a href="{{TARGET_URL}}">{{ANCHOR_TEXT}}</a></li>
                  </ul>
                </div>
                <div class="attribution">
                  <p>For more information, visit: <a href="{{TARGET_URL}}">{{ANCHOR_TEXT}}</a></p>
                </div>
              </footer>
            </main>
          </body>
          </html>
        `,
        styling: `
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
          }
          header {
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #2c5aa0;
            font-size: 2.5em;
            margin-bottom: 10px;
            line-height: 1.2;
          }
          .meta {
            display: flex;
            gap: 20px;
            font-size: 0.9em;
            color: #666;
          }
          .meta span {
            padding: 5px 10px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          article {
            font-size: 1.1em;
            margin-bottom: 40px;
          }
          article h2 {
            color: #2c5aa0;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          article h3 {
            color: #444;
            margin-top: 25px;
            margin-bottom: 10px;
          }
          article p {
            margin-bottom: 15px;
            text-align: justify;
          }
          article ul, article ol {
            margin-bottom: 15px;
            padding-left: 25px;
          }
          article li {
            margin-bottom: 5px;
          }
          footer {
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 30px;
          }
          .references h3 {
            color: #2c5aa0;
            margin-bottom: 10px;
          }
          .references ul {
            list-style: none;
            padding: 0;
          }
          .references li {
            margin-bottom: 8px;
            padding: 8px;
            background: #f9f9f9;
            border-left: 3px solid #2c5aa0;
          }
          a {
            color: #2c5aa0;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
          .attribution {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background: #f0f5ff;
            border-radius: 8px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .meta { flex-direction: column; gap: 5px; }
          }
        `,
        placeholders: ['TITLE', 'CONTENT', 'TARGET_URL', 'ANCHOR_TEXT', 'KEYWORD', 'AUTHOR', 'DATE', 'DESCRIPTION', 'KEYWORDS'],
        seoOptimized: true,
        platformOptimized: ['google-drive', 'dropbox', 'onedrive']
      },
      {
        id: 'research-report',
        name: 'Research Report',
        description: 'Academic-style research document with citations',
        format: 'pdf',
        htmlTemplate: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{TITLE}} - Research Report</title>
            <meta name="description" content="{{DESCRIPTION}}">
            <meta name="keywords" content="{{KEYWORDS}}">
          </head>
          <body>
            <div class="cover-page">
              <h1>{{TITLE}}</h1>
              <h2>Research Report</h2>
              <div class="report-meta">
                <p><strong>Subject:</strong> {{KEYWORD}}</p>
                <p><strong>Date:</strong> {{DATE}}</p>
                <p><strong>Author:</strong> {{AUTHOR}}</p>
              </div>
            </div>
            <div class="content-page">
              <div class="abstract">
                <h2>Abstract</h2>
                <p>{{DESCRIPTION}}</p>
              </div>
              <div class="main-content">
                {{CONTENT}}
              </div>
              <div class="bibliography">
                <h2>References</h2>
                <ol>
                  <li><a href="{{TARGET_URL}}">{{ANCHOR_TEXT}}</a> - Primary resource for {{KEYWORD}} research.</li>
                </ol>
              </div>
            </div>
          </body>
          </html>
        `,
        styling: `
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.8;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .cover-page {
            page-break-after: always;
            text-align: center;
            padding: 100px 40px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .cover-page h1 {
            font-size: 2.8em;
            margin-bottom: 20px;
            color: #1a1a1a;
          }
          .cover-page h2 {
            font-size: 1.8em;
            color: #666;
            font-weight: normal;
            margin-bottom: 40px;
          }
          .report-meta {
            margin-top: 60px;
            text-align: left;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }
          .report-meta p {
            font-size: 1.2em;
            margin-bottom: 10px;
          }
          .content-page {
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .abstract {
            margin-bottom: 40px;
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid #333;
          }
          .abstract h2 {
            margin-top: 0;
            color: #333;
          }
          .main-content h2 {
            color: #1a1a1a;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.4em;
          }
          .main-content h3 {
            color: #333;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.2em;
          }
          .main-content p {
            margin-bottom: 20px;
            text-align: justify;
            text-indent: 20px;
          }
          .bibliography {
            margin-top: 50px;
            border-top: 2px solid #333;
            padding-top: 20px;
          }
          .bibliography h2 {
            color: #1a1a1a;
            margin-bottom: 20px;
          }
          .bibliography ol {
            padding-left: 25px;
          }
          .bibliography li {
            margin-bottom: 10px;
            line-height: 1.6;
          }
          a {
            color: #0066cc;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `,
        placeholders: ['TITLE', 'CONTENT', 'TARGET_URL', 'ANCHOR_TEXT', 'KEYWORD', 'AUTHOR', 'DATE', 'DESCRIPTION', 'KEYWORDS'],
        seoOptimized: true,
        platformOptimized: ['box', 'mega', 'google-drive']
      },
      {
        id: 'how-to-guide',
        name: 'How-To Guide',
        description: 'Step-by-step instructional document',
        format: 'pdf',
        htmlTemplate: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{TITLE}} - Complete Guide</title>
            <meta name="description" content="{{DESCRIPTION}}">
            <meta name="keywords" content="{{KEYWORDS}}">
          </head>
          <body>
            <header>
              <div class="guide-header">
                <h1>{{TITLE}}</h1>
                <p class="subtitle">A Complete Step-by-Step Guide</p>
                <div class="guide-meta">
                  <span class="topic">{{KEYWORD}}</span>
                  <span class="date">{{DATE}}</span>
                </div>
              </div>
            </header>
            <main>
              <div class="content">
                {{CONTENT}}
              </div>
              <div class="resources">
                <h2>🔗 Additional Resources</h2>
                <div class="resource-card">
                  <h3>Recommended Resource</h3>
                  <p>For more detailed information and advanced techniques, check out:</p>
                  <a href="{{TARGET_URL}}" class="resource-link">{{ANCHOR_TEXT}}</a>
                  <p class="resource-desc">This comprehensive resource provides additional insights into {{KEYWORD}}.</p>
                </div>
              </div>
            </main>
          </body>
          </html>
        `,
        styling: `
          body {
            font-family: 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .guide-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 20px;
          }
          .guide-meta {
            display: flex;
            justify-content: center;
            gap: 20px;
          }
          .guide-meta span {
            background: rgba(255,255,255,0.2);
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.9em;
          }
          main {
            background: white;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            border-radius: 10px 10px 0 0;
            margin-top: -20px;
            position: relative;
            z-index: 1;
          }
          .content h2 {
            color: #667eea;
            border-left: 4px solid #667eea;
            padding-left: 15px;
            margin-top: 30px;
            margin-bottom: 20px;
          }
          .content h3 {
            color: #555;
            margin-top: 25px;
            margin-bottom: 15px;
          }
          .content p {
            margin-bottom: 15px;
          }
          .content ol {
            counter-reset: step-counter;
            list-style: none;
            padding-left: 0;
          }
          .content ol li {
            counter-increment: step-counter;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 5px;
            position: relative;
          }
          .content ol li::before {
            content: "Step " counter(step-counter);
            background: #667eea;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
            position: absolute;
            top: -10px;
            left: 15px;
          }
          .resources {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #eee;
          }
          .resources h2 {
            color: #667eea;
            text-align: center;
            margin-bottom: 25px;
          }
          .resource-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 10px;
            text-align: center;
          }
          .resource-card h3 {
            color: #333;
            margin-bottom: 15px;
          }
          .resource-link {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 15px 0;
            transition: all 0.3s ease;
          }
          .resource-link:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
          }
          .resource-desc {
            font-size: 0.9em;
            color: #666;
            margin-top: 15px;
          }
        `,
        placeholders: ['TITLE', 'CONTENT', 'TARGET_URL', 'ANCHOR_TEXT', 'KEYWORD', 'AUTHOR', 'DATE', 'DESCRIPTION', 'KEYWORDS'],
        seoOptimized: true,
        platformOptimized: ['dropbox', 'onedrive', 'google-drive']
      },
      {
        id: 'simple-html',
        name: 'Simple HTML Document',
        description: 'Clean HTML document for web viewing',
        format: 'html',
        htmlTemplate: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{TITLE}}</title>
            <meta name="description" content="{{DESCRIPTION}}">
            <meta name="keywords" content="{{KEYWORDS}}">
          </head>
          <body>
            <div class="container">
              <header>
                <h1>{{TITLE}}</h1>
                <p class="meta">Topic: {{KEYWORD}} | Date: {{DATE}}</p>
              </header>
              <main>
                {{CONTENT}}
              </main>
              <footer>
                <p>For more information: <a href="{{TARGET_URL}}">{{ANCHOR_TEXT}}</a></p>
              </footer>
            </div>
          </body>
          </html>
        `,
        styling: `
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #f4f4f4;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .meta {
            color: #666;
            font-size: 0.9em;
          }
          main h2 {
            color: #2c3e50;
            margin-top: 25px;
          }
          main p {
            margin-bottom: 15px;
          }
          footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          a {
            color: #3498db;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `,
        placeholders: ['TITLE', 'CONTENT', 'TARGET_URL', 'ANCHOR_TEXT', 'KEYWORD', 'AUTHOR', 'DATE', 'DESCRIPTION', 'KEYWORDS'],
        seoOptimized: true,
        platformOptimized: ['all']
      }
    ];
  }

  // Generate document from config
  async generateDocument(config: DocumentConfig): Promise<GeneratedDocument> {
    const template = this.getTemplateById(config.template.id) || this.templates[0];
    
    // Prepare variables for template replacement
    const variables = {
      TITLE: config.title,
      CONTENT: this.formatContentForDocument(config.content, config.targetUrl, config.anchorText),
      TARGET_URL: config.targetUrl,
      ANCHOR_TEXT: config.anchorText,
      KEYWORD: config.keyword,
      AUTHOR: config.metadata?.author || 'Content Creator',
      DATE: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      DESCRIPTION: config.metadata?.description || `Comprehensive guide about ${config.keyword}`,
      KEYWORDS: config.metadata?.keywords?.join(', ') || config.keyword
    };

    // Replace placeholders in template
    let htmlContent = template.htmlTemplate;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Add CSS styling
    htmlContent = htmlContent.replace('</head>', `<style>${template.styling}</style></head>`);

    // Generate document based on format
    switch (config.format) {
      case 'pdf':
        return await this.generatePDF(htmlContent, config);
      case 'html':
        return this.generateHTML(htmlContent, config);
      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }
  }

  // Generate PDF from HTML
  private async generatePDF(htmlContent: string, config: DocumentConfig): Promise<GeneratedDocument> {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
      margin: 0.5,
      filename: this.generateFilename(config.title, 'pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      
      return {
        blob: pdfBlob,
        filename: opt.filename,
        mimeType: 'application/pdf',
        size: pdfBlob.size,
        htmlContent,
        metadata: config.metadata
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  // Generate HTML document
  private generateHTML(htmlContent: string, config: DocumentConfig): GeneratedDocument {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const filename = this.generateFilename(config.title, 'html');

    return {
      blob,
      filename,
      mimeType: 'text/html',
      size: blob.size,
      htmlContent,
      metadata: config.metadata
    };
  }

  // Format content for document with embedded links
  private formatContentForDocument(content: string, targetUrl: string, anchorText: string): string {
    // Convert content to HTML if it's plain text
    let formattedContent = content;
    
    // Add paragraph tags if content doesn't have them
    if (!content.includes('<p>') && !content.includes('<h2>')) {
      formattedContent = content
        .split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('\n');
    }

    // Embed backlink naturally in the content
    if (!formattedContent.includes(targetUrl)) {
      // Find a good place to insert the link (middle of content)
      const paragraphs = formattedContent.split('</p>');
      const middleIndex = Math.floor(paragraphs.length / 2);
      
      if (paragraphs[middleIndex]) {
        const linkSentence = ` For more detailed information, check out <a href="${targetUrl}">${anchorText}</a>.`;
        paragraphs[middleIndex] = paragraphs[middleIndex] + linkSentence;
        formattedContent = paragraphs.join('</p>');
      }
    }

    return formattedContent;
  }

  // Generate filename
  private generateFilename(title: string, extension: string): string {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const timestamp = new Date().toISOString().split('T')[0];
    return `${cleanTitle}-${timestamp}.${extension}`;
  }

  // Get template by ID
  getTemplateById(id: string): DocumentTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  // Get all templates
  getAllTemplates(): DocumentTemplate[] {
    return this.templates;
  }

  // Get templates for specific platform
  getTemplatesForPlatform(platform: string): DocumentTemplate[] {
    return this.templates.filter(template => 
      template.platformOptimized.includes(platform) || 
      template.platformOptimized.includes('all')
    );
  }

  // Get optimal template for content type
  getOptimalTemplate(contentType: string, platform: string): DocumentTemplate {
    const platformTemplates = this.getTemplatesForPlatform(platform);
    
    // Content type to template mapping
    const templateMap = {
      'long-form-blog': 'professional-article',
      'how-to-guide': 'how-to-guide',
      'qa-answer': 'research-report',
      'press-release': 'professional-article',
      'forum-reply': 'simple-html',
      'microblog-social': 'simple-html',
      'directory-entry': 'simple-html'
    };

    const preferredTemplateId = templateMap[contentType];
    const preferredTemplate = platformTemplates.find(t => t.id === preferredTemplateId);
    
    return preferredTemplate || platformTemplates[0] || this.templates[0];
  }
}

export const documentGenerationService = new DocumentGenerationService();
export default documentGenerationService;
