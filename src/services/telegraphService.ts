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

      if (!response.ok) {
        let errorMessage = `Telegraph API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `Telegraph API error: ${errorData.error}`;
          }
        } catch (parseError) {
          console.warn('Failed to parse Telegraph error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Telegraph API returned invalid JSON response');
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

      if (!response.ok) {
        let errorMessage = `Telegraph API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `Telegraph API error: ${errorData.error}`;
          }
        } catch (parseError) {
          console.warn('Failed to parse Telegraph error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Telegraph API returned invalid JSON response');
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

      return telegraphNodes;
    } catch (error) {
      console.error('Error converting HTML to Telegraph format:', error);
      // Fallback: create simple text nodes
      return [{ tag: 'p', children: [htmlContent.replace(/<[^>]*>/g, '')] }];
    }
  }

  /**
   * Convert HTML element to Telegraph node format
   */
  private convertElementToTelegraphNode(element: Element): any {
    const tagName = element.tagName.toLowerCase();
    
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return {
          tag: 'h3', // Telegraph only supports h3 and h4
          children: this.getTextContent(element)
        };
      
      case 'p':
        const children = this.processChildNodes(element);
        return children.length > 0 ? { tag: 'p', children } : null;
      
      case 'a':
        return {
          tag: 'a',
          attrs: {
            href: element.getAttribute('href') || '',
            target: '_blank'
          },
          children: this.getTextContent(element)
        };
      
      case 'strong':
      case 'b':
        return {
          tag: 'strong',
          children: this.getTextContent(element)
        };
      
      case 'em':
      case 'i':
        return {
          tag: 'em',
          children: this.getTextContent(element)
        };
      
      case 'br':
        return { tag: 'br' };
      
      default:
        // For unsupported tags, just get text content
        const textContent = element.textContent?.trim();
        return textContent ? { tag: 'p', children: [textContent] } : null;
    }
  }

  /**
   * Process child nodes of an element
   */
  private processChildNodes(element: Element): any[] {
    const children: any[] = [];
    
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          children.push(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as Element;
        
        if (childElement.tagName.toLowerCase() === 'a') {
          children.push({
            tag: 'a',
            attrs: {
              href: childElement.getAttribute('href') || '',
              target: '_blank'
            },
            children: [childElement.textContent || '']
          });
        } else if (childElement.tagName.toLowerCase() === 'strong' || childElement.tagName.toLowerCase() === 'b') {
          children.push({
            tag: 'strong',
            children: [childElement.textContent || '']
          });
        } else if (childElement.tagName.toLowerCase() === 'em' || childElement.tagName.toLowerCase() === 'i') {
          children.push({
            tag: 'em',
            children: [childElement.textContent || '']
          });
        } else {
          const text = childElement.textContent?.trim();
          if (text) {
            children.push(text);
          }
        }
      }
    });
    
    return children;
  }

  /**
   * Get text content from element, preserving inline formatting
   */
  private getTextContent(element: Element): string[] {
    const text = element.textContent?.trim();
    return text ? [text] : [];
  }

  /**
   * Generate a title from content
   */
  generateTitleFromContent(keyword: string): string {
    const titles = [
      `The Ultimate Guide to ${keyword}`,
      `Everything You Need to Know About ${keyword}`,
      `Mastering ${keyword}: A Comprehensive Guide`,
      `${keyword}: Tips, Tricks, and Best Practices`,
      `Understanding ${keyword}: A Complete Overview`
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  /**
   * Test Telegraph API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.createAccount();
      return true;
    } catch (error) {
      console.error('Telegraph connection test failed:', error);
      return false;
    }
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
