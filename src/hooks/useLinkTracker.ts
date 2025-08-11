import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LinkTrackerState {
  totalLinksBuilt: number;
  canCreateLinks: boolean;
  remainingLinks: number;
  linkLimit: number;
  isNearLimit: boolean;
  hasReachedLimit: boolean;
}

export function useLinkTracker() {
  const { user, isPremium, isAuthenticated } = useAuth();
  const [linkTracker, setLinkTracker] = useState<LinkTrackerState>({
    totalLinksBuilt: 0,
    canCreateLinks: true,
    remainingLinks: 20,
    linkLimit: 20,
    isNearLimit: false,
    hasReachedLimit: false
  });

  // Determine user's link limit based on plan
  const getLinkLimit = useCallback(() => {
    if (isPremium) return Infinity; // Premium users have unlimited links
    return 20; // Guest and Free users have 20 links
  }, [isPremium]);

  // Get storage key based on user type
  const getStorageKey = useCallback(() => {
    if (isAuthenticated && user?.id) {
      return `link_tracker_${user.id}`;
    }
    // For guest users, use a persistent guest ID
    const guestId = localStorage.getItem('guest_user_id') || 'guest_default';
    return `link_tracker_guest_${guestId}`;
  }, [isAuthenticated, user?.id]);

  // Load link count from storage
  const loadLinkCount = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      const savedCount = localStorage.getItem(storageKey);
      const totalLinks = savedCount ? parseInt(savedCount, 10) : 0;
      
      const linkLimit = getLinkLimit();
      const remainingLinks = linkLimit === Infinity ? Infinity : Math.max(0, linkLimit - totalLinks);
      const isNearLimit = linkLimit !== Infinity && totalLinks >= linkLimit * 0.8;
      const hasReachedLimit = linkLimit !== Infinity && totalLinks >= linkLimit;

      setLinkTracker({
        totalLinksBuilt: totalLinks,
        canCreateLinks: !hasReachedLimit,
        remainingLinks,
        linkLimit,
        isNearLimit,
        hasReachedLimit
      });

      console.log('📊 Link tracker loaded:', {
        totalLinks,
        linkLimit,
        remainingLinks,
        canCreateLinks: !hasReachedLimit
      });

    } catch (error) {
      console.error('Error loading link count:', error);
    }
  }, [getStorageKey, getLinkLimit]);

  // Save link count to storage
  const saveLinkCount = useCallback((count: number) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, count.toString());
      console.log('💾 Link count saved:', count, 'to key:', storageKey);
    } catch (error) {
      console.error('Error saving link count:', error);
    }
  }, [getStorageKey]);

  // Add links (when backlinks are successfully created)
  const addLinks = useCallback((count: number = 1) => {
    const newTotal = linkTracker.totalLinksBuilt + count;
    const linkLimit = getLinkLimit();
    
    // Check if this would exceed the limit for non-premium users
    if (!isPremium && newTotal > linkLimit) {
      toast.error('Link Limit Reached', {
        description: `You've reached your ${linkLimit}-link limit. Upgrade to Premium for unlimited links.`
      });
      return false;
    }

    // Update the count
    saveLinkCount(newTotal);
    
    const remainingLinks = linkLimit === Infinity ? Infinity : Math.max(0, linkLimit - newTotal);
    const isNearLimit = linkLimit !== Infinity && newTotal >= linkLimit * 0.8;
    const hasReachedLimit = linkLimit !== Infinity && newTotal >= linkLimit;

    setLinkTracker({
      totalLinksBuilt: newTotal,
      canCreateLinks: !hasReachedLimit,
      remainingLinks,
      linkLimit,
      isNearLimit,
      hasReachedLimit
    });

    // Show warning when near limit
    if (isNearLimit && !hasReachedLimit && !isPremium) {
      toast.warning('Approaching Limit', {
        description: `You have ${remainingLinks} links remaining. Consider upgrading to Premium.`
      });
    }

    // Show success message
    if (count === 1) {
      toast.success('Backlink Created!', {
        description: `Successfully built ${count} new backlink. Total: ${newTotal}`
      });
    } else {
      toast.success('Backlinks Created!', {
        description: `Successfully built ${count} new backlinks. Total: ${newTotal}`
      });
    }

    return true;
  }, [linkTracker.totalLinksBuilt, getLinkLimit, isPremium, saveLinkCount]);

  // Check if user can create more links
  const canCreateMoreLinks = useCallback((requestedCount: number = 1) => {
    if (isPremium) return true; // Premium users always can create links
    
    const wouldExceedLimit = (linkTracker.totalLinksBuilt + requestedCount) > linkTracker.linkLimit;
    return !wouldExceedLimit;
  }, [isPremium, linkTracker.totalLinksBuilt, linkTracker.linkLimit]);

  // Reset link count (admin function)
  const resetLinkCount = useCallback(() => {
    saveLinkCount(0);
    loadLinkCount();
    toast.success('Link count reset successfully');
  }, [saveLinkCount, loadLinkCount]);

  // Migrate from old storage keys (if needed)
  const migrateOldData = useCallback(() => {
    try {
      // Check for old storage patterns and migrate if needed
      const oldKeys = ['total_links_built', 'campaign_links_count'];
      let migratedCount = 0;

      for (const oldKey of oldKeys) {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue) {
          const count = parseInt(oldValue, 10);
          if (count > migratedCount) {
            migratedCount = count;
          }
          localStorage.removeItem(oldKey); // Clean up old data
        }
      }

      if (migratedCount > 0) {
        saveLinkCount(migratedCount);
        console.log('📦 Migrated link count:', migratedCount);
      }
    } catch (error) {
      console.error('Error migrating old link data:', error);
    }
  }, [saveLinkCount]);

  // Load data on mount and when user/auth state changes
  useEffect(() => {
    // Set guest user ID if not exists
    if (!isAuthenticated && !localStorage.getItem('guest_user_id')) {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_user_id', guestId);
    }

    migrateOldData();
    loadLinkCount();
  }, [isAuthenticated, user?.id, isPremium, loadLinkCount, migrateOldData]);

  return {
    ...linkTracker,
    addLinks,
    canCreateMoreLinks,
    resetLinkCount,
    refreshCount: loadLinkCount
  };
}
