export interface TelegraphAccount {
  access_token: string;
  auth_url: string;
  short_name: string;
  author_name: string;
  author_url?: string;
}

export interface TelegraphPage {
  path: string;
  url: string;
  title: string;
  description: string;
  author_name?: string;
  author_url?: string;
  image_url?: string;
  content: any[];
  views: number;
  can_edit: boolean;
}

export interface CreatePageParams {
  title: string;
  author_name?: string;
  author_url?: string;
  content: string;
  return_content?: boolean;
}

export class TelegraphService {
  private readonly baseUrl = 'https://api.telegra.ph';
  private account: TelegraphAccount | null = null;

  /**
   * Create a Telegraph account for publishing
   */
  async createAccount(): Promise<TelegraphAccount> {
    try {
      const response = await fetch(`${this.baseUrl}/createAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          short_name: 'LinkBuilder',
          author_name: 'Automated Content',
          author_url: ''
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Telegraph API returned invalid JSON response');
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Telegraph API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (!data.ok) {
        throw new Error(`Telegraph API error: ${data.error || 'Unknown error'}`);
      }

      this.account = data.result;
      return this.account;
    } catch (error) {
      console.error('Error creating Telegraph account:', error);
      throw new Error(`Failed to create Telegraph account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publish content to Telegraph
   */
  async publishContent(params: CreatePageParams): Promise<TelegraphPage> {
    // Ensure we have an account
    if (!this.account) {
      await this.createAccount();
    }

    if (!this.account) {
      throw new Error('Failed to create Telegraph account');
    }

    try {
      // Convert HTML content to Telegraph format
      const telegraphContent = this.convertHtmlToTelegraphFormat(params.content);

      const response = await fetch(`${this.baseUrl}/createPage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.account.access_token,
          title: params.title,
          author_name: params.author_name || this.account.author_name,
          author_url: params.author_url || this.account.author_url,
          content: telegraphContent,
          return_content: params.return_content || false
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Telegraph API returned invalid JSON response');
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Telegraph API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (!data.ok) {
        throw new Error(`Telegraph API error: ${data.error || 'Unknown error'}`);
      }

      const page = data.result;
      // Add full URL to the page object
      page.url = `https://telegra.ph/${page.path}`;
      
      return page;
    } catch (error) {
      console.error('Error publishing to Telegraph:', error);
      throw new Error(`Failed to publish to Telegraph: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert HTML content to Telegraph format
   * Telegraph uses a specific DOM structure
   */
  private convertHtmlToTelegraphFormat(htmlContent: string): any[] {
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      const telegraphNodes: any[] = [];

      // Process each child node
      Array.from(tempDiv.children).forEach(element => {
        const node = this.convertElementToTelegraphNode(element);
        if (node) {
          telegraphNodes.push(node);
        }
      });

      // If no children were processed, treat the entire content as text
      if (telegraphNodes.length === 0) {
        // Split by paragraphs and create paragraph nodes
        const paragraphs = htmlContent.split('\n\n').filter(p => p.trim());
        paragraphs.forEach(paragraph => {
          if (paragraph.trim()) {
            telegraphNodes.push({
              tag: 'p',
              children: [paragraph.trim()]
            });
          }
        });
      }

      return telegraphNodes;
    } catch (error) {
      console.error('Error converting HTML to Telegraph format:', error);
      // Fallback: create simple paragraph nodes
      const paragraphs = htmlContent.split('\n\n').filter(p => p.trim());
      return paragraphs.map(paragraph => ({
        tag: 'p',
        children: [paragraph.trim()]
      }));
    }
  }

  /**
   * Convert DOM element to Telegraph node
   */
  private convertElementToTelegraphNode(element: Element): any {
    const tagName = element.tagName.toLowerCase();
    
    // Map HTML tags to Telegraph supported tags
    const tagMapping: { [key: string]: string } = {
      'h1': 'h3',
      'h2': 'h4',
      'h3': 'h4',
      'h4': 'h4',
      'h5': 'h4',
      'h6': 'h4',
      'div': 'p',
      'span': 'p'
    };

    const telegraphTag = tagMapping[tagName] || tagName;

    // Only allow supported Telegraph tags
    const supportedTags = ['p', 'h3', 'h4', 'br', 'strong', 'em', 'u', 'del', 'code', 'pre', 'blockquote', 'a', 'ul', 'ol', 'li'];
    
    if (!supportedTags.includes(telegraphTag)) {
      // For unsupported tags, extract text content and wrap in paragraph
      return {
        tag: 'p',
        children: [element.textContent || '']
      };
    }

    const children: any[] = [];

    // Process child nodes
    Array.from(element.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          children.push(text);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childNode = this.convertElementToTelegraphNode(child as Element);
        if (childNode) {
          children.push(childNode);
        }
      }
    });

    // Handle special cases
    if (telegraphTag === 'a') {
      const href = element.getAttribute('href');
      if (href) {
        return {
          tag: 'a',
          attrs: { href },
          children
        };
      }
    }

    if (telegraphTag === 'br') {
      return { tag: 'br' };
    }

    return {
      tag: telegraphTag,
      children: children.length > 0 ? children : [element.textContent || '']
    };
  }

  /**
   * Generate a title from content and keyword
   */
  generateTitleFromContent(keyword: string): string {
    const titles = [
      `The Ultimate Guide to ${keyword}`,
      `Mastering ${keyword}: Tips and Strategies`,
      `${keyword}: Everything You Need to Know`,
      `Expert Insights on ${keyword}`,
      `${keyword} Best Practices and Techniques`
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  /**
   * Get account information
   */
  getAccount(): TelegraphAccount | null {
    return this.account;
  }

  /**
   * Clear account (for testing or reset)
   */
  clearAccount(): void {
    this.account = null;
  }
}

// Singleton instance
let telegraphService: TelegraphService | null = null;

export const getTelegraphService = (): TelegraphService => {
  if (!telegraphService) {
    telegraphService = new TelegraphService();
  }
  return telegraphService;
};
