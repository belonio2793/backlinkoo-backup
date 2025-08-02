import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Infinity,
  Users,
  Database,
  Settings,
  BarChart3,
  Shield,
  Mail,
  Server,
  FileText,
  LogOut,
  User,
  ChevronDown,
  Home,
  MonitorSpeaker,
  Crown
} from "lucide-react";
import { AuthService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

interface AdminNavigationHeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  adminEmail?: string;
}

interface NavigationSection {
  id: string;
  name: string;
  icon: any;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export function AdminNavigationHeader({ 
  activeSection, 
  onSectionChange, 
  adminEmail 
}: AdminNavigationHeaderProps) {
  const { toast } = useToast();

  const navigationSections: NavigationSection[] = [
    {
      id: "overview",
      name: "Overview",
      icon: BarChart3,
      description: "Dashboard metrics & system status"
    },
    {
      id: "users",
      name: "Users",
      icon: Users,
      description: "User management & premium accounts"
    },
    {
      id: "content",
      name: "Content",
      icon: FileText,
      description: "Blog posts, AI content & moderation"
    },
    {
      id: "system",
      name: "System",
      icon: Server,
      description: "APIs, deployment & infrastructure"
    },
    {
      id: "communications",
      name: "Communications",
      icon: Mail,
      description: "Email systems & campaigns"
    },
    {
      id: "security",
      name: "Security",
      icon: Shield,
      description: "Security settings & monitoring"
    }
  ];

  const handleSignOut = () => {
    console.log('🚪 Admin sign out initiated');

    // Clear any loading states immediately
    document.body.style.cursor = 'wait';

    // Navigate instantly - no delays
    window.location.replace('/');

    // Background cleanup (non-blocking)
    AuthService.signOut().catch((error) => {
      console.warn('Background admin sign out error (non-critical):', error);
    });
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="relative">
              <Infinity className="h-6 w-6 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full">
                <Crown className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold hidden sm:block">Admin Portal</h1>
              <span className="text-xs text-muted-foreground hidden sm:block">System Administration</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-1 px-2 sm:px-3 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            
            <Badge variant="outline" className="gap-1 text-xs sm:text-sm bg-red-50 border-red-200 text-red-700">
              <MonitorSpeaker className="h-3 w-3" />
              <span className="hidden sm:inline">Administrator</span>
              <span className="sm:hidden">Admin</span>
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 sm:px-4 gap-1"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {adminEmail?.split('@')[0] || 'Admin'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onSectionChange('security')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSectionChange('system')}>
                  <MonitorSpeaker className="mr-2 h-4 w-4" />
                  System Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    // Immediate visual feedback
                    e.currentTarget.style.opacity = '0.5';
                    e.currentTarget.style.transform = 'scale(0.95)';
                    // Instant sign out
                    handleSignOut();
                  }}
                  className="text-red-600 focus:text-red-600 transition-all duration-75"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navigationSections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => onSectionChange(section.id)}
                  className={`
                    rounded-none border-b-2 border-transparent relative
                    ${isActive ? 'border-primary bg-secondary/50' : 'hover:border-primary/50'}
                    px-3 sm:px-4 py-3 flex-shrink-0 group
                  `}
                >
                  <IconComponent className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{section.name}</span>
                  
                  {section.badge && (
                    <div className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 sm:ml-2">
                      <Badge 
                        variant={section.badgeVariant || "default"} 
                        className="text-xs h-4 px-1 sm:h-auto sm:px-2"
                      >
                        {section.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Tooltip for mobile */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap sm:hidden">
                    {section.name}
                  </div>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Section Description Bar */}
      <div className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-2">
          {navigationSections.map((section) => {
            if (section.id === activeSection) {
              return (
                <div key={section.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <section.icon className="h-4 w-4" />
                  <span>{section.description}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </header>
  );
}
