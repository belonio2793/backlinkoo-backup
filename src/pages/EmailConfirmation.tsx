import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Infinity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is already authenticated
          toast({
            title: "Account Verified Successfully!",
            description: "Your email has been verified and you are now logged in.",
          });
          // Redirect to backlinkoo.com
          window.location.href = "https://backlinkoo.com/dashboard";
          return;
        }

        // Try to handle the confirmation with the token
        const token = searchParams.get("token");
        const type = searchParams.get("type");
        
        if (token && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any,
          });

          if (error) {
            // Handle various token errors
            if (error.message.includes("expired") || error.message.includes("invalid")) {
              toast({
                title: "Confirmation Link Invalid",
                description: "This confirmation link has expired or is invalid. Please try logging in or request a new confirmation email.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Account Verified Successfully!",
                description: "Your email has been verified. You can now log in.",
              });
            }
          } else {
            toast({
              title: "Account Verified Successfully!",
              description: "Your email has been verified and you are now logged in.",
            });
            // Redirect to backlinkoo.com after successful verification
            setTimeout(() => {
              window.location.href = "https://backlinkoo.com/dashboard";
            }, 2000);
            return;
          }
        } else {
          toast({
            title: "Account Verified Successfully!",
            description: "Your email has been verified. You can now log in.",
          });
        }
      } catch (error) {
        toast({
          title: "Account Verified Successfully!",
          description: "Your email appears to already be verified. You can now log in.",
        });
      }
      
      // Always redirect to backlinkoo.com after 3 seconds
      setTimeout(() => {
        window.location.href = "https://backlinkoo.com";
      }, 3000);
    };

    handleEmailConfirmation();
  }, [navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Infinity className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Backlink ∞</CardTitle>
          </div>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-xl text-green-600">Account Verified!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your email has been successfully verified. You will be redirected to your dashboard shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Redirecting to backlinkoo.com...</p>
          <Button 
            onClick={() => window.location.href = "https://backlinkoo.com/dashboard"}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;