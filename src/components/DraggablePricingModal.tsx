import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDraggable } from '@/hooks/useDraggable';
import { 
  Sparkles, 
  Move, 
  X, 
  Minimize2, 
  Maximize2,
  Star,
  CheckCircle,
  DollarSign,
  ArrowRight,
  CreditCard
} from 'lucide-react';

interface DraggablePricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
}

export const DraggablePricingModal: React.FC<DraggablePricingModalProps> = ({
  isOpen,
  onClose,
  initialCredits = 200,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const {
    position,
    isDragging,
    dragRef,
    handleRef,
    style,
    resetPosition,
  } = useDraggable({
    initialPosition: { x: 100, y: 100 },
    constrainToViewport: true,
    disabled: !isOpen,
  });

  const pricingPlans = [
    {
      id: 'starter_100',
      name: 'Starter 100',
      credits: 100,
      price: 140,
      pricePerLink: 1.40,
      description: 'Perfect for testing our platform',
      features: [
        'High DA backlinks',
        'Competitive analysis',
        'Real-time reporting',
        'Campaign management'
      ]
    },
    {
      id: 'starter_200',
      name: 'Starter 200',
      credits: 200,
      price: 280,
      pricePerLink: 1.40,
      description: 'Most popular starting package',
      popular: true,
      savings: 'Best Value',
      features: [
        'High DA backlinks',
        'Advanced analytics',
        'Priority support',
        'Campaign optimization'
      ]
    },
    {
      id: 'starter_300',
      name: 'Starter 300',
      credits: 300,
      price: 420,
      pricePerLink: 1.40,
      description: 'Maximum starter value',
      savings: 'Most Credits',
      features: [
        'High DA backlinks',
        'Full feature access',
        'Dedicated support',
        'Custom reporting'
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      
      {/* Draggable Modal */}
      <div
        ref={dragRef as React.RefObject<HTMLDivElement>}
        style={style}
        className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden max-w-4xl"
      >
        {/* Draggable Header */}
        <div
          ref={handleRef as React.RefObject<HTMLDivElement>}
          className={`flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b cursor-move select-none ${
            isDragging ? 'bg-gradient-to-r from-purple-100 to-pink-100' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-gray-500" />
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-800">Draggable Pricing Modal</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-yellow-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                resetPosition();
              }}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        {!isMinimized && (
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">Choose Your Plan</h2>
                <p className="text-gray-600">
                  This modal is fully draggable! Move it around to see different parts of your interface.
                </p>
              </div>

              {/* Pricing Plans */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingPlans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedPlan === plan.id 
                        ? 'border-purple-500 shadow-lg ring-2 ring-purple-200' 
                        : 'border-gray-200 hover:border-purple-300'
                    } ${plan.popular ? 'ring-2 ring-purple-100' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.popular && (
                          <Badge className="bg-purple-600 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {plan.savings && !plan.popular && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            {plan.savings}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-purple-600">
                          ${plan.price}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${plan.pricePerLink} per credit
                        </div>
                        <div className="text-xl font-semibold">
                          {plan.credits} Credits
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Plan Summary */}
              {selectedPlan && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold">Selected Plan:</span>
                        <span>{pricingPlans.find(p => p.id === selectedPlan)?.name}</span>
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        ${pricingPlans.find(p => p.id === selectedPlan)?.price}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  💡 Tip: Drag this window by the header to move it around!
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!selectedPlan}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Continue to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resize indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-300 opacity-50" 
             style={{ clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)' }} />
      </div>
    </>
  );
};

export default DraggablePricingModal;
