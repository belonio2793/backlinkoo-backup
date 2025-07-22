import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ModeToggle } from "@/components/ModeToggle"
import {
  TrendingUp,
  Search,
  Target,
  Users,
  BarChart3,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Shield,
  Clock,
  Copy,
  AlertTriangle,
  Settings,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autocomplete from 'react-google-autocomplete';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast()

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p>Welcome to your dashboard overview!</p>
          </div>
        );
      case 'projects':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Projects</h2>
            <p>Manage your projects here.</p>
          </div>
        );
      case 'tasks':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Tasks</h2>
            <p>View and manage your tasks.</p>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p>Configure your account settings.</p>
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">404 Not Found</h2>
            <p>The requested content was not found.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <div className="text-lg font-bold">Backlink ∞</div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Button variant="ghost" onClick={() => navigateToTab('overview')} active={activeTab === 'overview'}>
                  Overview
                </Button>
              </li>
              <li>
                <Button variant="ghost" onClick={() => navigateToTab('projects')} active={activeTab === 'projects'}>
                  Projects
                </Button>
              </li>
              <li>
                <Button variant="ghost" onClick={() => navigateToTab('tasks')} active={activeTab === 'tasks'}>
                  Tasks
                </Button>
              </li>
              <li>
                <Button variant="ghost" onClick={() => navigateToTab('settings')} active={activeTab === 'settings'}>
                  Settings
                </Button>
              </li>
            </ul>
          </nav>
          <ModeToggle />
        </div>
      </header>

      <main className="container mx-auto p-4 flex-grow">
        {renderContent()}
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
