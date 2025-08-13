/**
 * Blog Content Cleaner - Simple utility to fix common formatting issues
 * Removes problematic section headers and formatting artifacts
 */

export class BlogContentCleaner {
  /**
   * Clean blog content by removing section headers and formatting artifacts
   */
  static cleanBlogContent(content: string): string {
    if (!content) return '';

    let cleaned = content;

    // Remove problematic section headers that make content look unprofessional
    cleaned = cleaned
      // Remove section markers
      .replace(/^(Introduction|Section \d+|Conclusion|Call-to-Action):\s*/gim, '')
      .replace(/^(Hook Introduction|Summary|Overview|Abstract):\s*/gim, '')
      
      // Remove HTML syntax artifacts that appear as text
      .replace(/\bH[1-6]:\s*/gi, '')
      .replace(/^Title:\s*/gim, '')
      .replace(/^Hook Introduction:\s*/gim, '')
      
      // Remove markdown artifacts that don't render properly
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s+/gm, '')
      
      // Remove repeated symbols and formatting artifacts
      .replace(/["=]{2,}/g, '')
      .replace(/\*{3,}/g, '')
      
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+/gm, '') // Remove leading whitespace from lines
      .trim();

    return cleaned;
  }

  /**
   * Clean title by removing formatting artifacts
   */
  static cleanTitle(title: string): string {
    if (!title) return '';
    
    return title
      // Remove HTML tag prefixes
      .replace(/^(?:H[1-6]|Title|Heading|Header):\s*/gi, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove markdown syntax
      .replace(/^#+\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove common prefixes
      .replace(/^(?:Blog post|Article|Post):\s*/gi, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Remove duplicate title from content if it appears at the beginning
   */
  static removeDuplicateTitle(content: string, title: string): string {
    if (!content || !title) return content;

    const cleanedTitle = this.cleanTitle(title).toLowerCase().trim();
    if (!cleanedTitle) return content;

    // Split into lines and check first few lines for title match
    const lines = content.split('\n');
    let linesToRemove = 0;

    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const lineText = this.cleanTitle(lines[i]).toLowerCase().trim();
      
      if (lineText === cleanedTitle || 
          cleanedTitle.includes(lineText) || 
          lineText.includes(cleanedTitle)) {
        linesToRemove = i + 1;
        break;
      }
    }

    if (linesToRemove > 0) {
      return lines.slice(linesToRemove).join('\n').trim();
    }

    return content;
  }
}
