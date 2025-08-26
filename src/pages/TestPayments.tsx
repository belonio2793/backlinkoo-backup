import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BuyCreditsButton } from '@/components/BuyCreditsButton';
import { PremiumUpgradeButton } from '@/components/PremiumUpgradeButton';
import { ImprovedPaymentModal } from '@/components/ImprovedPaymentModal';
import { stripePaymentService } from '@/services/stripePaymentService';
import { CreditCard, Crown, Zap } from 'lucide-react';

export default function TestPayments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'credits' | 'premium'>('credits');

  const openModal = (tab: 'credits' | 'premium') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  // Get Stripe status
  const stripeStatus = stripePaymentService.getStatus();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Payment System Test</h1>
        <p className="text-muted-foreground">
          Test all payment functionality with real Stripe integration
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Stripe Configuration:</span>
              <span className={stripeStatus.configured ? 'text-green-600' : 'text-red-600'}>
                {stripeStatus.configured ? '✅ Configured' : '❌ Not Configured'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="text-blue-600">🚀 Production</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Purchase Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Purchase Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BuyCreditsButton credits={50} quickBuy={false}>
              Buy 50 Credits ($70)
            </BuyCreditsButton>
            
            <BuyCreditsButton credits={100} quickBuy={false}>
              Buy 100 Credits ($140)
            </BuyCreditsButton>
            
            <BuyCreditsButton credits={250} quickBuy={false}>
              Buy 250 Credits ($350)
            </BuyCreditsButton>
            
            <BuyCreditsButton credits={500} quickBuy={false}>
              Buy 500 Credits ($700)
            </BuyCreditsButton>
          </div>

          <div className="mt-4">
            <Button onClick={() => openModal('credits')} variant="outline" className="w-full">
              Open Credit Purchase Modal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Premium Subscription Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Premium Subscription Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <PremiumUpgradeButton plan="monthly" quickUpgrade={false}>
              Monthly Premium ($29/month)
            </PremiumUpgradeButton>
            
            <PremiumUpgradeButton plan="yearly" quickUpgrade={false}>
              Yearly Premium ($290/year)
            </PremiumUpgradeButton>
          </div>

          <div className="mt-4">
            <Button onClick={() => openModal('premium')} variant="outline" className="w-full">
              Open Premium Subscription Modal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Purchase Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BuyCreditsButton credits={100} quickBuy={true} showModal={false}>
              Quick Buy 100 Credits
            </BuyCreditsButton>
            
            <PremiumUpgradeButton plan="monthly" quickUpgrade={true} showModal={false}>
              Quick Monthly Upgrade
            </PremiumUpgradeButton>
            
            <PremiumUpgradeButton plan="yearly" quickUpgrade={true} showModal={false}>
              Quick Yearly Upgrade
            </PremiumUpgradeButton>

            <Button onClick={() => openModal('credits')} variant="secondary">
              Custom Credit Amount
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <ImprovedPaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={modalTab}
      />
    </div>
  );
}
