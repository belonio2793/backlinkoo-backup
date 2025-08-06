/**
 * Utility function to clean blog post titles
 * Removes markdown artifacts, **Title:** prefixes, and other formatting
 */

export const cleanTitle = (title: string): string => {
  if (!title) return '';
  
  // Remove all markdown artifacts from title including ** wrappers and Title: prefix
  return title
    .replace(/^\s*\*\*Title:\s*([^*]*)\*\*\s*/i, '$1') // Remove **Title:** wrapper and extract content
    .replace(/^\*\*H1\*\*:\s*/i, '')
    .replace(/^\*\*Title\*\*:\s*/i, '') // Remove **Title**: prefix
    .replace(/^Title:\s*/gi, '') // Remove Title: prefix (global + case insensitive)
    .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
    .replace(/^\*\*(.+?)\*\*$/i, '$1') // Handle **title** format
    .replace(/\*\*/g, '') // Remove any remaining ** symbols
    .replace(/\*/g, '') // Remove any remaining * symbols
    .replace(/^#{1,6}\s+/, '')
    .replace(/^Title:\s*/gi, '') // Final cleanup for any remaining Title: patterns
    .trim();
};
