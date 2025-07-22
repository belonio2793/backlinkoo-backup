import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from 'next-auth/react';
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Footer from "@/components/Footer";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { setUser } = useAuth();

  const loginMutation = useMutation(
    async () => {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    },
    {
      onSuccess: (data) => {
        setIsLoading(false);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        toast({
          title: "Login successful!",
          description: "You have successfully logged in.",
        })
        navigate(callbackUrl);
      },
      onError: (error: any) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Login failed.",
          description: error.message || "Invalid credentials.",
        })
      },
    }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto flex items-center justify-center h-full">
        <Card className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10">
          <CardContent className="p-8">
            <div className="flex flex-col space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white">Login</h2>
                <p className="text-muted-foreground text-sm">Enter your email and password to login</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <Button disabled={isLoading} className="w-full" type="submit">
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
              <div className="text-center text-sm text-gray-400">
                Don't have an account? <a href="/register" className="text-white hover:underline">Register</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;
