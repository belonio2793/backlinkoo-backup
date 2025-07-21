import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserPlus, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: 'registration' | 'purchase';
  firstName: string;
  country: string;
  countryFlag: string;
  amount?: number;
  timestamp: string;
}

export const GlobalNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Subscribe to the global notifications channel
    const channel = supabase.channel('global-notifications');

    channel
      .on('broadcast', { event: 'new-user' }, (payload) => {
        const notification: Notification = {
          id: `user-${Date.now()}`,
          type: 'registration',
          firstName: payload.firstName,
          country: payload.country,
          countryFlag: payload.countryFlag,
          timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      })
      .on('broadcast', { event: 'credit-purchase' }, (payload) => {
        const notification: Notification = {
          id: `purchase-${Date.now()}`,
          type: 'purchase',
          firstName: payload.firstName,
          country: payload.country,
          countryFlag: payload.countryFlag,
          amount: payload.amount,
          timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card key={notification.id} className="p-3 bg-white/95 backdrop-blur-sm border shadow-lg animate-slide-in-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notification.type === 'registration' ? (
                <div className="p-1 bg-green-100 rounded-full">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
              ) : (
                <div className="p-1 bg-blue-100 rounded-full">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {notification.firstName}
                  </span>
                  <span className="text-lg">{notification.countryFlag}</span>
                  <Badge variant="outline" className="text-xs">
                    {notification.country}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {notification.type === 'registration' 
                    ? 'just signed up!' 
                    : `purchased ${notification.amount} credits!`
                  }
                </div>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => removeNotification(notification.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};