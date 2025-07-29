import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalNotifications } from "@/components/GlobalNotifications";
import { BetaNotification } from "@/components/BetaNotification";
import { AppWrapper } from "@/components/AppWrapper";
import { AuthProfileChecker } from "@/components/AuthProfileChecker";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Import admin utilities for global availability
import "@/utils/adminUtilities";
import "@/utils/testContentMigration";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProfileChecker>
          <Toaster />
          <Sonner />
          <GlobalNotifications />
          <BetaNotification />
          <BrowserRouter>
            <AppWrapper />
          </BrowserRouter>
        </AuthProfileChecker>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
