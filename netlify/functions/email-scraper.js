// Email regex pattern for extracting emails
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Search engines and APIs to find pages
const SEARCH_ENGINES = [
  {
    name: 'DuckDuckGo',
    url: (query, page = 0) => `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}&s=${page * 20}`,
    selector: '.result__url',
    parseUrl: (element) => element.textContent?.trim()
  }
];

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
}

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && 
         !email.includes('.png') && 
         !email.includes('.jpg') && 
         !email.includes('.gif') &&
         !email.includes('example.com') &&
         !email.includes('test.com') &&
         !email.includes('mailto:') &&
         email.length < 100;
}

// Helper function to extract emails from text
function extractEmails(text, sourceUrl) {
  const matches = text.match(EMAIL_REGEX) || [];
  const validEmails = matches
    .filter(isValidEmail)
    .map(email => email.toLowerCase().trim())
    .filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates
  
  return validEmails.map(email => ({
    email,
    domain: extractDomain(email.split('@')[1]),
    source: sourceUrl
  }));
}

// Helper function to search for URLs using DuckDuckGo scraping
async function searchUrls(keyword, maxPages = 3) {
  const urls = new Set();
  
  try {
    for (let page = 0; page < maxPages; page++) {
      // Use a public search API or scraping service
      // For demo purposes, we'll simulate finding URLs related to the keyword
      const simulatedUrls = [
        `https://${keyword.replace(/\s+/g, '')}.com`,
        `https://www.${keyword.replace(/\s+/g, '')}.org`,
        `https://${keyword.replace(/\s+/g, '')}-company.com`,
        `https://best-${keyword.replace(/\s+/g, '')}.com`,
        `https://${keyword.replace(/\s+/g, '')}-services.net`,
        `https://pro-${keyword.replace(/\s+/g, '')}.com`,
        `https://${keyword.replace(/\s+/g, '')}-expert.com`,
        `https://top-${keyword.replace(/\s+/g, '')}.com`,
        `https://${keyword.replace(/\s+/g, '')}-solutions.com`,
        `https://premium-${keyword.replace(/\s+/g, '')}.com`
      ];
      
      simulatedUrls.forEach(url => urls.add(url));
      
      // Add some delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error searching for URLs:', error);
  }
  
  return Array.from(urls);
}

// Helper function to scrape emails from a single page
async function scrapePageEmails(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const emails = extractEmails(html, url);
    
    return emails;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return [];
  }
}

// Helper function to collect results
function collectResult(results, data) {
  results.push(data);
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // For streaming responses, we'll return JSON chunks instead of SSE
  headers['Content-Type'] = 'application/json';
  
  try {
    const { keyword } = JSON.parse(event.body);

    if (!keyword || typeof keyword !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid keyword is required' })
      };
    }

    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Keyword must be at least 2 characters long' })
      };
    }

    // Step 1: Search for URLs
    const urls = await searchUrls(trimmedKeyword, 3);

    if (urls.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No websites found for the given keyword',
          emails: [],
          totalPages: 0
        })
      };
    }

    // Step 2: Scrape emails from each URL
    const allEmails = new Map(); // Use Map to avoid duplicates

    // Process URLs in batches to avoid overwhelming the target servers
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      const batchPromises = batch.map(async (url) => {
        const emails = await scrapePageEmails(url);

        // Collect unique emails
        emails.forEach(emailData => {
          const emailKey = emailData.email;
          if (!allEmails.has(emailKey)) {
            allEmails.set(emailKey, emailData);
          }
        });

        return emails;
      });

      await Promise.allSettled(batchPromises);

      // Add delay between batches to be respectful
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 3: Return results
    const emailArray = Array.from(allEmails.values());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        keyword: trimmedKeyword,
        totalEmails: emailArray.length,
        totalPages: urls.length,
        emails: emailArray,
        message: `Scraping complete! Found ${emailArray.length} unique emails from ${urls.length} websites.`
      })
    };

  } catch (error) {
    console.error('Error in email scraper:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'An unexpected error occurred during scraping'
      })
    };
  }
}

export const config = {
  type: 'experimental-edge',
};
