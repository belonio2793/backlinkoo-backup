import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DraggableWindow } from '@/components/ui/draggable-window';
import { DraggableDialog } from '@/components/ui/draggable-dialog';
import { 
  Move, 
  MousePointer, 
  Maximize2, 
  Settings,
  BarChart3,
  Users,
  FileText,
  Calendar
} from 'lucide-react';

export const DraggableWindowDemo: React.FC = () => {
  const [showDraggableCard, setShowDraggableCard] = useState(false);
  const [showDraggableDialog, setShowDraggableDialog] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">Draggable Windows Demo</h1>
          <p className="text-lg text-gray-600">
            Click the buttons below to open draggable windows that you can move around the screen
          </p>
        </div>

        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Interactive Demo Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => setShowDraggableCard(true)}
                className="flex items-center gap-2 h-auto p-4 bg-blue-500 hover:bg-blue-600"
              >
                <Move className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Simple Window</div>
                  <div className="text-xs opacity-90">Basic draggable card</div>
                </div>
              </Button>

              <Button
                onClick={() => setShowDraggableDialog(true)}
                className="flex items-center gap-2 h-auto p-4 bg-green-500 hover:bg-green-600"
              >
                <Maximize2 className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Advanced Dialog</div>
                  <div className="text-xs opacity-90">Resizable & minimizable</div>
                </div>
              </Button>

              <Button
                onClick={() => setShowToolsPanel(true)}
                className="flex items-center gap-2 h-auto p-4 bg-purple-500 hover:bg-purple-600"
              >
                <Settings className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Tools Panel</div>
                  <div className="text-xs opacity-90">Development tools</div>
                </div>
              </Button>

              <Button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-2 h-auto p-4 bg-orange-500 hover:bg-orange-600"
              >
                <BarChart3 className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Analytics</div>
                  <div className="text-xs opacity-90">Performance metrics</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Move className="h-5 w-5 text-blue-500" />
                Draggable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Click and drag the title bar to move windows around the screen. Perfect for multi-tasking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="h-5 w-5 text-green-500" />
                Resizable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Drag the bottom-right corner to resize windows. Includes min/max constraints.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-500" />
                Customizable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configure initial position, size constraints, and enable/disable features.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Draggable Windows */}
      
      {/* Simple Draggable Card */}
      {showDraggableCard && (
        <DraggableWindow
          title="Simple Draggable Card"
          initialPosition={{ x: 200, y: 150 }}
          className="w-80"
        >
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Hello from a draggable window!</h3>
            <p className="text-gray-600">
              This is a simple draggable card that you can move around the screen. 
              Try dragging it by the title bar!
            </p>
            <div className="flex gap-2">
              <Button size="sm">Action 1</Button>
              <Button size="sm" variant="outline">Action 2</Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setShowDraggableCard(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DraggableWindow>
      )}

      {/* Advanced Draggable Dialog */}
      <DraggableDialog
        open={showDraggableDialog}
        onOpenChange={setShowDraggableDialog}
        title="Advanced Draggable Dialog"
        initialPosition={{ x: 300, y: 200 }}
        defaultSize={{ width: 500, height: 400 }}
      >
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Advanced Features</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-gray-500">Active users</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$56,789</div>
                <p className="text-xs text-gray-500">This month</p>
              </CardContent>
            </Card>
          </div>
          <p className="text-gray-600">
            This dialog is resizable, minimizable, and fully draggable. 
            Try the controls in the title bar!
          </p>
        </div>
      </DraggableDialog>

      {/* Tools Panel */}
      <DraggableDialog
        open={showToolsPanel}
        onOpenChange={setShowToolsPanel}
        title="Development Tools"
        initialPosition={{ x: 100, y: 300 }}
        defaultSize={{ width: 350, height: 500 }}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start gap-2">
              <FileText className="h-4 w-4" />
              Console Logs
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Users className="h-4 w-4" />
              Network
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            <div className="text-green-600">✓ Application initialized</div>
            <div className="text-blue-600">ℹ Loading components...</div>
            <div className="text-orange-600">⚠ Performance warning</div>
          </div>
        </div>
      </DraggableDialog>

      {/* Analytics Window */}
      <DraggableDialog
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
        title="Analytics Dashboard"
        initialPosition={{ x: 400, y: 250 }}
        defaultSize={{ width: 600, height: 450 }}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Visitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">24,567</div>
                <p className="text-xs text-green-600">+12% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,234</div>
                <p className="text-xs text-blue-600">+5% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">456</div>
                <p className="text-xs text-purple-600">+8% from last week</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-lg font-semibold">Chart Visualization</div>
              <div className="text-sm opacity-90">Interactive charts would go here</div>
            </div>
          </div>
        </div>
      </DraggableDialog>
    </div>
  );
};

export default DraggableWindowDemo;
