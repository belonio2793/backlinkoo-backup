/**
 * Perfect text formatter - DISABLED
 * No autoformatting applied
 */

export function formatModalText(postTitle: string, timeRemaining: string): {
  title: string;
  timeRemaining: string;
  fullText: string;
} {
  // Return text unchanged - no autoformatting
  return {
    title: postTitle || '',
    timeRemaining: timeRemaining || '',
    fullText: `Your blog post "${postTitle}" will be automatically deleted in ${timeRemaining} if left unclaimed.`
  };
}

export function formatTimeDisplay(timeString: string): string {
  // Return text unchanged - no autoformatting
  return timeString;
}
