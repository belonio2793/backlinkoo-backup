import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DraggableWindowDemo } from '@/components/DraggableWindowDemo';
import { DraggablePricingModal } from '@/components/DraggablePricingModal';
import { PricingModal } from '@/components/PricingModal';
import { 
  Move, 
  MousePointer, 
  Sparkles,
  ArrowRight,
  Code,
  Eye,
  Zap
} from 'lucide-react';

export const DraggableDemo: React.FC = () => {
  const [showDraggablePricing, setShowDraggablePricing] = useState(false);
  const [showOriginalPricing, setShowOriginalPricing] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-pink-600/10" />
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                Draggable Windows & Modals
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the future of user interfaces with fully draggable, resizable, and interactive windows. 
                Perfect for complex applications that need flexible layouts.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => setShowDraggablePricing(true)}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Try Draggable Modal
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => setShowOriginalPricing(true)}
              >
                <Eye className="h-5 w-5 mr-2" />
                Compare with Original
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Why Draggable Windows?</h2>
          <p className="text-lg text-gray-600">
            Enhance user experience with intuitive, flexible interfaces
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Move className="h-6 w-6 text-purple-600" />
                Multi-Window Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Keep multiple windows open simultaneously and position them exactly where you need them. 
                Perfect for comparing data or multi-tasking.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-6 w-6 text-blue-600" />
                Intuitive Interaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Natural drag-and-drop interactions that users understand immediately. 
                No learning curve required.
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-pink-600" />
                Enhanced Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Reduce context switching and improve workflow efficiency with 
                customizable window layouts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technical Features */}
      <div className="bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Technical Features</h2>
            <p className="text-lg text-gray-600">
              Built with modern web technologies for smooth performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Fully Responsive</h3>
                  <p className="text-gray-600">Works perfectly on desktop, tablet, and mobile devices</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Touch Support</h3>
                  <p className="text-gray-600">Native touch events for mobile and tablet interactions</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Boundary Constraints</h3>
                  <p className="text-gray-600">Automatically constrains windows to viewport boundaries</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Performance Optimized</h3>
                  <p className="text-gray-600">Smooth 60fps dragging with optimized event handling</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Customizable</h3>
                  <p className="text-gray-600">Configurable initial positions, sizes, and constraints</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Resizable Windows</h3>
                  <p className="text-gray-600">Optional resize handles with min/max size constraints</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Window Controls</h3>
                  <p className="text-gray-600">Minimize, maximize, and close buttons built-in</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-800">Easy Integration</h3>
                  <p className="text-gray-600">Simple hooks and components for existing React apps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Easy to Implement</h2>
          <p className="text-lg text-gray-600">
            Add draggable functionality to your existing components in minutes
          </p>
        </div>

        <Card className="bg-gray-900 text-green-400 font-mono">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Code className="h-5 w-5" />
              Simple Implementation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-x-auto">
{`import { DraggableDialog } from '@/components/ui/draggable-dialog';

<DraggableDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="My Draggable Modal"
  initialPosition={{ x: 100, y: 100 }}
  defaultSize={{ width: 600, height: 400 }}
>
  <YourModalContent />
</DraggableDialog>`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Demo Section */}
      <div className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-pink-600/10">
        <DraggableWindowDemo />
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Enhance Your Interface?</h2>
          <p className="text-xl opacity-90">
            Start building more intuitive and flexible user experiences today
          </p>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => setShowDraggablePricing(true)}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Try It Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DraggablePricingModal
        isOpen={showDraggablePricing}
        onClose={() => setShowDraggablePricing(false)}
      />

      <PricingModal
        isOpen={showOriginalPricing}
        onClose={() => setShowOriginalPricing(false)}
      />
    </div>
  );
};

export default DraggableDemo;
