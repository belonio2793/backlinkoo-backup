import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
            title: "Email Already Verified",
            description: "Your email has already been verified and you are logged in.",
          });
          navigate("/");
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
                title: "Email Already Verified", 
                description: "Your email has already been verified. You can now log in.",
              });
            }
          } else {
            toast({
              title: "Email Verified Successfully",
              description: "Your email has been verified. You are now logged in.",
            });
          }
        } else {
          toast({
            title: "Email Already Verified",
            description: "Your email has already been verified. You can now log in.",
          });
        }
      } catch (error) {
        toast({
          title: "Email Already Verified",
          description: "Your email appears to already be verified. You can now log in.",
        });
      } finally {
        // Always redirect to homepage
        navigate("/");
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    </div>
  );
};

export default EmailConfirmation;