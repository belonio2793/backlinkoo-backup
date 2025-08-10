/**
 * Display formatting utilities to handle "0" values properly
 * Prevents awkward concatenation and improves UI text
 */

export interface DisplayOptions {
  hideZero?: boolean;
  zeroText?: string;
  prefix?: string;
  suffix?: string;
  showPlusSign?: boolean;
}

/**
 * Format numbers for display with proper handling of zero values
 */
export function formatDisplayNumber(
  value: number | string | null | undefined,
  options: DisplayOptions = {}
): string {
  const {
    hideZero = false,
    zeroText = '0',
    prefix = '',
    suffix = '',
    showPlusSign = false
  } = options;

  const numValue = typeof value === 'string' ? parseInt(value, 10) : value || 0;

  // Handle zero values
  if (numValue === 0) {
    if (hideZero) {
      return '';
    }
    return `${prefix}${zeroText}${suffix}`;
  }

  // Format positive numbers
  const formattedNumber = numValue.toLocaleString();
  const plusSign = showPlusSign && numValue > 0 ? '+' : '';
  
  return `${prefix}${plusSign}${formattedNumber}${suffix}`;
}

/**
 * Format metric displays with contextual zero handling
 */
export function formatMetricDisplay(
  value: number,
  label: string,
  options: {
    hideZeroValue?: boolean;
    zeroLabel?: string;
    context?: 'live' | 'generated' | 'active' | 'domains' | 'clicks';
  } = {}
): { value: string; label: string } {
  const { hideZeroValue = false, zeroLabel, context } = options;

  if (value === 0) {
    if (hideZeroValue) {
      return { value: '', label: zeroLabel || getZeroContextLabel(context, label) };
    }
    return { 
      value: '0', 
      label: zeroLabel || getZeroContextLabel(context, label)
    };
  }

  return {
    value: value.toLocaleString(),
    label: label
  };
}

/**
 * Get contextual label for zero values
 */
function getZeroContextLabel(context?: string, originalLabel?: string): string {
  switch (context) {
    case 'live':
      return 'No live links yet';
    case 'generated':
      return 'No links generated';
    case 'active':
      return 'No active campaigns';
    case 'domains':
      return 'No domains reached';
    case 'clicks':
      return 'No clicks recorded';
    default:
      return originalLabel || 'None yet';
  }
}

/**
 * Format activity counts with proper grammar
 */
export function formatActivityCount(
  count: number,
  singular: string,
  plural?: string,
  options: {
    showZero?: boolean;
    zeroText?: string;
    includeCount?: boolean;
  } = {}
): string {
  const {
    showZero = true,
    zeroText = `No ${plural || singular}s yet`,
    includeCount = true
  } = options;

  if (count === 0) {
    return showZero ? zeroText : '';
  }

  const unit = count === 1 ? singular : (plural || `${singular}s`);
  return includeCount ? `${count} ${unit}` : unit;
}

/**
 * Format status text with proper spacing and grammar
 */
export function formatStatusText(
  count: number,
  status: string,
  options: {
    emptyText?: string;
    showCount?: boolean;
  } = {}
): string {
  const { emptyText = `ready for ${status}`, showCount = true } = options;

  if (count === 0) {
    return emptyText;
  }

  return showCount ? `${count} ${status}` : status;
}

/**
 * Format campaign statistics with intelligent zero handling
 */
export function formatCampaignStats(stats: {
  campaigns?: number;
  active?: number;
  live?: number;
  domains?: number;
  clicks?: number;
}): {
  campaigns: string;
  active: string;
  live: string;
  domains: string;
  clicks: string;
} {
  return {
    campaigns: formatActivityCount(stats.campaigns || 0, 'campaign', undefined, {
      zeroText: 'No campaigns yet'
    }),
    active: formatStatusText(stats.active || 0, 'active', {
      emptyText: 'ready to start'
    }),
    live: formatStatusText(stats.live || 0, 'live', {
      emptyText: 'none live yet'
    }),
    domains: formatActivityCount(stats.domains || 0, 'domain', undefined, {
      zeroText: 'no domains reached'
    }),
    clicks: formatDisplayNumber(stats.clicks || 0, {
      hideZero: false,
      zeroText: 'no clicks yet'
    })
  };
}
