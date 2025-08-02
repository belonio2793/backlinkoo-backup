import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function QuickPremiumFix() {
  const [status, setStatus] = useState<string>('Checking...');

  useEffect(() => {
    const forcePremium = async () => {
      try {
        setStatus('Finding user...');
        
        // Try to find user by email in profiles table first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', 'labindalawamaryrose@gmail.com')
          .single();

        let userId;
        if (profileData && !profileError) {
          userId = profileData.id;
          setStatus(`Found user in profiles: ${userId}`);
        } else {
          // Alternative: check auth.users (may require RLS permissions)
          const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
          const targetUser = users?.find(u => u.email === 'labindalawamaryrose@gmail.com');
          
          if (targetUser) {
            userId = targetUser.id;
            setStatus(`Found user in auth: ${userId}`);
          } else {
            setStatus('User not found');
            return;
          }
        }

        // Update or insert premium subscription
        setStatus('Creating premium subscription...');
        
        const { error: upsertError } = await supabase
          .from('premium_subscriptions')
          .upsert({
            user_id: userId,
            plan_type: 'premium',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          setStatus(`Error creating subscription: ${upsertError.message}`);
        } else {
          setStatus('✅ Premium subscription created successfully!');
          
          // Auto-remove this component after 3 seconds
          setTimeout(() => {
            setStatus('');
          }, 3000);
        }

      } catch (error) {
        setStatus(`Unexpected error: ${error}`);
      }
    };

    forcePremium();
  }, []);

  if (!status) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#f0f9ff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '14px'
    }}>
      <strong>Premium Force Status:</strong> {status}
    </div>
  );
}
