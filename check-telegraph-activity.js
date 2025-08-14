const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkRecentActivity() {
  console.log('🔍 Checking recent Telegraph automation activity...\n');
  
  try {
    // Check automation_logs for recent Telegraph errors
    console.log('1. Checking automation_logs for Telegraph entries...');
    const { data: logs, error: logsError } = await supabase
      .from('automation_logs')
      .select('*')
      .ilike('message', '%telegraph%')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (logsError) {
      console.log('❌ Error checking automation_logs:', logsError.message);
    } else {
      console.log('📝 Recent Telegraph logs:', logs?.length || 0, 'entries found');
      if (logs?.length > 0) {
        logs.forEach(log => {
          console.log(`- [${log.created_at}] [${log.level}] ${log.message}`);
          if (log.context) {
            console.log(`  Context: ${JSON.stringify(log.context)}`);
          }
        });
      }
    }
    
    // Check article_submissions for Telegraph URLs
    console.log('\n2. Checking article_submissions for Telegraph posts...');
    const { data: articles, error: articlesError } = await supabase
      .from('article_submissions')
      .select('*')
      .eq('target_site', 'telegraph')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (articlesError) {
      console.log('❌ Error checking article_submissions:', articlesError.message);
    } else {
      console.log('📰 Recent Telegraph articles:', articles?.length || 0, 'found');
      if (articles?.length > 0) {
        articles.forEach(article => {
          console.log(`- [${article.created_at}] ${article.article_title}`);
          console.log(`  URL: ${article.article_url}`);
          console.log(`  Status: ${article.status}`);
          console.log(`  Success: ${article.success}`);
        });
      }
    }
    
    // Check recent campaigns
    console.log('\n3. Checking recent automation campaigns...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('automation_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (campaignsError) {
      console.log('❌ Error checking campaigns:', campaignsError.message);
    } else {
      console.log('🎯 Recent campaigns:', campaigns?.length || 0, 'found');
      if (campaigns?.length > 0) {
        campaigns.forEach(campaign => {
          console.log(`- [${campaign.created_at}] Campaign: ${campaign.campaign_title}`);
          console.log(`  Status: ${campaign.status}`);
          console.log(`  Target URLs: ${campaign.target_urls}`);
          if (campaign.article_url) {
            console.log(`  Article URL: ${campaign.article_url}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkRecentActivity();
