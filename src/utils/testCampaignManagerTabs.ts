/**
 * Test utility for CampaignManagerTabbed component
 * 
 * Verifies that the tabbed interface works correctly and live links are displayed properly
 */

export async function testCampaignManagerTabs() {
  console.log('🧪 Testing CampaignManager Tabs functionality...');
  
  // Test if the component is rendered correctly
  const activityContainer = document.querySelector('[data-testid="activity-container"]');
  if (!activityContainer) {
    console.log('⚠️ Activity container not found - checking for card with Settings title');
    
    // Look for the card with Settings icon and Activity title
    const activityCard = Array.from(document.querySelectorAll('h3, h2')).find(el => 
      el.textContent?.includes('Activity')
    );
    
    if (activityCard) {
      console.log('✅ Activity card found');
    } else {
      console.error('❌ Activity card not found');
      return false;
    }
  }
  
  // Test if tabs are present
  const tabsList = document.querySelector('[role="tablist"]');
  if (tabsList) {
    console.log('✅ Tabs component found');
    
    // Check for specific tab buttons
    const activityTab = Array.from(tabsList.querySelectorAll('[role="tab"]')).find(tab => 
      tab.textContent?.includes('Campaign Activity')
    );
    
    const liveLinksTab = Array.from(tabsList.querySelectorAll('[role="tab"]')).find(tab => 
      tab.textContent?.includes('Live Links')
    );
    
    if (activityTab) {
      console.log('✅ Campaign Activity tab found');
    } else {
      console.warn('⚠️ Campaign Activity tab not found');
    }
    
    if (liveLinksTab) {
      console.log('✅ Live Links tab found');
      
      // Test Live Links tab functionality
      console.log('🧪 Testing Live Links tab...');
      (liveLinksTab as HTMLElement).click();
      
      // Wait for tab content to load
      setTimeout(() => {
        const liveLinksContent = document.querySelector('[data-state="active"]');
        if (liveLinksContent && liveLinksContent.textContent?.includes('Published Links')) {
          console.log('✅ Live Links tab content loaded correctly');
          
          // Check for published links
          const publishedLinks = liveLinksContent.querySelectorAll('a[href*="telegra.ph"], a[href*="http"]');
          console.log(`📊 Found ${publishedLinks.length} published links`);
          
          if (publishedLinks.length > 0) {
            console.log('✅ Published links are displayed');
            publishedLinks.forEach((link, index) => {
              console.log(`  📝 Link ${index + 1}: ${link.textContent}`);
            });
          } else {
            console.log('ℹ️ No published links found (this is normal for new accounts)');
          }
        } else {
          console.error('❌ Live Links tab content not loaded correctly');
        }
      }, 500);
      
    } else {
      console.warn('⚠️ Live Links tab not found');
    }
    
  } else {
    console.error('❌ Tabs component not found - may not be using tabbed version');
    return false;
  }
  
  // Test summary stats
  const statsElements = document.querySelectorAll('.text-2xl.font-bold');
  if (statsElements.length >= 4) {
    console.log('✅ Campaign summary stats found');
    statsElements.forEach((stat, index) => {
      const label = stat.nextElementSibling?.textContent;
      console.log(`  📊 ${label}: ${stat.textContent}`);
    });
  } else {
    console.warn('⚠️ Campaign summary stats not found or incomplete');
  }
  
  console.log('✅ CampaignManager Tabs test completed');
  return true;
}

export function testLiveLinksTab() {
  console.log('🧪 Testing Live Links tab specifically...');
  
  // Find and click the Live Links tab
  const liveLinksTab = Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
    tab.textContent?.includes('Live Links')
  );
  
  if (liveLinksTab) {
    console.log('🔗 Clicking Live Links tab...');
    (liveLinksTab as HTMLElement).click();
    
    setTimeout(() => {
      // Check for live links content
      const activeContent = document.querySelector('[data-state="active"]');
      if (activeContent) {
        const copyButtons = activeContent.querySelectorAll('button[title="Copy URL"]');
        const viewButtons = activeContent.querySelectorAll('button[title="Open Link"]');
        const linkElements = activeContent.querySelectorAll('a[href*="http"]');
        
        console.log(`📊 Live Links tab analysis:`);
        console.log(`  📋 Copy buttons: ${copyButtons.length}`);
        console.log(`  👁️ View buttons: ${viewButtons.length}`);
        console.log(`  🔗 Direct links: ${linkElements.length}`);
        
        if (linkElements.length > 0) {
          console.log('📝 Published URLs found:');
          linkElements.forEach((link, index) => {
            console.log(`  ${index + 1}. ${link.getAttribute('href')}`);
          });
        }
        
        // Test copy functionality if available
        if (copyButtons.length > 0) {
          console.log('🧪 Testing copy functionality...');
          (copyButtons[0] as HTMLElement).click();
          console.log('✅ Copy button clicked (check for toast notification)');
        }
      }
    }, 300);
    
  } else {
    console.error('❌ Live Links tab not found');
    return false;
  }
  
  return true;
}

export function getCampaignTabsStats() {
  const stats = {
    tabsFound: false,
    activeTab: null,
    campaignCount: 0,
    publishedLinksCount: 0,
    summaryStats: {}
  };
  
  // Check for tabs
  const tabsList = document.querySelector('[role="tablist"]');
  if (tabsList) {
    stats.tabsFound = true;
    
    // Get active tab
    const activeTab = tabsList.querySelector('[data-state="active"]');
    if (activeTab) {
      stats.activeTab = activeTab.textContent;
    }
  }
  
  // Count campaigns
  const campaignElements = document.querySelectorAll('[class*="campaign"], .p-4.border.rounded-lg');
  stats.campaignCount = campaignElements.length;
  
  // Count published links
  const linkElements = document.querySelectorAll('a[href*="telegra.ph"], a[href*="http"]');
  stats.publishedLinksCount = linkElements.length;
  
  // Get summary stats
  const summaryElements = document.querySelectorAll('.text-2xl.font-bold');
  summaryElements.forEach((element, index) => {
    const label = element.nextElementSibling?.textContent || `Stat ${index + 1}`;
    stats.summaryStats[label] = element.textContent;
  });
  
  return stats;
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testCampaignManagerTabs = testCampaignManagerTabs;
  (window as any).testLiveLinksTab = testLiveLinksTab;
  (window as any).getCampaignTabsStats = getCampaignTabsStats;
  
  console.log('🧪 Campaign Manager Tabs test utilities available:');
  console.log('  - testCampaignManagerTabs() - Test overall tabs functionality');
  console.log('  - testLiveLinksTab() - Test Live Links tab specifically');
  console.log('  - getCampaignTabsStats() - Get current tabs statistics');
}
