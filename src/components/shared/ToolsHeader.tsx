import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Infinity,
  Target,
  Sparkles,
  FileText,
  Menu,
  X,
  ChevronRight,
  Zap,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from '@supabase/supabase-js';
import { LoginModal } from "@/components/LoginModal";
import { useToast } from "@/hooks/use-toast";

interface ToolsHeaderProps {
  user: User | null;
  currentTool?: string;
}

const ToolsHeader = ({ user, currentTool }: ToolsHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Target },
    { name: "Tools", path: "#", icon: Sparkles, hasDropdown: true },
    { name: "Reports", path: "/backlink-report", icon: FileText },
  ];

  const toolsDropdown = [
    {
      name: "Backlink ∞ Automation Link Building (beta)",
      path: "/no-hands-seo",
      icon: Zap,
      description: "Automated link building",
      status: "Active",
      isActive: currentTool === "no-hands-seo"
    },
    {
      name: "Content Generator",
      path: "#",
      icon: Target,
      description: "Coming soon",
      status: "Soon",
      isActive: false,
      disabled: true
    }
  ];

  const handleClearCacheAndCookies = async () => {
    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear cookies (domain-specific)
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        // Clear for current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        // Clear for parent domain if applicable
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        // Clear for parent domain with leading dot
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }

      // Clear browser cache (if supported)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      toast({
        title: "Cache & Cookies Cleared",
        description: "Browser cache and cookies have been cleared successfully. Page will reload.",
      });

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error clearing cache and cookies:', error);
      toast({
        title: "Clear Failed",
        description: "Some data may not have been cleared completely.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <Infinity className="h-7 w-7 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Backlink</h1>
              <span className="text-xs text-muted-foreground font-medium">SEO Tools Suite</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                <button
                  onClick={() => item.path !== '#' && navigate(item.path)}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {item.hasDropdown && <ChevronRight className="h-3 w-3 group-hover:rotate-90 transition-transform" />}
                </button>
                
                {item.hasDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      {toolsDropdown.map((tool) => (
                        <div 
                          key={tool.name}
                          onClick={() => !tool.disabled && navigate(tool.path)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer group transition-colors ${
                            tool.disabled 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-gray-50'
                          } ${tool.isActive ? 'bg-blue-50 border border-blue-200' : ''}`}
                        >
                          <div className={`p-2 rounded-lg transition-colors ${
                            tool.isActive 
                              ? 'bg-blue-200' 
                              : tool.disabled 
                                ? 'bg-gray-100' 
                                : 'bg-blue-100 group-hover:bg-blue-200'
                          }`}>
                            <tool.icon className={`h-4 w-4 ${
                              tool.disabled ? 'text-gray-400' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${
                              tool.disabled ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {tool.name}
                            </div>
                            <div className={`text-sm ${
                              tool.disabled ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {tool.description}
                            </div>
                          </div>
                          <Badge 
                            variant={tool.status === 'Active' ? "secondary" : "outline"} 
                            className="ml-auto text-xs"
                          >
                            {tool.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Clear Cache Button - Always visible */}
            <Button
              onClick={handleClearCacheAndCookies}
              variant="outline"
              size="sm"
              className="bg-transparent hover:bg-orange-50/50 border border-orange-200/60 text-orange-600 hover:text-orange-700 hover:border-orange-300/80 transition-all duration-200 font-medium px-3 py-2 backdrop-blur-sm shadow-sm hover:shadow-md"
              title="Clear browser cache and cookies"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Clear Cache</span>
            </Button>

            {user ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button onClick={() => navigate("/dashboard")} className="sm:hidden">
                  <Target className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowLoginModal(true)} className="font-medium">
                Sign In
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (item.path !== '#') {
                        navigate(item.path);
                        setShowMobileMenu(false);
                      }
                    }}
                    className="flex items-center gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </button>
                  {item.hasDropdown && (
                    <div className="ml-6 space-y-1 border-l pl-4">
                      {toolsDropdown.map((tool) => (
                        <button
                          key={tool.name}
                          onClick={() => {
                            if (!tool.disabled) {
                              navigate(tool.path);
                              setShowMobileMenu(false);
                            }
                          }}
                          className={`flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors ${
                            tool.disabled 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-gray-50'
                          } ${tool.isActive ? 'bg-blue-50' : ''}`}
                        >
                          <tool.icon className={`h-4 w-4 ${
                            tool.disabled ? 'text-gray-400' : 'text-blue-600'
                          }`} />
                          <span className={`text-sm ${
                            tool.disabled ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {tool.name}
                          </span>
                          <Badge 
                            variant={tool.status === 'Active' ? "secondary" : "outline"} 
                            className="ml-auto text-xs"
                          >
                            {tool.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={(user) => {
          setShowLoginModal(false);
          // Refresh the page to update auth state
          window.location.reload();
        }}
        defaultTab="login"
      />
    </header>
  );
};

export default ToolsHeader;
