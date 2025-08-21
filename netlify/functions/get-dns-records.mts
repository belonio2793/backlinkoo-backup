import type { Context, Config } from "@netlify/functions";

interface DNSRecordsRequest {
  domain: string;
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  status: 'pending' | 'verified' | 'error';
}

interface DNSRecordsResponse {
  success: boolean;
  records: DNSRecord[];
  domain: string;
  error?: string;
}

export default async (req: Request, context: Context): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { domain }: DNSRecordsRequest = await req.json();

    if (!domain) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Domain is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Fetching DNS records for: ${domain}`);

    // Generate the required DNS records for this domain
    const records: DNSRecord[] = [
      {
        type: 'A',
        name: domain,
        value: '75.2.60.5',
        status: 'pending'
      },
      {
        type: 'A', 
        name: domain,
        value: '99.83.190.102',
        status: 'pending'
      },
      {
        type: 'CNAME',
        name: `www.${domain}`,
        value: 'backlinkoo.netlify.app',
        status: 'pending'
      },
      {
        type: 'TXT',
        name: domain,
        value: `netlify-verification=${generateVerificationToken()}`,
        status: 'pending'
      }
    ];

    // Check current DNS status for each record
    for (const record of records) {
      try {
        const dnsResponse = await fetch(
          `https://dns.google/resolve?name=${record.name}&type=${record.type}`
        );
        
        if (dnsResponse.ok) {
          const dnsData = await dnsResponse.json();
          
          if (dnsData.Answer && dnsData.Answer.length > 0) {
            const hasExpectedValue = dnsData.Answer.some((answer: any) => {
              if (record.type === 'A') {
                return answer.data === record.value;
              } else if (record.type === 'CNAME') {
                return answer.data.includes('netlify') || answer.data === record.value;
              } else if (record.type === 'TXT') {
                return answer.data.includes('netlify-verification');
              }
              return false;
            });
            
            record.status = hasExpectedValue ? 'verified' : 'error';
          }
        }
      } catch (error) {
        console.error(`Error checking DNS for ${record.name}:`, error);
        record.status = 'error';
      }
    }

    const result: DNSRecordsResponse = {
      success: true,
      records,
      domain
    };

    console.log('DNS records result:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('DNS records fetch error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      records: [],
      domain: '',
      error: error instanceof Error ? error.message : 'Failed to fetch DNS records'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const config: Config = {
  path: "/api/get-dns-records"
};
