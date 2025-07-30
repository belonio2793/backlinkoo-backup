import React from "react";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppWrapper } from "@/components/AppWrapper";

const Home = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>Backlinkoo - Home</h1>
    <p>Welcome to Backlinkoo!</p>
    <nav>
      <a href="/login" style={{ marginRight: '10px' }}>Login</a>
      <a href="/dashboard">Dashboard</a>
    </nav>
  </div>
);

const Login = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>Login</h1>
    <p>Login page works!</p>
    <a href="/">Back to Home</a>
  </div>
);

const Dashboard = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>Dashboard</h1>
    <p>Dashboard page works!</p>
    <a href="/">Back to Home</a>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  console.log('Minimal App rendering...');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppWrapper />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
