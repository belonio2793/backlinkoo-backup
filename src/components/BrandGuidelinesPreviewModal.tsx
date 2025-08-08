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

  const pages = [
    {
      id: 0,
      title: "Table of Contents",
      icon: FileText,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            📋 Table of Contents
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { title: "1. Brand Overview & Mission", pages: "2-3" },
              { title: "2. Logo Guidelines & Usage", pages: "4-5" },
              { title: "3. Color Palette & Guidelines", pages: "6-7" },
              { title: "4. Typography System", pages: "8-9" },
              { title: "5. Visual Elements & Patterns", pages: "10-11" },
              { title: "6. Photography Guidelines", pages: "12-13" },
              { title: "7. Social Media Standards", pages: "14-15" },
              { title: "8. Marketing Materials", pages: "16-17" },
              { title: "9. Digital Applications", pages: "18-19" },
              { title: "10. Print Specifications", pages: "20-21" },
              { title: "11. Brand Voice & Tone", pages: "22-23" }
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setCurrentPage(Math.floor(index / 2) + 1)}
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-gray-500">Pages {item.pages}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📖 How to Navigate</h4>
            <p className="text-sm text-blue-700">
              Use the navigation arrows at the bottom to browse through each section, or click on any section above to jump directly to it.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Brand Overview & Mission",
      icon: Target,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-purple-600" />
            Brand Overview & Mission
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Our Mission</h4>
              <p className="text-gray-700 mb-4">
                To democratize SEO and make advanced link building accessible to businesses of all sizes through intelligent automation and powerful tools.
              </p>
              <h4 className="text-lg font-semibold mb-4">Brand Values</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Innovation in SEO technology
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Transparency and ethical practices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Empowering business growth
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Community-driven development
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Brand Personality</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h5 className="font-medium text-purple-800">Professional</h5>
                  <p className="text-xs text-purple-600">Trustworthy & reliable</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-800">Innovative</h5>
                  <p className="text-xs text-blue-600">Cutting-edge technology</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-medium text-green-800">Accessible</h5>
                  <p className="text-xs text-green-600">Easy to understand</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <h5 className="font-medium text-orange-800">Results-driven</h5>
                  <p className="text-xs text-orange-600">Focused on outcomes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Logo Guidelines & Usage",
      icon: Palette,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-600" />
            Logo Guidelines & Usage
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">∞</span>
              </div>
              <h4 className="font-semibold text-sm">Primary Logo</h4>
              <p className="text-xs text-gray-600">Standard usage</p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-16 h-16 bg-white border-2 border-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">∞</span>
              </div>
              <h4 className="font-semibold text-sm">White Version</h4>
              <p className="text-xs text-gray-600">Dark backgrounds</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">∞</span>
              </div>
              <h4 className="font-semibold text-sm">Monochrome</h4>
              <p className="text-xs text-gray-600">Single color</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="font-semibold text-sm">Usage Rules</h4>
              <p className="text-xs text-gray-600">Do's & Don'ts</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Logo Do's
              </h4>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• Use official logo files only</li>
                <li>• Maintain minimum clear space</li>
                <li>• Keep proportions intact</li>
                <li>• Use on appropriate backgrounds</li>
                <li>• Ensure legibility at all sizes</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <X className="h-4 w-4" />
                Logo Don'ts
              </h4>
              <ul className="space-y-2 text-sm text-red-700">
                <li>• Don't stretch or distort</li>
                <li>• Don't change colors</li>
                <li>• Don't add effects or shadows</li>
                <li>• Don't place on busy backgrounds</li>
                <li>• Don't use outdated versions</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Color Palette & Guidelines",
      icon: Layout,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <Layout className="h-6 w-6 text-blue-600" />
            Color Palette & Guidelines
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Primary Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className="p-6 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#2563eb' }}
                  onClick={() => copyToClipboard('#2563eb')}
                >
                  <div className="text-white">
                    <div className="font-semibold">Primary Blue</div>
                    <div className="text-sm opacity-90">#2563eb</div>
                    <div className="text-xs opacity-75 mt-1">RGB(37, 99, 235)</div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#8b5cf6' }}
                  onClick={() => copyToClipboard('#8b5cf6')}
                >
                  <div className="text-white">
                    <div className="font-semibold">Purple Accent</div>
                    <div className="text-sm opacity-90">#8b5cf6</div>
                    <div className="text-xs opacity-75 mt-1">RGB(139, 92, 246)</div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-lg cursor-pointer hover:shadow-md transition-shadow border-2 border-gray-300"
                  style={{ backgroundColor: '#f8fafc' }}
                  onClick={() => copyToClipboard('#f8fafc')}
                >
                  <div className="text-gray-800">
                    <div className="font-semibold">Light Gray</div>
                    <div className="text-sm opacity-70">#f8fafc</div>
                    <div className="text-xs opacity-60 mt-1">RGB(248, 250, 252)</div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#1e293b' }}
                  onClick={() => copyToClipboard('#1e293b')}
                >
                  <div className="text-white">
                    <div className="font-semibold">Dark Gray</div>
                    <div className="text-sm opacity-90">#1e293b</div>
                    <div className="text-xs opacity-75 mt-1">RGB(30, 41, 59)</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Secondary Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Success Green', hex: '#10b981', rgb: 'RGB(16, 185, 129)' },
                  { name: 'Warning Orange', hex: '#f59e0b', rgb: 'RGB(245, 158, 11)' },
                  { name: 'Error Red', hex: '#ef4444', rgb: 'RGB(239, 68, 68)' },
                  { name: 'Info Cyan', hex: '#06b6d4', rgb: 'RGB(6, 182, 212)' }
                ].map((color, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow text-white"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex)}
                  >
                    <div className="font-semibold text-sm">{color.name}</div>
                    <div className="text-xs opacity-90">{color.hex}</div>
                    <div className="text-xs opacity-75">{color.rgb}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Typography System",
      icon: Type,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <Type className="h-6 w-6 text-indigo-600" />
            Typography System
          </h3>

          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Primary Typeface</h4>
              <div className="p-6 bg-gray-50 rounded-lg border">
                <h5 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Inter
                </h5>
                <p className="text-gray-600 mb-4">Modern, clean, and highly legible sans-serif</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h6 className="font-semibold mb-2">Headings</h6>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">Heading 1</div>
                      <div className="text-xl font-bold">Heading 2</div>
                      <div className="text-lg font-semibold">Heading 3</div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-semibold mb-2">Body Text</h6>
                    <div className="space-y-2">
                      <div className="text-base">Regular paragraph text</div>
                      <div className="text-sm">Small body text</div>
                      <div className="text-xs">Caption text</div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-semibold mb-2">Weights</h6>
                    <div className="space-y-2">
                      <div className="font-normal">Regular (400)</div>
                      <div className="font-medium">Medium (500)</div>
                      <div className="font-semibold">Semibold (600)</div>
                      <div className="font-bold">Bold (700)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Usage Guidelines</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-3">Typography Do's</h5>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li>• Use Inter for all digital applications</li>
                    <li>• Maintain consistent line heights</li>
                    <li>• Follow the type scale hierarchy</li>
                    <li>• Ensure proper contrast ratios</li>
                  </ul>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h5 className="font-semibold text-red-800 mb-3">Typography Don'ts</h5>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li>• Don't use more than 3 font weights</li>
                    <li>• Don't mix with other typefaces</li>
                    <li>• Don't use decorative fonts</li>
                    <li>• Don't sacrifice readability</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Marketing Guidelines",
      icon: Briefcase,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-green-600" />
            Marketing Guidelines & Best Practices
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approved Marketing Claims
                </h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• "Advanced link building automation"</li>
                  <li>• "SEO tools for professionals"</li>
                  <li>• "Streamline your SEO workflow"</li>
                  <li>• "Trusted by thousands of marketers"</li>
                  <li>• "Results-driven SEO platform"</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Content Guidelines</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• Focus on value and benefits</li>
                  <li>• Use clear, professional language</li>
                  <li>• Include relevant statistics</li>
                  <li>• Maintain consistent brand voice</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Prohibited Claims
                </h4>
                <ul className="space-y-2 text-sm text-red-700">
                  <li>• "Guaranteed #1 rankings"</li>
                  <li>• "Instant SEO results"</li>
                  <li>• "Secret Google algorithm"</li>
                  <li>• Unrealistic income promises</li>
                  <li>• Comparison attacks on competitors</li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-3">Required Disclosures</h4>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li>• Include affiliate relationship disclosure</li>
                  <li>• Add "Results may vary" disclaimer</li>
                  <li>• Comply with FTC guidelines</li>
                  <li>• Use provided tracking links</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
              🎨 Need Custom Assets?
            </h4>
            <p className="text-sm text-purple-700 mb-3">
              High-performing affiliates can request custom promotional materials from our design team.
            </p>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => toast({
                title: "Request Submitted",
                description: "We'll contact you about custom assets within 24 hours",
              })}
            >
              Request Custom Assets
            </Button>
          </div>
        </div>
      )
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  📘 Brand Guidelines Preview
                </DialogTitle>
                <p className="text-purple-100 mt-1">
                  {pages[currentPage].title} - Page {currentPage + 1} of {pages.length}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white">
                  ✨ Featured Resource
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {pages[currentPage].content}
          </div>

          {/* Navigation Footer */}
          <div className="border-t bg-gray-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={currentPage === pages.length - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      currentPage === index
                        ? 'bg-purple-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
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
