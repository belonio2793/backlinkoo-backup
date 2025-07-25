import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AffiliateService } from '@/services/affiliateService';

export const useReferralTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      // Track the referral click
      AffiliateService.trackReferralClick(referralCode, document.referrer);
      
      // Store in session storage as well for persistence
      sessionStorage.setItem('referral_code', referralCode);
      
      // Clean URL without removing the ref parameter functionality
      // We keep the parameter for now but could remove it if desired
    }
  }, [location]);

  // Function to convert referral when user makes a purchase
  const convertReferral = async (userId: string, orderAmount: number) => {
    try {
      await AffiliateService.convertReferral(userId, orderAmount);
    } catch (error) {
      console.error('Error converting referral:', error);
    }
  };

  return { convertReferral };
};
