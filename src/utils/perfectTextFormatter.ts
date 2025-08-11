/**
 * Perfect text formatter for modal content
 * Ensures flawless spacing and formatting
 */

export function formatModalText(postTitle: string, timeRemaining: string): {
  title: string;
  timeRemaining: string;
  fullText: string;
} {
  // Clean and format the title
  const cleanTitle = postTitle
    ? postTitle.trim().replace(/^["']|["']$/g, '') // Remove surrounding quotes
    : 'this content';
  
  // Clean and format the time remaining
  const cleanTime = timeRemaining
    .replace(/(\d+)\s*h\s*(\d+)\s*m\s*remaining/gi, '$1h $2m remaining')
    .replace(/(\d+)\s*m\s*remaining/gi, '$1m remaining')
    .trim();
  
  // Create the perfectly formatted full text
  const fullText = `Your blog post "${cleanTitle}" will be automatically deleted in ${cleanTime} if left unclaimed.`;
  
  return {
    title: cleanTitle,
    timeRemaining: cleanTime,
    fullText
  };
}

export function formatTimeDisplay(timeString: string): string {
  return timeString
    .replace(/(\d+)\s*h\s*(\d+)\s*m/gi, '$1h $2m')
    .replace(/(\d+)\s*m/gi, '$1m')
    .replace(/\s*remaining\s*/gi, ' remaining')
    .trim();
}
