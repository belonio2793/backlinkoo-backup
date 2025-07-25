import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag, getCountryName } from "@/utils/countryFlags";

// Utility to get user's country from IP
const getUserCountry = async (): Promise<{ country: string; countryCode: string }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: getCountryName(data.country_code || 'US'),
      countryCode: data.country_code || 'US'
    };
  } catch (error) {
    console.error('Error getting user country:', error);
    return {
      country: 'United States',
      countryCode: 'US'
    };
  }
};

export const useGlobalNotifications = () => {
  
  const broadcastNewUser = async (firstName: string) => {
    try {
      const { country, countryCode } = await getUserCountry();
      const countryFlag = getCountryFlag(countryCode);
      
      await supabase.channel('global-notifications').send({
        type: 'broadcast',
        event: 'new-user',
        payload: {
          firstName,
          country,
          countryFlag
        }
      });
    } catch (error) {
      console.error('Error broadcasting new user:', error);
    }
  };

  const broadcastCreditPurchase = async (firstName: string, amount: number) => {
    try {
      const { country, countryCode } = await getUserCountry();
      const countryFlag = getCountryFlag(countryCode);
      
      await supabase.channel('global-notifications').send({
        type: 'broadcast',
        event: 'credit-purchase',
        payload: {
          firstName,
          country,
          countryFlag,
          amount
        }
      });
    } catch (error) {
      console.error('Error broadcasting credit purchase:', error);
    }
  };

  return {
    broadcastNewUser,
    broadcastCreditPurchase
  };
};