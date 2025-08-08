import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download, X, Palette, Type, Layout, Globe, Target,
  Users, Zap, Shield, CheckCircle, Eye, ChevronLeft,
  ChevronRight, FileText, Image, Briefcase, Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BrandGuidelinesPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BrandGuidelinesPreviewModal({ isOpen, onClose }: BrandGuidelinesPreviewModalProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = '/brand-guidelines.pdf';
    link.download = 'Backlink-Infinity-Brand-Guidelines-v1.0.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: "Brand Guidelines PDF is being downloaded",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  📘 Brand Guidelines Preview
                </DialogTitle>
                <p className="text-purple-100 mt-1">
                  Comprehensive brand identity & visual standards - v1.0 • 2025
                </p>
              </div>
              <Badge className="bg-white/20 text-white">
                ✨ Featured Resource
              </Badge>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">📋 Table of Contents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>1. Brand Overview & Mission</span>
                    <span className="text-sm text-gray-500">3</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>2. Logo Guidelines & Usage</span>
                    <span className="text-sm text-gray-500">5</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>3. Color Palette & Guidelines</span>
                    <span className="text-sm text-gray-500">6</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>4. Typography System</span>
                    <span className="text-sm text-gray-500">8</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>5. Visual Elements & Patterns</span>
                    <span className="text-sm text-gray-500">10</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>+ 5 more sections</span>
                    <span className="text-sm text-gray-500">25 pages total</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Brand Identity Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                Brand Identity
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white font-bold">∞</span>
                  </div>
                  <h4 className="font-semibold text-sm">Primary Logo</h4>
                  <p className="text-xs text-gray-600">Standard usage</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-12 h-12 bg-white border-2 border-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">∞</span>
                  </div>
                  <h4 className="font-semibold text-sm">White Version</h4>
                  <p className="text-xs text-gray-600">Dark backgrounds</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white font-bold">∞</span>
                  </div>
                  <h4 className="font-semibold text-sm">Monochrome</h4>
                  <p className="text-xs text-gray-600">Single color</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Usage Rules</h4>
                  <p className="text-xs text-gray-600">Do's & Don'ts</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Color Palette */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-600" />
                Color Palette
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#2563eb' }}
                  onClick={() => copyToClipboard('#2563eb')}
                >
                  <div className="text-white">
                    <div className="font-semibold">Primary Blue</div>
                    <div className="text-sm opacity-90">#2563eb</div>
                  </div>
                </div>
                <div 
                  className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#8b5cf6' }}
                  onClick={() => copyToClipboard('#8b5cf6')}
                >
                  <div className="text-white">
                    <div className="font-semibold">Purple Accent</div>
                    <div className="text-sm opacity-90">#8b5cf6</div>
                  </div>
                </div>
                <div 
                  className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow border-2 border-gray-300"
                  style={{ backgroundColor: '#f8fafc' }}
                  onClick={() => copyToClipboard('#f8fafc')}
                >
                  <div className="text-gray-800">
                    <div className="font-semibold">Light Gray</div>
                    <div className="text-sm opacity-70">#f8fafc</div>
                  </div>
                </div>
                <div 
                  className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#1e293b' }}
                  onClick={() => copyToClipboard('#1e293b')}
                >
                  <div className="text-white">
                    <div className="font-semibold">Dark Gray</div>
                    <div className="text-sm opacity-90">#1e293b</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Usage Guidelines */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Usage Guidelines
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Do's
                  </h4>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li>• Use provided assets as-is</li>
                    <li>• Maintain proper spacing</li>
                    <li>• Follow color guidelines</li>
                    <li>• Include official tracking</li>
                  </ul>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Don'ts
                  </h4>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li>• Modify logo proportions</li>
                    <li>• Use unauthorized colors</li>
                    <li>• Add effects or shadows</li>
                    <li>• Make false claims</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Need Custom Assets */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                🎨 Need Custom Assets?
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                High-performing affiliates can request custom promotional materials from our design team.
              </p>
              <Button 
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => toast({
                  title: "Request Submitted",
                  description: "We'll contact you about custom assets within 24 hours",
                })}
              >
                Request Custom Assets
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>📄 Complete PDF Guide: 11 pages • High-resolution • Vector graphics</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close Preview
                </Button>
                <Button 
                  onClick={downloadPDF}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF (2.4 MB)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
