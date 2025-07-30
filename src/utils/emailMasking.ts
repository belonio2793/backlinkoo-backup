/**
 * Email masking utilities for privacy protection
 */

export interface MaskedEmail {
  maskedEmail: string;
  isOwner: boolean;
}

/**
 * Mask an email address for public display
 * Examples:
 * - john.doe@gmail.com -> j***doe***@gmail.com
 * - user123@example.com -> u***123***@example.com
 * - a@b.co -> a***@b.co
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return 'anonymous***@domain.com';
  }

  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    return 'anonymous***@domain.com';
  }

  // For very short local parts (1-2 chars), show first char only
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  // For longer local parts, show first and last few characters
  if (localPart.length <= 6) {
    return `${localPart[0]}***${localPart.slice(-1)}***@${domain}`;
  }

  // For long local parts, show more context
  const firstPart = localPart.slice(0, 2);
  const lastPart = localPart.slice(-2);
  return `${firstPart}***${lastPart}***@${domain}`;
}

/**
 * Get masked email for blog post display with ownership context
 */
export function getBlogPostEmail(
  postUserId: string | null | undefined,
  currentUserId: string | null | undefined,
  userEmail: string | null | undefined
): MaskedEmail {
  // No user assigned to post
  if (!postUserId) {
    return {
      maskedEmail: '',
      isOwner: false
    };
  }

  // Current user owns the post
  if (postUserId === currentUserId && userEmail) {
    return {
      maskedEmail: userEmail, // Show full email to owner
      isOwner: true
    };
  }

  // Someone else owns the post - show masked version
  // In a real app, you'd fetch the owner's email from the database
  // For now, we'll use a placeholder since we don't have access to other users' emails
  return {
    maskedEmail: 'claimed***@user.com',
    isOwner: false
  };
}

/**
 * Format email for display in UI components
 */
export function formatEmailForDisplay(
  email: string | null | undefined,
  isOwner: boolean,
  showLabel: boolean = true
): string {
  if (!email) {
    return '';
  }

  const displayEmail = email;
  const label = isOwner ? 'Your post' : 'Claimed by';
  
  if (showLabel) {
    return `${label}: ${displayEmail}`;
  }
  
  return displayEmail;
}

/**
 * Check if an email should be shown based on privacy settings
 */
export function shouldShowEmail(
  postUserId: string | null | undefined,
  currentUserId: string | null | undefined,
  isPublicView: boolean = false
): boolean {
  // Always show email to the owner
  if (postUserId === currentUserId) {
    return true;
  }

  // In public view, only show masked emails for claimed posts
  if (isPublicView) {
    return !!postUserId;
  }

  // In private dashboard view, show if claimed
  return !!postUserId;
}

/**
 * Get the appropriate email to display on a blog post
 */
export function getDisplayEmailForPost(
  post: {
    user_id?: string | null;
    is_trial_post?: boolean;
  },
  currentUser: {
    id?: string | null;
    email?: string | null;
  } | null = null,
  isPublicView: boolean = false
): { email: string; label: string; isOwner: boolean } | null {
  // No user claimed this post
  if (!post.user_id || post.is_trial_post) {
    return null;
  }

  const isOwner = post.user_id === currentUser?.id;
  
  if (isOwner && currentUser?.email) {
    return {
      email: currentUser.email,
      label: 'Your claimed post',
      isOwner: true
    };
  }

  // Show masked email for claimed posts
  return {
    email: maskEmail('user@example.com'), // Placeholder - in real app, get from database
    label: 'Claimed post',
    isOwner: false
  };
}
