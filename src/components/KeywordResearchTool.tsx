import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Eye, DollarSign, Globe, MapPin, BarChart3, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/SearchableSelect";
import googleLogo from "@/assets/google-g-logo.png";
import bingLogo from "@/assets/bing-logo.png";

interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  competition: 'low' | 'medium' | 'high';
  searchEngine: 'google' | 'bing';
  location?: string;
  competitorCount?: number;
  topCompetitors?: string[];
}

interface RankingUrl {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  domainAuthority?: number;
  pageAuthority?: number;
  backlinks?: number;
  estimatedTraffic?: number;
  socialShares?: number;
}

interface GeographicData {
  country: string;
  countryCode: string;
  cities: { name: string; searchVolume: number }[];
}

export const KeywordResearchTool = () => {
  console.log('KeywordResearchTool: Component rendering started');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [rankingUrls, setRankingUrls] = useState<RankingUrl[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("google");
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [userLocation, setUserLocation] = useState<{country: string; city: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [aiInsights, setAiInsights] = useState<string>("");
  const [showInsights, setShowInsights] = useState(false);

  // Detect user location on component mount
  useEffect(() => {
    console.log('KeywordResearchTool: useEffect running for location detection');
    const detectLocation = async () => {
      try {
        console.log('KeywordResearchTool: Attempting to detect location');
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        console.log('KeywordResearchTool: Location data received:', data);
        
        // Validate that the detected country exists in our countries list
        const detectedCountryCode = data.country_code || 'US';
        const countryExists = countries.find(c => c.code === detectedCountryCode);
        const finalCountryCode = countryExists ? detectedCountryCode : 'US';
        
        // Validate that the detected city exists in the selected country's cities list
        const detectedCity = data.city || '';
        const countryCities = cities[finalCountryCode as keyof typeof cities] || [];
        const cityExists = countryCities.includes(detectedCity);
        
        setUserLocation({
          country: data.country_name || 'United States',
          city: detectedCity
        });
        setSelectedCountry(finalCountryCode);
        
        // Only set the city if it exists in our predefined list for that country
        if (cityExists) {
          setSelectedCity(detectedCity);
        } else {
          setSelectedCity(''); // Default to "All Cities"
        }
      } catch (error) {
        console.log('KeywordResearchTool: Could not detect location, using defaults', error);
        // Set safe defaults on error
        setUserLocation({
          country: 'United States',
          city: ''
        });
        setSelectedCountry('US');
        setSelectedCity('');
      } finally {
        // Add a small delay to show the loading animation
        setTimeout(() => {
          setIsLoading(false);
          console.log('KeywordResearchTool: Loading complete');
        }, 1000);
      }
    };
    detectLocation();
  }, []);

  // Advanced keyword research with geographic and competition analysis
  const performKeywordResearch = async (searchTerm: string) => {
    console.log('Starting keyword research for:', searchTerm);
    
    try {
      const { data, error } = await supabase.functions.invoke('seo-analysis', {
        body: {
          type: 'advanced_keyword_research',
          data: { 
            keyword: searchTerm,
            country: selectedCountry,
            city: selectedCity,
            searchEngine: selectedEngine
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to perform keyword research');
      }

      if (!data) {
        throw new Error('No data returned from keyword research');
      }

      console.log('Keyword research successful:', data);
      return data;
    } catch (error) {
      console.error('Error in performKeywordResearch:', error);
      throw error;
    }
  };

  const countries = [
    { code: "AD", name: "Andorra", flag: "🇦🇩" },
    { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
    { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
    { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬" },
    { code: "AI", name: "Anguilla", flag: "🇦🇮" },
    { code: "AL", name: "Albania", flag: "🇦🇱" },
    { code: "AM", name: "Armenia", flag: "🇦🇲" },
    { code: "AO", name: "Angola", flag: "🇦🇴" },
    { code: "AQ", name: "Antarctica", flag: "🇦🇶" },
    { code: "AR", name: "Argentina", flag: "🇦🇷" },
    { code: "AS", name: "American Samoa", flag: "🇦🇸" },
    { code: "AT", name: "Austria", flag: "🇦🇹" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "AW", name: "Aruba", flag: "🇦🇼" },
    { code: "AX", name: "Åland Islands", flag: "🇦🇽" },
    { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
    { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
    { code: "BB", name: "Barbados", flag: "🇧🇧" },
    { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
    { code: "BE", name: "Belgium", flag: "🇧🇪" },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
    { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
    { code: "BH", name: "Bahrain", flag: "🇧🇭" },
    { code: "BI", name: "Burundi", flag: "🇧🇮" },
    { code: "BJ", name: "Benin", flag: "🇧🇯" },
    { code: "BL", name: "Saint Barthélemy", flag: "🇧🇱" },
    { code: "BM", name: "Bermuda", flag: "🇧🇲" },
    { code: "BN", name: "Brunei", flag: "🇧🇳" },
    { code: "BO", name: "Bolivia", flag: "🇧🇴" },
    { code: "BQ", name: "Caribbean Netherlands", flag: "🇧🇶" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
    { code: "BS", name: "Bahamas", flag: "🇧🇸" },
    { code: "BT", name: "Bhutan", flag: "🇧🇹" },
    { code: "BV", name: "Bouvet Island", flag: "🇧🇻" },
    { code: "BW", name: "Botswana", flag: "🇧🇼" },
    { code: "BY", name: "Belarus", flag: "🇧🇾" },
    { code: "BZ", name: "Belize", flag: "🇧🇿" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "CC", name: "Cocos Islands", flag: "🇨🇨" },
    { code: "CD", name: "Democratic Republic of the Congo", flag: "🇨🇩" },
    { code: "CF", name: "Central African Republic", flag: "🇨🇫" },
    { code: "CG", name: "Congo", flag: "🇨🇬" },
    { code: "CH", name: "Switzerland", flag: "🇨🇭" },
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
    { code: "CK", name: "Cook Islands", flag: "🇨🇰" },
    { code: "CL", name: "Chile", flag: "🇨🇱" },
    { code: "CM", name: "Cameroon", flag: "🇨🇲" },
    { code: "CN", name: "China", flag: "🇨🇳" },
    { code: "CO", name: "Colombia", flag: "🇨🇴" },
    { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
    { code: "CU", name: "Cuba", flag: "🇨🇺" },
    { code: "CV", name: "Cape Verde", flag: "🇨🇻" },
    { code: "CW", name: "Curaçao", flag: "🇨🇼" },
    { code: "CX", name: "Christmas Island", flag: "🇨🇽" },
    { code: "CY", name: "Cyprus", flag: "🇨🇾" },
    { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
    { code: "DK", name: "Denmark", flag: "🇩🇰" },
    { code: "DM", name: "Dominica", flag: "🇩🇲" },
    { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
    { code: "DZ", name: "Algeria", flag: "🇩🇿" },
    { code: "EC", name: "Ecuador", flag: "🇪🇨" },
    { code: "EE", name: "Estonia", flag: "🇪🇪" },
    { code: "EG", name: "Egypt", flag: "🇪🇬" },
    { code: "EH", name: "Western Sahara", flag: "🇪🇭" },
    { code: "ER", name: "Eritrea", flag: "🇪🇷" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
    { code: "FI", name: "Finland", flag: "🇫🇮" },
    { code: "FJ", name: "Fiji", flag: "🇫🇯" },
    { code: "FK", name: "Falkland Islands", flag: "🇫🇰" },
    { code: "FM", name: "Micronesia", flag: "🇫🇲" },
    { code: "FO", name: "Faroe Islands", flag: "🇫🇴" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "GA", name: "Gabon", flag: "🇬🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "GD", name: "Grenada", flag: "🇬🇩" },
    { code: "GE", name: "Georgia", flag: "🇬🇪" },
    { code: "GF", name: "French Guiana", flag: "🇬🇫" },
    { code: "GG", name: "Guernsey", flag: "🇬🇬" },
    { code: "GH", name: "Ghana", flag: "🇬🇭" },
    { code: "GI", name: "Gibraltar", flag: "🇬🇮" },
    { code: "GL", name: "Greenland", flag: "🇬🇱" },
    { code: "GM", name: "Gambia", flag: "🇬🇲" },
    { code: "GN", name: "Guinea", flag: "🇬🇳" },
    { code: "GP", name: "Guadeloupe", flag: "🇬🇵" },
    { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
    { code: "GR", name: "Greece", flag: "🇬🇷" },
    { code: "GS", name: "South Georgia and the South Sandwich Islands", flag: "🇬🇸" },
    { code: "GT", name: "Guatemala", flag: "🇬🇹" },
    { code: "GU", name: "Guam", flag: "🇬🇺" },
    { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
    { code: "GY", name: "Guyana", flag: "🇬🇾" },
    { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
    { code: "HM", name: "Heard Island and McDonald Islands", flag: "🇭🇲" },
    { code: "HN", name: "Honduras", flag: "🇭🇳" },
    { code: "HR", name: "Croatia", flag: "🇭🇷" },
    { code: "HT", name: "Haiti", flag: "🇭🇹" },
    { code: "HU", name: "Hungary", flag: "🇭🇺" },
    { code: "ID", name: "Indonesia", flag: "🇮🇩" },
    { code: "IE", name: "Ireland", flag: "🇮🇪" },
    { code: "IL", name: "Israel", flag: "🇮🇱" },
    { code: "IM", name: "Isle of Man", flag: "🇮🇲" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "IO", name: "British Indian Ocean Territory", flag: "🇮🇴" },
    { code: "IQ", name: "Iraq", flag: "🇮🇶" },
    { code: "IR", name: "Iran", flag: "🇮🇷" },
    { code: "IS", name: "Iceland", flag: "🇮🇸" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "JE", name: "Jersey", flag: "🇯🇪" },
    { code: "JM", name: "Jamaica", flag: "🇯🇲" },
    { code: "JO", name: "Jordan", flag: "🇯🇴" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "KE", name: "Kenya", flag: "🇰🇪" },
    { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
    { code: "KH", name: "Cambodia", flag: "🇰🇭" },
    { code: "KI", name: "Kiribati", flag: "🇰🇮" },
    { code: "KM", name: "Comoros", flag: "🇰🇲" },
    { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
    { code: "KP", name: "North Korea", flag: "🇰🇵" },
    { code: "KR", name: "South Korea", flag: "🇰🇷" },
    { code: "KW", name: "Kuwait", flag: "🇰🇼" },
    { code: "KY", name: "Cayman Islands", flag: "🇰🇾" },
    { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
    { code: "LA", name: "Laos", flag: "🇱🇦" },
    { code: "LB", name: "Lebanon", flag: "🇱🇧" },
    { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
    { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
    { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
    { code: "LR", name: "Liberia", flag: "🇱🇷" },
    { code: "LS", name: "Lesotho", flag: "🇱🇸" },
    { code: "LT", name: "Lithuania", flag: "🇱🇹" },
    { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
    { code: "LV", name: "Latvia", flag: "🇱🇻" },
    { code: "LY", name: "Libya", flag: "🇱🇾" },
    { code: "MA", name: "Morocco", flag: "🇲🇦" },
    { code: "MC", name: "Monaco", flag: "🇲🇨" },
    { code: "MD", name: "Moldova", flag: "🇲🇩" },
    { code: "ME", name: "Montenegro", flag: "🇲🇪" },
    { code: "MF", name: "Saint Martin", flag: "🇲🇫" },
    { code: "MG", name: "Madagascar", flag: "🇲🇬" },
    { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
    { code: "MK", name: "North Macedonia", flag: "🇲🇰" },
    { code: "ML", name: "Mali", flag: "🇲🇱" },
    { code: "MM", name: "Myanmar", flag: "🇲🇲" },
    { code: "MN", name: "Mongolia", flag: "🇲🇳" },
    { code: "MO", name: "Macao", flag: "🇲🇴" },
    { code: "MP", name: "Northern Mariana Islands", flag: "🇲🇵" },
    { code: "MQ", name: "Martinique", flag: "🇲🇶" },
    { code: "MR", name: "Mauritania", flag: "🇲🇷" },
    { code: "MS", name: "Montserrat", flag: "🇲🇸" },
    { code: "MT", name: "Malta", flag: "🇲🇹" },
    { code: "MU", name: "Mauritius", flag: "🇲🇺" },
    { code: "MV", name: "Maldives", flag: "🇲🇻" },
    { code: "MW", name: "Malawi", flag: "🇲🇼" },
    { code: "MX", name: "Mexico", flag: "🇲🇽" },
    { code: "MY", name: "Malaysia", flag: "🇲🇾" },
    { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
    { code: "NA", name: "Namibia", flag: "🇳🇦" },
    { code: "NC", name: "New Caledonia", flag: "🇳🇨" },
    { code: "NE", name: "Niger", flag: "🇳🇪" },
    { code: "NF", name: "Norfolk Island", flag: "🇳🇫" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱" },
    { code: "NO", name: "Norway", flag: "🇳🇴" },
    { code: "NP", name: "Nepal", flag: "🇳🇵" },
    { code: "NR", name: "Nauru", flag: "🇳🇷" },
    { code: "NU", name: "Niue", flag: "🇳🇺" },
    { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
    { code: "OM", name: "Oman", flag: "🇴🇲" },
    { code: "PA", name: "Panama", flag: "🇵🇦" },
    { code: "PE", name: "Peru", flag: "🇵🇪" },
    { code: "PF", name: "French Polynesia", flag: "🇵🇫" },
    { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
    { code: "PH", name: "Philippines", flag: "🇵🇭" },
    { code: "PK", name: "Pakistan", flag: "🇵🇰" },
    { code: "PL", name: "Poland", flag: "🇵🇱" },
    { code: "PM", name: "Saint Pierre and Miquelon", flag: "🇵🇲" },
    { code: "PN", name: "Pitcairn", flag: "🇵🇳" },
    { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
    { code: "PS", name: "Palestine", flag: "🇵🇸" },
    { code: "PT", name: "Portugal", flag: "🇵🇹" },
    { code: "PW", name: "Palau", flag: "🇵🇼" },
    { code: "PY", name: "Paraguay", flag: "🇵🇾" },
    { code: "QA", name: "Qatar", flag: "🇶🇦" },
    { code: "RE", name: "Réunion", flag: "🇷🇪" },
    { code: "RO", name: "Romania", flag: "🇷🇴" },
    { code: "RS", name: "Serbia", flag: "🇷🇸" },
    { code: "RU", name: "Russia", flag: "🇷🇺" },
    { code: "RW", name: "Rwanda", flag: "🇷🇼" },
    { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
    { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
    { code: "SC", name: "Seychelles", flag: "🇸🇨" },
    { code: "SD", name: "Sudan", flag: "🇸🇩" },
    { code: "SE", name: "Sweden", flag: "🇸🇪" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" },
    { code: "SH", name: "Saint Helena", flag: "🇸🇭" },
    { code: "SI", name: "Slovenia", flag: "🇸🇮" },
    { code: "SJ", name: "Svalbard and Jan Mayen", flag: "🇸🇯" },
    { code: "SK", name: "Slovakia", flag: "🇸🇰" },
    { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
    { code: "SM", name: "San Marino", flag: "🇸🇲" },
    { code: "SN", name: "Senegal", flag: "🇸🇳" },
    { code: "SO", name: "Somalia", flag: "🇸🇴" },
    { code: "SR", name: "Suriname", flag: "🇸🇷" },
    { code: "SS", name: "South Sudan", flag: "🇸🇸" },
    { code: "ST", name: "São Tomé and Príncipe", flag: "🇸🇹" },
    { code: "SV", name: "El Salvador", flag: "🇸🇻" },
    { code: "SX", name: "Sint Maarten", flag: "🇸🇽" },
    { code: "SY", name: "Syria", flag: "🇸🇾" },
    { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
    { code: "TC", name: "Turks and Caicos Islands", flag: "🇹🇨" },
    { code: "TD", name: "Chad", flag: "🇹🇩" },
    { code: "TF", name: "French Southern Territories", flag: "🇹🇫" },
    { code: "TG", name: "Togo", flag: "🇹🇬" },
    { code: "TH", name: "Thailand", flag: "🇹🇭" },
    { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
    { code: "TK", name: "Tokelau", flag: "🇹🇰" },
    { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
    { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
    { code: "TN", name: "Tunisia", flag: "🇹🇳" },
    { code: "TO", name: "Tonga", flag: "🇹🇴" },
    { code: "TR", name: "Turkey", flag: "🇹🇷" },
    { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
    { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
    { code: "TW", name: "Taiwan", flag: "🇹🇼" },
    { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
    { code: "UA", name: "Ukraine", flag: "🇺🇦" },
    { code: "UG", name: "Uganda", flag: "🇺🇬" },
    { code: "UM", name: "United States Minor Outlying Islands", flag: "🇺🇲" },
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "UY", name: "Uruguay", flag: "🇺🇾" },
    { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
    { code: "VA", name: "Vatican City", flag: "🇻🇦" },
    { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
    { code: "VE", name: "Venezuela", flag: "🇻🇪" },
    { code: "VG", name: "British Virgin Islands", flag: "🇻🇬" },
    { code: "VI", name: "U.S. Virgin Islands", flag: "🇻🇮" },
    { code: "VN", name: "Vietnam", flag: "🇻🇳" },
    { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
    { code: "WF", name: "Wallis and Futuna", flag: "🇼🇫" },
    { code: "WS", name: "Samoa", flag: "🇼🇸" },
    { code: "YE", name: "Yemen", flag: "🇾🇪" },
    { code: "YT", name: "Mayotte", flag: "🇾🇹" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦" },
    { code: "ZM", name: "Zambia", flag: "🇿🇲" },
    { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
  ];

  const cities = {
    US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville", "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City", "Long Beach", "Mesa", "Atlanta", "Colorado Springs", "Virginia Beach", "Raleigh", "Omaha", "Miami", "Oakland", "Minneapolis", "Tulsa", "Wichita", "New Orleans"],
    GB: ["London", "Birmingham", "Leeds", "Glasgow", "Sheffield", "Bradford", "Edinburgh", "Liverpool", "Manchester", "Bristol", "Wakefield", "Cardiff", "Coventry", "Nottingham", "Leicester", "Sunderland", "Belfast", "Newcastle upon Tyne", "Brighton", "Hull", "Plymouth", "Stoke-on-Trent", "Wolverhampton", "Derby", "Swansea", "Southampton", "Salford", "Aberdeen", "Westminster", "Portsmouth", "York", "Peterborough", "Dundee", "Lancaster", "Oxford", "Newport", "Preston", "St Albans", "Norwich", "Chester", "Cambridge", "Salisbury", "Exeter", "Gloucester", "Lisburn", "Chichester", "Winchester", "Londonderry", "Carlisle", "Worcester", "Bath", "Durham", "Lincoln", "Hereford", "Armagh", "Inverness", "Stirling", "Canterbury", "Lichfield", "Newry", "Ripon", "Bangor", "Truro", "Ely", "Wells", "St Asaph", "St Davids"],
    CA: ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton", "Mississauga", "Winnipeg", "Quebec City", "Hamilton", "Brampton", "Surrey", "Laval", "Halifax", "London", "Markham", "Vaughan", "Gatineau", "Saskatoon", "Longueuil", "Burnaby", "Regina", "Richmond", "Richmond Hill", "Oakville", "Burlington", "Barrie", "Oshawa", "Sherbrooke", "Saguenay", "Lévis", "Kelowna", "Abbotsford", "Coquitlam", "Trois-Rivières", "Guelph", "Cambridge", "Whitby", "Ajax", "Langley", "Saanich", "Terrebonne", "Milton", "St. Catharines", "New Westminster", "Thunder Bay", "Waterloo", "Delta", "Chatham-Kent", "Red Deer", "Kamloops", "Brantford", "Cape Breton", "Lethbridge", "Saint-Jean-sur-Richelieu", "Clarington", "Pickering", "Nanaimo", "Sudbury", "North Vancouver", "Brossard"],
    AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Central Coast", "Wollongong", "Logan City", "Geelong", "Hobart", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Albury", "Launceston", "Mackay", "Rockhampton", "Bunbury", "Bundaberg", "Coffs Harbour", "Wagga Wagga", "Hervey Bay", "Mildura", "Shepparton", "Port Macquarie", "Gladstone", "Tamworth", "Traralgon", "Orange", "Dubbo", "Geraldton", "Bowral", "Bathurst", "Nowra", "Warrnambool", "Albany", "Warwick", "Devonport", "Mount Gambier"],
    DE: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt am Main", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster", "Karlsruhe", "Mannheim", "Augsburg", "Wiesbaden", "Gelsenkirchen", "Mönchengladbach", "Braunschweig", "Chemnitz", "Kiel", "Aachen", "Halle", "Magdeburg", "Freiburg im Breisgau", "Krefeld", "Lübeck", "Oberhausen", "Erfurt", "Mainz", "Rostock", "Kassel", "Hagen", "Hamm", "Saarbrücken", "Mülheim an der Ruhr", "Potsdam", "Ludwigshafen am Rhein", "Oldenburg", "Leverkusen", "Osnabrück", "Solingen"],
    FR: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Saint-Denis", "Le Mans", "Aix-en-Provence", "Clermont-Ferrand", "Brest", "Limoges", "Tours", "Amiens", "Perpignan", "Metz", "Besançon", "Boulogne-Billancourt", "Orléans", "Mulhouse", "Rouen", "Caen", "Nancy", "Saint-Denis", "Saint-Paul", "Montreuil", "Argenteuil", "Roubaix", "Tourcoing", "Nanterre", "Avignon", "Créteil", "Dunkerque", "Poitiers", "Asnières-sur-Seine"],
    ES: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas de Gran Canaria", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "L'Hospitalet de Llobregat", "A Coruña", "Vitoria-Gasteiz", "Granada", "Elche", "Oviedo", "Badalona", "Cartagena", "Terrassa", "Jerez de la Frontera", "Sabadell", "Santa Cruz de Tenerife", "Pamplona", "Almería", "Alcalá de Henares", "Fuenlabrada", "Donostia-San Sebastián", "Leganés", "Santander", "Burgos", "Castellón de la Plana", "Alcorcón", "Albacete", "Getafe", "Salamanca", "Huelva", "Logroño", "Badajoz", "San Cristóbal de La Laguna", "León", "Tarragona", "Cádiz", "Lleida", "Marbella"],
    IT: ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste", "Brescia", "Taranto", "Prato", "Parma", "Reggio Calabria", "Modena", "Reggio Emilia", "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara", "Sassari", "Latina", "Giugliano in Campania", "Monza", "Syracuse", "Pescara", "Bergamo", "Forlì", "Trento", "Vicenza", "Terni", "Bolzano", "Novara", "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena", "Lecce"],
    JP: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kawasaki", "Kyoto", "Saitama", "Hiroshima", "Sendai", "Kitakyushu", "Chiba", "Sakai", "Niigata", "Hamamatsu", "Okayama", "Sagamihara", "Shizuoka", "Kumamoto", "Kagoshima", "Matsuyama", "Kanazawa", "Utsunomiya", "Matsudo", "Kawaguchi", "Amagasaki", "Himeji", "Nara", "Toyama", "Kurashiki", "Takamatsu", "Hachioji", "Naha", "Iwaki", "Suita", "Otsu", "Koriyama", "Wakayama", "Fukushima", "Kochi", "Takatsuki", "Asahikawa", "Toyonaka", "Gifu", "Fujisawa", "Shimonoseki", "Morioka"],
    BR: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Goiânia", "Belém", "Porto Alegre", "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Nova Iguaçu", "Teresina", "Natal", "Campo Grande", "São Bernardo do Campo", "João Pessoa", "Santo André", "Osasco", "Jaboatão dos Guararapes", "São José dos Campos", "Ribeirão Preto", "Uberlândia", "Sorocaba", "Contagem", "Aracaju", "Feira de Santana", "Cuiabá", "Joinville", "Juiz de Fora", "Londrina", "Aparecida de Goiânia", "Niterói", "Ananindeua", "Porto Velho", "Serra", "Caxias do Sul", "Vila Velha", "Florianópolis", "Macapá", "Cariacica", "Santos", "Carapicuíba"],
    IN: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur"],
    MX: ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez", "Torreón", "Querétaro", "San Luis Potosí", "Mérida", "Mexicali", "Aguascalientes", "Cuernavaca", "Acapulco", "Saltillo", "Chihuahua", "Culiacán", "Hermosillo", "Durango", "Morelia", "Xalapa", "Veracruz", "Villahermosa", "Reynosa", "Tampico", "Pachuca", "Toluca", "Tlalnepantla", "Naucalpan", "Chimalhuacán", "Tlaquepaque", "Guadalupe", "Ecatepec", "Nezahualcóyotl", "Zapopan", "Benito Juárez", "Iztapalapa", "Gustavo A. Madero", "Miguel Hidalgo", "Venustiano Carranza", "Álvaro Obregón", "Coyoacán", "Azcapotzalco", "Iztacalco", "Cuauhtémoc", "Tlalpan", "Xochimilco", "Tláhuac", "Milpa Alta"]
  };

  const searchEngines = [
    { 
      value: "google", 
      name: "Google", 
      logo: googleLogo,
      color: "text-blue-600"
    },
    { 
      value: "bing", 
      name: "Bing", 
      logo: bingLogo,
      color: "text-orange-600"
    }
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keyword to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await performKeywordResearch(searchTerm.trim());
      setKeywords(results.keywords);
      setRankingUrls(results.rankingUrls || []);
      setGeographicData(results.geographicData || []);
      setAiInsights(results.aiInsights);
      setShowInsights(true);

      toast({
        title: "Research Complete",
        description: `Found ${results.keywords.length} keywords and ${results.rankingUrls?.length || 0} ranking URLs`,
      });
    } catch (error) {
      console.error('Keyword research failed:', error);
      toast({
        title: "Error",
        description: "Failed to perform keyword research. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return "bg-green-100 text-green-800";
    if (difficulty <= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 30) return "Easy";
    if (difficulty <= 60) return "Medium";
    return "Hard";
  };

  console.log('KeywordResearchTool: About to render component', { isLoading });
  
  // Show loading animation while initializing
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin" style={{ animationDelay: '-0.15s' }}></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Loading Keyword Research Tool</h3>
          <p className="text-sm text-muted-foreground">Initializing advanced keyword analysis...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Keyword Research
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Enter a keyword (e.g., ∞)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
            </div>
            
            <SearchableSelect
              options={countries.map(country => ({
                value: country.code,
                label: country.name,
                searchableText: `${country.name} ${country.code}`,
                flag: country.flag
              }))}
              value={selectedCountry}
              onValueChange={(value) => {
                console.log('Country changed to:', value);
                try {
                  setSelectedCountry(value);
                  setSelectedCity(""); // Always reset city when country changes
                } catch (error) {
                  console.error('Error changing country:', error);
                  toast({
                    title: "Error",
                    description: "Failed to change country. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              placeholder="Select Country"
              searchPlaceholder="Type to search countries..."
              emptyMessage="No countries found."
              className="w-full"
            />

            <SearchableSelect
              options={searchEngines.map(engine => ({
                value: engine.value,
                label: engine.name,
                searchableText: engine.name,
                icon: <img 
                  src={engine.logo} 
                  alt={engine.name}
                  className="w-4 h-4 object-contain"
                />
              }))}
              value={selectedEngine}
              onValueChange={setSelectedEngine}
              placeholder="Search Engine"
              searchPlaceholder="Type to search engines..."
              emptyMessage="No search engines found."
              className="w-full"
            />
          </div>

          {selectedCountry && cities[selectedCountry as keyof typeof cities] && cities[selectedCountry as keyof typeof cities].length > 0 && (
            <SearchableSelect
              options={[
                {
                  value: "",
                  label: "All Cities",
                  searchableText: "all cities",
                  icon: <Globe className="h-4 w-4" />
                },
                ...(cities[selectedCountry as keyof typeof cities] || []).map(city => ({
                  value: city,
                  label: city,
                  searchableText: city,
                  icon: <MapPin className="h-4 w-4" />
                }))
              ]}
              value={selectedCity}
              onValueChange={setSelectedCity}
              placeholder="City (optional)"
              searchPlaceholder="Type to search cities..."
              emptyMessage="No cities found."
              className="max-w-md"
            />
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            {userLocation && (
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>Detected: {userLocation.city ? `${userLocation.city}, ` : ''}{userLocation.country}</span>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSearch} 
            disabled={isSearching}
            className="w-full md:w-auto"
          >
            {isSearching ? "Analyzing..." : "Research Keywords"}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Get comprehensive keyword data with competition analysis from top search engines
          </p>
        </CardContent>
      </Card>

      {showInsights && aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI SEO Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {aiInsights}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {keywords.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Keywords</TabsTrigger>
            <TabsTrigger value="rankings">Top 10 Rankings</TabsTrigger>
            <TabsTrigger value="competition">Competition</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Keyword Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-lg">{keyword.keyword}</h3>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <img 
                                src={keyword.searchEngine === 'google' ? googleLogo : bingLogo} 
                                alt={keyword.searchEngine}
                                className="w-3 h-3 object-contain"
                              />
                              {keyword.searchEngine.toUpperCase()}
                            </Badge>
                          {keyword.location && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {keyword.location}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp 
                            className={`h-4 w-4 ${
                              keyword.trend === 'up' ? 'text-green-500' : 
                              keyword.trend === 'down' ? 'text-red-500' : 
                              'text-gray-500'
                            }`} 
                          />
                          <Badge className={getDifficultyColor(keyword.difficulty)}>
                            {getDifficultyLabel(keyword.difficulty)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="font-medium">{keyword.searchVolume.toLocaleString()}/mo</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className="font-medium">{keyword.difficulty}/100</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">CPC:</span>
                          <span className="font-medium">${keyword.cpc}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Competition:</span>
                          <span className="font-medium capitalize">{keyword.competition}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rankings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top 10 Ranking URLs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingUrls.length > 0 ? (
                  <div className="space-y-4">
                    {rankingUrls.map((ranking, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {ranking.position}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg mb-1">{ranking.title}</h3>
                              <a 
                                href={ranking.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                {ranking.domain}
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {ranking.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Domain Authority</span>
                            <span className="font-medium">{ranking.domainAuthority || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Page Authority</span>
                            <span className="font-medium">{ranking.pageAuthority || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Backlinks</span>
                            <span className="font-medium">{ranking.backlinks?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Est. Traffic</span>
                            <span className="font-medium">{ranking.estimatedTraffic?.toLocaleString() || 'N/A'}/mo</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Social Shares</span>
                            <span className="font-medium">{ranking.socialShares?.toLocaleString() || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ranking URLs will appear here after running a search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competition">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Competition Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">{keyword.keyword}</h3>
                        <Badge className={getDifficultyColor(keyword.difficulty)}>
                          {keyword.competitorCount || 10} Competitors
                        </Badge>
                      </div>
                      
                      {keyword.topCompetitors && keyword.topCompetitors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-sm text-muted-foreground">Top Ranking Competitors:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {keyword.topCompetitors.map((competitor, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="bg-muted rounded px-2 py-1 text-xs font-mono">#{idx + 1}</span>
                                <span className="text-blue-600 hover:underline cursor-pointer">{competitor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geographic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {geographicData.length > 0 ? (
                  <div className="space-y-6">
                    {geographicData.map((country, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {country.country}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {country.cities.map((city, cityIndex) => (
                            <div key={cityIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{city.name}</span>
                              <span className="font-medium text-sm">{city.searchVolume.toLocaleString()}/mo</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Geographic data will appear here after running a search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
    );
};